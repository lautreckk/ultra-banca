// Service Worker for Push Notifications - v2

// Push notification received
self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // Fallback for plain text
    data = { title: 'Nova mensagem', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nova mensagem', options)
  );
});

// Click handler - open the app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it and navigate
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(url);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Install - skip waiting to activate immediately
self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

// Activate - claim clients immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

// Fetch handler (required for beforeinstallprompt on Chrome)
self.addEventListener('fetch', function(event) {
  // Network-first strategy - let Next.js handle everything
  event.respondWith(fetch(event.request));
});

// Periodic re-subscription check (when SW wakes up)
self.addEventListener('pushsubscriptionchange', function(event) {
  // When subscription expires or changes, re-subscribe
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(function(subscription) {
        // Notify the app to save the new subscription
        return self.clients.matchAll().then(function(clients) {
          clients.forEach(function(client) {
            client.postMessage({
              type: 'PUSH_SUBSCRIPTION_CHANGED',
              subscription: subscription.toJSON(),
            });
          });
        });
      })
  );
});
