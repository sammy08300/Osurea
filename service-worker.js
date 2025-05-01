// Service Worker pour Osu!rea - Area Visualizer
const CACHE_NAME = 'osu-area-visualizer-v2.1';
const APP_SHELL_CACHE = 'app-shell-v1';
const DYNAMIC_CACHE = 'dynamic-content-v1';

// Ressources essentielles (app shell) à mettre en cache immédiatement
const APP_SHELL_ASSETS = [
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
  '/assets/img/favicon.svg'
];

// Ressources que nous voulons précacher mais qui sont moins critiques
const SECONDARY_ASSETS = [
  '/data/tablets.json',
  '/assets/js/components/tabletSelector.js',
  '/manifest.webmanifest'
];

// Installation du service worker avec mise en cache parallèle pour plus de rapidité
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Mettre en cache l'app shell (priorité haute)
      caches.open(APP_SHELL_CACHE).then(cache => 
        Promise.all(
          APP_SHELL_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Échec mise en cache de ${url}:`, err))
          )
        )
      ),
      
      // Mettre en cache les ressources secondaires (parallèle)
      caches.open(DYNAMIC_CACHE).then(cache => 
        Promise.all(
          SECONDARY_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Échec mise en cache secondaire de ${url}:`, err))
          )
        )
      )
    ])
    .then(() => self.skipWaiting())
  );
});

// Activation et suppression des anciens caches
self.addEventListener('activate', (event) => {
  const currentCaches = [APP_SHELL_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Stratégie de mise en cache optimisée
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ne pas intercepter les requêtes non GET ou vers d'autres domaines
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Stratégie spécifique pour les fichiers HTML (Network First)
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(APP_SHELL_CACHE)
            .then(cache => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Stratégie pour fichiers JavaScript et CSS (Cache First avec mise à jour en arrière-plan)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Renvoyer la réponse mise en cache si elle existe
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Mettre à jour le cache en arrière-plan
              caches.open(APP_SHELL_CACHE)
                .then(cache => cache.put(event.request, networkResponse.clone()));
              return networkResponse;
            });
          
          // Renvoyer la réponse mise en cache immédiatement si disponible,
          // sinon attendre la réponse réseau
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // Stratégie pour les données JSON (Network First avec timeout pour les performances)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      Promise.race([
        fetch(event.request)
          .then(response => {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, clonedResponse));
            return response;
          }),
        // Timeout de 2 secondes pour revenir au cache si le réseau est lent
        new Promise(resolve => {
          setTimeout(() => {
            caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) resolve(cachedResponse);
            });
          }, 2000);
        })
      ])
      .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Stratégie par défaut pour les autres ressources (Cache First)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Ne mettre en cache que les réponses valides
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Mettre en cache la nouvelle ressource
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, responseToCache));
            
            return response;
          });
      })
  );
}); 