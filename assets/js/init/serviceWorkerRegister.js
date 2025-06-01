/**
 * Service Worker Registration Module
 * Optimized service worker registration with error handling and update management
 */

(function serviceWorkerRegister() {
    // Configuration
    const SW_CONFIG = {
        path: '/service-worker.js',
        scope: '/',
        updateCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
        registrationOptions: {
            scope: '/'
        }
    };
    
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.log('Service Workers not supported by this browser');
        return;
    }
    
    // Register the service worker
    function registerServiceWorker() {
        navigator.serviceWorker.register(SW_CONFIG.path, SW_CONFIG.registrationOptions)
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
                
                // Check for updates
                checkForUpdates(registration);
                
                // Set up periodic update checks
                setupPeriodicUpdateChecks(registration);
            })
            .catch(error => {
                console.warn('Service Worker registration failed:', error);
            });
    }
    
    // Check for service worker updates
    function checkForUpdates(registration) {
        // Skip update check if less than 24 hours since last check
        const lastUpdateCheck = localStorage.getItem('swLastUpdateCheck');
        const now = Date.now();
        
        if (lastUpdateCheck && (now - parseInt(lastUpdateCheck)) < SW_CONFIG.updateCheckInterval) {
            return;
        }
        
        // Update the last check timestamp
        localStorage.setItem('swLastUpdateCheck', now.toString());
        
        // Check for updates
        registration.update()
            .catch(error => {
                console.warn('Service Worker update check failed:', error);
            });
    }
    
    // Set up periodic update checks
    function setupPeriodicUpdateChecks(registration) {
        // Check for updates when the user returns to the app
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkForUpdates(registration);
            }
        });
        
        // Listen for controller changes (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker updated and activated');
        });
    }
    
    // Handle service worker lifecycle events
    function handleServiceWorkerEvents() {
        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                console.log('New version available. Refresh to update.');
                
                // Show notification if available
                if (typeof Notifications !== 'undefined' && Notifications.info) {
                    Notifications.info('New version available. Refresh to update.');
                }
            }
        });
    }
    
    // Initialize service worker registration
    window.addEventListener('load', () => {
        try {
            // Register service worker
            registerServiceWorker();
            
            // Set up event handlers
            handleServiceWorkerEvents();
        } catch (error) {
            console.warn('Error during service worker initialization:', error);
        }
    });
    
    // Expose API for manual registration/updates
    window.swManager = {
        register: registerServiceWorker,
        update: () => {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    checkForUpdates(registration);
                }
            });
        }
    };
})();