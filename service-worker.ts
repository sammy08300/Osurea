/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'osu-area-visualizer-v2.2'; 
const APP_SHELL_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-content-v2';
const STATIC_CACHE = 'static-assets-v2';
const IMAGE_CACHE = 'images-v2';

const STATIC_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; 
const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000;    

const APP_SHELL_ASSETS: string[] = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/js/app.js', 
  '/assets/js/utils/helpers.js', 
  '/assets/js/utils/storage.js', 
  '/assets/js/utils/constraintHelpers.js', 
  '/assets/js/utils/preferences.js', 
  '/assets/js/components/area/visualizer.js', 
  '/assets/js/components/favorites.js', 
  '/assets/js/components/ui/notifications.js', 
  '/assets/js/components/area/contextMenu.js', 
  '/assets/js/components/tablet/tabletSelector.js', 
  '/assets/js/components/area/areaManager.js', 
  '/assets/img/favicon.svg',
  '/manifest.webmanifest',
  '/404.html'
];

const SECONDARY_ASSETS: string[] = [
  '/data/tablets.json'
];

interface CacheSizeLimits {
  [cacheName: string]: number;
}

const CACHE_SIZE_LIMITS: CacheSizeLimits = {
  [DYNAMIC_CACHE]: 30,
  [IMAGE_CACHE]: 50
};

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then(cache => 
        Promise.all(
          APP_SHELL_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        )
      ),
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

self.addEventListener('activate', (event: ExtendableEvent) => {
  const currentCaches: string[] = [APP_SHELL_CACHE, DYNAMIC_CACHE, STATIC_CACHE, IMAGE_CACHE];
  
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
      .then(() => cleanExpiredCache()) 
  );
});

async function trimCache(cacheName: string, maxItems: number): Promise<void> { 
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

async function cleanExpiredCache(): Promise<void> {
  const now = Date.now();
  
  const staticCache = await caches.open(STATIC_CACHE);
  const staticKeys = await staticCache.keys();
  for (const request of staticKeys) {
    const response = await staticCache.match(request);
    if (response) {
      const timestampHeader = response.headers.get('sw-cache-timestamp');
      if (timestampHeader) {
        const timestamp = parseInt(timestampHeader, 10);
        if (timestamp && (now - timestamp) > STATIC_CACHE_DURATION) {
          await staticCache.delete(request);
        }
      }
    }
  }
  
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const dynamicKeys = await dynamicCache.keys();
  for (const request of dynamicKeys) {
    const response = await dynamicCache.match(request);
     if (response) {
      const timestampHeader = response.headers.get('sw-cache-timestamp');
      if (timestampHeader) {
        const timestamp = parseInt(timestampHeader, 10);
        if (timestamp && (now - timestamp) > DYNAMIC_CACHE_DURATION) {
          await dynamicCache.delete(request);
        }
      }
    }
  }
}

function addTimestampToResponse(response: Response): Response {
  if (!response || !response.body) return response;
  
  const headers = new Headers(response.headers);
  headers.append('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Export for testing
export { addTimestampToResponse };

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const timestampedResponse = addTimestampToResponse(response.clone());
          caches.open(APP_SHELL_CACHE)
            .then(cache => cache.put(event.request, timestampedResponse));
          return response;
        })
        .catch(() => caches.match(event.request) as Promise<Response>) 
    );
    return;
  }
  
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              const timestampedResponse = addTimestampToResponse(networkResponse.clone());
              caches.open(APP_SHELL_CACHE)
                .then(cache => cache.put(event.request, timestampedResponse));
              return networkResponse;
            }).catch(() => {
              if (cachedResponse) return cachedResponse; 
              throw new Error("Network error and no cache for JS/CSS");
            });
          
          return cachedResponse || fetchPromise;
        }) as Promise<Response>
    );
    return;
  }
  
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  const timestampedResponse = addTimestampToResponse(networkResponse.clone());
                  caches.open(IMAGE_CACHE)
                    .then(cache => {
                      cache.put(event.request, timestampedResponse);
                      trimCache(IMAGE_CACHE, CACHE_SIZE_LIMITS[IMAGE_CACHE]);
                    });
                }
              })
              .catch(() => {}); 
              
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              if (!networkResponse || !networkResponse.ok) {
                return networkResponse;
              }
              
              const timestampedResponse = addTimestampToResponse(networkResponse.clone());
              caches.open(IMAGE_CACHE)
                .then(cache => {
                  cache.put(event.request, timestampedResponse);
                  trimCache(IMAGE_CACHE, CACHE_SIZE_LIMITS[IMAGE_CACHE]);
                });
                
              return networkResponse;
            });
        }) as Promise<Response>
    );
    return;
  }
  
  if (url.pathname.endsWith('.json')) {
     event.respondWith(
      new Promise<Response>((resolve, reject) => {
        const networkPromise = fetch(event.request)
          .then(response => {
            const timestampedResponse = addTimestampToResponse(response.clone());
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, timestampedResponse);
                trimCache(DYNAMIC_CACHE, CACHE_SIZE_LIMITS[DYNAMIC_CACHE]);
              });
            resolve(response);
          })
          .catch(reject); 

        const timeoutPromise = new Promise<Response | undefined>(resolveTimeout => {
          setTimeout(() => {
            caches.match(event.request).then(cachedResponse => {
              resolveTimeout(cachedResponse);
            });
          }, 2000);
        });

        Promise.race([networkPromise, timeoutPromise])
          .then(response => {
            if (response instanceof Response) { 
                 resolve(response);
            } else if(response === undefined) { 
                 caches.match(event.request).then(res => {
                    if(res) resolve(res);
                    else reject(new Error("Network timeout and no cache for JSON"));
                 }).catch(reject); 
            } else {
                 reject(new Error("Unexpected Promise.race resolution for JSON"));
            }
          })
          .catch(() => { 
            caches.match(event.request).then(res => {
                if(res) resolve(res);
                else reject(new Error("Network error/timeout and no cache for JSON"));
            }).catch(reject); 
          });
      })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const timestampedResponse = addTimestampToResponse(response.clone());
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(event.request, timestampedResponse));
            
            return response;
          });
      }) as Promise<Response>
  );
});

interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}

(self as any).addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanExpiredCache());
  }
});

interface MessageData {
  type: string;
}

// Use ExtendableMessageEvent if waitUntil is truly needed, though it's not standard for all 'message' events.
// If it's a simple message, MessageEvent is correct and waitUntil should not be used.
// Given the error and standard library definitions, casting to ExtendableMessageEvent for the addEventListener
// signature, but understanding that the actual event might be a simple MessageEvent.
self.addEventListener('message', (event: ExtendableMessageEvent) => { 
  const data = event.data as MessageData; 
  if (data && data.type === 'CACHE_CLEANUP') {
    // If cleanExpiredCache() is async and its completion needs to extend SW lifetime,
    // then this event *must* be an ExtendableEvent, and thus ExtendableMessageEvent.
    // However, simple postMessage doesn't make it an ExtendableMessageEvent.
    // This implies the CACHE_CLEANUP message might be sent in a context
    // where the event is indeed extendable (e.g., from another service worker event handler).
    // For now, assuming cleanExpiredCache is not something that needs `waitUntil` here.
    cleanExpiredCache(); 
  }
});

export {};
