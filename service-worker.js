// Service Worker pour osu! Area Visualizer
const CACHE_NAME = 'osu-area-visualizer-v1';
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

// Stratégie de mise en cache : Cache First, puis réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse mise en cache si elle existe
        if (response) {
          return response;
        }
        
        // Sinon, faire la requête au réseau
        return fetch(event.request)
          .then((response) => {
            // Ne pas mettre en cache les réponses d'API ou les requêtes non réussies
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Mettre en cache la nouvelle réponse
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
      .catch(() => {
        // Fallback pour les requêtes qui échouent
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/index.html');
        }
      })
  );
}); 