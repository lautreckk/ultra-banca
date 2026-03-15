'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getPlatformIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )platform_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function saveSubscriptionToDB(subscription: PushSubscription, userId: string): Promise<boolean> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys) return false;

  const supabase = createClient();
  const platformId = getPlatformIdFromCookie();

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    platform_id: platformId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
  }, {
    onConflict: 'user_id,endpoint',
  });

  if (error) {
    console.error('[PUSH] Save subscription error:', error);
    return false;
  }
  return true;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported || !VAPID_PUBLIC_KEY) return;

    setPermission(Notification.permission);

    // Register SW and ensure subscription is synced with DB
    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      await navigator.serviceWorker.ready;

      const existingSub = await registration.pushManager.getSubscription();

      if (existingSub && Notification.permission === 'granted') {
        // Subscription exists in browser - make sure it's also in the DB
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check if this endpoint exists in DB
          const json = existingSub.toJSON();
          const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', json.endpoint || '')
            .maybeSingle();

          if (!existing) {
            // Subscription exists in browser but NOT in DB - re-save it
            console.log('[PUSH] Subscription missing from DB, re-saving...');
            await saveSubscriptionToDB(existingSub, user.id);
          }

          setIsSubscribed(true);
        }
      } else if (Notification.permission === 'granted' && !existingSub) {
        // Permission granted but no subscription - auto-subscribe
        console.log('[PUSH] Permission granted but no subscription, auto-subscribing...');
        try {
          const newSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
          });

          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await saveSubscriptionToDB(newSub, user.id);
            setIsSubscribed(true);
            console.log('[PUSH] Auto-subscribed successfully');
          }
        } catch (err) {
          console.error('[PUSH] Auto-subscribe failed:', err);
        }
      }
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // Subscribe to push (keep existing if valid, create new if not)
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }

      // Save to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const saved = await saveSubscriptionToDB(subscription, user.id);
      if (!saved) return false;

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[PUSH] Subscribe error:', err);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
  };
}
