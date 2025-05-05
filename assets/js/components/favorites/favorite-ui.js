// favorite-ui.js - Module UI des favoris
// Gère l'affichage, les interactions, les dialogues et la logique utilisateur pour les favoris
// Utilise les modules helpers (sort, storage, events, i18n)

import { favoriteSortFavorites } from './favorite-sort.js';
import { translateWithFallback } from './favoritesI18n.js';
import { getFavorites, getFavoriteById, addFavorite, updateFavorite, removeFavorite } from './favorite-storage.js';
import { FavoritesEvents } from './favorite-events.js';

/**
 * Formate un nombre avec un certain nombre de décimales
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(val, decimals = 1) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    return val.toFixed(decimals);
}
/**
 * Calcule le ratio largeur/hauteur
 * @param {number} w
 * @param {number} h
 * @returns {number}
 */
function calculateRatio(w, h) {
    if (!w || !h) return 0;
    return w / h;
}

/**
 * Composant UI principal pour la gestion des favoris
 */
export const FavoritesUI = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date',
    isInitialized: false,
    cachedFavorites: null,
    editingFavoriteId: null,
    currentDetailedFavoriteId: null,
    autoSaveTimer: null,
    originalValues: null,

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
        this.createDialogs();
        this.createDetailsPopup();
        
        // Charger les favoris mais attendre pour les afficher
        this.cachedFavorites = getFavorites();
        
        // Attendre que tout soit prêt pour afficher la liste de favoris
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Précharger la liste en arrière-plan
                this.loadFavoritesWithAnimation(true);
                
                // Mettre à jour la visibilité
                this.isInitialized = true;
                this.favoritesList.style.visibility = 'visible';
                this.favoritesList.style.opacity = '1';
                document.body.classList.remove('loading-favorites');
                
                // Initialiser les écouteurs d'événements après le chargement
                FavoritesEvents.init(this);
                
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
     * Crée les dialogues à l'avance
     */
    createDialogs() {
        // Vérifier d'abord si le dialog de commentaire existe déjà
        let commentDialog = document.getElementById('favorite-comment-dialog');
        if (!commentDialog) {
            commentDialog = document.createElement('div');
            commentDialog.id = 'favorite-comment-dialog';
            commentDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden animate-fadeIn';
            commentDialog.innerHTML = `
                <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 scale-100 transition-transform animate-scaleIn">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                        <h2 class="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span data-i18n="save_favorite">Enregistrer la configuration actuelle</span>
                        </h2>
                        <button id="favorite-close-btn" class="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Section Titre -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label for="favorite-title-input" class="block text-base font-medium text-white">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span data-i18n="favorite_name" class="text-lg">Titre</span>
                                </div>
                            </label>
                            <span id="favorite-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/32</span>
                        </div>
                        <input id="favorite-title-input" type="text" maxlength="32" class="w-full p-2.5 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Nom du favori (optionnel)">
                    </div>
                    
                    <!-- Section Description -->
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="favorite-desc-input" class="block text-base font-medium text-white">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span data-i18n="favorite_description" class="text-lg">Description</span>
                                </div>
                            </label>
                            <span id="favorite-desc-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                        </div>
                        <textarea id="favorite-desc-input" maxlength="144" class="w-full p-2.5 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition resize-none min-h-[100px]" placeholder="Description (optionnelle)"></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-3 mt-4">
                        <button id="favorite-cancel-btn" class="flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span data-i18n="cancel">Annuler</span>
                        </button>
                        <button id="favorite-save-btn" class="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span data-i18n="save">Sauvegarder</span>
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(commentDialog);
        }
        
        // Vérifier si le dialog de suppression existe déjà
        let deleteDialog = document.getElementById('favorite-delete-dialog');
        if (!deleteDialog) {
            deleteDialog = document.createElement('div');
            deleteDialog.id = 'favorite-delete-dialog';
            deleteDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden animate-fadeIn';
            deleteDialog.innerHTML = `
                <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 scale-100 transition-transform animate-scaleIn">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                        <h2 class="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span data-i18n="delete_confirm">Confirmer la suppression</span>
                        </h2>
                        <button id="favorite-del-close-btn" class="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-red-500/20 mb-5">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-base font-medium text-red-400" data-i18n="warning">Attention</h3>
                                <div class="mt-2 text-sm text-gray-300">
                                    <p data-i18n="delete_warning">Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible et ne peut pas être annulée.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button id="favorite-del-cancel-btn" class="flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span data-i18n="cancel">Annuler</span>
                        </button>
                        <button id="favorite-del-confirm-btn" class="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span data-i18n="delete">Supprimer</span>
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(deleteDialog);
        }
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
                this.loadFavoritesWithAnimation(false);
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
                this.loadFavoritesWithAnimation(false);
            }, 20);
        } catch (error) {
            console.error("[ERROR] Error refreshing favorites:", error);
        }
    },

    /**
     * Nettoie les listeners et l'état du composant (à appeler lors de la destruction)
     */
    destroy() {
        FavoritesEvents.cleanup();
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
        this.loadFavoritesWithAnimation(false);
    },

    /**
     * Charge et affiche les favoris avec animation
     * @param {boolean} isInitialLoad - Si c'est le chargement initial (pas d'animation de sortie)
     */
    loadFavoritesWithAnimation(isInitialLoad = false) {
        // Récupérer tous les favoris
        const favorites = this.cachedFavorites || getFavorites();
        this.cachedFavorites = favorites;
        
        // Cas où il n'y a pas de favoris
        if (favorites.length === 0) {
            if (this.favoritesPlaceholder) {
                this.favoritesPlaceholder.classList.remove('hidden');
                if (!this.favoritesPlaceholder.classList.contains('col-span-full')) {
                    this.favoritesPlaceholder.classList.add('col-span-full');
                }
            }
            
            // Vider la liste (excepté le placeholder)
            const existingCards = this.favoritesList.querySelectorAll('.favorite-item');
            existingCards.forEach(card => card.remove());
            
            this.favoritesList.classList.remove('favorites-loading');
            return;
        }
        
        // Masquer le placeholder s'il y a des favoris
        if (this.favoritesPlaceholder) {
            this.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Trier les favoris selon le critère actuel
        const sortedFavorites = favoriteSortFavorites(favorites, this.currentSortCriteria);
        
        // Supprimer tous les éléments existants
        const existingCards = this.favoritesList.querySelectorAll('.favorite-item');
        existingCards.forEach(card => card.remove());
        
        // Trouver le dernier favori ajouté (celui avec l'ID le plus récent)
        const lastAddedId = Math.max(...sortedFavorites.map(f => parseInt(f.id)));
        
        // Créer et insérer tous les favoris dans l'ordre trié
        sortedFavorites.forEach(favorite => {
            // Créer un nouvel élément pour chaque favori
            const cardElement = this.createFavoriteElement(favorite);
            
            // Animer seulement si c'est le dernier ajouté et ce n'est pas le chargement initial
            if (!isInitialLoad && favorite.id == lastAddedId) {
                cardElement.style.opacity = '0';
                cardElement.classList.add('animate-fadeIn-smooth');
                
                // Animation complète après un court délai
                setTimeout(() => {
                    cardElement.style.opacity = '1';
                    // Ajouter un gestionnaire pour marquer l'animation comme terminée
                    cardElement.addEventListener('animationend', () => {
                        cardElement.classList.remove('animate-fadeIn-smooth');
                        cardElement.classList.add('animation-complete');
                    }, { once: true });
                }, 50);
            }
            
            this.favoritesList.appendChild(cardElement);
        });
        
        this.favoritesList.classList.remove('favorites-loading');
    },

    /**
     * Crée un élément DOM pour un favori
     * @param {Object} favorite
     * @returns {HTMLElement}
     */
    createFavoriteElement(favorite) {
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const item = document.createElement('div');
        item.className = 'favorite-item bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-blue-500/30 shadow-lg';
        item.dataset.id = favorite.id;
        let title = favorite.title || favorite.comment || 'i18n:default_favorite_name';
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        const displayTitle = translatedTitle.length > 32 ? translatedTitle.substring(0, 32) + '...' : translatedTitle;
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width, 3);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        item.innerHTML = `
            <div class="relative">
                <div class="flex items-center mb-2">
                    <div class="flex-1">
                        <h3 class="font-medium text-white text-sm truncate mb-0.5">${displayTitle}</h3>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                ${areaWidth}×${areaHeight}
                            </span>
                            <span class="text-xs text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                ${areaRatio}
                            </span>
                            <span class="text-xs text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4a8 8 0 100 16 8 8 0 000-16z" />
                                </svg>
                                ${areaRadius}%
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        ${formattedDate}
                    </div>
                    <div class="flex gap-1.5">
                        <button class="load-favorite-btn bg-blue-600 hover:bg-blue-500 text-white rounded-md p-1 flex items-center justify-center transition-colors duration-200 w-7 h-7 shadow-md favorite-btn" title="Charger la configuration" aria-label="Charger la configuration">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button class="edit-favorite-btn bg-gray-600 hover:bg-gray-500 text-white rounded-md p-1 flex items-center justify-center transition-colors duration-200 w-7 h-7 shadow-md favorite-btn" title="Modifier" aria-label="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-favorite-btn bg-red-500 hover:bg-red-400 text-white rounded-md p-1 flex items-center justify-center transition-colors duration-200 w-7 h-7 shadow-md favorite-btn" title="Supprimer" aria-label="Supprimer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>`;

        // Ajouter un gestionnaire de clic à la carte elle-même (excluant les boutons)
        item.addEventListener('click', (e) => {
            // Si le clic est sur un bouton ou à l'intérieur d'un bouton, ne rien faire
            if (e.target.closest('.favorite-btn')) {
                return;
            }
            // Sinon, montrer les détails du favori
            e.stopPropagation();
            favorite._originalTitle = title;
            this.showFavoriteDetails && this.showFavoriteDetails(favorite);
        });
        
        // Ajouter des gestionnaires de clic séparés pour chaque bouton
        const loadBtn = item.querySelector('.load-favorite-btn');
        const editBtn = item.querySelector('.edit-favorite-btn');
        const deleteBtn = item.querySelector('.delete-favorite-btn');
        
        loadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.loadFavorite && this.loadFavorite(favorite.id);
        });
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.editFavorite && this.editFavorite(favorite.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.deleteFavorite && this.deleteFavorite(favorite.id);
        });
        
        item.style.marginTop = '8px';
        
        // Ajouter la classe animate-fadeIn-smooth pour l'animation d'entrée
        if (this.isInitialized) {
            item.classList.add('animate-fadeIn-smooth');
        }
        
        return item;
    },

    /**
     * Affiche un popup détaillé pour un favori
     * @param {Object} favorite
     */
    showFavoriteDetails(favorite) {
        let popup = document.getElementById('favorite-details-popup');
        if (!popup) {
            this.createDetailsPopup();
            popup = document.getElementById('favorite-details-popup');
            if (!popup) {
                console.error("[ERROR] Impossible de créer la popup de détails");
                return;
            }
        }
        
        // Remplir les champs
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const titleInput = popup.querySelector('#details-title');
        const descriptionInput = popup.querySelector('#details-description');
        const dateSpan = popup.querySelector('#details-date');
        const areaDim = popup.querySelector('#details-area-dimensions');
        const areaRatio = popup.querySelector('#details-area-ratio');
        const areaSize = popup.querySelector('#details-area-size');
        const areaPos = popup.querySelector('#details-area-position');
        const areaRadius = popup.querySelector('#details-area-radius');
        const tabletDim = popup.querySelector('#details-tablet-dimensions');
        const tabletRatio = popup.querySelector('#details-tablet-ratio');
        const tabletName = popup.querySelector('#details-tablet-name');
        const titleCounter = popup.querySelector('#details-title-counter');
        const descriptionCounter = popup.querySelector('#details-description-counter');
        
        // Stocker l'ID du favori actuellement affiché
        this.currentDetailedFavoriteId = favorite.id;
        
        let title = favorite.title || favorite.comment || 'i18n:default_favorite_name';
        let translatedTitle = title;
        
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        
        titleInput.value = translatedTitle;
        titleInput.dataset.originalTitle = title; // Stocker le titre original pour la sauvegarde
        descriptionInput.value = favorite.description || '';
        dateSpan.textContent = formattedDate;
        
        // Mettre à jour les compteurs de caractères
        if (titleCounter) {
            titleCounter.textContent = `${translatedTitle.length}/32`;
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            if (translatedTitle.length >= 32) {
                titleCounter.classList.add('text-red-500');
            } else if (translatedTitle.length > 25) {
                titleCounter.classList.add('text-yellow-500');
            }
        }
        
        if (descriptionCounter) {
            const descLength = (favorite.description || '').length;
            descriptionCounter.textContent = `${descLength}/144`;
            descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            if (descLength >= 144) {
                descriptionCounter.classList.add('text-red-500');
            } else if (descLength > 120) {
                descriptionCounter.classList.add('text-yellow-500');
            }
        }
        
        // Afficher la date de dernière modification si elle existe
        const lastModifiedContainer = popup.querySelector('#details-last-modified-container');
        const lastModifiedContent = popup.querySelector('#details-last-modified');
        
        if (favorite.lastModified && lastModifiedContainer && lastModifiedContent) {
            const lastModifiedDate = new Date(favorite.lastModified);
            const formattedLastModified = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
            lastModifiedContent.textContent = formattedLastModified;
            lastModifiedContainer.classList.remove('hidden');
            lastModifiedContainer.classList.add('flex');
        } else if (lastModifiedContainer) {
            lastModifiedContainer.classList.add('hidden');
            lastModifiedContainer.classList.remove('flex');
        }
        
        // Zone active
        areaDim.textContent = `${formatNumber(favorite.areaWidth || favorite.width, 3)} × ${formatNumber(favorite.areaHeight || favorite.height, 3)} mm`;
        areaRatio.textContent = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        areaSize.textContent = `${formatNumber((favorite.areaWidth || favorite.width) * (favorite.areaHeight || favorite.height), 1)} mm²`;
        areaPos.textContent = `X: ${formatNumber(favorite.x || favorite.offsetX, 3)}, Y: ${formatNumber(favorite.y || favorite.offsetY, 3)}`;
        areaRadius.textContent = `${typeof favorite.radius !== 'undefined' ? favorite.radius : 0}%`;
        
        // Tablette
        if (favorite.tabletW && favorite.tabletH) {
            tabletDim.textContent = `${formatNumber(favorite.tabletW, 1)} × ${formatNumber(favorite.tabletH, 1)} mm`;
            tabletRatio.textContent = formatNumber(calculateRatio(favorite.tabletW, favorite.tabletH), 3);
        } else {
            tabletDim.textContent = '-- × -- mm';
            tabletRatio.textContent = '--';
        }
        
        if (favorite.presetInfo) {
            if (favorite.presetInfo.startsWith('i18n:')) {
                const key = favorite.presetInfo.substring(5);
                tabletName.textContent = translateWithFallback(key);
            } else {
                tabletName.textContent = favorite.presetInfo;
            }
        } else {
            tabletName.textContent = translateWithFallback('select_model');
        }
        
        // Préparation de l'animation simplifiée
        const dialogContent = popup.querySelector('div');
        if (dialogContent) {
            dialogContent.style.transform = 'scale(0.95)';
        }
        
        // Afficher la popup
        popup.classList.remove('hidden');
        popup.classList.add('flex');
        popup.style.opacity = '0';
        
        // Ajouter la classe show après un court délai pour assurer une transition fluide
        setTimeout(() => {
            popup.classList.add('show');
            popup.style.opacity = '1';
        }, 10);
        
        // Configurer les événements pour l'auto-sauvegarde
        this.setupAutoSave(titleInput, descriptionInput, titleCounter, descriptionCounter);
    },

    /**
     * Configure l'auto-sauvegarde des champs de la popup
     */
    setupAutoSave(titleInput, descriptionInput, titleCounter, descriptionCounter) {
        // Supprimer les anciens écouteurs pour éviter les doublons
        const oldTitleListener = titleInput._inputListener;
        const oldDescListener = descriptionInput._inputListener;
        
        if (oldTitleListener) {
            titleInput.removeEventListener('input', oldTitleListener);
        }
        
        if (oldDescListener) {
            descriptionInput.removeEventListener('input', oldDescListener);
        }
        
        // Définir les nouveaux écouteurs
        const titleInputListener = () => {
            const length = titleInput.value.length;
            if (titleCounter) {
                titleCounter.textContent = `${length}/32`;
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                if (length >= 32) {
                    titleCounter.classList.add('text-red-500');
                } else if (length > 25) {
                    titleCounter.classList.add('text-yellow-500');
                }
            }
            
            // Programmer une sauvegarde automatique
            this.scheduleAutoSave();
        };
        
        const descInputListener = () => {
            const length = descriptionInput.value.length;
            if (descriptionCounter) {
                descriptionCounter.textContent = `${length}/144`;
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                if (length >= 144) {
                    descriptionCounter.classList.add('text-red-500');
                } else if (length > 120) {
                    descriptionCounter.classList.add('text-yellow-500');
                }
            }
            
            // Programmer une sauvegarde automatique
            this.scheduleAutoSave();
        };
        
        // Stocker les références pour pouvoir les supprimer plus tard
        titleInput._inputListener = titleInputListener;
        descriptionInput._inputListener = descInputListener;
        
        // Ajouter les écouteurs
        titleInput.addEventListener('input', titleInputListener);
        descriptionInput.addEventListener('input', descInputListener);
        
        // Activer la touche Entrée pour passer au champ description
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                descriptionInput.focus();
            }
        });
    },
    
    /**
     * Programme une sauvegarde automatique après un délai
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            // Sauvegarder les changements
            const needsUpdate = this.saveChangesIfNeeded();
            
            // Si les données ont été modifiées, forcer un rafraîchissement 
            // des favoris dans l'interface pour refléter les changements
            if (needsUpdate) {
                this.refreshAllFavorites();
            }
        }, 600);
    },
    
    /**
     * Sauvegarde les modifications apportées aux champs du favori si nécessaire
     * @returns {boolean} - true si des modifications ont été effectuées, false sinon
     */
    saveChangesIfNeeded() {
        const favoriteId = this.currentDetailedFavoriteId;
        if (!favoriteId) {
            return false;
        }
        
        const titleInput = document.getElementById('details-title');
        const descriptionInput = document.getElementById('details-description');
        
        if (!titleInput || !descriptionInput) {
            return false;
        }
        
        const favorite = getFavoriteById(favoriteId);
        if (!favorite) {
            return false;
        }
        
        // Récupérer les valeurs
        const newTitleValue = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        
        // Vérifier si on doit préserver le format i18n
        let newTitle = newTitleValue;
        
        // Si on a un titre original stocké et c'était une clé i18n,
        // et l'utilisateur n'a pas changé le texte affiché, préserver la clé i18n
        const originalTitle = titleInput.dataset.originalTitle;
        if (originalTitle && originalTitle.startsWith('i18n:')) {
            const key = originalTitle.substring(5);
            let currentTranslation = '';
            
            // Obtenir la traduction actuelle pour comparaison
            if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
                currentTranslation = localeManager.translate(key);
            } else {
                currentTranslation = translateWithFallback(key);
            }
            
            if (currentTranslation === newTitleValue) {
                // L'utilisateur n'a pas modifié le texte traduit, garder la clé i18n
                newTitle = originalTitle;
            } else if (newTitleValue === key) {
                // L'utilisateur a entré la clé brute, garder le format i18n
                newTitle = originalTitle;
            } else if (key === 'default_favorite_name') {
                // Pour default_favorite_name, vérifier s'ils ont tapé l'une des traductions standard
                let isDefaultTranslation = false;
                
                if (newTitleValue === 'Configuration sauvegardée' ||
                    newTitleValue === 'Saved configuration' ||
                    newTitleValue === 'Configuración guardada') {
                    isDefaultTranslation = true;
                }
                
                if (isDefaultTranslation) {
                    newTitle = 'i18n:default_favorite_name';
                }
            }
        }
        
        // Vérifier si les valeurs ont changé
        const titleChanged = newTitle !== (favorite.title || '');
        const descChanged = newDescription !== (favorite.description || '');
        
        if (titleChanged || descChanged) {
            // Mettre à jour la date de dernière modification
            const now = new Date().getTime();
            
            // Mettre à jour le titre et la description
            const updatedData = {
                ...favorite,
                title: newTitle,
                description: newDescription,
                lastModified: now // Ajouter la date de dernière modification
            };
            
            const success = updateFavorite(favoriteId, updatedData);
            
            if (success) {
                // Mise à jour de l'affichage de la date de dernière modification dans la popup
                const lastModifiedContainer = document.getElementById('details-last-modified-container');
                const lastModifiedContent = document.getElementById('details-last-modified');
                
                if (lastModifiedContainer && lastModifiedContent) {
                    const lastModifiedDate = new Date(now);
                    const formattedLastModified = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
                    lastModifiedContent.textContent = formattedLastModified;
                    lastModifiedContainer.classList.remove('hidden');
                    lastModifiedContainer.classList.add('flex');
                }
                
                return true; // Des modifications ont été effectuées
            }
        }
        
        return false; // Aucune modification n'a été effectuée
    },

    /**
     * Charge un favori dans le formulaire principal
     * @param {string|number} id
     */
    loadFavorite(id) {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(`Favori ID ${id} introuvable`);
            }
            return;
        }
        try {
            // Exemple : mise à jour des champs du formulaire (à adapter selon l'app)
            document.getElementById('areaWidth').value = formatNumber(favorite.width);
            document.getElementById('areaHeight').value = formatNumber(favorite.height);
            document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
            document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
            if (favorite.ratio) {
                document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
            }
            if (typeof favorite.radius !== 'undefined') {
                document.getElementById('areaRadius').value = favorite.radius;
                const radiusInput = document.getElementById('radius-input');
                if (radiusInput) radiusInput.value = favorite.radius;
            }
            
            // Mettre à jour les dimensions de la tablette si disponibles
            if (typeof favorite.tabletW !== 'undefined' && typeof favorite.tabletH !== 'undefined') {
                const tabletWidth = document.getElementById('tabletWidth');
                const tabletHeight = document.getElementById('tabletHeight');
                
                if (tabletWidth) tabletWidth.value = formatNumber(favorite.tabletW);
                if (tabletHeight) tabletHeight.value = formatNumber(favorite.tabletH);
            }
            
            // Mettre à jour l'information du modèle si disponible
            if (favorite.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                    
                    // Vérifier si c'est une clé de traduction
                    if (favorite.presetInfo.startsWith('i18n:')) {
                        const key = favorite.presetInfo.substring(5);
                        
                        // Appliquer la clé de traduction à l'attribut data-i18n
                        selectorText.setAttribute('data-i18n', key);
                        
                        // Utiliser notre fonction de traduction robuste
                        selectorText.textContent = translateWithFallback(key);
                    } else {
                        // C'est un nom de modèle normal, pas une clé de traduction
                        selectorText.removeAttribute('data-i18n');
                        selectorText.textContent = favorite.presetInfo;
                    }
                }
            }
            
            // Mettre à jour l'affichage si besoin
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
            
            // Mettre en évidence le favori chargé sans recharger toute la liste
            this.highlightFavorite(id);
            
            // Sauvegarder l'état actuel dans les préférences si disponible
            if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
            }
            
            // Notification
            if (typeof Notifications !== 'undefined' && Notifications.success) {
                Notifications.success('Configuration chargée');
            }
        } catch (error) {
            console.error('Error loading the favorite:', error);
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error('Erreur lors du chargement de la configuration');
            }
        }
    },

    /**
     * Démarre l'édition d'un favori
     * @param {string|number} id - ID du favori à éditer
     */
    editFavorite(id) {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error('Favori introuvable');
            }
            return;
        }
        
        // Stocker l'ID du favori en cours d'édition (dans l'état global ou local)
        this.editingFavoriteId = id;
        
        // Sauvegarder les valeurs originales pour pouvoir les restaurer
        this.originalValues = {
            width: favorite.width,
            height: favorite.height,
            x: favorite.x || favorite.offsetX,
            y: favorite.y || favorite.offsetY,
            ratio: favorite.ratio,
            tabletW: favorite.tabletW, 
            tabletH: favorite.tabletH,
            presetInfo: favorite.presetInfo,
            title: favorite.title,
            description: favorite.description,
            radius: favorite.radius || 0
        };
        
        // Mise à jour du state global si disponible
        if (typeof window.appState !== 'undefined') {
            window.appState.editingFavoriteId = id;
            window.appState.originalValues = this.originalValues;
        }
        
        // Afficher le bouton pour annuler l'édition
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.classList.add('flex');
            
            // Ajouter l'événement d'annulation
            cancelBtn.onclick = () => this.cancelEditMode();
        }
        
        // Remplacer le bouton de sauvegarde par un bouton "Confirmer la modification"
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            // Changer le contenu du bouton
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span data-i18n="confirm_modification">Confirmer la modification</span>`;
            
            // S'assurer que la traduction est appliquée
            if (typeof localeManager !== 'undefined') {
                if (typeof localeManager.applyTranslations === 'function') {
                    localeManager.applyTranslations(saveBtn);
                } else if (typeof localeManager.translate === 'function') {
                    const span = saveBtn.querySelector('span[data-i18n]');
                    if (span) {
                        const key = span.getAttribute('data-i18n');
                        span.textContent = localeManager.translate(key) || 'Confirmer la modification';
                    }
                }
            }
        }
        
        // Remplir le formulaire avec les valeurs du favori
        document.getElementById('areaWidth').value = formatNumber(favorite.width);
        document.getElementById('areaHeight').value = formatNumber(favorite.height);
        document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
        document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
        if (favorite.ratio) {
            document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
        }
        if (typeof favorite.radius !== 'undefined') {
            document.getElementById('areaRadius').value = favorite.radius;
            const radiusInput = document.getElementById('radius-input');
            if (radiusInput) radiusInput.value = favorite.radius;
        }
        
        // Mettre à jour l'affichage de l'interface si la fonction existe
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        } else if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
        
        // Mettre en surbrillance le favori en cours d'édition
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`);
        if (favoriteElement) {
            favoriteElement.classList.add('border-blue-500', 'highlight-effect');
            // Retirer la surbrillance après un délai
            setTimeout(() => {
                favoriteElement.classList.remove('highlight-effect');
                // Garder la bordure bleue pour indiquer l'élément en cours d'édition
            }, 1500);
        }
        
        // Afficher une notification
        if (typeof Notifications !== 'undefined' && Notifications.info) {
            Notifications.info('Mode édition activé - Modifiez les paramètres puis cliquez sur "Confirmer la modification"');
        }
    },

    /**
     * Annule le mode édition et restaure les valeurs originales
     * @param {boolean} skipNotification - Si vrai, n'affiche pas de notification
     */
    cancelEditMode(skipNotification = false) {
        // Vérifier qu'il y a un mode d'édition actif et des valeurs à restaurer
        if (!this.editingFavoriteId || !this.originalValues) {
            return;
        }
        
        // Stocker l'ID pour pouvoir l'utiliser après la réinitialisation
        const previousEditingId = this.editingFavoriteId;
        
        // Restaurer les valeurs originales
        const original = this.originalValues;
        
        if (original) {
            document.getElementById('areaWidth').value = formatNumber(original.width);
            document.getElementById('areaHeight').value = formatNumber(original.height);
            document.getElementById('areaOffsetX').value = formatNumber(original.x, 3);
            document.getElementById('areaOffsetY').value = formatNumber(original.y, 3);
            
            if (original.ratio) {
                document.getElementById('customRatio').value = formatNumber(original.ratio, 3);
            }
            
            if (typeof original.radius !== 'undefined') {
                document.getElementById('areaRadius').value = original.radius;
                const radiusInput = document.getElementById('radius-input');
                if (radiusInput) radiusInput.value = original.radius;
            }
            
            // Mettre à jour l'affichage
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
        }
        
        // Supprimer la mise en évidence du favori en cours d'édition
        // sans provoquer d'animation indésirable
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${previousEditingId}"]`);
        if (favoriteElement) {
            // Supprimer les classes sans transition
            requestAnimationFrame(() => {
                favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
            });
        }
        
        // Réinitialiser le bouton de sauvegarde
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span data-i18n="save">Sauvegarder</span>`;
            
            // S'assurer que la traduction est appliquée
            if (typeof localeManager !== 'undefined') {
                if (typeof localeManager.applyTranslations === 'function') {
                    localeManager.applyTranslations(saveBtn);
                } else if (typeof localeManager.translate === 'function') {
                    const span = saveBtn.querySelector('span[data-i18n]');
                    if (span) {
                        const key = span.getAttribute('data-i18n');
                        span.textContent = localeManager.translate(key) || 'Sauvegarder';
                    }
                }
            }
        }
        
        // Cacher le bouton d'annulation
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
            cancelBtn.classList.remove('flex');
        }
        
        // Réinitialiser les états
        this.editingFavoriteId = null;
        this.originalValues = null;
        
        // Réinitialiser également dans l'état global si disponible
        if (typeof window.appState !== 'undefined') {
            window.appState.editingFavoriteId = null;
            window.appState.originalValues = null;
        }
        
        // Afficher une notification sauf si demandé de ne pas le faire
        if (!skipNotification && typeof Notifications !== 'undefined' && Notifications.info) {
            Notifications.info('Mode édition annulé');
        }
    },

    /**
     * Affiche un dialogue pour saisir le titre et la description d'un favori
     * @param {Function} callback - Reçoit {title, description}
     */
    showCommentDialog(callback) {
        let dialog = document.getElementById('favorite-comment-dialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'favorite-comment-dialog';
            dialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn';
            dialog.innerHTML = `
                <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 scale-100 transition-transform animate-scaleIn">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                        <h2 class="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span data-i18n="save_favorite">Enregistrer la configuration actuelle</span>
                        </h2>
                        <button id="favorite-close-btn" class="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Section Titre -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label for="favorite-title-input" class="block text-base font-medium text-white">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span data-i18n="favorite_name" class="text-lg">Titre</span>
                                </div>
                            </label>
                            <span id="favorite-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/32</span>
                        </div>
                        <input id="favorite-title-input" type="text" maxlength="32" class="w-full p-2.5 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Nom du favori (optionnel)">
                    </div>
                    
                    <!-- Section Description -->
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="favorite-desc-input" class="block text-base font-medium text-white">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span data-i18n="favorite_description" class="text-lg">Description</span>
                                </div>
                            </label>
                            <span id="favorite-desc-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                        </div>
                        <textarea id="favorite-desc-input" maxlength="144" class="w-full p-2.5 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition resize-none min-h-[100px]" placeholder="Description (optionnelle)"></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-3 mt-4">
                        <button id="favorite-cancel-btn" class="flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span data-i18n="cancel">Annuler</span>
                        </button>
                        <button id="favorite-save-btn" class="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span data-i18n="save">Sauvegarder</span>
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(dialog);
        }
        
        dialog.classList.remove('hidden');
        const titleInput = dialog.querySelector('#favorite-title-input');
        const descInput = dialog.querySelector('#favorite-desc-input');
        const cancelBtn = dialog.querySelector('#favorite-cancel-btn');
        const saveBtn = dialog.querySelector('#favorite-save-btn');
        const closeBtn = dialog.querySelector('#favorite-close-btn');
        const titleCounter = dialog.querySelector('#favorite-title-counter');
        const descCounter = dialog.querySelector('#favorite-desc-counter');
        
        // Réinitialiser complètement les champs et compteurs
        titleInput.value = '';
        descInput.value = '';
        titleCounter.textContent = '0/32';
        descCounter.textContent = '0/144';
        
        // Supprimer les écouteurs d'événements existants pour éviter les doublons
        const oldTitleListener = titleInput._inputListener;
        const oldDescListener = descInput._inputListener;
        
        if (oldTitleListener) {
            titleInput.removeEventListener('input', oldTitleListener);
        }
        
        if (oldDescListener) {
            descInput.removeEventListener('input', oldDescListener);
        }
        
        // Définir les nouveaux écouteurs d'événements
        const titleInputListener = () => {
            const length = titleInput.value.length;
            titleCounter.textContent = `${length}/32`;
            
            // Classes conditionnelles selon la limite
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            if (length >= 32) {
                titleCounter.classList.add('text-red-500');
            } else if (length > 25) {
                titleCounter.classList.add('text-yellow-500');
            }
        };
        
        const descInputListener = () => {
            const length = descInput.value.length;
            descCounter.textContent = `${length}/144`;
            
            // Classes conditionnelles selon la limite
            descCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            if (length >= 144) {
                descCounter.classList.add('text-red-500');
            } else if (length > 120) {
                descCounter.classList.add('text-yellow-500');
            }
        };
        
        // Stocker les références aux écouteurs pour pouvoir les supprimer plus tard
        titleInput._inputListener = titleInputListener;
        descInput._inputListener = descInputListener;
        
        titleInput.addEventListener('input', titleInputListener);
        descInput.addEventListener('input', descInputListener);
        
        const hideDialog = () => {
            // Réinitialiser les compteurs avant de cacher le dialogue
            if (titleCounter) {
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
            
            if (descCounter) {
                descCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
            
            dialog.classList.add('hidden');
        };
        
        cancelBtn.onclick = hideDialog;
        closeBtn.onclick = hideDialog;
        
        saveBtn.onclick = () => {
            hideDialog();
            callback({ title: titleInput.value, description: descInput.value });
        };
        
        // Activer la touche Entrée pour passer au champ description
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                descInput.focus();
            }
        });
        
        // Focus sur le champ de titre avec un léger délai pour éviter les problèmes d'animation
        setTimeout(() => {
            titleInput.focus();
        }, 100);
    },

    /**
     * Affiche un dialogue de confirmation de suppression
     * @param {Function} callback - Reçoit true si confirmé
     */
    showDeleteDialog(callback) {
        let dialog = document.getElementById('favorite-delete-dialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'favorite-delete-dialog';
            dialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn';
            dialog.innerHTML = `
                <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 scale-100 transition-transform animate-scaleIn">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                        <h2 class="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span data-i18n="delete_confirm">Confirmer la suppression</span>
                        </h2>
                        <button id="favorite-del-close-btn" class="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-red-500/20 mb-5">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-base font-medium text-red-400" data-i18n="warning">Attention</h3>
                                <div class="mt-2 text-sm text-gray-300">
                                    <p data-i18n="delete_warning">Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible et ne peut pas être annulée.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button id="favorite-del-cancel-btn" class="flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span data-i18n="cancel">Annuler</span>
                        </button>
                        <button id="favorite-del-confirm-btn" class="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span data-i18n="delete">Supprimer</span>
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(dialog);
        }
        dialog.classList.remove('hidden');
        
        const closeBtn = dialog.querySelector('#favorite-del-close-btn');
        const cancelBtn = dialog.querySelector('#favorite-del-cancel-btn');
        const confirmBtn = dialog.querySelector('#favorite-del-confirm-btn');
        
        const hideDialog = () => {
            dialog.classList.add('hidden');
        };
        
        closeBtn.onclick = () => {
            hideDialog();
            callback(false);
        };
        
        cancelBtn.onclick = () => {
            hideDialog();
            callback(false);
        };
        
        confirmBtn.onclick = () => {
            hideDialog();
            callback(true);
        };
    },

    /**
     * Sauvegarde un favori (ajout ou mise à jour selon le contexte, avec titre/description)
     */
    saveFavorite() {
        // Récupérer les valeurs du formulaire
        const areaWidth = parseFloat(document.getElementById('areaWidth').value);
        const areaHeight = parseFloat(document.getElementById('areaHeight').value);
        const areaOffsetX = parseFloat(document.getElementById('areaOffsetX').value);
        const areaOffsetY = parseFloat(document.getElementById('areaOffsetY').value);
        const customRatio = parseFloat(document.getElementById('customRatio').value);
        const areaRadius = parseInt(document.getElementById('areaRadius')?.value) || 0;
        
        // Récupérer les informations de la tablette si disponibles
        let tabletWidth = 0;
        let tabletHeight = 0;
        let presetInfo = null;
        
        const tabletWidthElement = document.getElementById('tabletWidth');
        const tabletHeightElement = document.getElementById('tabletHeight');
        const tabletSelectorText = document.getElementById('tabletSelectorText');
        
        if (tabletWidthElement) {
            tabletWidth = parseFloat(tabletWidthElement.value) || 0;
        }
        if (tabletHeightElement) {
            tabletHeight = parseFloat(tabletHeightElement.value) || 0;
        }
        if (tabletSelectorText) {
            // Vérifier si c'est une clé de traduction
            if (tabletSelectorText.hasAttribute('data-i18n')) {
                presetInfo = 'i18n:' + tabletSelectorText.getAttribute('data-i18n');
            } else {
                presetInfo = tabletSelectorText.textContent;
            }
        }
        
        // Vérifier si on est en mode édition
        if (this.editingFavoriteId) {
            // Mise à jour d'un favori existant - PAS DE DIALOGUE, mise à jour directe
            const updatedData = {
                width: !isNaN(areaWidth) ? areaWidth : this.originalValues.width,
                height: !isNaN(areaHeight) ? areaHeight : this.originalValues.height,
                x: !isNaN(areaOffsetX) ? areaOffsetX : this.originalValues.x,
                y: !isNaN(areaOffsetY) ? areaOffsetY : this.originalValues.y,
                ratio: !isNaN(customRatio) ? customRatio : this.originalValues.ratio,
                tabletW: !isNaN(tabletWidth) ? tabletWidth : this.originalValues.tabletW,
                tabletH: !isNaN(tabletHeight) ? tabletHeight : this.originalValues.tabletH,
                presetInfo: presetInfo || this.originalValues.presetInfo,
                title: this.originalValues.title,
                description: this.originalValues.description,
                radius: !isNaN(areaRadius) ? areaRadius : (this.originalValues.radius || 0),
                lastModified: new Date().getTime() // Ajouter la date de dernière modification
            };
            
            const success = updateFavorite(this.editingFavoriteId, updatedData);
            if (success) {
                // Stocker l'ID du favori modifié
                const modifiedFavoriteId = this.editingFavoriteId;
                
                // Annuler le mode édition sans notification
                this.cancelEditMode(true);
                
                // Mettre à jour le cache local
                this.cachedFavorites = null;
                
                // Trouver l'élément du favori modifié et le mettre en évidence
                // sans recharger toute la liste
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${modifiedFavoriteId}"]`);
                if (favoriteElement) {
                    // Mettre en évidence la carte modifiée
                    favoriteElement.classList.add('border-blue-500', 'highlight-effect');
                    
                    // Retirer la mise en évidence après un délai
                    setTimeout(() => {
                        favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
                    }, 1500);
                }
                
                if (typeof Notifications !== 'undefined' && Notifications.success) {
                    Notifications.success('Configuration mise à jour');
                }
            } else {
                if (typeof Notifications !== 'undefined' && Notifications.error) {
                    Notifications.error('Erreur lors de la mise à jour de la configuration');
                }
            }
        } else {
            // Ajout d'un nouveau favori - afficher le dialogue pour le titre et la description
            this.showCommentDialog((commentData) => {
                // Si le titre est vide, utiliser la clé de traduction complète
                if (!commentData.title || commentData.title.trim() === '') {
                    commentData.title = "i18n:default_favorite_name";
                }
                
                // Si c'est une clé de traduction, ne pas tronquer
                if (!commentData.title.startsWith('i18n:') && commentData.title.length > 32) {
                    if (typeof Notifications !== 'undefined' && Notifications.warning) {
                        Notifications.warning("Le titre a été tronqué à 32 caractères.");
                    }
                    commentData.title = commentData.title.substring(0, 32);
                }
                
                if (commentData.description && commentData.description.length > 144) {
                    if (typeof Notifications !== 'undefined' && Notifications.warning) {
                        Notifications.warning("La description a été tronquée à 144 caractères.");
                    }
                    commentData.description = commentData.description.substring(0, 144);
                }
                
                const newFavorite = {
                    width: areaWidth,
                    height: areaHeight,
                    x: areaOffsetX,
                    y: areaOffsetY,
                    ratio: customRatio,
                    title: commentData.title,
                    description: commentData.description,
                    tabletW: tabletWidth,
                    tabletH: tabletHeight,
                    presetInfo: presetInfo,
                    radius: areaRadius
                };
                
                const savedFavorite = addFavorite(newFavorite);
                if (savedFavorite) {
                    this.cachedFavorites = null;
                    this.loadFavoritesWithAnimation(false);
                    
                    // Mettre en évidence le favori ajouté
                    const favoriteElement = document.querySelector(`.favorite-item[data-id="${savedFavorite.id}"]`);
                    if (favoriteElement) {
                        favoriteElement.classList.add('highlight-effect');
                        setTimeout(() => {
                            favoriteElement.classList.remove('highlight-effect');
                        }, 2000);
                    }
                    
                    if (typeof Notifications !== 'undefined' && Notifications.success) {
                        Notifications.success('Configuration sauvegardée');
                    }
                } else {
                    if (typeof Notifications !== 'undefined' && Notifications.error) {
                        Notifications.error('Erreur lors de la sauvegarde de la configuration');
                    }
                }
                
                // Sauvegarder l'état actuel dans les préférences si disponible
                if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                    setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
                }
            });
        }
    },

    /**
     * Supprime un favori avec confirmation
     * @param {string|number} id
     */
    deleteFavorite(id) {
        this.showDeleteDialog((confirmed) => {
            if (confirmed) {
                // Trouver l'élément avant de le supprimer pour pouvoir l'animer
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`);
                
                if (favoriteElement) {
                    // Animer la disparition de l'élément avant de le supprimer
                    favoriteElement.classList.add('animate-fadeOut');
                    
                    // Attendre que l'animation soit terminée avant de supprimer définitivement
                    setTimeout(() => {
                        const success = removeFavorite(id);
                        
                        if (success) {
                            this.cachedFavorites = null;
                            
                            // Supprimer l'élément du DOM
                            if (favoriteElement.parentNode) {
                                favoriteElement.parentNode.removeChild(favoriteElement);
                            }
                            
                            if (typeof Notifications !== 'undefined' && Notifications.success) {
                                Notifications.success('Favori supprimé');
                            }
                        } else {
                            // Si erreur, retirer l'animation et restaurer l'élément
                            favoriteElement.classList.remove('animate-fadeOut');
                            
                            if (typeof Notifications !== 'undefined' && Notifications.error) {
                                Notifications.error('Erreur lors de la suppression du favori');
                            }
                        }
                    }, 300); // Durée de l'animation fadeOut
                    
                } else {
                    // Si l'élément n'est pas trouvé dans le DOM, suppression classique
                    const success = removeFavorite(id);
                    
                    if (success) {
                        this.cachedFavorites = null;
                        if (typeof Notifications !== 'undefined' && Notifications.success) {
                            Notifications.success('Favori supprimé');
                        }
                    } else {
                        if (typeof Notifications !== 'undefined' && Notifications.error) {
                            Notifications.error('Erreur lors de la suppression du favori');
                        }
                    }
                }
            }
        });
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
            this.loadFavoritesWithAnimation(false);
        }
    },

    /**
     * Crée la popup de détails des favoris
     */
    createDetailsPopup() {
        // Vérifier d'abord si le popup existe déjà dans le DOM
        let existingPopup = document.getElementById('favorite-details-popup');
        if (existingPopup) {
            this.detailsPopup = existingPopup;
            return;
        }

        const popup = document.createElement('div');
        popup.id = 'favorite-details-popup';
        popup.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 hidden transition-opacity duration-300 opacity-0';
        
        popup.innerHTML = `
            <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 transform transition-all duration-300 scale-95 mx-4 max-h-[90vh] overflow-y-auto">
                <!-- En-tête avec bouton de fermeture -->
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span data-i18n="current_config">Configuration</span>
                    </h2>
                    <button id="close-details-btn" class="bg-gray-800 hover:bg-gray-700 transition-colors p-1.5 rounded-md text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- Titre -->
                <div class="mb-4 pb-3 border-b border-gray-800">
                    <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span data-i18n="favorite_name">Titre</span>
                        </div>
                        <span id="details-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/32</span>
                    </h3>
                    <input type="text" id="details-title" maxlength="32" data-i18n-placeholder="favorite_name_placeholder" placeholder="" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mb-0 transition-colors duration-200">
                </div>
                
                <!-- Date de création -->
                <div class="text-sm text-gray-300 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-gray-400 mr-1" data-i18n="creation_date">Création:</span>
                    <span id="details-date" class="break-words"></span>
                </div>
                
                <!-- Date de dernière modification -->
                <div id="details-last-modified-container" class="text-sm text-gray-300 mb-4 items-center hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span class="text-gray-400 mr-1" data-i18n="last_modified">Dernière modification:</span>
                    <span id="details-last-modified" class="break-words"></span>
                </div>
                
                <!-- Description -->
                <div id="details-description-container" class="mb-5">
                    <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span data-i18n="favorite_description">Description</span>
                        </div>
                        <span id="details-description-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                    </h3>
                    <textarea id="details-description" maxlength="144" data-i18n-placeholder="favorite_description_placeholder" placeholder="" rows="4"
                              class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mb-2 resize-none transition-colors duration-200 min-h-[90px]"></textarea>
                </div>
                
                <!-- Informations Tablette -->
                <div class="mb-5 bg-gray-750 rounded-lg p-3 border border-gray-700">
                    <h4 class="text-md font-semibold text-white mb-3 pb-2 border-b border-gray-700/70 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        <span data-i18n="tablet_settings">TABLETTE</span>
                    </h4>
                    <div class="grid gap-y-3 gap-x-4 text-sm pl-1">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span class="text-gray-300" data-i18n="tablet_model">Modèle:</span>
                            </div>
                            <div class="text-white font-medium" id="details-tablet-name" data-i18n="select_model">Sélectionner un modèle</div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-y-3 gap-x-4">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                <span class="text-gray-300" data-i18n="dimensions">Dimensions:</span>
                            </div>
                            <div class="text-right text-white font-medium" id="details-tablet-dimensions"></div>
                            
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span class="text-gray-300" data-i18n="ratio">Ratio:</span>
                            </div>
                            <div class="text-right text-white font-medium" id="details-tablet-ratio"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Informations Area -->
                <div class="mb-5 bg-gray-750 rounded-lg p-3 border border-gray-700">
                    <h4 class="text-md font-semibold text-white mb-3 pb-2 border-b border-gray-700/70 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span data-i18n="area_settings">ZONE ACTIVE</span>
                    </h4>
                    <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm pl-1">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span class="text-gray-300" data-i18n="dimensions">Dimensions:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-dimensions"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span class="text-gray-300" data-i18n="surface_area">Surface:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-size"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span class="text-gray-300" data-i18n="ratio">Ratio:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-ratio"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span class="text-gray-300" data-i18n="area_position">Position:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-position"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4a8 8 0 100 16 8 8 0 000-16z" />
                            </svg>
                            <span class="text-gray-300" data-i18n="radius">Rayon:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-radius">--</div>
                    </div>
                </div>
                
                <!-- Boutons d'action -->
                <div class="mt-6 grid grid-cols-3 gap-3">
                    <button id="details-load-btn" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span class="text-sm font-medium" data-i18n="load">Charger</span>
                    </button>
                    <button id="details-edit-btn" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="text-sm font-medium" data-i18n="edit">Modifier</span>
                    </button>
                    <button id="details-delete-btn" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span class="text-sm font-medium" data-i18n="delete">Supprimer</span>
                    </button>
                </div>
            </div>
        `;
        
        // Attacher le popup au document
        document.body.appendChild(popup);
        
        // Référencer le popup pour une utilisation future
        this.detailsPopup = popup;
        
        // Ajouter la classe pour les animations
        popup.addEventListener('transitionend', () => {
            if (!popup.classList.contains('show')) {
                popup.classList.add('hidden');
            }
        });
        
        // Déclencher un événement pour que le système de traduction puisse gérer ce popup
        try {
            const event = new CustomEvent('popup:created', { 
                detail: { popupId: 'favorite-details-popup' } 
            });
            document.dispatchEvent(event);
        } catch (e) {
            console.error("[ERROR] Impossible de déclencher l'événement popup:created", e);
        }
        
        // Ajouter les gestionnaires d'événements
        const closeBtn = document.getElementById('close-details-btn');
        const editBtn = document.getElementById('details-edit-btn');
        const deleteBtn = document.getElementById('details-delete-btn');
        const loadBtn = document.getElementById('details-load-btn');
        const titleInput = document.getElementById('details-title');
        const descriptionInput = document.getElementById('details-description');
        const titleCounter = document.getElementById('details-title-counter');
        const descriptionCounter = document.getElementById('details-description-counter');
        const overlay = popup;
        
        // Vérifier si tous les éléments nécessaires existent
        if (!closeBtn || !editBtn || !deleteBtn || !loadBtn || !titleInput || !descriptionInput) {
            console.error("[ERROR] Certains éléments du popup n'ont pas été trouvés");
        }
        
        // Gestionnaires d'événements pour les compteurs
        if (titleInput && titleCounter) {
            const updateTitleCounter = () => {
                if (!titleCounter) return;
                const length = titleInput.value.length;
                titleCounter.textContent = `${length}/32`;
                
                // Réinitialiser les classes
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                // Ajouter les classes en fonction de la limite
                if (length >= 32) {
                    titleCounter.classList.add('text-red-500');
                } else if (length > 25) {
                    titleCounter.classList.add('text-yellow-500');
                }
                
                // Déclencher la sauvegarde automatique
                this.scheduleAutoSave();
            };
            
            titleInput.addEventListener('input', updateTitleCounter);
        }
        
        if (descriptionInput && descriptionCounter) {
            const updateDescCounter = () => {
                if (!descriptionCounter) return;
                const length = descriptionInput.value.length;
                descriptionCounter.textContent = `${length}/144`;
                
                // Réinitialiser les classes
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                // Ajouter les classes en fonction de la limite
                if (length >= 144) {
                    descriptionCounter.classList.add('text-red-500');
                } else if (length > 120) {
                    descriptionCounter.classList.add('text-yellow-500');
                }
                
                // Déclencher la sauvegarde automatique
                this.scheduleAutoSave();
            };
            
            descriptionInput.addEventListener('input', updateDescCounter);
        }
        
        // Activer la touche Entrée pour passer à la description
        if (titleInput && descriptionInput) {
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    descriptionInput.focus();
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetailsPopup());
        }
        
        // Fermer en cliquant à l'extérieur du contenu
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Bouton pour charger la configuration
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const favoriteId = this.currentDetailedFavoriteId;
                if (favoriteId) {
                    this.loadFavorite(favoriteId);
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Bouton pour éditer le favori
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const favoriteId = this.currentDetailedFavoriteId;
                if (favoriteId) {
                    this.editFavorite(favoriteId);
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Bouton pour supprimer le favori
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const favoriteId = this.currentDetailedFavoriteId;
                if (favoriteId) {
                    this.deleteFavorite(favoriteId);
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Ajouter les styles CSS pour les animations
        if (!document.getElementById('favorite-details-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'favorite-details-popup-styles';
            style.textContent = `
                /* Les styles d'animation sont maintenant définis dans favorite-fix.css */
                #details-title-counter.text-red-500, #details-description-counter.text-red-500 {
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    /**
     * Ferme la popup de détails
     */
    closeDetailsPopup() {
        if (this.detailsPopup) {
            // Sauvegarde automatique avant la fermeture
            const hasChanges = this.saveChangesIfNeeded();
            
            // Forcer un rafraîchissement complet des favoris pour montrer les changements
            this.refreshAllFavorites();
            
            // Réinitialiser les compteurs et leurs classes
            const titleCounter = this.detailsPopup.querySelector('#details-title-counter, #favorite-title-counter');
            const descCounter = this.detailsPopup.querySelector('#details-description-counter, #favorite-desc-counter');
            
            if (titleCounter) {
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
            
            if (descCounter) {
                descCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
            
            // Animation de fermeture simplifiée
            this.detailsPopup.classList.remove('show');
            this.detailsPopup.style.opacity = '0';
            
            // Attendre la fin de la transition
            setTimeout(() => {
                this.detailsPopup.classList.add('hidden');
                this.detailsPopup.classList.remove('flex');
            }, 300);
        }
    },

    /**
     * Met en évidence un favori pour une courte durée
     * @param {string|number} id - ID du favori à mettre en surbrillance
     * @param {boolean} withScroll - Si true, fait défiler la vue pour montrer le favori
     */
    highlightFavorite(id, withScroll = true) {
        // Supprimer toutes les mises en évidence existantes
        const highlightedFavorites = document.querySelectorAll('.favorite-item.border-blue-500, .favorite-item.highlight-effect');
        highlightedFavorites.forEach(item => {
            requestAnimationFrame(() => {
                item.classList.remove('border-blue-500', 'highlight-effect');
            });
        });
        
        // Trouver et mettre en évidence le nouveau favori
        const favoriteItem = document.querySelector(`.favorite-item[data-id="${id}"]`);
        if (favoriteItem) {
            requestAnimationFrame(() => {
                favoriteItem.classList.add('border-blue-500', 'highlight-effect');
            });
            
            // Faire défiler la vue si nécessaire pour montrer le favori
            if (withScroll && typeof favoriteItem.scrollIntoView === 'function') {
                favoriteItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            // Supprimer l'effet après un délai
            setTimeout(() => {
                favoriteItem.classList.remove('highlight-effect');
            }, 1500);
        }
    },

    /**
     * Alias vers saveChangesIfNeeded pour la compatibilité avec les appels existants
     * @param {string|number} favoriteId
     */
    saveChanges(favoriteId) {
        // Stocker temporairement l'ID courant
        const currentId = this.currentDetailedFavoriteId;
        // Définir l'ID passé en paramètre
        this.currentDetailedFavoriteId = favoriteId;
        // Appeler la méthode principale
        this.saveChangesIfNeeded();
        // Restaurer l'ID courant
        this.currentDetailedFavoriteId = currentId;
    },

    /**
     * Met à jour un favori existant
     * @param {string|number} id - ID du favori à mettre à jour
     * @param {Object} data - Données à mettre à jour
     * @returns {boolean} - Succès de l'opération
     */
    updateFavorite(id, data) {
        return updateFavorite(id, data);
    },

    /**
     * Met à jour le contenu d'un élément de favori existant avec les nouvelles valeurs
     * @param {HTMLElement} element - L'élément DOM à mettre à jour
     * @param {Object} favorite - Les données du favori
     */
    updateFavoriteElementContent(element, favorite) {
        // Extraire les informations nécessaires pour la mise à jour
        let title = favorite.title || favorite.comment || 'i18n:default_favorite_name';
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        
        // Formater les valeurs pour l'affichage
        const displayTitle = translatedTitle.length > 32 ? translatedTitle.substring(0, 32) + '...' : translatedTitle;
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width, 3);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        
        // Mettre à jour les éléments spécifiques dans la carte
        const titleElement = element.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = displayTitle;
        }
        
        // Mettre à jour les dimensions
        const dimensions = element.querySelectorAll('.flex-1 .flex span');
        if (dimensions.length >= 3) {
            // Format: largeur × hauteur
            const dimensionText = dimensions[0].querySelector('svg').nextSibling;
            if (dimensionText) {
                dimensionText.textContent = `${areaWidth}×${areaHeight}`;
            }
            
            // Ratio
            const ratioText = dimensions[1].querySelector('svg').nextSibling;
            if (ratioText) {
                ratioText.textContent = areaRatio;
            }
            
            // Rayon
            const radiusText = dimensions[2].querySelector('svg').nextSibling;
            if (radiusText) {
                radiusText.textContent = `${areaRadius}%`;
            }
        }
        
        // Mettre à jour la date
        const dateElement = element.querySelector('.text-xs.text-gray-500 svg').nextSibling;
        if (dateElement) {
            dateElement.textContent = formattedDate;
        }
        
        // Mettre à jour l'attribut de données
        element._originalTitle = title;
    },
}; 