// Service Worker pour Osu!rea - Area Visualizer
const CACHE_NAME = 'osu-area-visualizer-v2.2';
const APP_SHELL_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-content-v2';
const STATIC_CACHE = 'static-assets-v2';
const IMAGE_CACHE = 'images-v2';

// Durée de mise en cache (7 jours pour contenu statique, 1 jour pour contenu dynamique)
const STATIC_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours
const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000;    // 1 jour

// Ressources essentielles (app shell) à mettre en cache immédiatement
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/utils/storage.js',
  '/assets/js/utils/constraintHelpers.js',
  '/assets/js/utils/preferences.js',
  '/assets/js/components/visualizer.js',
  '/assets/js/components/favorites.js',
  '/assets/js/components/notifications.js',
  '/assets/js/components/contextMenu.js',
  '/assets/js/components/tabletSelector.js',
  '/assets/js/components/areaManager.js',
  '/assets/img/favicon.svg',
  '/manifest.webmanifest',
  '/404.html'
];

// Ressources que nous voulons précacher mais qui sont moins critiques
const SECONDARY_ASSETS = [
  '/data/tablets.json'
];

// Limites pour la taille des caches
const CACHE_SIZE_LIMITS = {
  [DYNAMIC_CACHE]: 30,  // Nombre maximum d'entrées
  [IMAGE_CACHE]: 50     // Nombre maximum d'images
};

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
  const currentCaches = [APP_SHELL_CACHE, DYNAMIC_CACHE, STATIC_CACHE, IMAGE_CACHE];
  
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

// Fonction utilitaire pour limiter la taille d'un cache (LRU - Least Recently Used)
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Supprimer les entrées les plus anciennes jusqu'à atteindre la limite
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Fonction pour gérer les expirations du cache
async function cleanExpiredCache() {
  const now = Date.now();
  
  // Nettoyer le cache statique
  const staticCache = await caches.open(STATIC_CACHE);
  const staticKeys = await staticCache.keys();
  for (const request of staticKeys) {
    const response = await staticCache.match(request);
    const timestamp = response.headers.get('sw-cache-timestamp');
    
    if (timestamp && (now - parseInt(timestamp)) > STATIC_CACHE_DURATION) {
      await staticCache.delete(request);
    }
  }
  
  // Nettoyer le cache dynamique
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const dynamicKeys = await dynamicCache.keys();
  for (const request of dynamicKeys) {
    const response = await dynamicCache.match(request);
    const timestamp = response.headers.get('sw-cache-timestamp');
    
    if (timestamp && (now - parseInt(timestamp)) > DYNAMIC_CACHE_DURATION) {
      await dynamicCache.delete(request);
    }
  }
}

// Ajouter un timestamp aux réponses mises en cache
function addTimestampToResponse(response) {
  if (!response || !response.body) return response;
  
  const headers = new Headers(response.headers);
  headers.append('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

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
          const timestamp = addTimestampToResponse(response.clone());
          caches.open(APP_SHELL_CACHE)
            .then(cache => cache.put(event.request, timestamp));
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
              const timestamp = addTimestampToResponse(networkResponse.clone());
              caches.open(APP_SHELL_CACHE)
                .then(cache => cache.put(event.request, timestamp));
              return networkResponse;
            });
          
          // Renvoyer la réponse mise en cache immédiatement si disponible,
          // sinon attendre la réponse réseau
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // Stratégie pour les images (Cache First puis Network avec stockage)
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Mettre à jour l'image en arrière-plan si elle existe dans le cache
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  const timestamp = addTimestampToResponse(networkResponse.clone());
                  caches.open(IMAGE_CACHE)
                    .then(cache => {
                      cache.put(event.request, timestamp);
                      trimCache(IMAGE_CACHE, CACHE_SIZE_LIMITS[IMAGE_CACHE]);
                    });
                }
              })
              .catch(() => {});
              
            return cachedResponse;
          }
          
          // Si pas dans le cache, la récupérer et la mettre en cache
          return fetch(event.request)
            .then(networkResponse => {
              if (!networkResponse || !networkResponse.ok) {
                return networkResponse;
              }
              
              const timestamp = addTimestampToResponse(networkResponse.clone());
              caches.open(IMAGE_CACHE)
                .then(cache => {
                  cache.put(event.request, timestamp);
                  trimCache(IMAGE_CACHE, CACHE_SIZE_LIMITS[IMAGE_CACHE]);
                });
                
              return networkResponse;
            });
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
            const timestamp = addTimestampToResponse(response.clone());
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, timestamp);
                trimCache(DYNAMIC_CACHE, CACHE_SIZE_LIMITS[DYNAMIC_CACHE]);
              });
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
            const timestamp = addTimestampToResponse(response.clone());
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(event.request, timestamp));
            
            return response;
          });
      })
  );
});

// Nettoyer périodiquement les caches expirés (toutes les 24 heures)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanExpiredCache());
  }
});

// Fallback pour les navigateurs qui ne supportent pas periodicSync
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanExpiredCache());
  }
});

// Planifier un nettoyage initial après l'activation
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanExpiredCache()
    ])
  );
}); 