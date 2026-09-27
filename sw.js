// Self-clearing service worker to prevent cached blank screens
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch from network directly without stale intercepting
  event.respondWith(fetch(event.request));
});
