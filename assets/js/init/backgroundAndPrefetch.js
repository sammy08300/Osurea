/**
 * Background and Prefetch Optimization Module
 * Improves initial loading performance by setting background color early
 * and prefetching critical resources
 */

(function() {
    try {
        // Apply background color immediately to prevent white flash
        document.documentElement.style.backgroundColor = 'rgb(3, 7, 18)';
        document.documentElement.classList.add('loading');
        
        // Create a list of critical resources to prefetch
        const criticalResources = [
            'assets/js/app.js',
            'assets/js/components/area/visualizer.js',
            'assets/js/components/favorites/favoritesModule.js',
            'assets/css/styles.css',
            'data/tablets.json'
        ];
        
        // Function to prefetch resources
        const prefetchResources = () => {
            criticalResources.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = url;
                link.as = url.endsWith('.js') ? 'script' : 
                          url.endsWith('.css') ? 'style' : 
                          url.endsWith('.json') ? 'fetch' : 'fetch';
                
                // Add priority hint for modern browsers
                if ('fetchPriority' in HTMLLinkElement.prototype) {
                    link.fetchPriority = 'high';
                }
                
                document.head.appendChild(link);
            });
        };
        
        // Use requestIdleCallback for non-blocking prefetch
        if ("requestIdleCallback" in window) {
            requestIdleCallback(prefetchResources, { timeout: 2000 });
        } else {
            // Fallback to setTimeout for older browsers
            setTimeout(prefetchResources, 200);
        }
        
        // Preconnect to external domains
        const preconnectDomains = [
            'https://cdnjs.cloudflare.com'
        ];
        
        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        // Periodic cache cleanup via service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                try {
                    // Schedule cache cleanup once per day
                    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
                    
                    // Check when the last cleanup was performed
                    const lastCleanup = localStorage.getItem('lastCacheCleanup');
                    const now = Date.now();
                    
                    if (!lastCleanup || (now - parseInt(lastCleanup)) > CLEANUP_INTERVAL) {
                        // Time to clean up
                        navigator.serviceWorker.ready.then(registration => {
                            if (registration && registration.active) {
                                registration.active.postMessage({ type: 'CACHE_CLEANUP' });
                                localStorage.setItem('lastCacheCleanup', now.toString());
                            }
                        }).catch(err => {
                            console.warn('Service worker error:', err);
                        });
                    }
                } catch (e) {
                    console.warn('Error initializing service worker:', e);
                }
            });
        }
    } catch (e) {
        console.warn('Error during style initialization:', e);
    }
})();