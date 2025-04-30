/**
 * Favorites component for saving and managing area configurations
 */

const Favorites = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date',
    
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
        
        this.setupSortButtons();
        this.loadFavorites();
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
        
        // Sort favorites based on current criteria
        const sortedFavorites = this.sortFavorites(favorites, this.currentSortCriteria);
        
        // Create favorite items
        sortedFavorites.forEach(favorite => {
            this.addFavoriteToList(favorite);
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
     * Create and add a single favorite item to the list
     * @param {Object} favorite - Favorite data
     */
    addFavoriteToList(favorite) {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item bg-gray-700/50 p-3 rounded-lg flex flex-col gap-2 text-sm hover:bg-gray-700 transition duration-150 ease-in-out border border-transparent';
        favoriteItem.dataset.id = favorite.id;
        
        // Title/Comment
        const commentText = favorite.comment ? 
            `<span class="font-semibold text-white">${favorite.comment}</span>` : 
            '<span class="italic text-gray-400">Sans nom</span>';
        
        // Dimensions and ratio
        const dimensionsText = `${formatNumber(favorite.width)}x${formatNumber(favorite.height)}mm`;
        const ratioText = favorite.ratio && favorite.ratio !== 'N/A' ? 
            `<span title="Ratio largeur/hauteur">${parseFloatSafe(favorite.ratio, 0).toFixed(3)}</span>` : 
            '';
        
        // Position
        const positionText = (favorite.x !== undefined && favorite.y !== undefined) ? 
            `<span title="Position du centre">@(${formatNumber(favorite.x, 3)}, ${formatNumber(favorite.y, 3)})</span>` : 
            '';
        
        // Tablet info
        const tabletText = (favorite.tabletW && favorite.tabletH) ? 
            `<span class="text-xs text-gray-400" title="Dimensions de la tablette">Tablette: ${formatNumber(favorite.tabletW)}x${formatNumber(favorite.tabletH)}mm</span>` : 
            '';
            
        // Tablet preset info
        const presetText = favorite.presetInfo && favorite.presetInfo !== "Personnalisé" ? 
            `<span class="text-xs text-cyan-400" title="Basé sur le preset tablette">${favorite.presetInfo}</span>` : 
            `<span class="text-xs text-gray-400" title="Dimensions tablette personnalisées">Personnalisé</span>`;
        
        // Main content
        favoriteItem.innerHTML = `
            <div class="flex flex-col">
                <div class="flex justify-between items-start">
                    <div>${commentText}</div>
                    <div class="flex gap-1">
                        <button class="edit-favorite-btn p-1 text-blue-400 hover:text-blue-300" title="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-favorite-btn p-1 text-red-400 hover:text-red-300" title="Supprimer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 mt-1">
                    <span class="font-medium">${dimensionsText}</span>
                    ${ratioText ? `<span class="text-gray-400">(${ratioText})</span>` : ''}
                    ${positionText ? `<span class="text-gray-400 text-xs">${positionText}</span>` : ''}
                </div>
                
                <div class="flex gap-2 text-xs mt-1">
                    ${presetText}
                    ${tabletText}
                </div>
            </div>
            
            <button class="load-favorite-btn w-full mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors">
                Charger Configuration
            </button>
        `;
        
        // Add event listeners
        const loadBtn = favoriteItem.querySelector('.load-favorite-btn');
        const editBtn = favoriteItem.querySelector('.edit-favorite-btn');
        const deleteBtn = favoriteItem.querySelector('.delete-favorite-btn');
        
        loadBtn.addEventListener('click', () => this.loadFavorite(favorite.id));
        editBtn.addEventListener('click', () => this.editFavorite(favorite.id));
        deleteBtn.addEventListener('click', () => this.deleteFavorite(favorite.id));
        
        this.favoritesList.appendChild(favoriteItem);
    },
    
    /**
     * Load a favorite into the inputs
     * @param {string|number} id - ID of the favorite to load
     */
    loadFavorite(id) {
        const favorite = StorageManager.getFavoriteById(id);
        
        if (!favorite) {
            Notifications.error('Favori introuvable');
            return;
        }
        
        // Cancel edit mode if active
        if (appState.editingFavoriteId) {
            appState.cancelEditMode();
        }
        
        // Update tablet information
        if (favorite.tabletW !== undefined) {
            document.getElementById('tabletWidth').value = formatNumber(favorite.tabletW);
        }
        
        if (favorite.tabletH !== undefined) {
            document.getElementById('tabletHeight').value = formatNumber(favorite.tabletH);
        }
        
        // Match tablet with preset if possible
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        const tabletWidthGroup = document.getElementById('tablet-width-group');
        const tabletHeightGroup = document.getElementById('tablet-height-group');
        const tabletManualHr = document.getElementById('tablet-manual-hr');
        
        if (favorite.tabletW && favorite.tabletH) {
            const loadedWStr = formatNumber(favorite.tabletW);
            const loadedHStr = formatNumber(favorite.tabletH);
            
            let matchFound = false;
            
            // Try to find a matching preset
            Array.from(tabletPresetSelect.options).forEach(opt => {
                if (opt.dataset.width && opt.dataset.height) {
                    const presetW = formatNumber(parseFloat(opt.dataset.width));
                    const presetH = formatNumber(parseFloat(opt.dataset.height));
                    
                    if (presetW === loadedWStr && presetH === loadedHStr) {
                        tabletPresetSelect.value = opt.value;
                        tabletWidthGroup.classList.add('hidden');
                        tabletHeightGroup.classList.add('hidden');
                        tabletManualHr.classList.add('hidden');
                        matchFound = true;
                    }
                }
            });
            
            // If no match found, show custom fields
            if (!matchFound) {
                tabletPresetSelect.value = 'custom';
                tabletWidthGroup.classList.remove('hidden');
                tabletHeightGroup.classList.remove('hidden');
                tabletManualHr.classList.remove('hidden');
            }
        }
        
        // Update area dimensions
        document.getElementById('areaWidth').value = formatNumber(favorite.width);
        document.getElementById('areaHeight').value = formatNumber(favorite.height);
        
        // Update area position
        document.getElementById('areaOffsetX').value = 
            favorite.x !== undefined ? formatNumber(favorite.x, 3) : formatNumber(0, 3);
        document.getElementById('areaOffsetY').value = 
            favorite.y !== undefined ? formatNumber(favorite.y, 3) : formatNumber(0, 3);
        
        // Update ratio if present
        if (favorite.ratio && favorite.ratio !== 'N/A') {
            const ratio = parseFloatSafe(favorite.ratio);
            if (ratio > 0) {
                document.getElementById('customRatio').value = ratio.toFixed(3);
                document.getElementById('lockRatio').checked = true;
            }
        } else if (favorite.height > 0) {
            document.getElementById('customRatio').value = (favorite.width / favorite.height).toFixed(3);
            document.getElementById('lockRatio').checked = true;
        }
        
        // Update display
        updateDisplay();
        
        // Highlight the loaded favorite
        this.highlightFavorite(id);
        
        Notifications.success('Configuration chargée');
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
        
        appState.startEditFavorite(id);
        
        // Scroll to top for editing
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    /**
     * Delete a favorite
     * @param {string|number} id - ID of the favorite to delete
     */
    deleteFavorite(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce favori ?')) {
            const success = StorageManager.removeFavorite(id);
            
            if (success) {
                this.loadFavorites();
                Notifications.success('Favori supprimé');
            } else {
                Notifications.error('Erreur lors de la suppression du favori');
            }
        }
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
        
        let comment = '';
        
        // Get preset info
        let presetInfo = "Personnalisé";
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        
        if (tabletPresetSelect.value !== 'custom' && tabletPresetSelect.value) {
            const selectedOption = tabletPresetSelect.selectedOptions[0];
            if (selectedOption) {
                const brandPart = selectedOption.dataset.brand || '';
                presetInfo = brandPart ? `${brandPart} - ${selectedOption.textContent}` : selectedOption.textContent;
            }
        }
        
        if (appState.editingFavoriteId) {
            // Updating existing favorite - keep existing comment
            const existingFavorite = StorageManager.getFavoriteById(appState.editingFavoriteId);
            comment = existingFavorite ? existingFavorite.comment || '' : '';
            
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
            // New favorite - ask for comment
            comment = prompt("Ajouter un commentaire (optionnel, max 40 caractères):");
            
            if (comment === null) {
                // User canceled
                return false;
            }
            
            if (comment && comment.length > 40) {
                Notifications.warning("Le commentaire a été tronqué à 40 caractères.");
                comment = comment.substring(0, 40);
            }
            
            const newFavorite = {
                width: areaWidth,
                height: areaHeight,
                x: areaOffsetX,
                y: areaOffsetY,
                ratio: customRatio,
                comment: comment,
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
        }
        
        return true;
    }
};
