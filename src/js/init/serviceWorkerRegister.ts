// Enregistrement et gestion du Service Worker
(function serviceWorkerRegister(): void {
    window.addEventListener('load', function(): void {
        if ('serviceWorker' in navigator) {
            try {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration: ServiceWorkerRegistration) { // Add type for registration
                        console.log('Service Worker registered successfully:', registration.scope);
                    })
                    .catch(function(error: any) { // error can be of any type
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
