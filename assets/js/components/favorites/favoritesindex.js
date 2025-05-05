// favoritesindex.js - Point d'entrée ES module pour le module favoris

// Importer tous les modules
import { FavoritesInit } from './favorite-init.js';
import { FavoritesRendering } from './favorite-rendering.js';
import { FavoritesActions } from './favorite-actions.js';
import { FavoritesPopups } from './favorite-popup.js';
import { FavoritesEvents } from './favorite-events.js';

// Créer un objet global qui unifie tous les modules
export const FavoritesUI = {
    // Propriétés partagées
    editingFavoriteId: null,
    currentDetailedFavoriteId: null,
    favoritesList: null,
    favoritesPlaceholder: null,
    cachedFavorites: null,
    isInitialized: false,
    autoSaveTimer: null,
    originalValues: null,
    currentSortCriteria: 'date',
    
    // Méthodes d'initialisation
    init() {
        FavoritesInit.init();
        // Synchroniser les états
        this.favoritesList = FavoritesInit.favoritesList;
        this.favoritesPlaceholder = FavoritesInit.favoritesPlaceholder;
        this.cachedFavorites = FavoritesInit.cachedFavorites;
        this.isInitialized = FavoritesInit.isInitialized;
        this.currentSortCriteria = FavoritesInit.currentSortCriteria;
    },
    destroy() {
        FavoritesEvents.cleanup();
    },
    
    // Méthodes de gestion de favoris
    loadFavorite(id) {
        FavoritesActions.loadFavorite(id);
    },
    saveFavorite() {
        FavoritesActions.saveFavorite();
    },
    editFavorite(id) {
        FavoritesActions.editFavorite(id);
        this.editingFavoriteId = FavoritesActions.editingFavoriteId;
        this.originalValues = FavoritesActions.originalValues;
    },
    deleteFavorite(id) {
        FavoritesActions.deleteFavorite(id);
    },
    cancelEditMode(skipNotification = false) {
        FavoritesActions.cancelEditMode(skipNotification);
        this.editingFavoriteId = FavoritesActions.editingFavoriteId;
        this.originalValues = FavoritesActions.originalValues;
    },
    
    // Méthodes d'affichage et mise à jour de l'UI
    refreshAllFavorites() {
        FavoritesInit.refreshAllFavorites();
        this.cachedFavorites = FavoritesInit.cachedFavorites;
    },
    forceRefreshFavorites() {
        FavoritesInit.forceRefreshFavorites();
        this.cachedFavorites = FavoritesInit.cachedFavorites;
    },
    highlightFavorite(id, withScroll = true) {
        FavoritesRendering.highlightFavorite(id, withScroll);
    },
    
    // Méthodes de popups et dialogues
    showFavoriteDetails(favorite) {
        FavoritesPopups.showFavoriteDetails(favorite, FavoritesActions);
        this.currentDetailedFavoriteId = FavoritesActions.currentDetailedFavoriteId;
    },
    showCommentDialog(callback) {
        FavoritesPopups.showCommentDialog(callback);
    },
    showDeleteDialog(callback) {
        FavoritesPopups.showDeleteDialog(callback);
    },
    
    // Méthodes de gestion de la langue
    handleLocaleChange(event) {
        FavoritesInit.handleLocaleChange(event);
        this.cachedFavorites = FavoritesInit.cachedFavorites;
    },
    manualLanguageUpdate(language) {
        FavoritesInit.manualLanguageUpdate(language);
        this.cachedFavorites = FavoritesInit.cachedFavorites;
    }
}; 