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

async function saveSubscription(subscription: PushSubscription, userId: string): Promise<boolean> {
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

    if (supported) {
      setPermission(Notification.permission);

      // Register SW and check/refresh subscription
      navigator.serviceWorker.register('/sw.js').then(async (registration) => {
        await navigator.serviceWorker.ready;

        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setIsSubscribed(true);

          // Force re-subscribe if using legacy FCM endpoint
          if (existingSub.endpoint.includes('fcm.googleapis.com/fcm/send/')) {
            console.log('[PUSH] Legacy FCM endpoint detected, re-subscribing...');
            try {
              await existingSub.unsubscribe();
              const newSub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
              });

              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Delete old subscription
                await supabase.from('push_subscriptions')
                  .delete()
                  .eq('endpoint', existingSub.endpoint);
                // Save new one
                await saveSubscription(newSub, user.id);
                console.log('[PUSH] Re-subscribed with new endpoint');
              }
            } catch (err) {
              console.error('[PUSH] Re-subscribe failed:', err);
            }
          }
        }
      });

      // Listen for subscription changes from SW
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user && event.data.subscription) {
            const sub = event.data.subscription;
            if (sub.endpoint && sub.keys) {
              await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                platform_id: getPlatformIdFromCookie(),
                endpoint: sub.endpoint,
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
                user_agent: navigator.userAgent,
              }, { onConflict: 'user_id,endpoint' });
            }
          }
        }
      });
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') return false;

      // Unsubscribe existing (to get fresh endpoint)
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Subscribe to push with fresh endpoint
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Save to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Delete old subscriptions for this user
      if (existingSub) {
        await supabase.from('push_subscriptions')
          .delete()
          .eq('endpoint', existingSub.endpoint);
      }

      const saved = await saveSubscription(subscription, user.id);
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
