/**
 * Favorites Module - Browser Entry Point
 * Automatic initialization for browser environments
 */

import { FavoritesUI } from './favoritesindex'; // Use .ts extension implicitly
import { logError } from './favorites-utils';
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
        document.addEventListener('DOMContentLoaded', initializeFavorites as EventListener);
    } else {
        // DOM is already ready
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
