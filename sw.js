const CACHE_NAME = 'retro-hub-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/console.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Only cache valid GET responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || event.request.method !== 'GET') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback if network is completely down and item not in cache
        // You could return a custom offline page here if needed
      });
    })
  );
});
