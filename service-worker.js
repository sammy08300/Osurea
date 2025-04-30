// Service Worker pour osu! Area Visualizer
const CACHE_NAME = 'osu-area-visualizer-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/utils/storage.js',
  '/assets/js/components/visualizer.js',
  '/assets/js/components/favorites.js',
  '/assets/js/components/notifications.js',
  '/assets/js/components/contextMenu.js',
  '/assets/img/favicon.svg',
  '/data/tablets.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation et suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de mise en cache : Network First pour HTML et CSS, Cache First pour le reste
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Stratégie Network First pour HTML et CSS
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mettre à jour le cache avec la nouvelle réponse
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Fallback au cache si le réseau échoue
          return caches.match(event.request);
        })
    );
  } else {
    // Stratégie Cache First pour les autres ressources
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            });
        })
    );
  }
}); 