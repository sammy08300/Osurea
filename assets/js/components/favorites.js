/**
 * Favorites component for saving and managing area configurations
 */

const Favorites = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date',
    isInitialized: false,
    cachedFavorites: null, // Ajout d'un cache pour les favoris
    
    /**
     * Initialize the favorites component
     */
    init() {
        this.favoritesList = document.getElementById('favorites-list');
        
        if (!this.favoritesList) {
            console.error('Favorites list element not found');
            return;
        }
        
        // IMPORTANT: Prevent any type of animation during initial loading
        document.body.classList.add('loading-favorites');
        
        // Immediately hide the complete favorites list
        this.favoritesList.style.visibility = 'hidden';
        this.favoritesList.style.opacity = '0';
        
        this.favoritesPlaceholder = this.favoritesList.querySelector('p');
        
        // Add class to hide favorites until they are fully loaded
        this.favoritesList.classList.add('favorites-loading');
        
        this.setupSortButtons();
        
        // Création anticipée des dialogues pour éviter la création pendant l'utilisation
        this.createDialogs();
        this.createDetailsPopup();
        
        // Use requestAnimationFrame to report the loading
        // until the browser is ready to render the changes
        requestAnimationFrame(() => {
            // Préchargement des favoris pour éviter des lectures multiples
            this.cachedFavorites = StorageManager.getFavorites();
            
            // Load favorites with animation instead of without animation
            this.loadFavoritesWithAnimation();
            
            // IMPORTANT: Listen for locale changes to refresh the favorites
            document.removeEventListener('localeChanged', this.handleLocaleChange);
            this.boundHandleLocaleChange = this.handleLocaleChange.bind(this);
            document.addEventListener('localeChanged', this.boundHandleLocaleChange);
            
            // Test the initial translation
            if (typeof localeManager !== 'undefined') {
                console.log("[DEBUG] Initial translation:", {
                    key: 'default_favorite_name',
                    result: localeManager.translate('default_favorite_name'),
                    locale: localeManager.getCurrentLocale()
                });
            }
            
            // Add the global locale change listener (for the manual language selector)
            window.addEventListener('languageChanged', (event) => {
                console.log("[DEBUG] Detected languageChanged event, language:", event.detail?.language);
                this.manualLanguageUpdate(event.detail?.language);
            });
            
            // Wait for everything to be properly rendered before displaying the list
            requestAnimationFrame(() => {
                setTimeout(() => {
                    // Mark as initialized before making visible
                    this.isInitialized = true;
                    
                    this.favoritesList.style.visibility = 'visible';
                    this.favoritesList.style.opacity = '1';
                    this.favoritesList.classList.remove('favorites-loading');
                    document.body.classList.remove('loading-favorites');
                }, 15); // Réduit de 20ms à 15ms
            });
        });
    },
    
    // Special function to force favorites update on manual language change
    manualLanguageUpdate(language) {
        console.log("[DEBUG] Manual language update to:", language);
        
        // Force the cache purge
        if (typeof StorageManager !== 'undefined' && typeof StorageManager.clearCache === 'function') {
            StorageManager.clearCache();
        }
        
        // Purger notre cache local également
        this.cachedFavorites = null;
        
        // Add the exit animation before refreshing the favorites
        if (this.favoritesList) {
            this.favoritesList.classList.add('favorites-loading');
            this.favoritesList.classList.add('favorites-transition-out');
        }
        
        // Rebuild the favorites completely
        setTimeout(() => {
            this.forceRefreshFavorites();
        }, 120); // Réduit de 150ms à 120ms
    },
    
    // Force completely update the favorites on language change
    handleLocaleChange(event) {
        console.log("[DEBUG] Language changed!", event?.detail?.locale || "unknown");
        
        // 1. Force the cleanup of any potential cache
        if (typeof StorageManager !== 'undefined' && typeof StorageManager.clearCache === 'function') {
            StorageManager.clearCache();
            this.cachedFavorites = null; // Purger notre cache local
            console.log("[DEBUG] StorageManager cache cleared");
        }
        
        // 2. Préparer la transition
        if (this.favoritesList) {
            // Add the exit transition class
            this.favoritesList.classList.add('favorites-transition-out');
            
            // Wait for the exit animation to complete
            setTimeout(() => {
                // Clear the favorites list
                while (this.favoritesList.firstChild) {
                    this.favoritesList.removeChild(this.favoritesList.firstChild);
                }
                
                // Remove the exit transition class
                this.favoritesList.classList.remove('favorites-transition-out');
                
                // Reload the favorites with animation
                this.loadFavoritesWithAnimation();
            }, 120); // Réduit de 150ms à 120ms
        }
    },
    
    // New method to force a complete favorites refresh
    forceRefreshFavorites() {
        try {
            console.log("[DEBUG] Starting complete favorites refresh");
            
            // 1. Get the current language for logging
            const currentLang = document.documentElement.lang || 
                               (typeof localeManager !== 'undefined' ? localeManager.getCurrentLocale() : 'unknown');
            console.log(`[DEBUG] Current language during refresh: ${currentLang}`);
            
            // 2. Completely clear the list (including the placeholder)
            if (this.favoritesList) {
                this.favoritesList.innerHTML = '';
                
                // 3. Reinsert the placeholder
                if (this.favoritesPlaceholder) {
                    this.favoritesList.appendChild(this.favoritesPlaceholder);
                }
            }
            
            // 4. Force a clean cache reload by briefly delaying the favorites loading
            setTimeout(() => {
                // 5. Get the favorites directly (no cache)
                const favorites = StorageManager.getFavorites();
                this.cachedFavorites = favorites; // Mise à jour du cache local
                console.log("[DEBUG] Favorites retrieved:", favorites.length);
                
                // 6. Log any favorites with i18n titles
                favorites.forEach(favorite => {
                    if (favorite.title && favorite.title.startsWith('i18n:')) {
                        const key = favorite.title.substring(5);
                        const translation = typeof localeManager !== 'undefined' ? 
                                           localeManager.translate(key) : 'translation unavailable';
                        console.log(`[DEBUG] i18n favorite ${favorite.id}: key=${key}, translation=${translation}`);
                    }
                });
                
                // 7. Completely recreate all elements
                this.loadFavoritesWithAnimation();
                console.log("[DEBUG] Favorites reloaded with the new language");
            }, 20); // Réduit de 30ms à 20ms
        } catch (error) {
            console.error("[ERROR] Error refreshing favorites:", error);
        }
    },
    
    /**
     * Preloading favorites to avoid visual flash
     */
    preloadFavorites() {
        // Get favorites from cache
        const favorites = StorageManager.getFavorites();
        
        // If no favorites, display the placeholder
        if (favorites.length === 0) {
            this.favoritesPlaceholder.classList.remove('hidden');
            this.favoritesList.classList.remove('favorites-loading');
            return;
        }
        
        // Prepare favorites but delay the display
        this.favoritesPlaceholder.classList.add('hidden');
        
        // Sort the favorites
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        
        // Prepare the HTML content in one go (better performance)
        const fragment = document.createDocumentFragment();
        
        // Generate all favorite elements
        sortedFavorites.forEach(favorite => {
            const item = this.createFavoriteElement(favorite);
            fragment.appendChild(item);
        });
        
        // Add all favorites in one DOM operation
        this.favoritesList.appendChild(fragment);
        
        // Once everything is ready, display the favorites
        requestAnimationFrame(() => {
            this.favoritesList.classList.remove('favorites-loading');
            this.isInitialized = true;
        });
    },
    
    /**
     * Create a favorite element
     * @param {Object} favorite - Favorite object to display
     * @returns {HTMLElement} - Favorite DOM element
     */
    createFavoriteElement(favorite) {
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const item = document.createElement('div');
        // Utilisation de className pour mettre en œuvre l'effet de soulèvement
        item.className = 'favorite-item bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-blue-500/30 shadow-lg cursor-pointer transform-gpu';
        item.dataset.id = favorite.id;
        
        // Add the animation class but only if already initialized
        if (this.isInitialized) {
            item.classList.add('animate-fadeIn');
        }
        
        // Use the title if it exists, otherwise use the old comment field if it exists, otherwise default text
        let title = favorite.title || favorite.comment || 'i18n:default_favorite_name';
        
        // Handling translation keys (i18n:)
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        
        // Limit the title to 25 characters with an ellipsis if necessary
        const displayTitle = translatedTitle.length > 25 ? translatedTitle.substring(0, 25) + '...' : translatedTitle;
        
        // Limit to 3 decimal places for all numeric values
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width, 3);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        
        // Création du HTML en un seul bloc pour de meilleures performances
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
                        <button class="load-favorite-btn bg-blue-600 hover:bg-blue-500 text-white rounded-md p-1 flex items-center justify-center transition-all duration-200 w-7 h-7 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm" title="Charger la configuration" aria-label="Charger la configuration">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button class="edit-favorite-btn bg-gray-600 hover:bg-gray-500 text-white rounded-md p-1 flex items-center justify-center transition-all duration-200 w-7 h-7 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm" title="Modifier" aria-label="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-favorite-btn bg-red-500 hover:bg-red-400 text-white rounded-md p-1 flex items-center justify-center transition-all duration-200 w-7 h-7 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm" title="Supprimer" aria-label="Supprimer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>`;
        
        // Utilisation de la délégation d'événements pour améliorer les performances
        item.addEventListener('click', (e) => {
            const target = e.target;
            // Gérer les clics sur les boutons
            if (target.closest('.load-favorite-btn')) {
                e.stopPropagation();
                this.loadFavorite(favorite.id);
            } else if (target.closest('.edit-favorite-btn')) {
                e.stopPropagation();
                this.editFavorite(favorite.id);
            } else if (target.closest('.delete-favorite-btn')) {
                e.stopPropagation();
                this.deleteFavorite(favorite.id);
            } else {
                // Clic sur la carte elle-même
                console.log("[DEBUG] Clic sur favori détecté", favorite.id);
                // Conserver le titre original non-traduit dans l'objet favori
                favorite._originalTitle = title;
                this.showFavoriteDetails(favorite);
            }
        });
        
        // Ajout du margin-top pour éviter que la carte ne soit coupée lors de l'animation
        item.style.marginTop = '8px';
        
        return item;
    },
    
    /**
     * Create custom dialogs for favorites
     */
    createDialogs() {
        // Create a custom dialog for comment input
        const commentDialog = document.createElement('div');
        commentDialog.id = 'comment-dialog';
        commentDialog.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 hidden opacity-0 transition-opacity duration-200';
        commentDialog.innerHTML = `
            <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 transform scale-95 transition-transform duration-200 mx-4">
                <!-- En-tête avec titre -->
                <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
                    <h2 class="text-xl font-semibold text-white flex items-center flex-nowrap whitespace-nowrap overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span data-i18n="save_favorite" class="truncate">Sauvegarder la configuration</span>
                    </h2>
                    <button id="close-comment-dialog-btn" class="bg-gray-800 hover:bg-gray-700 transition-colors p-1.5 rounded-md text-gray-400 hover:text-white ml-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- Section Titre -->
                <div class="mb-5">
                    <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span data-i18n="favorite_name">Titre</span>
                        </div>
                        <span id="title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/25</span>
                    </h3>
                    <input type="text" id="comment-input" maxlength="25" data-i18n-placeholder="favorite_name_placeholder" placeholder="" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-200">
                </div>
                
                <!-- Section Description -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span data-i18n="favorite_description">Description</span>
                        </div>
                        <span id="description-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                    </h3>
                    <textarea id="description-input" maxlength="144" data-i18n-placeholder="favorite_description_placeholder" placeholder="" rows="4"
                              class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-colors duration-200 min-h-[90px]"></textarea>
                </div>
                
                <!-- Boutons d'action -->
                <div class="flex justify-end space-x-3">
                    <button id="cancel-comment-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-md">Annuler</button>
                    <button id="save-comment-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Sauvegarder
                    </button>
                </div>
            </div>
        `;
        
        // Create a custom dialog for deletion confirmation
        const deleteDialog = document.createElement('div');
        deleteDialog.id = 'delete-dialog';
        deleteDialog.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 hidden opacity-0 transition-opacity duration-200';
        deleteDialog.innerHTML = `
            <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 transform scale-95 transition-transform duration-200 mx-4">
                <!-- En-tête avec titre -->
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Confirmation de suppression
                    </h2>
                    <button id="close-delete-dialog-btn" class="bg-gray-800 hover:bg-gray-700 transition-colors p-1.5 rounded-md text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="text-gray-300 text-sm mb-6 bg-gray-800 p-4 rounded-lg border border-red-500/30">
                    <div class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>Êtes-vous sûr de vouloir supprimer définitivement ce favori ? Cette action ne peut pas être annulée.</p>
                    </div>
                </div>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-delete-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-md">Annuler</button>
                    <button id="confirm-delete-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Supprimer
                    </button>
                </div>
            </div>
        `;
        
        // Add dialogs to the document
        document.body.appendChild(commentDialog);
        document.body.appendChild(deleteDialog);
        
        // Comment dialog event listeners
        const commentInput = document.getElementById('comment-input');
        const descriptionInput = document.getElementById('description-input');
        const saveCommentBtn = document.getElementById('save-comment-btn');
        const cancelCommentBtn = document.getElementById('cancel-comment-btn');
        const closeCommentBtn = document.getElementById('close-comment-dialog-btn');
        
        // Function to close the comment dialog with animation
        const closeCommentDialogWithAnimation = (callback) => {
            const dialogContent = commentDialog.querySelector('div');
            
            // Start the closing animation
            commentDialog.classList.add('hidden');
            commentDialog.classList.remove('flex');
            commentDialog.style.opacity = '0';
            if (dialogContent) {
                dialogContent.style.transform = 'scale(0.95)';
            }
            
            // After the animation, hide the dialog and execute the callback
            setTimeout(() => {
                commentDialog.classList.add('hidden');
                commentDialog.classList.remove('flex');
                if (typeof callback === 'function') {
                    callback();
                }
            }, 150); // Réduit de 200ms à 150ms
        };
        
        // Event handler for the cancel button
        cancelCommentBtn.addEventListener('click', () => {
            closeCommentDialogWithAnimation(() => {
                this.commentDialogCallback = null;
            });
        });
        
        // Event handler for the close button
        closeCommentBtn?.addEventListener('click', () => {
            closeCommentDialogWithAnimation(() => {
                this.commentDialogCallback = null;
            });
        });
        
        saveCommentBtn.addEventListener('click', () => {
            if (this.commentDialogCallback) {
                const commentData = {
                    title: commentInput.value,
                    description: descriptionInput.value
                };
                
                closeCommentDialogWithAnimation(() => {
                    this.commentDialogCallback(commentData);
                    this.commentDialogCallback = null;
                });
            } else {
                closeCommentDialogWithAnimation();
            }
        });
        
        // Enter key handling for comment input 
        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                descriptionInput.focus();
            }
        });
        
        // Delete dialog event listeners
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        const closeDeleteBtn = document.getElementById('close-delete-dialog-btn');
        
        // Function to close the delete dialog with animation
        const closeDeleteDialogWithAnimation = (callback) => {
            const dialogContent = deleteDialog.querySelector('div');
            
            // Start the closing animation
            deleteDialog.classList.add('hidden');
            deleteDialog.classList.remove('flex');
            deleteDialog.style.opacity = '0';
            if (dialogContent) {
                dialogContent.style.transform = 'scale(0.95)';
            }
            
            // After the animation, hide the dialog and execute the callback
            setTimeout(() => {
                deleteDialog.classList.add('hidden');
                deleteDialog.classList.remove('flex');
                if (typeof callback === 'function') {
                    callback();
                }
            }, 150); // Réduit de 200ms à 150ms
        };
        
        cancelDeleteBtn.addEventListener('click', () => {
            closeDeleteDialogWithAnimation(() => {
                this.deleteDialogCallback = null;
            });
        });
        
        // Event handler for the close button
        closeDeleteBtn?.addEventListener('click', () => {
            closeDeleteDialogWithAnimation(() => {
                this.deleteDialogCallback = null;
            });
        });
        
        confirmDeleteBtn.addEventListener('click', () => {
            if (this.deleteDialogCallback) {
                closeDeleteDialogWithAnimation(() => {
                    this.deleteDialogCallback(true);
                    this.deleteDialogCallback = null;
                });
            } else {
                closeDeleteDialogWithAnimation();
            }
        });
    },
    
    /**
     * Show comment input dialog
     * @param {Function} callback - Function to call with comment value
     */
    showCommentDialog(callback) {
        const commentDialog = document.getElementById('comment-dialog');
        const commentInput = document.getElementById('comment-input');
        const descriptionInput = document.getElementById('description-input');
        const titleCounter = document.getElementById('title-counter');
        const descriptionCounter = document.getElementById('description-counter');
        
        if (!commentDialog || !commentInput || !descriptionInput) {
            console.error("Comment dialog elements not found");
            callback({title: "", description: ""});
            return;
        }
        
        // Reset input values
        commentInput.value = '';
        descriptionInput.value = '';
        
        // Update counters with initial values
        if (titleCounter) titleCounter.textContent = '0/25';
        if (descriptionCounter) descriptionCounter.textContent = '0/144';
        
        // Setup input counters
        const updateTitleCounter = () => {
            if (!titleCounter) return;
            const length = commentInput.value.length;
            titleCounter.textContent = `${length}/25`;
            
            // Reset the classes
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Add the classes based on the limit
            if (length >= 25) {
                titleCounter.classList.add('at-limit');
            } else if (length > 15) {
                titleCounter.classList.add('near-limit');
            }
            
            // Trigger automatic save
            this.scheduleAutoSave();
        };
        
        const updateDescCounter = () => {
            if (!descriptionCounter) return;
            const length = descriptionInput.value.length;
            descriptionCounter.textContent = `${length}/144`;
            
            // Reset the classes
            descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Add the classes based on the limit
            if (length >= 144) {
                descriptionCounter.classList.add('at-limit');
            } else if (length > 120) {
                descriptionCounter.classList.add('near-limit');
            }
            
            // Trigger automatic save
            this.scheduleAutoSave();
        };
        
        commentInput.removeEventListener('input', updateTitleCounter);
        commentInput.addEventListener('input', updateTitleCounter);
        
        descriptionInput.removeEventListener('input', updateDescCounter);
        descriptionInput.addEventListener('input', updateDescCounter);
        
        // Store callback
        this.commentDialogCallback = callback;
        
        // Show dialog with animation
        commentDialog.classList.remove('hidden');
        commentDialog.classList.add('flex');
        commentDialog.style.opacity = '0';
        const dialogContent = commentDialog.querySelector('div');
        if (dialogContent) {
            dialogContent.style.transform = 'scale(0.95)';
        }
        
        // Force reflow to ensure animation plays
        void commentDialog.offsetWidth;
        
        // Start animation
        commentDialog.style.opacity = '1';
        if (dialogContent) {
            dialogContent.style.transform = 'scale(1)';
        }
        
        // Focus input after animation
        setTimeout(() => {
            commentInput.focus();
        }, 150); // Réduit de 200ms à 150ms
    },
    
    /**
     * Show delete confirmation dialog
     * @param {Function} callback - Function to call with confirmation result
     */
    showDeleteDialog(callback) {
        const deleteDialog = document.getElementById('delete-dialog');
        
        if (!deleteDialog) {
            console.error("Delete dialog element not found");
            if (confirm('Êtes-vous sûr de vouloir supprimer ce favori ?')) {
                callback(true);
            }
            return;
        }
        
        // Store callback
        this.deleteDialogCallback = callback;
        
        // Show dialog with animation
        deleteDialog.classList.remove('hidden');
        deleteDialog.classList.add('flex');
        deleteDialog.style.opacity = '0';
        const dialogContent = deleteDialog.querySelector('div');
        if (dialogContent) {
            dialogContent.style.transform = 'scale(0.95)';
        }
        
        // Force reflow to ensure animation plays
        void deleteDialog.offsetWidth;
        
        // Start animation
        deleteDialog.style.opacity = '1';
        if (dialogContent) {
            dialogContent.style.transform = 'scale(1)';
        }
    },
    
    /**
     * Set up sort buttons
     */
    setupSortButtons() {
        const sortButtons = document.querySelectorAll('.sort-button');
        
        // First, disable all buttons
        sortButtons.forEach(button => {
            // Improvement of button styles
            button.classList.remove('py-1.5', 'px-2.5', 'text-xs', 'rounded-md', 'font-medium', 'border');
            button.classList.add('py-1.5', 'px-3', 'text-xs', 'rounded-md', 'font-medium', 'shadow-sm', 'transition-all', 'duration-200');
            
            // Start with the disabled appearance by default
            button.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'shadow-blue-500/10');
            button.classList.add('text-gray-300', 'bg-gray-800/80', 'hover:bg-gray-700', 'border', 'border-gray-700', 'hover:border-gray-600');
        });
        
        // Then, activate only the button corresponding to the current criteria
        const activeButton = document.querySelector(`.sort-button[data-sort="${this.currentSortCriteria}"]`);
        if (activeButton) {
            activeButton.classList.remove('text-gray-300', 'bg-gray-800/80', 'hover:bg-gray-700', 'border', 'border-gray-700', 'hover:border-gray-600');
            activeButton.classList.add('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'shadow-blue-500/10');
        }
        
        // Create a new button for the modified sort if necessary
        const sortOptionsContainer = document.getElementById('sort-options');
        if (sortOptionsContainer && !document.querySelector('.sort-button[data-sort="modified"]')) {
            const modifiedButton = document.createElement('button');
            modifiedButton.setAttribute('data-sort', 'modified');
            modifiedButton.className = 'sort-button py-1.5 px-3 text-xs rounded-md font-medium shadow-sm transition-all duration-200 text-gray-300 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600';
            modifiedButton.textContent = 'Modif.';
            sortOptionsContainer.appendChild(modifiedButton);
            
            // Add the event listener for the new button
            modifiedButton.addEventListener('click', () => this.handleSortButtonClick(modifiedButton));
        }
        
        // Add the event listeners for all buttons
        sortButtons.forEach(button => {
            // First, remove the existing listeners to avoid duplicates
            button.removeEventListener('click', () => this.handleSortButtonClick(button));
            // Add the new listener
            button.addEventListener('click', () => this.handleSortButtonClick(button));
        });
    },
    
    /**
     * Handle sort button click
     * @param {HTMLElement} button - The clicked button
     */
    handleSortButtonClick(button) {
        if (button.dataset.sort === this.currentSortCriteria) {
            return; // Do nothing if the current sort button is already activated
        }
        
        // Update the appearance of all buttons
        const sortButtons = document.querySelectorAll('.sort-button');
        sortButtons.forEach(btn => {
            if (btn === button) {
                btn.classList.remove('text-gray-300', 'bg-gray-800/80', 'hover:bg-gray-700', 'border', 'border-gray-700', 'hover:border-gray-600');
                btn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'shadow-blue-500/10');
            } else {
                btn.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'shadow-blue-500/10');
                btn.classList.add('text-gray-300', 'bg-gray-800/80', 'hover:bg-gray-700', 'border', 'border-gray-700', 'hover:border-gray-600');
            }
        });
        
        // Update the current sort criteria
        this.currentSortCriteria = button.dataset.sort;
        
        // Reload and sort the favorites with the new criteria
        this.loadFavorites();
    },
    
    /**
     * Load favorites from storage and display them
     */
    loadFavorites() {
        // Utiliser le cache si disponible pour éviter un appel coûteux
        const favorites = this.cachedFavorites || StorageManager.getFavorites();
        this.cachedFavorites = favorites; // Mettre à jour le cache
        
        // Hide the list to prevent flash
        if (this.favoritesList) {
            this.favoritesList.style.visibility = 'hidden';
        }
        
        if (favorites.length === 0) {
            // Ensure the placeholder remains visible and well positioned
            if (this.favoritesPlaceholder) {
                this.favoritesPlaceholder.classList.remove('hidden');
                
                // Ensure the placeholder covers the entire width
                if (!this.favoritesPlaceholder.classList.contains('col-span-full')) {
                    this.favoritesPlaceholder.classList.add('col-span-full');
                }
            }
            
            // Supprimer tous les éléments favorite-item
            const existingItems = this.favoritesList.querySelectorAll('.favorite-item');
            existingItems.forEach(item => item.remove());
            
            this.favoritesList.classList.remove('favorites-loading');
            
            // Make the list visible again
            if (this.favoritesList) {
                this.favoritesList.style.visibility = 'visible';
            }
            return;
        }
        
        // Hide the placeholder if there are favorites
        if (this.favoritesPlaceholder) {
            this.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Supprimer tous les éléments favorite-item existants
        const existingItems = this.favoritesList.querySelectorAll('.favorite-item');
        existingItems.forEach(item => item.remove());
        
        // Garder le placeholder
        const placeholder = this.favoritesPlaceholder;
        
        // Load all sorted favorites
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        
        // Utiliser un DocumentFragment pour améliorer les performances de rendu
        const fragment = document.createDocumentFragment();
        
        sortedFavorites.forEach(favorite => {
            const cardElement = this.createFavoriteElement(favorite);
            // Ajouter la classe pour déclencher l'animation
            if (this.isInitialized) {
                cardElement.classList.add('animate-fadeIn');
            }
            fragment.appendChild(cardElement);
        });
        
        // S'assurer que le placeholder est le premier élément
        if (placeholder && !this.favoritesList.contains(placeholder)) {
            this.favoritesList.appendChild(placeholder);
        }
        
        this.favoritesList.appendChild(fragment);
        
        // Remove the loading class
        this.favoritesList.classList.remove('favorites-loading');
        
        // Make the list visible again
        if (this.favoritesList) {
            this.favoritesList.style.visibility = 'visible';
        }
    },
    
    /**
     * Sort favorites based on criteria
     * @param {Array} favorites - List of favorites to sort
     * @param {string} criteria - Sort criteria (date, name, size)
     * @returns {Array} - Sorted favorites
     */
    sortFavorites(favorites, criteria) {
        return [...favorites].sort((a, b) => {
            switch (criteria) {
                case 'name':
                    // Use the title if it exists, otherwise the comment
                    const titleA = (a.title || a.comment || '').toLowerCase();
                    const titleB = (b.title || b.comment || '').toLowerCase();
                    return titleA.localeCompare(titleB);
                case 'size':
                    const areaA = (a.width || 0) * (a.height || 0);
                    const areaB = (b.width || 0) * (b.height || 0);
                    return areaB - areaA;
                case 'modified':
                    // Sort by modification date if it exists, otherwise by creation date
                    const modifiedA = a.lastModified || a.id || 0;
                    const modifiedB = b.lastModified || b.id || 0;
                    return modifiedB - modifiedA;
                case 'date':
                default:
                    // Sort by creation date (id is a timestamp)
                    return (b.id || 0) - (a.id || 0);
            }
        });
    },
    
    /**
     * Load a favorite into the inputs
     * @param {string|number} id - ID of the favorite to load
     */
    loadFavorite(id) {
        const favorite = StorageManager.getFavoriteById(id);
        
        if (!favorite) {
            Notifications.error(`Favori ID ${id} introuvable`);
            return;
        }
        
        try {
            // Cancel the edit mode if it is active
            if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
                appState.cancelEditMode();
            }
            
            // Update the tablet dimensions
            if (favorite.tabletW && favorite.tabletH) {
                document.getElementById('tabletWidth').value = formatNumber(favorite.tabletW);
                document.getElementById('tabletHeight').value = formatNumber(favorite.tabletH);
            }
            
            // Update the area dimensions
            document.getElementById('areaWidth').value = formatNumber(favorite.width);
            document.getElementById('areaHeight').value = formatNumber(favorite.height);
            
            // Update the offsets
            document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
            document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
            
            // Update the ratio
            if (favorite.ratio) {
                document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
            }
            
            // Update the radius
            if (typeof favorite.radius !== 'undefined') {
                document.getElementById('areaRadius').value = favorite.radius;
                window.currentRadius = favorite.radius;
                const radiusPercentage = document.getElementById('radius-percentage');
                if (radiusPercentage) radiusPercentage.textContent = `${favorite.radius}%`;
            }
            
            // Update the tablet preset if available
            if (favorite.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                    
                    // Check if it is a translation key (prefix "i18n:")
                    if (favorite.presetInfo.startsWith('i18n:')) {
                        // It is a translation key
                        const translationKey = favorite.presetInfo.substring(5); // Remove "i18n:"
                        selectorText.setAttribute('data-i18n', translationKey);
                        
                        // Apply the translation
                        if (typeof localeManager !== 'undefined') {
                            selectorText.textContent = localeManager.translate(translationKey);
                        }
                    } else {
                        // It is a normal model name
                        selectorText.removeAttribute('data-i18n');
                        selectorText.textContent = favorite.presetInfo;
                    }
                }
            } else {
                // If no preset, ensure that we have the data-i18n attribute for the translation
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                    selectorText.setAttribute('data-i18n', 'select_model');
                    // Update the text immediately with the current translation
                    if (typeof localeManager !== 'undefined') {
                        selectorText.textContent = localeManager.translate('select_model');
                    }
                }
            }
            
            // Update the display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
            
            // Highlight the loaded favorite
            this.highlightFavorite(id);
            
            // Sauvegarder l'état actuel dans les préférences
            if (typeof PreferencesManager !== 'undefined') {
                setTimeout(() => PreferencesManager.saveCurrentState(), 100);
            }
            
            Notifications.success('Configuration chargée');
        } catch (error) {
            console.error('Error loading the favorite:', error); 
            Notifications.error('Erreur lors du chargement de la configuration');
        }
    },
    
    /**
     * Highlight a favorite item briefly
     * @param {string|number} id - ID of the favorite to highlight
     */
    highlightFavorite(id) {
        const favoriteItem = this.favoritesList.querySelector(`[data-id="${id}"]`);
        if (!favoriteItem) return;
        
        favoriteItem.classList.add('highlight-effect', 'border-blue-500');
        setTimeout(() => {
            favoriteItem.classList.remove('highlight-effect', 'border-blue-500');
        }, 1500);
    },
    
    /**
     * Start editing a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    editFavorite(id) {
        const favorite = StorageManager.getFavoriteById(id);
        if (!favorite) {
            Notifications.error('Favori introuvable');
            return;
        }
        
        // Save the original values
        if (typeof appState !== 'undefined') {
            appState.editingFavoriteId = id;
            appState.originalValues = {
                width: favorite.width,
                height: favorite.height,
                x: favorite.x || favorite.offsetX,
                y: favorite.y || favorite.offsetY,
                ratio: favorite.ratio,
                tabletW: favorite.tabletW,
                tabletH: favorite.tabletH,
                presetInfo: favorite.presetInfo,
                title: favorite.title,
                description: favorite.description
            };
        }
        
        // Display the cancel button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.classList.add('flex');
        }
        
        // Update the fields with the favorite values
        document.getElementById('areaWidth').value = formatNumber(favorite.width);
        document.getElementById('areaHeight').value = formatNumber(favorite.height);
        document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
        document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
        
        if (favorite.ratio) {
            document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
        }
        
        if (favorite.tabletW && favorite.tabletH) {
            document.getElementById('tabletWidth').value = formatNumber(favorite.tabletW);
            document.getElementById('tabletHeight').value = formatNumber(favorite.tabletH);
        }
        
        if (favorite.presetInfo) {
            const tabletSelector = document.getElementById('tabletSelectorButton');
            if (tabletSelector) {
                const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                
                // Check if presetInfo is a translation key
                if (favorite.presetInfo.startsWith('i18n:')) {
                    const key = favorite.presetInfo.substring(5);
                    
                    // Apply the translation key to the data-i18n attribute
                    selectorText.setAttribute('data-i18n', key);
                    
                    // Utiliser notre fonction de traduction robuste
                    selectorText.textContent = translateWithFallback(key);
                } else {
                    // It is a normal model name, not a translation key
                    selectorText.removeAttribute('data-i18n');
                    selectorText.textContent = favorite.presetInfo;
                }
            }
        }
        
        // Update the display
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Highlight the favorite being edited
        this.highlightFavorite(id);
        
        Notifications.info('Mode édition activé - Modifiez les paramètres puis cliquez sur "Sauvegarder"');
        
        if (typeof favorite.radius !== 'undefined') {
            document.getElementById('areaRadius').value = favorite.radius;
            window.currentRadius = favorite.radius;
            const radiusPercentage = document.getElementById('radius-percentage');
            if (radiusPercentage) radiusPercentage.textContent = `${favorite.radius}%`;
        }
    },
    
    /**
     * Delete a favorite
     * @param {string|number} id - ID of the favorite to delete
     */
    deleteFavorite(id) {
        this.showDeleteDialog((confirmed) => {
            if (confirmed) {
                // Supprimer immédiatement l'élément de l'interface pour éviter le double clic
                const element = this.favoritesList.querySelector(`.favorite-item[data-id="${id}"]`);
                if (element) {
                    element.remove();
                }
                
                const success = StorageManager.removeFavorite(id);
                
                if (success) {
                    // Vider le cache pour forcer un rechargement complet
                    this.cachedFavorites = null;
                    this.loadFavorites();
                    Notifications.success('Favori supprimé');
                } else {
                    Notifications.error('Erreur lors de la suppression du favori');
                    
                    // Si la suppression a échoué, recharger la liste pour récupérer l'élément
                    this.loadFavorites();
                }
            }
        });
    },
    
    /**
     * Save current configuration as a favorite
     */
    saveFavorite() {
        const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
        const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
        const areaWidth = parseFloatSafe(document.getElementById('areaWidth').value);
        const areaHeight = parseFloatSafe(document.getElementById('areaHeight').value);
        const areaOffsetX = parseFloatSafe(document.getElementById('areaOffsetX').value);
        const areaOffsetY = parseFloatSafe(document.getElementById('areaOffsetY').value);
        const customRatio = parseFloatSafe(document.getElementById('customRatio').value);
        const areaRadius = parseInt(document.getElementById('areaRadius')?.value) || 0;
        
        // Get the preset tablet information
        const tabletSelector = document.getElementById('tabletSelectorButton');
        let presetInfo = '';
        
        if (tabletSelector) {
            const selectorText = tabletSelector.querySelector('#tabletSelectorText');
            // Check if the text is the default value ("Select a model" or "Sélectionner un modèle")
            if (selectorText && selectorText.hasAttribute('data-i18n')) {
                // Use a special format to indicate that it is a translation key
                // The "i18n:" prefix allows us to distinguish translation keys from model names
                presetInfo = "i18n:" + selectorText.getAttribute('data-i18n');
            } else if (selectorText) {
                // Otherwise, save the displayed text (tablet name)
                presetInfo = selectorText.textContent;
            }
        }
        
        if (appState.editingFavoriteId) {
            // Update an existing favorite
            const updatedData = {
                width: !isNaN(areaWidth) ? areaWidth : appState.originalValues.width,
                height: !isNaN(areaHeight) ? areaHeight : appState.originalValues.height,
                x: !isNaN(areaOffsetX) ? areaOffsetX : appState.originalValues.x,
                y: !isNaN(areaOffsetY) ? areaOffsetY : appState.originalValues.y,
                ratio: !isNaN(customRatio) ? customRatio : appState.originalValues.ratio,
                tabletW: !isNaN(tabletWidth) ? tabletWidth : appState.originalValues.tabletW,
                tabletH: !isNaN(tabletHeight) ? tabletHeight : appState.originalValues.tabletH,
                presetInfo: presetInfo || appState.originalValues.presetInfo,
                title: appState.originalValues.title,
                description: appState.originalValues.description,
                radius: !isNaN(areaRadius) ? areaRadius : (appState.originalValues.radius || 0)
            };
            
            const success = StorageManager.updateFavorite(appState.editingFavoriteId, updatedData);
            
            if (success) {
                // Réinitialiser le cache pour forcer un rechargement
                this.cachedFavorites = null;
                this.loadFavorites();
                appState.cancelEditMode();
                Notifications.success('Configuration mise à jour');
            } else {
                Notifications.error('Erreur lors de la mise à jour de la configuration');
            }
        } else {
            // New favorite - display the dialog for the title and description
            this.showCommentDialog((commentData) => {
                // If the title is empty, use the full translation key
                if (!commentData.title || commentData.title.trim() === '') {
                    commentData.title = "i18n:default_favorite_name";
                }
                // If it is a translation key, do not truncate
                if (!commentData.title.startsWith('i18n:') && commentData.title.length > 25) {
                    Notifications.warning("Le titre a été tronqué à 25 caractères.");
                    commentData.title = commentData.title.substring(0, 25);
                }
                if (commentData.description && commentData.description.length > 144) {
                    Notifications.warning("La description a été tronquée à 144 caractères.");
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
                const savedFavorite = StorageManager.addFavorite(newFavorite);
                if (savedFavorite) {
                    // Réinitialiser le cache pour forcer un rechargement
                    this.cachedFavorites = null;
                    this.loadFavorites();
                    this.highlightFavorite(savedFavorite.id);
                    Notifications.success('Configuration sauvegardée');
                } else {
                    Notifications.error('Erreur lors de la sauvegarde de la configuration');
                }
            });
        }
        return true;
    },
    
    /**
     * Add a single favorite to the list (for new saves)
     * @param {Object} favorite - Favorite object to add
     */
    addFavoriteToList(favorite) {
        // Check if the favorite already exists
        const existingItem = this.favoritesList.querySelector(`.favorite-item[data-id="${favorite.id}"]`);
        if (existingItem) {
            existingItem.remove();
        }
        
        // Hide the placeholder if it is visible
        if (!this.favoritesPlaceholder.classList.contains('hidden')) {
            this.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Create and add the new element
        const item = this.createFavoriteElement(favorite);
        
        // Add at the beginning or at the end according to the sort
        if (this.currentSortCriteria === 'date') {
            this.favoritesList.insertBefore(item, this.favoritesList.children[1]);
        } else {
            this.favoritesList.appendChild(item);
            // If sorted by name, reload to have the correct order
            if (this.currentSortCriteria === 'name') {
                this.loadFavorites();
            }
        }
    },
    
    /**
     * Display a detailed popup for a favorite
     * @param {Object} favorite - The favorite to display
     */
    showFavoriteDetails(favorite) {
        // Create the popup if it does not exist
        if (!this.detailsPopup) {
            this.createDetailsPopup();
        }
        
        console.log("[DEBUG] Affichage popup détaillée pour favori:", favorite.id);
        
        // Store the ID of the currently displayed favorite
        this.currentDetailedFavoriteId = favorite.id;
        
        // Title and date
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Use the original title for editing (with i18n prefix if it exists)
        // This ensures we save back the i18n key and not the translated text
        let originalTitle = favorite._originalTitle || favorite.title || favorite.comment || 'i18n:default_favorite_name';
        let displayTitle = originalTitle;
        
        // For display in input field, remove the i18n: prefix if present
        if (displayTitle.startsWith('i18n:')) {
            const key = displayTitle.substring(5);
            displayTitle = translateWithFallback(key);
        }
        
        // Update the popup content
        const titleInput = document.getElementById('details-title');
        const descriptionElement = document.getElementById('details-description');
        const titleCounter = document.getElementById('details-title-counter');
        const descriptionCounter = document.getElementById('details-description-counter');
        
        if (!titleInput || !descriptionElement) {
            console.error("Details popup elements not found");
            return;
        }
        
        // Only display the translated title, but store the original with i18n: prefix
        titleInput.value = displayTitle;
        titleInput.dataset.originalTitle = originalTitle;  // Store original for saving
        
        document.getElementById('details-date').textContent = formattedDate;
        
        // Add the last modified date if it exists
        const lastModifiedContainer = document.getElementById('details-last-modified-container');
        const lastModifiedContent = document.getElementById('details-last-modified');
        
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
        
        // Update the description
        if (descriptionElement) {
            const description = favorite.description || '';
            descriptionElement.value = description;
            
            // Update the character counter
            if (descriptionCounter) {
                descriptionCounter.textContent = `${description.length}/144`;
                
                // Reset the classes
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                // Add the classes according to the limit
                if (description.length >= 144) {
                    descriptionCounter.classList.add('at-limit');
                } else if (description.length > 120) {
                    descriptionCounter.classList.add('near-limit');
                }
            }
        }
        
        // Update the title counter
        if (titleCounter) {
            titleCounter.textContent = `${displayTitle.length}/25`;
            
            // Reset the classes
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Add the classes according to the limit
            if (displayTitle.length >= 25) {
                titleCounter.classList.add('at-limit');
            } else if (displayTitle.length > 15) {
                titleCounter.classList.add('near-limit');
            }
        }
        
        // Calculate area and tablet values for display
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width, 3);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height, 3);
        
        const tabletWidth = formatNumber(favorite.tabletW, 1);
        const tabletHeight = formatNumber(favorite.tabletH, 1);
        
        const areaRatio = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        const tabletRatio = formatNumber(calculateRatio(favorite.tabletW, favorite.tabletH), 3);
        
        const surface = formatNumber((favorite.areaWidth || favorite.width) * (favorite.areaHeight || favorite.height), 1);
        
        // Update additional details fields
        document.getElementById('details-area-dimensions').textContent = `${areaWidth} × ${areaHeight} mm`;
        document.getElementById('details-area-ratio').textContent = areaRatio;
        document.getElementById('details-area-size').textContent = `${surface} mm²`;
        document.getElementById('details-area-position').textContent = `X: ${formatNumber(favorite.x || favorite.offsetX, 3)}, Y: ${formatNumber(favorite.y || favorite.offsetY, 3)}`;
        // Ajout radius
        let areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        let radiusDetails = document.getElementById('details-area-radius');
        if (!radiusDetails) {
            // Crée dynamiquement si absent
            const parent = document.getElementById('details-area-position').parentElement;
            const label = document.createElement('div');
            label.className = 'flex items-center';
            label.innerHTML = `<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 4a8 8 0 100 16 8 8 0 000-16z\" /></svg><span class=\"text-gray-300\" data-i18n=\"area_radius\">Rayon:</span>`;
            const value = document.createElement('div');
            value.className = 'text-right text-white font-medium';
            value.id = 'details-area-radius';
            parent.appendChild(label);
            parent.appendChild(value);
            radiusDetails = value;
        }
        radiusDetails.textContent = `${areaRadius}%`;
        
        if (favorite.tabletW && favorite.tabletH) {
            document.getElementById('details-tablet-dimensions').textContent = `${tabletWidth} × ${tabletHeight} mm`;
            document.getElementById('details-tablet-ratio').textContent = tabletRatio;
        } else {
            document.getElementById('details-tablet-dimensions').textContent = '-- × -- mm';
            document.getElementById('details-tablet-ratio').textContent = '--';
        }
        
        if (favorite.presetInfo) {
            const tabletNameElement = document.getElementById('details-tablet-name');
            
            // Check if presetInfo is a translation key
            if (favorite.presetInfo.startsWith('i18n:')) {
                const key = favorite.presetInfo.substring(5);
                tabletNameElement.textContent = translateWithFallback(key);
            } else {
                // Regular preset info
                tabletNameElement.textContent = favorite.presetInfo;
            }
        }
        
        // Ensure the popup exists and is properly configured
        if (!this.detailsPopup) {
            console.error("[ERROR] detailsPopup is null");
            return;
        }
        
        // Ensure all classes are correct before displaying
        this.detailsPopup.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 opacity-0';
        
        // Make the popup visible - first remove hidden
        this.detailsPopup.classList.remove('hidden');
        this.detailsPopup.classList.add('flex');
        
        // Force a reflow before adding the show class for the animation to work properly 
        void this.detailsPopup.offsetWidth;
        
        // Then add the show class for the animation
        this.detailsPopup.classList.add('show');
        
        // Apply the styles to the inner div
        const dialogContent = this.detailsPopup.querySelector('div');
        if (dialogContent) {
            dialogContent.style.transform = 'scale(1)';
        }
        
        console.log("[DEBUG] Popup affiché avec succès");
    },
    
    /**
     * Close the details popup
     */
    closeDetailsPopup() {
        console.log("[DEBUG] Fermeture du popup de détails");
        if (this.detailsPopup) {
            // Automatic save before closing
            this.saveChangesIfNeeded();
            
            // Ensure the animation works correctly
            const dialogContent = this.detailsPopup.querySelector('div');
            if (dialogContent) {
                dialogContent.style.transform = 'scale(0.95)';
            }
            
            this.detailsPopup.classList.remove('show');
            this.detailsPopup.style.opacity = '0';
            
            // Hide after the animation
            setTimeout(() => {
                this.detailsPopup.classList.add('hidden');
                this.detailsPopup.classList.remove('flex');
                console.log("[DEBUG] Popup complètement fermé");
            }, 300);
        } else {
            console.error("[ERROR] Tentative de fermeture du popup mais this.detailsPopup est null");
        }
    },
    
    /**
     * Schedule an automatic save
     */
    scheduleAutoSave() {
        // Cancel the previous timer if it exists
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Set a new timer of 600ms
        this.autoSaveTimer = setTimeout(() => {
            this.saveChangesIfNeeded();
        }, 600);
    },
    
    /**
     * Save changes if necessary
     */
    saveChangesIfNeeded() {
        const favoriteId = this.currentDetailedFavoriteId;
        if (!favoriteId) return;
        
        const titleInput = document.getElementById('details-title');
        const descriptionInput = document.getElementById('details-description');
        
        if (!titleInput || !descriptionInput) return;
        
        const favorite = StorageManager.getFavoriteById(favoriteId);
        if (!favorite) return;
        
        // Get the input values
        const newTitleValue = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        
        // Check if we should preserve the i18n format
        let newTitle = newTitleValue;
        
        // If we have an original title stored and it was an i18n key,
        // and the user hasn't changed the displayed text, preserve the i18n key
        const originalTitle = titleInput.dataset.originalTitle;
        if (originalTitle && originalTitle.startsWith('i18n:')) {
            const key = originalTitle.substring(5);
            let currentTranslation = '';
            
            // Get the current translation for comparison
            if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
                currentTranslation = localeManager.translate(key);
            }
            
            if (currentTranslation === newTitleValue) {
                // User didn't change the text, keep the i18n key
                console.log("[DEBUG] User didn't modify the translated title, preserving i18n key");
                newTitle = originalTitle;
            } else if (newTitleValue === key) {
                // User entered the raw key, keep the i18n format
                newTitle = originalTitle;
            } else if (key === 'default_favorite_name') {
                // For default_favorite_name, check if they typed any of the standard translations
                const htmlLang = document.documentElement.lang || 'fr';
                let isDefaultTranslation = false;
                
                if (newTitleValue === 'Configuration sauvegardée' ||
                    newTitleValue === 'Saved configuration' ||
                    newTitleValue === 'Configuración guardada') {
                    isDefaultTranslation = true;
                }
                
                if (isDefaultTranslation) {
                    console.log("[DEBUG] User entered a standard translation, preserving i18n:default_favorite_name");
                    newTitle = 'i18n:default_favorite_name';
                }
            }
        }
        
        // Check if the values have changed
        if (newTitle !== (favorite.title || '') || newDescription !== (favorite.description || '')) {
            console.log(`[DEBUG] Updating favorite title: ${newTitle} (original input: ${newTitleValue})`);
            
            // Update the title and description
            const updatedData = {
                ...favorite,
                title: newTitle,
                description: newDescription
            };
            
            const success = StorageManager.updateFavorite(favoriteId, updatedData);
            
            if (success) {
                this.loadFavorites();
                // No notification to avoid spamming the user
            }
        }
    },
    
    /**
     * Create the details popup if it does not already exist
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
                        <span id="details-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/25</span>
                    </h3>
                    <input type="text" id="details-title" maxlength="25" data-i18n-placeholder="favorite_name_placeholder" placeholder="" 
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
        
        // Attach the popup to the document
        document.body.appendChild(popup);
        console.log("[DEBUG] Popup created and added to the DOM");
        
        // Reference the popup for future use
        this.detailsPopup = popup;
        
        // Add the class for animations
        popup.addEventListener('transitionend', () => {
            if (!popup.classList.contains('show')) {
                popup.classList.add('hidden');
            }
        });
        
        // Trigger an event so the translation system can handle this popup
        try {
            const event = new CustomEvent('popup:created', { 
                detail: { popupId: 'favorite-details-popup' } 
            });
            document.dispatchEvent(event);
        } catch (e) {
            console.error("[ERROR] Impossible de déclencher l'événement popup:created", e);
        }
        
        // Add the event handlers
        const closeBtn = document.getElementById('close-details-btn');
        const editBtn = document.getElementById('details-edit-btn');
        const deleteBtn = document.getElementById('details-delete-btn');
        const loadBtn = document.getElementById('details-load-btn');
        const titleInput = document.getElementById('details-title');
        const descriptionInput = document.getElementById('details-description');
        const titleCounter = document.getElementById('details-title-counter');
        const descriptionCounter = document.getElementById('details-description-counter');
        const overlay = popup;
        
        // Check if all necessary elements exist
        if (!closeBtn || !editBtn || !deleteBtn || !loadBtn || !titleInput || !descriptionInput) {
            console.error("[ERROR] Certains éléments du popup n'ont pas été trouvés");
        }
        
        // Event handlers for the counters
        if (titleInput && titleCounter) {
            const updateTitleCounter = () => {
                if (!titleCounter) return;
                const length = titleInput.value.length;
                titleCounter.textContent = `${length}/25`;
                
                // Reset the classes
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                // Add the classes based on the limit
                if (length >= 25) {
                    titleCounter.classList.add('at-limit');
                } else if (length > 15) {
                    titleCounter.classList.add('near-limit');
                }
                
                // Trigger the automatic save
                this.scheduleAutoSave();
            };
            
            titleInput.addEventListener('input', updateTitleCounter);
        }
        
        if (descriptionInput && descriptionCounter) {
            const updateDescCounter = () => {
                if (!descriptionCounter) return;
                const length = descriptionInput.value.length;
                descriptionCounter.textContent = `${length}/144`;
                
                // Reset the classes
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                // Add the classes based on the limit
                if (length >= 144) {
                    descriptionCounter.classList.add('at-limit');
                } else if (length > 120) {
                    descriptionCounter.classList.add('near-limit');
                }
                
                // Trigger the automatic save
                this.scheduleAutoSave();
            };
            
            descriptionInput.addEventListener('input', updateDescCounter);
        }
        
        // Activate the Enter key to pass to the description
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
        
        // Close when clicking outside the content
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Button to load the configuration
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const favoriteId = this.currentDetailedFavoriteId;
                if (favoriteId) {
                    this.loadFavorite(favoriteId);
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Button to edit the favorite
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const favoriteId = this.currentDetailedFavoriteId;
                if (favoriteId) {
                    this.editFavorite(favoriteId);
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Button to delete the favorite
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const favoriteId = this.currentDetailedFavoriteId;
                if (favoriteId) {
                    this.deleteFavorite(favoriteId);
                    this.closeDetailsPopup();
                }
            });
        }
        
        // Add the CSS styles for the animations
        if (!document.getElementById('favorite-details-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'favorite-details-popup-styles';
            style.textContent = `
                #favorite-details-popup {
                    transition: opacity 0.3s ease;
                }
                #favorite-details-popup.show {
                    opacity: 1 !important;
                }
                #favorite-details-popup > div {
                    transition: transform 0.3s ease;
                }
                #favorite-details-popup.show > div {
                    transform: scale(1) !important;
                }
                #details-title-counter.at-limit, #details-description-counter.at-limit {
                    color: #ef4444;
                    animation: pulse 1s infinite;
                }
                #details-title-counter.near-limit, #details-description-counter.near-limit {
                    color: #f59e0b;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `;
            document.head.appendChild(style);
            console.log("[DEBUG] Styles de la popup ajoutés");
        }
    },
    
    /**
     * Load favorites without animation - version spéciale pour le chargement initial
     */
    loadFavoritesWithoutAnimation() {
        const favorites = StorageManager.getFavorites();
        
        if (favorites.length === 0) {
            // Ensure the placeholder remains visible and properly positioned
            if (this.favoritesPlaceholder) {
                this.favoritesPlaceholder.classList.remove('hidden');
                
                // Ensure the placeholder covers the entire width
                if (!this.favoritesPlaceholder.classList.contains('col-span-full')) {
                    this.favoritesPlaceholder.classList.add('col-span-full');
                }
            }
            return;
        }
        
        // Hide the placeholder if there are favorites
        if (this.favoritesPlaceholder) {
            this.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Load all sorted favorites, without animation
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        sortedFavorites.forEach(favorite => {
            const cardElement = this.createFavoriteElement(favorite);
            // Do not add the animation class
            // cardElement.classList.add('animate-fadeIn');
            this.favoritesList.appendChild(cardElement);
        });
    },
    
    /**
     * Charge favorites with a smooth entry animation
     * Specifically designed for language changes
     */
    loadFavoritesWithAnimation() {
        // Utiliser le cache
        const favorites = this.cachedFavorites || StorageManager.getFavorites();
        this.cachedFavorites = favorites;
        
        if (favorites.length === 0) {
            if (this.favoritesPlaceholder) {
                this.favoritesPlaceholder.classList.remove('hidden');
                if (!this.favoritesPlaceholder.classList.contains('col-span-full')) {
                    this.favoritesPlaceholder.classList.add('col-span-full');
                }
            }
            this.favoritesList.classList.remove('favorites-loading');
            this.favoritesList.classList.add('favorites-transition-in');
            this.favoritesList.classList.remove('favorites-transition-out');
            return;
        }
        
        if (this.favoritesPlaceholder) {
            this.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Clear the existing list except the placeholder
        const placeholder = this.favoritesPlaceholder;
        this.favoritesList.innerHTML = '';
        if (placeholder) {
            this.favoritesList.appendChild(placeholder);
        }
        
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        const fragment = document.createDocumentFragment();
        
        // Réduire le délai d'animation entre les cartes
        const animationDelayIncrement = 0.03; // Réduit de 0.05s à 0.03s
        
        sortedFavorites.forEach((favorite, index) => {
            const cardElement = this.createFavoriteElement(favorite);
            cardElement.style.opacity = '0';
            cardElement.classList.add('animate-fadeIn-smooth');
            cardElement.style.animationDelay = `${index * animationDelayIncrement}s`;
            
            fragment.appendChild(cardElement);
        });
        
        this.favoritesList.appendChild(fragment);
        
        requestAnimationFrame(() => {
            this.favoritesList.classList.remove('favorites-loading');
            this.favoritesList.classList.add('favorites-transition-in');
            this.favoritesList.classList.remove('favorites-transition-out');
            
            // Réduire le délai avant affichage
            setTimeout(() => {
                const cards = this.favoritesList.querySelectorAll('.animate-fadeIn-smooth');
                cards.forEach(card => {
                    card.style.opacity = '';
                });
                
                setTimeout(() => {
                    this.favoritesList.classList.remove('favorites-transition-in');
                }, 300); // Réduit de 500ms à 300ms
            }, 30); // Réduit de 50ms à 30ms
        });
    },
};

/**
 * Function to translate an i18n key with robust fallback 
    }
};

/**
 * Utility function to translate an i18n key with robust fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @returns {string} - The translation or a default formatted value
 */
function translateWithFallback(key) {
    // Try to use the standard translation system first
    let translated = null;
    
    if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
        try {
            translated = localeManager.translate(key);
            if (translated === key) translated = null; // If the translation returns the key, consider it a failure
        } catch (e) {
            console.error("[ERROR] Translation failed for key:", key, e);
        }
    }
    
    // If the standard translation failed, use fallbacks
    if (!translated || translated.startsWith('i18n:')) {
        const htmlLang = document.documentElement.lang || 'fr';
        
        // Manually defined translations for common keys
        const fallbackTranslations = {
            'select_model': {
                'en': 'Select a model',
                'es': 'Seleccionar modelo',
                'fr': 'Sélectionner un modèle'
            },
            'default_favorite_name': {
                'en': 'Saved configuration',
                'es': 'Configuración guardada',
                'fr': 'Configuration sauvegardée'
            },
            'load': {
                'en': 'Load',
                'es': 'Cargar',
                'fr': 'Charger'
            },
            'edit': {
                'en': 'Edit',
                'es': 'Editar',
                'fr': 'Modifier'
            },
            'delete': {
                'en': 'Delete',
                'es': 'Eliminar',
                'fr': 'Supprimer'
            },
            'tablet_model': {
                'en': 'Model',
                'es': 'Modelo',
                'fr': 'Modèle'
            },
            'dimensions': {
                'en': 'Dimensions',
                'es': 'Dimensiones',
                'fr': 'Dimensions'
            },
            'ratio': {
                'en': 'Ratio',
                'es': 'Relación',
                'fr': 'Ratio'
            },
            'tablet_settings': {
                'en': 'TABLET',
                'es': 'TABLETA',
                'fr': 'TABLETTE'
            },
            'area_settings': {
                'en': 'ACTIVE AREA',
                'es': 'ZONA ACTIVA',
                'fr': 'ZONE ACTIVE'
            },
            'area_position': {
                'en': 'Position',
                'es': 'Posición',
                'fr': 'Position'
            },
            'surface_area': {
                'en': 'Surface',
                'es': 'Superficie',
                'fr': 'Surface'
            },
            'last_modified': {
                'en': 'Last modified:',
                'es': 'Última modificación:',
                'fr': 'Dernière modification:'
            },
            'creation_date': {
                'en': 'Created:',
                'es': 'Creado:',
                'fr': 'Création:'
            },
            'favorite_name': {
                'en': 'Title',
                'es': 'Título',
                'fr': 'Titre'
            },
            'favorite_description': {
                'en': 'Description',
                'es': 'Descripción',
                'fr': 'Description'
            },
            'current_config': {
                'en': 'Configuration',
                'es': 'Configuración',
                'fr': 'Configuration'
            }
        };
        
        // Déterminer la langue à utiliser (préfixe seulement)
        let lang = 'fr'; // Par défaut
        if (htmlLang.startsWith('en')) {
            lang = 'en';
        } else if (htmlLang.startsWith('es')) {
            lang = 'es';
        }
        
        // Utiliser la traduction de fallback si disponible
        if (fallbackTranslations[key] && fallbackTranslations[key][lang]) {
            translated = fallbackTranslations[key][lang];
        } else {
            // Formatage par défaut pour les clés inconnues
            translated = key.replace(/_/g, ' ');
            // Première lettre en majuscule
            translated = translated.charAt(0).toUpperCase() + translated.slice(1);
        }
    }
    
    return translated;
}
