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
        item.classList.add('favorite-item', 'bg-gray-900', 'rounded-lg', 'p-3', 'mb-3', 'border', 'border-gray-800', 'hover:border-gray-700', 'shadow-md', 'transition-colors');
        item.dataset.id = favorite.id;
        
        // Ajouter la classe d'animation mais ne l'activer que si déjà initialisé
        if (this.isInitialized) {
            item.classList.add('animate-fadeIn');
        }
        
        // Utiliser le titre s'il existe, sinon utiliser l'ancien champ comment s'il existe, sinon texte par défaut
        const title = favorite.title || favorite.comment || 'Configuration sauvegardée';
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height);
        const areaRatio = calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height);
        
        // Préparer le HTML avec titre et description
        let innerHtml = `
            <div class="flex items-center justify-between mb-1">
                <h3 class="font-medium text-white">${title}</h3>
                <div class="flex">
                    <button class="edit-favorite-btn text-gray-400 hover:text-white p-1 mr-1 transition-colors" title="Modifier le nom" aria-label="Modifier le nom">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="delete-favorite-btn text-gray-400 hover:text-red-500 p-1 transition-colors" title="Supprimer" aria-label="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>`;
            
        // Ajouter la description si elle existe
        if (favorite.description) {
            innerHtml += `<div class="text-sm text-gray-400 mb-1 line-clamp-2">${favorite.description}</div>`;
        }
        
        // Ajouter les informations de dimensions et date
        innerHtml += `
            <div class="text-sm text-gray-400">${areaWidth} × ${areaHeight} mm (${areaRatio})</div>
            <div class="text-xs text-gray-500 mt-1">${formattedDate}</div>
        `;
        
        item.innerHTML = innerHtml;
        
        // Ajouter les gestionnaires d'événements
        const loadHandler = () => this.loadFavorite(favorite.id);
        item.addEventListener('click', loadHandler);
        
        // Empêcher le chargement lors du clic sur les boutons
        const editBtn = item.querySelector('.edit-favorite-btn');
        const deleteBtn = item.querySelector('.delete-favorite-btn');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editFavorite(favorite.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFavorite(favorite.id);
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
            <div class="bg-gray-900 rounded-lg p-6 shadow-xl max-w-md w-full border border-gray-700 transform scale-95 transition-transform duration-200">
                <!-- Section Titre -->
                <h3 class="text-xl font-semibold text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Ajouter un titre
                    </div>
                    <span id="title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/40</span>
                </h3>
                <input type="text" id="comment-input" maxlength="40" placeholder="Titre de la configuration (Optionnel)" 
                       class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-0 focus:border-blue-500 mb-6 transition-colors duration-200">
                
                <!-- Section Description -->
                <h3 class="text-xl font-semibold text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Ajouter une description
                    </div>
                    <span id="description-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                </h3>
                <textarea id="description-input" maxlength="144" placeholder="Description de la configuration (Optionnel)" rows="3"
                          class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-100 focus:outline-none focus:ring-0 focus:border-blue-500 mb-6 resize-none transition-colors duration-200"></textarea>
                
                <!-- Boutons d'action -->
                <div class="flex justify-end space-x-3">
                    <button id="cancel-comment-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors duration-200">Annuler</button>
                    <button id="save-comment-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors duration-200">Sauvegarder</button>
                </div>
            </div>
        `;
        
        // Create a custom dialog for deletion confirmation
        const deleteDialog = document.createElement('div');
        deleteDialog.id = 'delete-dialog';
        deleteDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden opacity-0 transition-opacity duration-200';
        deleteDialog.innerHTML = `
            <div class="bg-gray-900 rounded-lg p-6 shadow-xl max-w-md w-full border border-gray-700 transform scale-95 transition-transform duration-200">
                <h3 class="text-xl font-semibold text-white pb-2 mb-4 border-b border-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Confirmation de suppression
                </h3>
                <p class="text-gray-300 text-sm mb-6 bg-gray-800 p-3 rounded-md border border-gray-700">Êtes-vous sûr de vouloir supprimer ce favori ?</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-delete-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors duration-200">Annuler</button>
                    <button id="confirm-delete-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors duration-200">Supprimer</button>
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
        
        cancelCommentBtn.addEventListener('click', () => {
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
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        
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
        if (titleCounter) titleCounter.textContent = '0/40';
        if (descriptionCounter) descriptionCounter.textContent = '0/144';
        
        // Setup input counters
        const updateTitleCounter = () => {
            if (!titleCounter) return;
            const length = commentInput.value.length;
            titleCounter.textContent = `${length}/40`;
            
            // Réinitialiser les classes
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            // Ajouter les classes en fonction de la limite
            if (length >= 40) {
                titleCounter.classList.add('at-limit');
            } else if (length > 30) {
                titleCounter.classList.add('near-limit');
            }
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
     * Setup sort buttons for favorites list
     */
    setupSortButtons() {
        const sortButtons = document.querySelectorAll('.sort-button');
        
        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sortBy = button.getAttribute('data-sort');
                
                // Update active button styling
                sortButtons.forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('bg-gray-700', 'text-gray-300');
                });
                
                button.classList.remove('bg-gray-700', 'text-gray-300');
                button.classList.add('bg-blue-600', 'text-white');
                
                this.currentSortCriteria = sortBy;
                this.loadFavorites();
            });
        });
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
        
        if (favorites.length === 0) {
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
                    return (a.comment || '').toLowerCase().localeCompare((b.comment || '').toLowerCase());
                case 'size':
                    const areaA = (a.width || 0) * (a.height || 0);
                    const areaB = (b.width || 0) * (b.height || 0);
                    return areaB - areaA;
                case 'date':
                default:
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
            
            // Update inputs
            document.getElementById('areaWidth').value = formatNumber(favorite.width);
            document.getElementById('areaHeight').value = formatNumber(favorite.height);
            document.getElementById('areaOffsetX').value = formatNumber(favorite.offsetX, 3);
            document.getElementById('areaOffsetY').value = formatNumber(favorite.offsetY, 3);
            
            // Update ratio if present
            if (favorite.ratio && favorite.ratio !== 'N/A') {
                const ratio = parseFloatSafe(favorite.ratio);
                if (ratio > 0) {
                    document.getElementById('customRatio').value = ratio.toFixed(3);
                    document.getElementById('lockRatio').setAttribute('aria-pressed', 'true');
                    // Mettre à jour visuellement l'indicateur
                    const indicator = document.getElementById('lockRatioIndicator')?.firstElementChild;
                    if (indicator) {
                        indicator.style.transform = 'scale(1)';
                    }
                }
            } else if (favorite.height > 0) {
                document.getElementById('customRatio').value = (favorite.width / favorite.height).toFixed(3);
                document.getElementById('lockRatio').setAttribute('aria-pressed', 'true');
                // Mettre à jour visuellement l'indicateur
                const indicator = document.getElementById('lockRatioIndicator')?.firstElementChild;
                if (indicator) {
                    indicator.style.transform = 'scale(1)';
                }
            }
            
            // Update display
            updateDisplay();
            
            // Highlight the loaded favorite
            this.highlightFavorite(id);
            
            Notifications.success('Configuration chargée');
        } catch (error) {
            console.error('Erreur lors du chargement du favori:', error);
            Notifications.error('Erreur lors du chargement du favori');
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
            Notifications.error('Favori introuvable pour édition');
            return;
        }
        
        // Ouvrir la boîte de dialogue pour éditer le titre et la description
        const commentDialog = document.getElementById('comment-dialog');
        const commentInput = document.getElementById('comment-input');
        const descriptionInput = document.getElementById('description-input');
        const titleCounter = document.getElementById('title-counter');
        const descriptionCounter = document.getElementById('description-counter');
        
        if (!commentDialog || !commentInput || !descriptionInput) {
            Notifications.error('Éléments de dialogue introuvables');
            return;
        }
        
        // Remplir les champs avec les valeurs existantes
        commentInput.value = favorite.title || favorite.comment || '';
        descriptionInput.value = favorite.description || '';
        
        // Mettre à jour les compteurs
        if (titleCounter) {
            titleCounter.textContent = `${commentInput.value.length}/40`;
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (commentInput.value.length >= 40) {
                titleCounter.classList.add('at-limit');
            } else if (commentInput.value.length > 30) {
                titleCounter.classList.add('near-limit');
            }
        }
        
        if (descriptionCounter) {
            descriptionCounter.textContent = `${descriptionInput.value.length}/144`;
            descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (descriptionInput.value.length >= 144) {
                descriptionCounter.classList.add('at-limit');
            } else if (descriptionInput.value.length > 120) {
                descriptionCounter.classList.add('near-limit');
            }
        }
        
        // Utiliser les mêmes animations que showCommentDialog
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
        
        // Définir le callback pour la sauvegarde
        this.commentDialogCallback = (commentData) => {
            // Vérifier et tronquer si nécessaire
            if (commentData.title && commentData.title.length > 40) {
                Notifications.warning("Le titre a été tronqué à 40 caractères.");
                commentData.title = commentData.title.substring(0, 40);
            }
            
            if (commentData.description && commentData.description.length > 144) {
                Notifications.warning("La description a été tronquée à 144 caractères.");
                commentData.description = commentData.description.substring(0, 144);
            }
            
            // Mettre à jour le favori
            const updatedData = {
                title: commentData.title,
                description: commentData.description
            };
            
            const success = StorageManager.updateFavorite(id, updatedData);
            
            if (success) {
                this.loadFavorites();
                this.highlightFavorite(id);
                Notifications.success('Favori mis à jour');
            } else {
                Notifications.error('Erreur lors de la mise à jour du favori');
            }
        };
        
        // Mettre le focus sur le champ de titre après l'animation
        setTimeout(() => {
            commentInput.focus();
        }, 200);
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
        const customRatio = document.getElementById('customRatio').value;
        
        // Validate dimensions
        if (!isValidNumber(areaWidth, 1) || !isValidNumber(areaHeight, 1) || 
            !isValidNumber(tabletWidth, 10) || !isValidNumber(tabletHeight, 10)) {
            Notifications.error('Dimensions invalides');
            return false;
        }
        
        // Get preset info
        let presetInfo = "Personnalisé";
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        
        if (tabletPresetSelect && tabletPresetSelect.value !== 'custom' && tabletPresetSelect.value) {
            const selectedOption = tabletPresetSelect.selectedOptions[0];
            if (selectedOption) {
                const brandPart = selectedOption.dataset.brand || '';
                presetInfo = brandPart ? `${brandPart} - ${selectedOption.textContent}` : selectedOption.textContent;
            }
        } else {
            // Vérifier le nouveau sélecteur
            const selectorText = document.getElementById('tabletSelectorText');
            if (selectorText) {
                presetInfo = selectorText.textContent;
            }
        }
        
        if (appState.editingFavoriteId) {
            // Updating existing favorite - keep existing comment
            const existingFavorite = StorageManager.getFavoriteById(appState.editingFavoriteId);
            const comment = existingFavorite ? existingFavorite.comment || '' : '';
            
            const updatedData = {
                width: areaWidth,
                height: areaHeight,
                x: areaOffsetX,
                y: areaOffsetY,
                ratio: customRatio,
                tabletW: tabletWidth,
                tabletH: tabletHeight,
                presetInfo: presetInfo
            };
            
            const success = StorageManager.updateFavorite(appState.editingFavoriteId, updatedData);
            
            if (success) {
                this.loadFavorites();
                appState.cancelEditMode();
                Notifications.success('Favori mis à jour');
            } else {
                Notifications.error('Erreur lors de la mise à jour du favori');
            }
            
        } else {
            // New favorite - show comment dialog
            this.showCommentDialog((commentData) => {
                if (commentData.title && commentData.title.length > 40) {
                    Notifications.warning("Le titre a été tronqué à 40 caractères.");
                    commentData.title = commentData.title.substring(0, 40);
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
                    Notifications.success('Favori sauvegardé');
                } else {
                    Notifications.error('Erreur lors de la sauvegarde du favori');
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
    }
};
