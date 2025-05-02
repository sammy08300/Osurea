// Service Worker for Osu!rea - Area Visualizer v2.2
const CACHE_NAME = 'osu-area-visualizer-v2.2';
const APP_SHELL_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-content-v2';
const STATIC_CACHE = 'static-assets-v2';
const IMAGE_CACHE = 'images-v2';

// Cache duration (7 days for static content, 1 day for dynamic content)
const STATIC_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000;    // 1 day

// Essential resources (app shell) to cache immediately
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

// Resources we want to precache but are less critical
const SECONDARY_ASSETS = [
  '/data/tablets.json'
];

// Cache size limits
const CACHE_SIZE_LIMITS = {
  [DYNAMIC_CACHE]: 30,  // Maximum number of entries
  [IMAGE_CACHE]: 50     // Maximum number of images
};

// Install the service worker with parallel caching for faster performance
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache the app shell (high priority)
      caches.open(APP_SHELL_CACHE).then(cache => 
        Promise.all(
          APP_SHELL_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        )
      ),
      
      // Cache the secondary resources (parallel)
      caches.open(DYNAMIC_CACHE).then(cache => 
        Promise.all(
          SECONDARY_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Secondary cache failed for ${url}:`, err))
          )
        )
      )
    ])
    .then(() => self.skipWaiting())
  );
});

// Activation and deletion of old caches
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

// Utility function to limit the size of a cache (LRU - Least Recently Used)
async function trimCache(cacheName, maxItems) { 
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete the oldest entries until the limit is reached
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Function to handle cache expiration
async function cleanExpiredCache() {
  const now = Date.now();
  
  // Clean the static cache
  const staticCache = await caches.open(STATIC_CACHE);
  const staticKeys = await staticCache.keys();
  for (const request of staticKeys) {
    const response = await staticCache.match(request);
    const timestamp = response.headers.get('sw-cache-timestamp');
    
    if (timestamp && (now - parseInt(timestamp)) > STATIC_CACHE_DURATION) {
      await staticCache.delete(request);
    }
  }
  
  // Clean the dynamic cache
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

// Add a timestamp to cached responses
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

// Optimized caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Do not intercept non-GET requests or requests to other domains
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Specific strategy for HTML files (Network First)
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
  
  // Strategy for JavaScript and CSS files (Cache First with background update)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return the cached response if it exists
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Update the cache in the background
              const timestamp = addTimestampToResponse(networkResponse.clone());
              caches.open(APP_SHELL_CACHE)
                .then(cache => cache.put(event.request, timestamp));
              return networkResponse;
            });
          
          // Return the cached response immediately if available,
          // otherwise wait for the network response
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // Strategy for images (Cache First then Network with storage)
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Update the image in the background if it exists in the cache
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
          
          // If not in the cache, fetch it and cache it
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
  
  // Strategy for JSON data (Network First with timeout for performance)
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
        // Timeout of 2 seconds to return to cache if the network is slow
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
  
  // Default strategy for other resources (Cache First)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Cache only valid responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the new resource
            const timestamp = addTimestampToResponse(response.clone());
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(event.request, timestamp));
            
            return response;
          });
      })
  );
});

// Clean expired caches periodically (every 24 hours)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanExpiredCache());
  }
});

// Fallback for browsers that do not support periodicSync
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanExpiredCache());
  }
});

// Schedule an initial cleanup after activation
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanExpiredCache()
    ])
  );
}); 