// favorite-init.js - Favorites initialization module
import { FavoritesEvents } from './favorite-events.js';
import { translateWithFallback } from '../../../js/i18n-init.js';
import { getFavorites } from './favorite-storage.js';
import { sortFavorites } from './favorite-sort.js';
import { FavoritesRendering } from './favorite-rendering.js';
import { FavoritesPopups } from './favorite-popup.js';

/**
 * Favorites initialization and configuration management module
 */
export const FavoritesInit = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date',
    isInitialized: false,
    cachedFavorites: null,
    
    /**
     * Initialize the favorites component (DOM, listeners, sorting, etc.)
     */
    init() {
        this.favoritesList = document.getElementById('favorites-list');
        if (!this.favoritesList) {
            console.error('Favorites list element not found');
            return;
        }
        
        document.body.classList.add('loading-favorites');
        this.favoritesList.style.visibility = 'hidden';
        this.favoritesList.style.opacity = '0';
        
        // Force cleanup of local favorites cache and StorageManager
        this.cachedFavorites = null;
        
        // Ensure StorageManager is reset to get clean data
        if (typeof StorageManager !== 'undefined') {
            if (typeof StorageManager.forceReset === 'function') {
                console.log("Using forceReset during favorites initialization");
                // Use forceReset to ensure clean data
                const cleanFavorites = StorageManager.forceReset();
                this.cachedFavorites = cleanFavorites;
            } else if (typeof StorageManager.clearCache === 'function') {
                StorageManager.clearCache();
                this.cachedFavorites = getFavorites();
            } else {
                this.cachedFavorites = getFavorites();
            }
        } else {
            // Fallback if StorageManager is not available
            this.cachedFavorites = getFavorites();
        }
        
        this.favoritesPlaceholder = this.favoritesList.querySelector('.col-span-full');
        this.setupSortButtons();
        
        // Create dialogs in advance to avoid creation during use
        FavoritesPopups.createDialogs();
        FavoritesPopups.createDetailsPopup();
        
        // Load favorites but wait to display them
        // Note: cachedFavorites is already defined, no need to redefine it here
        
        // Wait for everything to be ready to display the favorites list
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Preload the list in the background
                FavoritesRendering.loadFavoritesWithAnimation(true);
                
                // Update visibility
                this.isInitialized = true;
                this.favoritesList.style.visibility = 'visible';
                this.favoritesList.style.opacity = '1';
                document.body.classList.remove('loading-favorites');
                
                // Initialize event listeners after loading
                FavoritesEvents.init();
                
                // Listeners for language changes
                document.removeEventListener('localeChanged', this.handleLocaleChange);
                this.boundHandleLocaleChange = this.handleLocaleChange.bind(this);
                document.addEventListener('localeChanged', this.boundHandleLocaleChange);
                
                // Listen to global language change events
                window.addEventListener('languageChanged', (event) => {
                    this.manualLanguageUpdate(event.detail?.language);
                });
            }, 50); // Slightly longer delay to ensure stability
        });
    },
    
    /**
     * Handles language changes
     * @param {Event} event - The language change event
     */
    handleLocaleChange(event) {
        // Force cache cleanup
        this.cachedFavorites = null;
        
        // Prepare transition
        if (this.favoritesList) {
            // Add exit transition class
            this.favoritesList.classList.add('favorites-transition-out');
            
            // Wait for exit animation to complete
            setTimeout(() => {
                // Empty the favorites list
                while (this.favoritesList.firstChild) {
                    this.favoritesList.removeChild(this.favoritesList.firstChild);
                }
                
                // Remove exit transition class
                this.favoritesList.classList.remove('favorites-transition-out');
                
                // Reload favorites with animation
                FavoritesRendering.loadFavoritesWithAnimation(false);
            }, 120);
        }
    },

    /**
     * Force favorites update during manual language change
     * @param {string} language - The new language
     */
    manualLanguageUpdate(language) {
        // Empty our local cache
        this.cachedFavorites = null;
        
        // Add exit animation before refreshing favorites
        if (this.favoritesList) {
            this.favoritesList.classList.add('favorites-loading');
            this.favoritesList.classList.add('favorites-transition-out');
        }
        
        // Rebuild favorites completely
        setTimeout(() => {
            this.forceRefreshFavorites();
        }, 120);
    },

    /**
     * Force un rafraîchissement complet des favoris
     */
    forceRefreshFavorites() {
        try {
            // Récupérer la langue actuelle pour le logging
            const currentLang = document.documentElement.lang || 
                               (typeof localeManager !== 'undefined' ? localeManager.getCurrentLocale() : 'unknown');
            
            // Vider seulement les favoris, pas le placeholder
            if (this.favoritesList) {
                const existingCards = this.favoritesList.querySelectorAll('.favorite-item');
                existingCards.forEach(card => card.remove());
            }
            
            // Forcer un rechargement propre en retardant légèrement le chargement des favoris
            setTimeout(() => {
                // Récupérer les favoris directement (sans cache)
                const favorites = getFavorites();
                this.cachedFavorites = favorites;
                
                // Recréer complètement tous les éléments
                FavoritesRendering.loadFavoritesWithAnimation(false);
            }, 20);
        } catch (error) {
            console.error("[ERROR] Error refreshing favorites:", error);
        }
    },

    /**
     * Force un rafraîchissement complet de tous les favoris
     */
    refreshAllFavorites() {
        // Vider complètement le cache
        this.cachedFavorites = null;
        
        // Remove tous les éléments existants
        if (this.favoritesList) {
            while (this.favoritesList.firstChild) {
                this.favoritesList.removeChild(this.favoritesList.firstChild);
            }
        }
        
        // Recharger avec la méthode de base
        FavoritesRendering.loadFavoritesWithAnimation(false);
    },

    /**
     * Met à jour le cache des favoris et rafraîchit l'affichage
     * Utilisé notamment après l'ajout d'un nouveau favori
     * @param {boolean} forceFullRefresh - Si true, force un rafraîchissement complet de la liste
     */
    updateFavoriteCache(forceFullRefresh = false) {
        // Mettre à jour le cache immédiatement
        this.cachedFavorites = getFavorites();
        
        if (forceFullRefresh) {
            // Utiliser requestAnimationFrame pour optimiser les performances d'animation
            requestAnimationFrame(() => {
                // Remove tous les éléments existants
                if (this.favoritesList) {
                    while (this.favoritesList.firstChild) {
                        this.favoritesList.removeChild(this.favoritesList.firstChild);
                    }
                }
                
                // Recharger avec animation optimisée
                FavoritesRendering.loadFavoritesWithAnimation(false);
            });
        } else {
            // Simplement mettre à jour l'affichage sans recréer tous les éléments
            // pour une meilleure performance
            const favorites = this.cachedFavorites;
            const existingItems = this.favoritesList.querySelectorAll('.favorite-item');
            
            // Mettre à jour chaque élément existant
            existingItems.forEach(item => {
                const id = item.dataset.id;
                const favorite = favorites.find(f => f.id == id);
                
                if (favorite) {
                    // Mettre à jour le contenu sans recréer l'élément
                    FavoritesRendering.updateFavoriteElementContent(item, favorite);
                }
            });
        }
    },

    /**
     * Initialise les boutons de tri et leur comportement
     */
    setupSortButtons() {
        const sortButtons = document.querySelectorAll('.sort-button');
        sortButtons.forEach(button => {
            button.classList.remove('bg-blue-600', 'text-white');
            button.classList.add('text-gray-300', 'bg-gray-800/80');
            if (button.dataset.sort === this.currentSortCriteria) {
                button.classList.add('bg-blue-600', 'text-white');
                button.classList.remove('text-gray-300', 'bg-gray-800/80');
            }
            button.onclick = () => this.handleSortButtonClick(button);
        });
    },

    /**
     * Gère le clic sur un bouton de tri
     * @param {HTMLElement} button
     */
    handleSortButtonClick(button) {
        if (button.dataset.sort === this.currentSortCriteria) return;
        
        // Mettre à jour le critère de tri
        this.currentSortCriteria = button.dataset.sort;
        
        // Mettre à jour les boutons visuellement
        this.setupSortButtons();
        
        try {
            // Récupérer les favoris et les trier
            const favorites = this.cachedFavorites || getFavorites();
            const sortedFavorites = favoriteSortFavorites(favorites, this.currentSortCriteria);
            
            // Récupérer tous les éléments de favori actuels dans le DOM
            const favoriteElements = {};
            const existingCards = this.favoritesList.querySelectorAll('.favorite-item');
            
            // Si aucun élément, rien à trier
            if (existingCards.length === 0) return;
            
            // Créer un dictionnaire des éléments par ID
            existingCards.forEach(card => {
                if (card.dataset.id) {
                    favoriteElements[card.dataset.id] = card;
                }
            });
            
            // Trouver l'élément avant lequel nous allons insérer les éléments
            const insertBeforeElement = this.favoritesPlaceholder || null;
            
            // Parcourir les favoris triés et réorganiser les éléments DOM
            sortedFavorites.forEach((favorite) => {
                const element = favoriteElements[favorite.id];
                if (element) {
                    // Réordonner en déplaçant l'élément à son nouvel emplacement
                    this.favoritesList.insertBefore(element, insertBeforeElement);
                }
            });
            
        } catch (error) {
            console.error("Error sorting favorites:", error);
            
                            // In case of error, fall back to the previous method
            this.cachedFavorites = null;
            FavoritesRendering.loadFavoritesWithAnimation(false);
        }
    }
}; 
