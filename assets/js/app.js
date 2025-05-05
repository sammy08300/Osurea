/**
 * Main application module
 */

// Import modules
import { FavoritesUI } from './components/favorites/favoritesindex.js';
import TabletSelector from './components/tabletSelector.js';
import { translateWithFallback } from './i18n-init.js';
import { DOMUtils } from './utils/dom-utils.js';
import { UIManager } from './ui/ui-manager.js';
import { FormManager } from './ui/form-manager.js';
import { RecapManager } from './ui/recap-manager.js';
import { NumberUtils } from './utils/number-utils.js';

/**
 * Application state manager
 */
class AppState {
    constructor() {
        this.tabletData = [];
        this.editingFavoriteId = null;
        this.originalValues = null;
        this.currentRatio = 1.0;
        this.debouncedUpdateRatio = null;
    }

    /**
     * Load tablet data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadTabletData() {
        try {
            const response = await fetch('data/tablets.json');
            if (!response.ok) {
                throw new Error('Failed to load tablet data');
            }
            this.tabletData = await response.json();
            
            // Initialize the tablet selector
            TabletSelector.init(this.tabletData);
        } catch (error) {
            console.error('Error loading tablet data:', error);
            Notifications.error(window.translateWithFallback('notifications.tabletDataError') || 'Erreur de chargement des données tablettes');
        }
    }
    
    /**
     * Start editing a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    startEditFavorite(id) {
        this.editingFavoriteId = id;
        UIManager.updateEditModeUI(true);
    }
    
    /**
     * Cancel edit mode
     */
    cancelEditMode() {
        if (this.editingFavoriteId && this.originalValues) {
            FormManager.restoreOriginalValues(this.originalValues);
            
            // Reset the edit mode
            this.editingFavoriteId = null;
            this.originalValues = null;
            
            UIManager.updateEditModeUI(false);
            Notifications.info(window.translateWithFallback('notifications.editModeCanceled') || 'Modifications annulées');
        }
    }
    
    /**
     * Initialize app components and load data
     */
    async init() {
        // Initialize notification system
        Notifications.init();
        
        // Lancer un diagnostic avant de charger les favoris
        if (typeof StorageManager !== 'undefined') {
            console.log("Running initial storage diagnostic...");
            
            // Réinitialiser complètement le stockage pour résoudre les problèmes potentiels
            if (typeof StorageManager.forceReset === 'function') {
                console.log("Performing full storage reset during initialization");
                StorageManager.forceReset();
            } else if (typeof StorageManager.diagnoseFavorites === 'function') {
                StorageManager.diagnoseFavorites();
            }
        }
        
        // Preload favorites during the loading of other data
        if (typeof FavoritesUI !== 'undefined') {
            FavoritesUI.init();
        }
        
        // Initialize the preferences manager if it exists
        if (typeof PreferencesManager !== 'undefined') {
            PreferencesManager.init();
        }
        
        // S'assurer que les préférences ne font pas référence à des favoris supprimés
        if (typeof PreferencesManager !== 'undefined' && 
            typeof PreferencesManager._cleanupFavoriteReferences === 'function') {
            console.log("Performing preferences cleanup during initialization");
            PreferencesManager._cleanupFavoriteReferences();
        }
        
        // Lancer un second diagnostic après que les favoris et préférences soient chargés
        if (typeof StorageManager !== 'undefined' && typeof StorageManager.diagnoseFavorites === 'function') {
            console.log("Running post-init storage diagnostic...");
            setTimeout(() => StorageManager.diagnoseFavorites(), 500);
        }
        
        // Load tablet data
        await this.loadTabletData();
        
        // Setup UI managers
        FormManager.init(this);
        UIManager.init(this);
        RecapManager.init();
        
        // Creation of a debounce function to update the ratio
        this.debouncedUpdateRatio = DOMUtils.debounce(() => {
            const elements = FormManager.getFormElements();
            const width = NumberUtils.parseFloatSafe(elements.areaWidth.value);
            const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
            
            if (height > 0 && width > 0) {
                const calculatedRatio = width / height;
                // Always update the ratio, unless the user is directly editing the field
                if (!elements.customRatio.dataset.editing && !elements.customRatio.matches(':focus')) {
                    elements.customRatio.value = NumberUtils.formatNumber(calculatedRatio, 3);
                    this.currentRatio = calculatedRatio;
                }
            }
        }, 300); // 300ms delay
        
        // Start with default values
        updateDisplay();
    }
}

// Create and export the global app state instance
export const appState = new AppState();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    appState.init();
    
    // Block context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Initialize context menu after a delay
    setTimeout(() => {
        if (typeof ContextMenu !== 'undefined') {
            ContextMenu.init();
        }
    }, 500);
    
    // Gestionnaire spécial pour F5 et Ctrl+R qui assure que les favoris sont correctement sauvegardés
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            console.log("Page refresh detected (F5/Ctrl+R)");
            
            // Forcer le nettoyage du cache des favoris avant le rechargement
            if (typeof StorageManager !== 'undefined') {
                console.log("Cleaning StorageManager cache before refresh");
                if (typeof StorageManager.clearCache === 'function') {
                    StorageManager.clearCache();
                }
                
                // Vérifier et récupérer la dernière liste de favoris disponible
                if (typeof StorageManager.getFavorites === 'function') {
                    const currentFavorites = StorageManager.getFavorites();
                    console.log(`Current favorites before refresh: ${currentFavorites.length} items`);
                }
            }
            
            // Nettoyer le cache des favoris dans l'initialisation
            if (typeof FavoritesInit !== 'undefined') {
                console.log("Cleaning FavoritesInit cache before refresh");
                FavoritesInit.cachedFavorites = null;
                
                // Forcer un rafraîchissement complet en dernier recours
                if (typeof FavoritesInit.updateFavoriteCache === 'function') {
                    FavoritesInit.updateFavoriteCache(true);
                }
            }
            
            // S'assurer que les préférences sont mises à jour
            if (typeof PreferencesManager !== 'undefined') {
                console.log("Saving and cleaning preferences before refresh");
                
                // Nettoyer les références aux favoris supprimés
                if (typeof PreferencesManager._cleanupFavoriteReferences === 'function') {
                    PreferencesManager._cleanupFavoriteReferences();
                }
                
                // Sauvegarder l'état actuel
                if (typeof PreferencesManager.saveCurrentState === 'function') {
                    PreferencesManager.saveCurrentState();
                }
            }
        }
    });
});