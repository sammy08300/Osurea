// Applique le fond et la classe loading immédiatement
(function() {
    try {
        document.documentElement.style.backgroundColor = 'rgb(3, 7, 18)';
        document.documentElement.classList.add('loading');
        if ("requestIdleCallback" in window) {
            requestIdleCallback(() => {
                const resourcesToPrefetch = [
                    'assets/js/app.js',
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
                        registration.active.postMessage({ type: 'CACHE_CLEANUP' });
                    }
                }).catch(err => {
                    console.warn('Service worker error:', err);
                });
            }, 24 * 60 * 60 * 1000);
        } catch (e) {
            console.warn('Error initializing service worker:', e);
        }
    });
} 
