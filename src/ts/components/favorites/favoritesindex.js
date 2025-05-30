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
        currentSortCriteria: FAVORITES_CONFIG.SORT_CRITERIA.DATE
    },

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
            
            this.state.isInitialized = true;
            console.log('FavoritesUI initialized successfully');
            return true;
        } catch (error) {
            logError('FavoritesUI.init', error);
            return false;
        }
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
            logError('FavoritesUI.destroy', error);
        }
    },

    /**
     * Synchronize state with the init module
     */
    syncStateWithInit() {
        this.state.favoritesList = FavoritesInit.favoritesList;
        this.state.favoritesPlaceholder = FavoritesInit.favoritesPlaceholder;
        this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        this.state.isInitialized = FavoritesInit.isInitialized;
        this.state.currentSortCriteria = FavoritesInit.currentSortCriteria;
    },

    /**
     * Reset the component state
     */
    resetState() {
        this.state = {
            editingFavoriteId: null,
            currentDetailedFavoriteId: null,
            favoritesList: null,
            favoritesPlaceholder: null,
            cachedFavorites: null,
            isInitialized: false,
            autoSaveTimer: null,
            originalValues: null,
            currentSortCriteria: FAVORITES_CONFIG.SORT_CRITERIA.DATE
        };
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
    loadFavorite(id) {
        try {
            const result = FavoritesActions.loadFavorite(id);
            return result !== false;
        } catch (error) {
            logError('FavoritesUI.loadFavorite', error, { id });
            return false;
        }
    },

    /**
     * Save current configuration as favorite
     * @returns {boolean} True if saved successfully
     */
    saveFavorite() {
        try {
            const result = FavoritesActions.saveFavorite();
            if (result) {
                this.refreshAllFavorites();
            }
            return result !== false;
        } catch (error) {
            logError('FavoritesUI.saveFavorite', error);
            return false;
        }
    },

    /**
     * Start editing a favorite
     * @param {string|number} id - Favorite ID
     * @returns {boolean} True if edit mode started successfully
     */
    editFavorite(id) {
        try {
            FavoritesActions.editFavorite(id);
            this.state.editingFavoriteId = FavoritesActions.editingFavoriteId;
            this.state.originalValues = FavoritesActions.originalValues;
            return true;
        } catch (error) {
            logError('FavoritesUI.editFavorite', error, { id });
            return false;
        }
    },

    /**
     * Delete a favorite
     * @param {string|number} id - Favorite ID
     * @returns {boolean} True if deleted successfully
     */
    deleteFavorite(id) {
        try {
            const result = FavoritesActions.deleteFavorite(id);
            if (result) {
                this.refreshAllFavorites();
            }
            return result !== false;
        } catch (error) {
            logError('FavoritesUI.deleteFavorite', error, { id });
            return false;
        }
    },

    /**
     * Cancel edit mode
     * @param {boolean} skipNotification - Skip showing notification
     * @returns {boolean} True if cancelled successfully
     */
    cancelEditMode(skipNotification = false) {
        try {
            FavoritesActions.cancelEditMode(skipNotification);
            this.state.editingFavoriteId = FavoritesActions.editingFavoriteId;
            this.state.originalValues = FavoritesActions.originalValues;
            return true;
        } catch (error) {
            logError('FavoritesUI.cancelEditMode', error);
            return false;
        }
    },

    // === Display and UI Methods ===

    /**
     * Refresh all favorites display
     */
    refreshAllFavorites() {
        try {
            FavoritesInit.refreshAllFavorites();
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.refreshAllFavorites', error);
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
            logError('FavoritesUI.forceRefreshFavorites', error);
        }
    },

    /**
     * Highlight a specific favorite
     * @param {string|number} id - Favorite ID
     * @param {boolean} withScroll - Whether to scroll to the favorite
     */
    highlightFavorite(id, withScroll = true) {
        try {
            FavoritesRendering.highlightFavorite(id, withScroll);
        } catch (error) {
            logError('FavoritesUI.highlightFavorite', error, { id, withScroll });
        }
    },

    // === Popup and Dialog Methods ===

    /**
     * Show favorite details popup
     * @param {Object} favorite - Favorite object
     */
    showFavoriteDetails(favorite) {
        try {
            FavoritesPopups.showFavoriteDetails(favorite, FavoritesActions);
            this.state.currentDetailedFavoriteId = FavoritesActions.currentDetailedFavoriteId;
        } catch (error) {
            logError('FavoritesUI.showFavoriteDetails', error, { favorite });
        }
    },

    /**
     * Show comment dialog
     * @param {Function} callback - Callback function
     */
    showCommentDialog(callback) {
        try {
            FavoritesPopups.showCommentDialog(callback);
        } catch (error) {
            logError('FavoritesUI.showCommentDialog', error);
        }
    },

    /**
     * Show delete confirmation dialog
     * @param {Function} callback - Callback function
     */
    showDeleteDialog(callback) {
        try {
            FavoritesPopups.showDeleteDialog(callback);
        } catch (error) {
            logError('FavoritesUI.showDeleteDialog', error);
        }
    },

    // === Language and Localization Methods ===

    /**
     * Handle locale change event
     * @param {Event} event - Locale change event
     */
    handleLocaleChange(event) {
        try {
            FavoritesInit.handleLocaleChange(event);
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.handleLocaleChange', error, { event });
        }
    },

    /**
     * Handle manual language update
     * @param {string} language - New language code
     */
    manualLanguageUpdate(language) {
        try {
            FavoritesInit.manualLanguageUpdate(language);
            this.state.cachedFavorites = FavoritesInit.cachedFavorites;
        } catch (error) {
            logError('FavoritesUI.manualLanguageUpdate', error, { language });
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
    }
}; 
