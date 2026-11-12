/* Kill-switch: drop the old PWA worker and its caches.
 * The previous worker cache-busted every request and defeated GitHub Pages CDN. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.map(function (name) {
          return caches.delete(name);
        }));
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.matchAll();
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          if (client.navigate) client.navigate(client.url);
        });
      })
  );
});
