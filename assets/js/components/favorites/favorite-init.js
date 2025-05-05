// favorite-init.js - Module d'initialisation pour les favoris
import { FavoritesEvents } from './favorite-events.js';
import { translateWithFallback } from './favoritesI18n.js';
import { getFavorites } from './favorite-storage.js';
import { favoriteSortFavorites } from './favorite-sort.js';
import { FavoritesRendering } from './favorite-rendering.js';
import { FavoritesPopups } from './favorite-popup.js';

/**
 * Module de gestion d'initialisation et configuration des favoris
 */
export const FavoritesInit = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date',
    isInitialized: false,
    cachedFavorites: null,
    
    /**
     * Initialise le composant favoris (DOM, listeners, tri, etc.)
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
        
        this.favoritesPlaceholder = this.favoritesList.querySelector('p');
        this.setupSortButtons();
        
        // Créer les dialogues à l'avance pour éviter la création lors de l'utilisation
        FavoritesPopups.createDialogs();
        FavoritesPopups.createDetailsPopup();
        
        // Charger les favoris mais attendre pour les afficher
        this.cachedFavorites = getFavorites();
        
        // Attendre que tout soit prêt pour afficher la liste de favoris
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Précharger la liste en arrière-plan
                FavoritesRendering.loadFavoritesWithAnimation(true);
                
                // Mettre à jour la visibilité
                this.isInitialized = true;
                this.favoritesList.style.visibility = 'visible';
                this.favoritesList.style.opacity = '1';
                document.body.classList.remove('loading-favorites');
                
                // Initialiser les écouteurs d'événements après le chargement
                FavoritesEvents.init();
                
                // Écouteurs pour les changements de langue
                document.removeEventListener('localeChanged', this.handleLocaleChange);
                this.boundHandleLocaleChange = this.handleLocaleChange.bind(this);
                document.addEventListener('localeChanged', this.boundHandleLocaleChange);
                
                // Écouter les événements globaux de changement de langue
                window.addEventListener('languageChanged', (event) => {
                    this.manualLanguageUpdate(event.detail?.language);
                });
            }, 50); // Délai légèrement plus long pour assurer la stabilité
        });
    },
    
    /**
     * Gère les changements de langue
     * @param {Event} event - L'événement de changement de langue
     */
    handleLocaleChange(event) {
        // Forcer le nettoyage du cache
        this.cachedFavorites = null;
        
        // Préparer la transition
        if (this.favoritesList) {
            // Ajouter la classe de transition de sortie
            this.favoritesList.classList.add('favorites-transition-out');
            
            // Attendre que l'animation de sortie soit terminée
            setTimeout(() => {
                // Vider la liste de favoris
                while (this.favoritesList.firstChild) {
                    this.favoritesList.removeChild(this.favoritesList.firstChild);
                }
                
                // Supprimer la classe de transition de sortie
                this.favoritesList.classList.remove('favorites-transition-out');
                
                // Recharger les favoris avec animation
                FavoritesRendering.loadFavoritesWithAnimation(false);
            }, 120);
        }
    },

    /**
     * Force la mise à jour des favoris lors d'un changement manuel de langue
     * @param {string} language - La nouvelle langue
     */
    manualLanguageUpdate(language) {
        // Vider notre cache local
        this.cachedFavorites = null;
        
        // Ajouter l'animation de sortie avant de rafraîchir les favoris
        if (this.favoritesList) {
            this.favoritesList.classList.add('favorites-loading');
            this.favoritesList.classList.add('favorites-transition-out');
        }
        
        // Reconstruire complètement les favoris
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
            
            // Vider complètement la liste (y compris le placeholder)
            if (this.favoritesList) {
                this.favoritesList.innerHTML = '';
                
                // Réinsérer le placeholder
                if (this.favoritesPlaceholder) {
                    this.favoritesList.appendChild(this.favoritesPlaceholder);
                }
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
        
        // Supprimer tous les éléments existants
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
                // Supprimer tous les éléments existants
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
            console.error("Erreur lors du tri des favoris:", error);
            
            // En cas d'erreur, recourir à la méthode précédente
            this.cachedFavorites = null;
            FavoritesRendering.loadFavoritesWithAnimation(false);
        }
    }
}; 