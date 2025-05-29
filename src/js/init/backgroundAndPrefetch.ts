// Applique le fond et la classe loading immédiatement
(function() {
    try {
        document.documentElement.style.backgroundColor = 'rgb(3, 7, 18)';
        document.documentElement.classList.add('loading');
        
        // Check if requestIdleCallback is available
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
                const resourcesToPrefetch: string[] = [
                    'assets/js/app.js', // Consider if these paths need updating if they become .ts
                    'assets/js/components/area/visualizer.js', 
                    'assets/js/components/favorites/favoritesModule.js'
                ];
                resourcesToPrefetch.forEach(url => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = url;
                    document.head.appendChild(link);
                });
            });
        }
    } catch (e) {
        console.warn('Error during style initialization:', e);
    }
})();

// Nettoyage périodique du cache via le service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        try {
            setInterval(() => {
                navigator.serviceWorker.ready.then(registration => {
                    if (registration && registration.active) {
                        // Define a more specific type for the message if possible
                        registration.active.postMessage({ type: 'CACHE_CLEANUP' } as any);
                    }
                }).catch(err => {
                    console.warn('Service worker error:', err);
                });
            }, 24 * 60 * 60 * 1000); // 24 hours
        } catch (e) {
            console.warn('Error initializing service worker periodic cache cleanup:', e);
        }
    });
}
