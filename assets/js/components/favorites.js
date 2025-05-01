/**
 * Favorites component for saving and managing area configurations
 */

const Favorites = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date',
    isInitialized: false,
    
    /**
     * Initialize the favorites component
     */
    init() {
        this.favoritesList = document.getElementById('favorites-list');
        this.favoritesPlaceholder = this.favoritesList.querySelector('p');
        
        if (!this.favoritesList) {
            console.error('Favorites list element not found');
            return;
        }
        
        // Ajouter classe pour cacher les favoris jusqu'à leur chargement complet
        this.favoritesList.classList.add('favorites-loading');
        
        // Configurer la grille avec une seule colonne sur mobile, 2 sur tablette et 3 sur grand écran
        this.favoritesList.classList.remove('grid', 'grid-cols-2', 'gap-2', 'grid-cols-1', 'sm:grid-cols-2', 'gap-3');
        this.favoritesList.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-3');
        
        this.setupSortButtons();
        
        // Précharger les favoris avant le rendu DOM
        this.preloadFavorites();
        
        this.createDialogs();
    },
    
    /**
     * Préchargement des favoris pour éviter le flash visuel
     */
    preloadFavorites() {
        // Récupérer les favoris depuis le cache
        const favorites = StorageManager.getFavorites();
        
        // Si aucun favori, on affiche simplement le placeholder
        if (favorites.length === 0) {
            this.favoritesPlaceholder.classList.remove('hidden');
            this.favoritesList.classList.remove('favorites-loading');
            return;
        }
        
        // Préparer les favoris mais retarder l'affichage
        this.favoritesPlaceholder.classList.add('hidden');
        
        // Trier les favoris
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        
        // Préparer le contenu HTML en une seule fois (meilleure performance)
        const fragment = document.createDocumentFragment();
        
        // Générer tous les éléments de favoris
        sortedFavorites.forEach(favorite => {
            const item = this.createFavoriteElement(favorite);
            fragment.appendChild(item);
        });
        
        // Ajouter tous les favoris en une seule opération DOM
        this.favoritesList.appendChild(fragment);
        
        // Une fois que tout est prêt, afficher les favoris
        requestAnimationFrame(() => {
            this.favoritesList.classList.remove('favorites-loading');
            this.isInitialized = true;
        });
    },
    
    /**
     * Crée un élément de favori
     * @param {Object} favorite - Objet favori à afficher
     * @returns {HTMLElement} - Élément DOM du favori
     */
    createFavoriteElement(favorite) {
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const item = document.createElement('div');
        item.classList.add(
            'favorite-item', 
            'bg-gray-800', 
            'rounded-xl', 
            'p-3', 
            'border', 
            'border-gray-700', 
            'hover:border-blue-500/30', 
            'shadow-lg', 
            'transition-all', 
            'cursor-pointer', 
            'hover:shadow-blue-500/10',
            'hover:-translate-y-0.5',
            'hover:shadow-xl',
            'active:translate-y-0',
            'active:shadow-md',
            'duration-300'
        );
        item.dataset.id = favorite.id;
        
        // Ajouter la classe d'animation mais ne l'activer que si déjà initialisé
        if (this.isInitialized) {
            item.classList.add('animate-fadeIn');
        }
        
        // Utiliser le titre s'il existe, sinon utiliser l'ancien champ comment s'il existe, sinon texte par défaut
        const title = favorite.title || favorite.comment || 'Configuration sauvegardée';
        // Limiter le titre à 25 caractères avec une ellipse si nécessaire
        const displayTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height);
        const areaRatio = calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height);
        
        // Préparer le HTML avec titre et description
        let innerHtml = `
            <div class="relative">
                <div class="flex items-center mb-2">
                    <div class="flex-1">
                        <h3 class="font-medium text-white text-sm truncate mb-0.5">${displayTitle}</h3>
                        <div class="flex items-center gap-2">
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
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        ${date.toLocaleDateString()}
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
        
        item.innerHTML = innerHtml;
        
        // Ajouter les gestionnaires d'événements
        const loadBtn = item.querySelector('.load-favorite-btn');
        const editBtn = item.querySelector('.edit-favorite-btn');
        const deleteBtn = item.querySelector('.delete-favorite-btn');
        
        loadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadFavorite(favorite.id);
        });
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editFavorite(favorite.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFavorite(favorite.id);
        });
        
        // Ajouter un gestionnaire pour afficher le popup détaillé
        item.addEventListener('click', () => {
            this.showFavoriteDetails(favorite);
        });
        
        return item;
    },
    
    /**
     * Create custom dialogs for favorites
     */
    createDialogs() {
        // Create a custom dialog for comment input
        const commentDialog = document.createElement('div');
        commentDialog.id = 'comment-dialog';
        commentDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden opacity-0 transition-opacity duration-200';
        commentDialog.innerHTML = `
            <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 transform scale-95 transition-transform duration-200 mx-4">
                <!-- En-tête avec titre -->
                <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
                    <h2 class="text-xl font-semibold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Sauvegarder la configuration
                    </h2>
                    <button id="close-comment-dialog-btn" class="bg-gray-800 hover:bg-gray-700 transition-colors p-1.5 rounded-md text-gray-400 hover:text-white">
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
                            Titre
                        </div>
                        <span id="title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/25</span>
                    </h3>
                    <input type="text" id="comment-input" maxlength="25" placeholder="Titre de la configuration (Optionnel)" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-200">
                </div>
                
                <!-- Section Description -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Description
                        </div>
                        <span id="description-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                    </h3>
                    <textarea id="description-input" maxlength="144" placeholder="Description de la configuration (Optionnel)" rows="4"
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
        deleteDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden opacity-0 transition-opacity duration-200';
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
        
        // Fonction d'animation de fermeture du dialogue
        const closeCommentDialogWithAnimation = (callback) => {
            const dialogContent = commentDialog.querySelector('div');
            
            // Commencer l'animation de fermeture
            commentDialog.style.opacity = '0';
            if (dialogContent) {
                dialogContent.style.transform = 'scale(0.95)';
            }
            
            // Après l'animation, cacher le dialogue et exécuter le callback
            setTimeout(() => {
                commentDialog.classList.add('hidden');
                if (typeof callback === 'function') {
                    callback();
                }
            }, 200);
        };
        
        // Gestionnaire pour le bouton Annuler
        cancelCommentBtn.addEventListener('click', () => {
            closeCommentDialogWithAnimation(() => {
                this.commentDialogCallback = null;
            });
        });
        
        // Gestionnaire pour le bouton de fermeture X
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
        
        // Fonction d'animation de fermeture du dialogue de suppression
        const closeDeleteDialogWithAnimation = (callback) => {
            const dialogContent = deleteDialog.querySelector('div');
            
            // Commencer l'animation de fermeture
            deleteDialog.style.opacity = '0';
            if (dialogContent) {
                dialogContent.style.transform = 'scale(0.95)';
            }
            
            // Après l'animation, cacher le dialogue et exécuter le callback
            setTimeout(() => {
                deleteDialog.classList.add('hidden');
                if (typeof callback === 'function') {
                    callback();
                }
            }, 200);
        };
        
        cancelDeleteBtn.addEventListener('click', () => {
            closeDeleteDialogWithAnimation(() => {
                this.deleteDialogCallback = null;
            });
        });
        
        // Gestionnaire pour le bouton de fermeture X
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
        
        // Reset inputs and counters
        commentInput.value = '';
        descriptionInput.value = '';
        if (titleCounter) titleCounter.textContent = '0/25';
        if (descriptionCounter) descriptionCounter.textContent = '0/144';
        
        // Setup input counters
        const updateTitleCounter = () => {
            if (!titleCounter) return;
            const length = commentInput.value.length;
            titleCounter.textContent = `${length}/25`;
            
            // Réinitialiser les classes
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Ajouter les classes en fonction de la limite
            if (length >= 25) {
                titleCounter.classList.add('at-limit');
            } else if (length > 15) {
                titleCounter.classList.add('near-limit');
            }
            
            // Déclencher la sauvegarde automatique
            this.scheduleAutoSave();
        };
        
        const updateDescCounter = () => {
            if (!descriptionCounter) return;
            const length = descriptionInput.value.length;
            descriptionCounter.textContent = `${length}/144`;
            
            // Réinitialiser les classes
            descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Ajouter les classes en fonction de la limite
            if (length >= 144) {
                descriptionCounter.classList.add('at-limit');
            } else if (length > 120) {
                descriptionCounter.classList.add('near-limit');
            }
            
            // Déclencher la sauvegarde automatique
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
        }, 200);
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
        
        // D'abord, désactiver tous les boutons
        sortButtons.forEach(button => {
            // Amélioration des styles des boutons
            button.classList.remove('py-1.5', 'px-2.5', 'text-xs', 'rounded-md', 'font-medium', 'border');
            button.classList.add('py-1.5', 'px-3', 'text-xs', 'rounded-md', 'font-medium', 'shadow-sm', 'transition-all', 'duration-200');
            
            // Commencer avec l'apparence désactivée par défaut
            button.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'shadow-blue-500/10');
            button.classList.add('text-gray-300', 'bg-gray-800/80', 'hover:bg-gray-700', 'border', 'border-gray-700', 'hover:border-gray-600');
        });
        
        // Ensuite, activer uniquement le bouton correspondant au critère actuel
        const activeButton = document.querySelector(`.sort-button[data-sort="${this.currentSortCriteria}"]`);
        if (activeButton) {
            activeButton.classList.remove('text-gray-300', 'bg-gray-800/80', 'hover:bg-gray-700', 'border', 'border-gray-700', 'hover:border-gray-600');
            activeButton.classList.add('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'shadow-blue-500/10');
        }
        
        // Créer un nouveau bouton pour le tri par dernière modification si nécessaire
        const sortOptionsContainer = document.getElementById('sort-options');
        if (sortOptionsContainer && !document.querySelector('.sort-button[data-sort="modified"]')) {
            const modifiedButton = document.createElement('button');
            modifiedButton.setAttribute('data-sort', 'modified');
            modifiedButton.className = 'sort-button py-1.5 px-3 text-xs rounded-md font-medium shadow-sm transition-all duration-200 text-gray-300 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600';
            modifiedButton.textContent = 'Modif.';
            sortOptionsContainer.appendChild(modifiedButton);
            
            // Ajouter l'écouteur d'événements pour le nouveau bouton
            modifiedButton.addEventListener('click', () => this.handleSortButtonClick(modifiedButton));
        }
        
        // Ajouter les écouteurs d'événements pour tous les boutons
        sortButtons.forEach(button => {
            // Supprimer d'abord les écouteurs existants pour éviter les doublons
            button.removeEventListener('click', () => this.handleSortButtonClick(button));
            // Ajouter le nouvel écouteur
            button.addEventListener('click', () => this.handleSortButtonClick(button));
        });
    },
    
    /**
     * Handle sort button click
     * @param {HTMLElement} button - The clicked button
     */
    handleSortButtonClick(button) {
        if (button.dataset.sort === this.currentSortCriteria) {
            return; // Ne rien faire si le bouton de tri actuel est déjà activé
        }
        
        // Mise à jour de l'apparence de tous les boutons
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
        
        // Mettre à jour le critère de tri actuel
        this.currentSortCriteria = button.dataset.sort;
        
        // Recharger et trier les favoris avec le nouveau critère
        this.loadFavorites();
    },
    
    /**
     * Load and display favorites from storage
     */
    loadFavorites() {
        const favorites = StorageManager.getFavorites();
        
        // Clear favorites list (except placeholder)
        while (this.favoritesList.children.length > 1) {
            this.favoritesList.removeChild(this.favoritesList.lastChild);
        }
        
        this.favoritesPlaceholder.classList.toggle('hidden', favorites.length > 0);
        
        // Si le placeholder est visible, lui donner la pleine largeur
        if (favorites.length === 0) {
            this.favoritesPlaceholder.classList.remove('col-span-2');
            this.favoritesPlaceholder.classList.add('col-span-full');
            return;
        }
        
        // Sort favorites by selected criteria
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        
        // Add each favorite to the list
        sortedFavorites.forEach(favorite => {
            const item = this.createFavoriteElement(favorite);
            this.favoritesList.appendChild(item);
        });
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
                    // Utiliser le titre s'il existe, sinon le comment
                    const titleA = (a.title || a.comment || '').toLowerCase();
                    const titleB = (b.title || b.comment || '').toLowerCase();
                    return titleA.localeCompare(titleB);
                case 'size':
                    const areaA = (a.width || 0) * (a.height || 0);
                    const areaB = (b.width || 0) * (b.height || 0);
                    return areaB - areaA;
                case 'modified':
                    // Tri par date de modification si elle existe, sinon par date de création
                    const modifiedA = a.lastModified || a.id || 0;
                    const modifiedB = b.lastModified || b.id || 0;
                    return modifiedB - modifiedA;
                case 'date':
                default:
                    // Tri par date de création (id est un timestamp)
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
            // Annuler le mode d'édition s'il est actif
            if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
                appState.cancelEditMode();
            }
            
            // Mettre à jour les dimensions de la tablette
            if (favorite.tabletW && favorite.tabletH) {
                document.getElementById('tabletWidth').value = formatNumber(favorite.tabletW);
                document.getElementById('tabletHeight').value = formatNumber(favorite.tabletH);
            }
            
            // Mettre à jour les dimensions de l'area
            document.getElementById('areaWidth').value = formatNumber(favorite.width);
            document.getElementById('areaHeight').value = formatNumber(favorite.height);
            
            // Mettre à jour les offsets
            document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
            document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
            
            // Mettre à jour le ratio
            if (favorite.ratio) {
                document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
            }
            
            // Mettre à jour le preset de la tablette si disponible
            if (favorite.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    tabletSelector.querySelector('#tabletSelectorText').textContent = favorite.presetInfo;
                }
            }
            
            // Mettre à jour l'affichage
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
            
            // Mettre en surbrillance le favori chargé
            this.highlightFavorite(id);
            
            Notifications.success('Configuration chargée');
        } catch (error) {
            console.error('Erreur lors du chargement du favori:', error);
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
        
        // Sauvegarder les valeurs originales
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
        
        // Afficher le bouton d'annulation
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
        }
        
        // Mettre à jour les champs avec les valeurs du favori
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
                tabletSelector.querySelector('#tabletSelectorText').textContent = favorite.presetInfo;
            }
        }
        
        // Mettre à jour l'affichage
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Mettre en surbrillance le favori en cours d'édition
        this.highlightFavorite(id);
        
        Notifications.info('Mode édition activé - Modifiez les paramètres puis cliquez sur "Sauvegarder"');
    },
    
    /**
     * Delete a favorite
     * @param {string|number} id - ID of the favorite to delete
     */
    deleteFavorite(id) {
        this.showDeleteDialog((confirmed) => {
            if (confirmed) {
                const success = StorageManager.removeFavorite(id);
                
                if (success) {
                    this.loadFavorites();
                    Notifications.success('Favori supprimé');
                } else {
                    Notifications.error('Erreur lors de la suppression du favori');
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
        
        // Récupérer les informations du preset de tablette
        const tabletSelector = document.getElementById('tabletSelectorButton');
        const presetInfo = tabletSelector ? tabletSelector.querySelector('#tabletSelectorText').textContent : '';
        
        if (appState.editingFavoriteId) {
            // Mise à jour d'un favori existant
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
                description: appState.originalValues.description
            };
            
            const success = StorageManager.updateFavorite(appState.editingFavoriteId, updatedData);
            
            if (success) {
                this.loadFavorites();
                appState.cancelEditMode();
                Notifications.success('Configuration mise à jour');
            } else {
                Notifications.error('Erreur lors de la mise à jour de la configuration');
            }
        } else {
            // Nouveau favori - afficher la boîte de dialogue pour le titre et la description
            this.showCommentDialog((commentData) => {
                if (commentData.title && commentData.title.length > 25) {
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
                    presetInfo: presetInfo
                };
                
                const savedFavorite = StorageManager.addFavorite(newFavorite);
                
                if (savedFavorite) {
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
        // Vérifier si le favori existe déjà
        const existingItem = this.favoritesList.querySelector(`.favorite-item[data-id="${favorite.id}"]`);
        if (existingItem) {
            existingItem.remove();
        }
        
        // Cacher le placeholder s'il est visible
        if (!this.favoritesPlaceholder.classList.contains('hidden')) {
            this.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Créer et ajouter le nouvel élément
        const item = this.createFavoriteElement(favorite);
        
        // Ajouter au début ou à la fin selon le tri
        if (this.currentSortCriteria === 'date') {
            this.favoritesList.insertBefore(item, this.favoritesList.children[1]);
        } else {
            this.favoritesList.appendChild(item);
            // Si trié par nom, recharger pour avoir le bon ordre
            if (this.currentSortCriteria === 'name') {
                this.loadFavorites();
            }
        }
    },
    
    /**
     * Affiche un popup détaillé pour un favori
     * @param {Object} favorite - Le favori à afficher
     */
    showFavoriteDetails(favorite) {
        // Créer le popup s'il n'existe pas
        if (!this.detailsPopup) {
            this.createDetailsPopup();
        }
        
        // Stocker l'ID du favori actuellement affiché
        this.currentDetailedFavoriteId = favorite.id;
        
        // Titre et date
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const title = favorite.title || favorite.comment || 'Configuration sauvegardée';
        
        // Mettre à jour le contenu du popup
        const titleInput = document.getElementById('details-title');
        const descriptionElement = document.getElementById('details-description');
        const titleCounter = document.getElementById('details-title-counter');
        const descriptionCounter = document.getElementById('details-description-counter');
        
        titleInput.value = title;
        document.getElementById('details-date').textContent = formattedDate;
        
        // Ajouter la date de dernière modification si elle existe
        const lastModifiedContainer = document.getElementById('details-last-modified-container');
        const lastModifiedContent = document.getElementById('details-last-modified');
        
        if (favorite.lastModified && lastModifiedContainer && lastModifiedContent) {
            const lastModifiedDate = new Date(favorite.lastModified);
            const formattedLastModified = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
            lastModifiedContent.textContent = formattedLastModified;
            lastModifiedContainer.classList.remove('hidden');
        } else if (lastModifiedContainer) {
            lastModifiedContainer.classList.add('hidden');
        }
        
        // Mettre à jour le compteur de titre
        if (titleCounter) {
            titleCounter.textContent = `${title.length}/25`;
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (title.length >= 25) {
                titleCounter.classList.add('at-limit');
            } else if (title.length > 15) {
                titleCounter.classList.add('near-limit');
            }
        };
        
        // Description
        if (favorite.description && favorite.description.trim() !== '') {
            descriptionElement.value = favorite.description;
            
            // Mettre à jour le compteur de description
            if (descriptionCounter) {
                const descLength = favorite.description.length;
                descriptionCounter.textContent = `${descLength}/144`;
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                if (descLength >= 144) {
                    descriptionCounter.classList.add('at-limit');
                } else if (descLength > 120) {
                    descriptionCounter.classList.add('near-limit');
                }
            }
        } else {
            descriptionElement.value = '';
            if (descriptionCounter) {
                descriptionCounter.textContent = '0/144';
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
        }
        
        // Informations sur la tablette
        const tabletName = favorite.presetInfo || 'Tablette personnalisée';
        document.getElementById('details-tablet-name').textContent = tabletName;
        
        const tabletWidth = formatNumber(favorite.tabletW);
        const tabletHeight = formatNumber(favorite.tabletH);
        document.getElementById('details-tablet-dimensions').textContent = `${tabletWidth} × ${tabletHeight} mm`;
        
        const tabletRatio = calculateRatio(favorite.tabletW, favorite.tabletH);
        document.getElementById('details-tablet-ratio').textContent = tabletRatio;
        
        // Informations sur l'area
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height);
        document.getElementById('details-area-dimensions').textContent = `${areaWidth} × ${areaHeight} mm`;
        
        const areaSize = (favorite.width * favorite.height).toFixed(2);
        document.getElementById('details-area-size').textContent = `${areaSize} mm²`;
        
        const areaRatio = calculateRatio(favorite.width, favorite.height);
        document.getElementById('details-area-ratio').textContent = areaRatio;
        
        const areaX = formatNumber(favorite.x || favorite.offsetX, 3);
        const areaY = formatNumber(favorite.y || favorite.offsetY, 3);
        document.getElementById('details-area-position').textContent = `X: ${areaX} mm, Y: ${areaY} mm`;
        
        // Afficher le popup avec une animation
        this.detailsPopup.classList.remove('hidden');
        setTimeout(() => {
            this.detailsPopup.classList.add('show');
        }, 10);
    },
    
    /**
     * Ferme le popup de détails
     */
    closeDetailsPopup() {
        if (this.detailsPopup) {
            // Sauvegarde automatique avant fermeture
            this.saveChangesIfNeeded();
            
            this.detailsPopup.classList.remove('show');
            setTimeout(() => {
                this.detailsPopup.classList.add('hidden');
            }, 300);
        }
    },
    
    /**
     * Planifie une sauvegarde automatique
     */
    scheduleAutoSave() {
        // Annuler le timer précédent s'il existe
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Définir un nouveau timer de 600ms
        this.autoSaveTimer = setTimeout(() => {
            this.saveChangesIfNeeded();
        }, 600);
    },
    
    /**
     * Sauvegarde les changements si nécessaire
     */
    saveChangesIfNeeded() {
        const favoriteId = this.currentDetailedFavoriteId;
        if (!favoriteId) return;
        
        const titleInput = document.getElementById('details-title');
        const descriptionInput = document.getElementById('details-description');
        
        if (!titleInput || !descriptionInput) return;
        
        const favorite = StorageManager.getFavoriteById(favoriteId);
        if (!favorite) return;
        
        const newTitle = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        
        // Vérifier si les valeurs ont changé
        if (newTitle !== (favorite.title || '') || newDescription !== (favorite.description || '')) {
            // Mettre à jour le titre et la description
            const updatedData = {
                ...favorite,
                title: newTitle,
                description: newDescription
            };
            
            const success = StorageManager.updateFavorite(favoriteId, updatedData);
            
            if (success) {
                this.loadFavorites();
                // Pas de notification pour éviter de spammer l'utilisateur
            }
        }
    },
    
    /**
     * Crée le popup de détails s'il n'existe pas déjà
     */
    createDetailsPopup() {
        const popup = document.createElement('div');
        popup.id = 'favorite-details-popup';
        popup.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden transition-opacity duration-300 opacity-0';
        
        popup.innerHTML = `
            <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full border border-gray-800 transform transition-all duration-300 scale-95 mx-4 max-h-[90vh] overflow-y-auto">
                <!-- En-tête avec bouton de fermeture -->
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Configuration
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
                            Titre
                        </div>
                        <span id="details-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/25</span>
                    </h3>
                    <input type="text" id="details-title" maxlength="25" placeholder="Titre de la configuration" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mb-0 transition-colors duration-200">
                </div>
                
                <!-- Date de création -->
                <div class="text-sm text-gray-300 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-gray-400 mr-1">Création:</span>
                    <span id="details-date" class="break-words"></span>
                </div>
                
                <!-- Date de dernière modification -->
                <div id="details-last-modified-container" class="text-sm text-gray-300 mb-4 flex items-center hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span class="text-gray-400 mr-1">Dernière modification:</span>
                    <span id="details-last-modified" class="break-words"></span>
                </div>
                
                <!-- Description -->
                <div id="details-description-container" class="mb-5">
                    <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Description
                        </div>
                        <span id="details-description-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                    </h3>
                    <textarea id="details-description" maxlength="144" placeholder="Description de la configuration" rows="4"
                              class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mb-2 resize-none transition-colors duration-200 min-h-[90px]"></textarea>
                </div>
                
                <!-- Informations Tablette -->
                <div class="mb-5 bg-gray-750 rounded-lg p-3 border border-gray-700">
                    <h4 class="text-md font-semibold text-white mb-3 pb-2 border-b border-gray-700/70 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        TABLETTE
                    </h4>
                    <div class="grid gap-y-3 gap-x-4 text-sm pl-1">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span class="text-gray-300">Modèle:</span>
                            </div>
                            <div class="text-white font-medium" id="details-tablet-name"></div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-y-3 gap-x-4">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                <span class="text-gray-300">Dimensions:</span>
                            </div>
                            <div class="text-right text-white font-medium" id="details-tablet-dimensions"></div>
                            
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span class="text-gray-300">Ratio:</span>
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
                        ZONE ACTIVE
                    </h4>
                    <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm pl-1">
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span class="text-gray-300">Dimensions:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-dimensions"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span class="text-gray-300">Surface:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-size"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span class="text-gray-300">Ratio:</span>
                        </div>
                        <div class="text-right text-white font-medium" id="details-area-ratio"></div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span class="text-gray-300">Position:</span>
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
                        <span class="text-sm font-medium">Charger</span>
                    </button>
                    <button id="details-edit-btn" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="text-sm font-medium">Modifier</span>
                    </button>
                    <button id="details-delete-btn" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span class="text-sm font-medium">Supprimer</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        this.detailsPopup = popup;
        
        // Ajouter la classe pour les animations
        popup.addEventListener('transitionend', () => {
            if (!popup.classList.contains('show')) {
                popup.classList.add('hidden');
            }
        });
        
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
        
        // Gestionnaires pour les compteurs
        const updateTitleCounter = () => {
            if (!titleCounter) return;
            const length = titleInput.value.length;
            titleCounter.textContent = `${length}/25`;
            
            // Réinitialiser les classes
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Ajouter les classes en fonction de la limite
            if (length >= 25) {
                titleCounter.classList.add('at-limit');
            } else if (length > 15) {
                titleCounter.classList.add('near-limit');
            }
            
            // Déclencher la sauvegarde automatique
            this.scheduleAutoSave();
        };
        
        const updateDescCounter = () => {
            if (!descriptionCounter) return;
            const length = descriptionInput.value.length;
            descriptionCounter.textContent = `${length}/144`;
            
            // Réinitialiser les classes
            descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Ajouter les classes en fonction de la limite
            if (length >= 144) {
                descriptionCounter.classList.add('at-limit');
            } else if (length > 120) {
                descriptionCounter.classList.add('near-limit');
            }
            
            // Déclencher la sauvegarde automatique
            this.scheduleAutoSave();
        };
        
        titleInput.addEventListener('input', updateTitleCounter);
        descriptionInput.addEventListener('input', updateDescCounter);
        
        // Activer la touche Entrée pour passer à la description
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                descriptionInput.focus();
            }
        });
        
        closeBtn?.addEventListener('click', () => this.closeDetailsPopup());
        
        // Fermer quand on clique en dehors du contenu
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeDetailsPopup();
            }
        });
        
        // Bouton pour charger la configuration
        loadBtn.addEventListener('click', () => {
            const favoriteId = this.currentDetailedFavoriteId;
            if (favoriteId) {
                this.loadFavorite(favoriteId);
                this.closeDetailsPopup();
            }
        });
        
        // Bouton pour modifier le favori
        editBtn.addEventListener('click', () => {
            const favoriteId = this.currentDetailedFavoriteId;
            if (favoriteId) {
                this.editFavorite(favoriteId);
                this.closeDetailsPopup();
            }
        });
        
        // Bouton pour supprimer le favori
        deleteBtn.addEventListener('click', () => {
            const favoriteId = this.currentDetailedFavoriteId;
            if (favoriteId) {
                this.deleteFavorite(favoriteId);
                this.closeDetailsPopup();
            }
        });
        
        // Ajouter les styles CSS pour les animations
        const style = document.createElement('style');
        style.textContent = `
            #favorite-details-popup.show {
                opacity: 1;
            }
            #favorite-details-popup.show > div {
                transform: scale(1);
            }
            #details-title-counter.at-limit, #details-description-counter.at-limit {
                color: #ef4444;
                animation: pulse 1s infinite;
            }
            #details-title-counter.near-limit, #details-description-counter.near-limit {
                color: #f59e0b;
            }
        `;
        document.head.appendChild(style);
    }
};
