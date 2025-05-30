// Enregistrement et gestion du Service Worker
(function serviceWorkerRegister() {
    window.addEventListener('load', function() {
        if ('serviceWorker' in navigator) {
            try {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                        console.log('Service Worker registered successfully:', registration.scope);
                    })
                    .catch(function(error) {
                        console.warn('Service Worker registration failed:', error);
                    });
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                    console.log('Service Worker updated');
                });
            } catch (e) {
                console.warn('Error registering Service Worker:', e);
            }
        } else {
            console.log('Service Workers not supported by this browser');
        }
    });
})(); 
