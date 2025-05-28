/**
 * Favorites Main Module
 * Central entry point for the favorites component
 */

import { FAVORITES_CONFIG } from './favorites-config.js';
import { FavoritesInit } from './favorite-init.js';
import { FavoritesRendering } from './favorite-rendering.js';
import { FavoritesActions } from './favorite-actions.js';
import { FavoritesPopups } from './favorite-popup.js';
import { FavoritesEvents } from './favorite-events.js';
import { logError } from './favorites-utils.js';
import { SortCriteria } from './types.js';
import { FavoriteObject, FavoritesState } from './types.js';
import { updateFavorite as updateFavoriteStorage } from './favorite-storage.js';

export { FavoritesInit }; // Re-export FavoritesInit

/**
 * Unified Favorites Interface
 * Provides a single point of access to all favorites functionality
 */
export const FavoritesUI = {
    // State management
    state: {
        editingFavoriteId: null,
        currentDetailedFavoriteId: null,
        favoritesList: null,
        favoritesPlaceholder: null,
        cachedFavorites: null,
        isInitialized: false,
        autoSaveTimer: null,
        originalValues: null,
        currentSortCriteria: 'date' as SortCriteria,
    } as FavoritesState,

    /**
     * Initialize the favorites component
     * @returns {Promise<boolean>} True if initialization successful
     */
    async init() {
        try {
            console.log('Initializing FavoritesUI...');
            
            // Initialize the core module
            await FavoritesInit.init();
            
            // Synchronize state with init module
            this.syncStateWithInit();
            
            // Initialize events
            FavoritesEvents.init();
            
            FavoritesPopups.createDialogs();
            FavoritesPopups.createDetailsPopup();
            
            this.state.isInitialized = true;
            console.log('FavoritesUI initialized successfully');
            return true;
        } catch (error) {
            logError('FavoritesUI.init', error as Error);
            this.state.isInitialized = false;
        }
        return this.state.isInitialized;
    },

    /**
     * Destroy the favorites component and clean up resources
     */
    destroy() {
        try {
            FavoritesEvents.cleanup();
            this.clearAutoSaveTimer();
            this.resetState();
            console.log('FavoritesUI destroyed successfully');
        } catch (error) {
            logError('FavoritesUI.destroy', error as Error);
        }
    },

    /**
     * Synchronize state with the init module
     */
    syncStateWithInit() {
        this.state.favoritesList = FavoritesInit.favoritesList;
        this.state.favoritesPlaceholder = FavoritesInit.favoritesPlaceholder as HTMLElement | null;
        this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        this.state.currentSortCriteria = FavoritesInit.currentSortCriteria as SortCriteria;
    },

    /**
     * Reset the component state
     */
    resetState() {
        this.state.editingFavoriteId = null;
        this.state.currentDetailedFavoriteId = null;
        this.state.cachedFavorites = [];
        this.state.originalValues = null;
        this.clearAutoSaveTimer();
        if (this.state.favoritesList) {
            this.state.favoritesList.innerHTML = '';
        }
    },

    /**
     * Clear auto-save timer
     */
    clearAutoSaveTimer() {
        if (this.state.autoSaveTimer) {
            clearTimeout(this.state.autoSaveTimer);
            this.state.autoSaveTimer = null;
        }
    },

    // === Favorite Management Methods ===

    /**
     * Load a favorite configuration
     * @param {string|number} id - Favorite ID
     * @returns {boolean} True if loaded successfully
     */
    loadFavorite(id: string | number): boolean {
        try {
            FavoritesActions.loadFavorite(id);
            return true;
        } catch (error) {
            logError('FavoritesUI.loadFavorite', error as Error, { id });
            return false;
        }
    },

    /**
     * Save current configuration as favorite
     * @returns {boolean} True if saved successfully
     */
    saveFavorite(): boolean {
        try {
            FavoritesActions.saveFavorite();
            this.state.editingFavoriteId = FavoritesActions.editingFavoriteId;
            this.state.originalValues = FavoritesActions.originalValues;
            this.refreshAllFavorites();
            return true;
        } catch (error) {
            logError('FavoritesUI.saveFavorite', error as Error);
            return false;
        }
    },

    /**
     * Start editing a favorite
     * @param {string|number} id - Favorite ID
     * @returns {boolean} True if edit mode started successfully
     */
    editFavorite(id: string | number): boolean {
        try {
            FavoritesActions.editFavorite(id);
            this.state.editingFavoriteId = FavoritesActions.editingFavoriteId;
            this.state.originalValues = FavoritesActions.originalValues;
            return true;
        } catch (error) {
            logError('FavoritesUI.editFavorite', error as Error, { id });
            return false;
        }
    },

    /**
     * Delete a favorite
     * @param {string|number} id - Favorite ID
     * @returns {boolean} True if deleted successfully
     */
    deleteFavorite(id: string | number): boolean {
        try {
            FavoritesActions.deleteFavorite(id);
            this.refreshAllFavorites();
            return true;
        } catch (error) {
            logError('FavoritesUI.deleteFavorite', error as Error, { id });
            return false;
        }
    },

    /**
     * Cancel edit mode
     * @param {boolean} skipNotification - Skip showing notification
     * @returns {boolean} True if cancelled successfully
     */
    cancelEditMode(skipNotification = false): boolean {
        try {
            FavoritesActions.cancelEditMode(skipNotification);
            this.state.editingFavoriteId = FavoritesActions.editingFavoriteId;
            this.state.originalValues = FavoritesActions.originalValues;
            return true;
        } catch (error) {
            logError('FavoritesUI.cancelEditMode', error as Error);
            return false;
        }
    },

    // === Display and UI Methods ===

    /**
     * Refresh all favorites display
     */
    refreshAllFavorites() {
        try {
            FavoritesRendering.loadFavoritesWithAnimation();
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.refreshAllFavorites', error as Error);
        }
    },

    /**
     * Force refresh favorites display
     */
    forceRefreshFavorites() {
        try {
            FavoritesInit.forceRefreshFavorites();
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.forceRefreshFavorites', error as Error);
        }
    },

    /**
     * Highlight a specific favorite
     * @param {string|number} id - Favorite ID
     * @param {boolean} withScroll - Whether to scroll to the favorite
     */
    highlightFavorite(id: string | number, withScroll = true) {
        try {
            FavoritesRendering.highlightFavorite(id, withScroll);
        } catch (error) {
            logError('FavoritesUI.highlightFavorite', error as Error, { id, withScroll });
        }
    },

    // === Popup and Dialog Methods ===

    /**
     * Show favorite details popup
     * @param {Object} favorite - Favorite object
     */
    showFavoriteDetails(favorite: FavoriteObject) {
        try {
            FavoritesPopups.showFavoriteDetails(favorite, FavoritesActions as any);
            this.state.currentDetailedFavoriteId = FavoritesActions.currentDetailedFavoriteId;
        } catch (error) {
            logError('FavoritesUI.showFavoriteDetails', error as Error, { favorite });
        }
    },

    /**
     * Show comment dialog
     * @param {Function} callback - Callback function
     */
    showCommentDialog(callback: (data: { title: string, description: string }) => void) {
        try {
            FavoritesPopups.showCommentDialog(callback);
        } catch (error) {
            logError('FavoritesUI.showCommentDialog', error as Error);
        }
    },

    /**
     * Show delete confirmation dialog
     * @param {Function} callback - Callback function
     */
    showDeleteDialog(callback: (confirmed: boolean) => void) {
        try {
            FavoritesPopups.showDeleteDialog(callback);
        } catch (error) {
            logError('FavoritesUI.showDeleteDialog', error as Error);
        }
    },

    // === Language and Localization Methods ===

    /**
     * Handle locale change event
     * @param {Event} event - Locale change event
     */
    handleLocaleChange(event: CustomEvent) {
        try {
            FavoritesInit.handleLocaleChange(event);
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.handleLocaleChange', error as Error, { event });
        }
    },

    /**
     * Handle manual language update
     * @param {string} language - New language code
     */
    manualLanguageUpdate(language: string) {
        try {
            FavoritesInit.manualLanguageUpdate(language);
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.manualLanguageUpdate', error as Error, { language });
        }
    },

    // === Utility Methods ===

    /**
     * Check if the component is initialized
     * @returns {boolean} True if initialized
     */
    isReady() {
        return this.state.isInitialized && FavoritesEvents.isReady();
    },

    /**
     * Get current state
     * @returns {Object} Current state object
     */
    getState() {
        return { ...this.state };
    },

    /**
     * Get favorites count
     * @returns {number} Number of favorites
     */
    getFavoritesCount() {
        return this.state.cachedFavorites ? this.state.cachedFavorites.length : 0;
    },

    updateFavorite(id: string | number, data: Partial<FavoriteObject>): boolean {
        if (!this.isReady()) return false;
        try {
            const success = updateFavoriteStorage(id, data);
            if (success) {
                this.forceRefreshFavorites();
            }
            return success;
        } catch (error) {
            logError('FavoritesUI.updateFavorite', error as Error, { id, data });
            return false;
        }
    }
};
