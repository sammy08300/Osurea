/**
 * Favorites Module - Browser Entry Point
 * Automatic initialization for browser environments
 */

import { FavoritesUI } from './favoritesindex.js'; // Ajouter l'extension .js explicitement
import { logError } from './favorites-utils.js'; // Ajouter l'extension .js explicitement
import { FavoritesUIInterface } from './types'; // Import the interface

// Extend the Window interface to include FavoritesUI
declare global {
    interface Window {
        FavoritesUI?: FavoritesUIInterface;
    }
}

/**
 * Initialize favorites when DOM is ready
 */
async function initializeFavorites(): Promise<void> {
    try {
        // Check if already initialized to prevent duplicate initialization
        if (FavoritesUI.isReady && FavoritesUI.isReady()) {
            console.log('Favorites module already initialized, skipping');
            return;
        }
        
        console.log('Starting favorites initialization...');
        const success = await FavoritesUI.init();
        
        if (success) {
            console.log('Favorites module initialized successfully');
            // Exposer globalement pour le débogage
            if (typeof window !== 'undefined') {
                window.FavoritesUI = FavoritesUI;
            }
        } else {
            console.error('Failed to initialize favorites module');
        }
    } catch (error) {
        logError('initializeFavorites', error as Error);
    }
}

// Browser environment setup
if (typeof window !== 'undefined') {
    // Expose the unified interface globally
    window.FavoritesUI = FavoritesUI;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("DOM Content Loaded - Initializing favorites module");
            initializeFavorites();
        });
    } else {
        // DOM is already ready
        console.log("DOM already ready - Initializing favorites module immediately");
        initializeFavorites();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        try {
            if (FavoritesUI.destroy) { // Check if destroy exists
                FavoritesUI.destroy();
            }
        } catch (error) {
            console.warn('Error during favorites cleanup:', error);
        }
    });
}

// CommonJS support if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesUI;
}

export default FavoritesUI;
