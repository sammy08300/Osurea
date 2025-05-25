// favorite-actions.js - Module de gestion des actions sur les favoris
import { translateWithFallback } from '../../../js/i18n-init.js';
import { getFavorites, getFavoriteById, addFavorite, updateFavorite, removeFavorite } from './favorite-storage.js';
import { FavoritesPopups } from './favorite-popup.js';
import { FavoritesRendering } from './favorite-rendering.js';
import { FavoritesInit } from './favorite-init.js';
import localeManager from '../../../locales/index.js';

/**
 * Format a number with a certain number of decimals
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(val, decimals = 1) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    return val.toFixed(decimals);
}

/**
 * Module of actions on favorites
 */
export const FavoritesActions = {
    editingFavoriteId: null,
    currentDetailedFavoriteId: null,
    autoSaveTimer: null,
    originalValues: null,

    /**
     * Load a favorite into the main form
     * @param {string|number} id
     */
    loadFavorite(id) {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(localeManager.translate('notifications.favoriteNotFound') || `Favori ID ${id} introuvable`);
            }
            return;
        }
        try {
            // Example: update the fields of the form (to adapt according to the application)
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
            
            // Update the tablet dimensions if available
            if (typeof favorite.tabletW !== 'undefined' && typeof favorite.tabletH !== 'undefined') {
                const tabletWidth = document.getElementById('tabletWidth');
                const tabletHeight = document.getElementById('tabletHeight');
                
                if (tabletWidth) tabletWidth.value = formatNumber(favorite.tabletW);
                if (tabletHeight) tabletHeight.value = formatNumber(favorite.tabletH);
            }
            
            // Update the model information if available
            if (favorite.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                    
                    // Check if it's a translation key
                    if (favorite.presetInfo.startsWith('i18n:')) {
                        const key = favorite.presetInfo.substring(5);
                        
                        // Apply the translation key to the data-i18n attribute
                        selectorText.setAttribute('data-i18n', key);
                        
                        // Use our robust translation function
                        selectorText.textContent = translateWithFallback(key);
                    } else {
                        // It's a normal model name, not a translation key
                        selectorText.removeAttribute('data-i18n');
                        selectorText.textContent = favorite.presetInfo;
                    }
                }
            }
            
            // Update the display if needed
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
            
            // Highlight the loaded favorite without reloading the entire list
            FavoritesRendering.highlightFavorite(id);
            
            // Save the current state in preferences if available
            if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
            }
            
            // Notification
            if (typeof Notifications !== 'undefined' && Notifications.success) {
                Notifications.success(localeManager.translate('notifications.configurationLoaded') || 'Configuration chargée');
            }
        } catch (error) {
            console.error('Error loading the favorite:', error);
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(localeManager.translate('notifications.errorLoadingConfig') || 'Erreur lors du chargement de la configuration');
            }
        }
    },
    
    /**
     * Start the edition of a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    editFavorite(id) {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(localeManager.translate('notifications.favoriteNotFound') || 'Favori introuvable');
            }
            return;
        }
        
        // Store the ID of the favorite being edited (in the global state or local)
        this.editingFavoriteId = id;
        
        // Save the original values to be able to restore them
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
        
        // Update the global state if available
        if (typeof window.appState !== 'undefined') {
            window.appState.editingFavoriteId = id;
            window.appState.originalValues = this.originalValues;
        }
        
        // Display the button to cancel the edition
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.classList.add('flex');
            
            // Add the cancel event
            cancelBtn.onclick = () => this.cancelEditMode();
        }
        
        // Replace the save button with a "Confirm the modification" button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            // Change the content of the button
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span data-i18n="favorites.confirmModification">Confirmer la modification</span>`;
            
            // Ensure the translation is applied
            if (typeof localeManager !== 'undefined') {
                if (typeof localeManager.applyTranslations === 'function') {
                    localeManager.applyTranslations(saveBtn);
                } else if (typeof localeManager.translate === 'function') {
                    const span = saveBtn.querySelector('span[data-i18n]');
                    if (span) {
                        const key = span.getAttribute('data-i18n');
                        span.textContent = localeManager.translate(key);
                    }
                }
            }
        }
        
        // Fill the form with the favorite values
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
        
        // Highlight the favorite being edited
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`);
        if (favoriteElement) {
            favoriteElement.classList.add('border-blue-500', 'highlight-effect');
            // Remove the highlight after a delay
            setTimeout(() => {
                favoriteElement.classList.remove('highlight-effect');
                // Keep the blue border to indicate the element being edited
            }, 1500);
        }
        
        // Display a notification
        if (typeof Notifications !== 'undefined' && Notifications.info) {
            Notifications.info(localeManager.translate('notifications.editModeActivated') || 'Mode édition activé - Modifiez les paramètres puis cliquez sur "Confirmer la modification"');
        }
    },

    /**
     * Cancel the edit mode and restore the original values
     * @param {boolean} skipNotification - If true, do not display a notification
     */
    cancelEditMode(skipNotification = false) {
        // Check if there is an active edit mode and values to restore
        if (!this.editingFavoriteId || !this.originalValues) {
            return;
        }
        
        // Store the ID to be able to use it after the reset
        const previousEditingId = this.editingFavoriteId;
        
        // Restore the original values
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
            
            // Update the display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
        }
        
        // Remove the highlight of the favorite being edited
        // without causing undesirable animations
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${previousEditingId}"]`);
        if (favoriteElement) {
            // Remove the classes without transition
            requestAnimationFrame(() => {
                favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
            });
        }
        
        // Reset the save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span data-i18n="save">Sauvegarder</span>`;
            
            // Ensure the translation is applied
            if (typeof localeManager !== 'undefined') {
                if (typeof localeManager.applyTranslations === 'function') {
                    localeManager.applyTranslations(saveBtn);
                } else if (typeof localeManager.translate === 'function') {
                    const span = saveBtn.querySelector('span[data-i18n]');
                    if (span) {
                        const key = span.getAttribute('data-i18n');
                        span.textContent = localeManager.translate(key);
                    }
                }
            }
        }
        
        // Hide the cancel button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
            cancelBtn.classList.remove('flex');
        }
        
        // Reset the states
        this.editingFavoriteId = null;
        this.originalValues = null;
        
        // Also reset in the global state if available
        if (typeof window.appState !== 'undefined') {
            window.appState.editingFavoriteId = null;
            window.appState.originalValues = null;
        }
        
        // Display a notification unless requested not to do so
        if (!skipNotification && typeof Notifications !== 'undefined' && Notifications.info) {
            Notifications.info(localeManager.translate('notifications.editModeCanceled') || 'Edit mode canceled');
        }
    },

    /**
     * Delete a favorite with confirmation
     * @param {string|number} id
     */
    deleteFavorite(id) {
        FavoritesPopups.showDeleteDialog((confirmed) => {
            if (confirmed) {
                // Find the element before deleting it to be able to animate it
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`);
                
                if (favoriteElement) {
                    // Animate the disappearance of the element before deleting it
                    favoriteElement.classList.add('animate-fadeOut');
                    
                    // Wait for the animation to end before deleting it definitively
                    setTimeout(() => {
                        const success = removeFavorite(id);
                        
                        if (success) {
                            // Remove the element from the DOM
                            if (favoriteElement.parentNode) {
                                favoriteElement.parentNode.removeChild(favoriteElement);
                            }
                            
                            // Update the favorites cache and force a complete update
                            FavoritesInit.updateFavoriteCache(true);
                            
                            // Ensure the favorite is also deleted from preferences
                            if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                                setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
                            }
                            
                            if (typeof Notifications !== 'undefined' && Notifications.success) {
                                Notifications.success(localeManager.translate('notifications.favoriteDeleted') || 'Favori supprimé');
                            }
                        } else {
                            // If error, remove the animation and restore the element
                            favoriteElement.classList.remove('animate-fadeOut');
                            
                            if (typeof Notifications !== 'undefined' && Notifications.error) {
                                Notifications.error(localeManager.translate('notifications.errorDeletingFavorite') || 'Erreur lors de la suppression du favori');
                            }
                        }
                    }, 300); // Duration of the fadeOut animation
                } else {
                    // If the element is not found in the DOM, classic deletion
                    const success = removeFavorite(id);
                    
                    if (success) {
                        // Update the cache and the interface
                        FavoritesInit.updateFavoriteCache(true);
                        
                        // Ensure the favorite is also deleted from preferences
                        if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                            setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
                        }
                        
                        if (typeof Notifications !== 'undefined' && Notifications.success) {
                            Notifications.success(localeManager.translate('notifications.favoriteDeleted') || 'Favori supprimé');
                        }
                    } else {
                        if (typeof Notifications !== 'undefined' && Notifications.error) {
                            Notifications.error(localeManager.translate('notifications.errorDeletingFavorite') || 'Erreur lors de la suppression du favori');
                        }
                    }
                }
            }
        });
    },

    /**
     * Save a favorite (add or update depending on the context, with title/description)
     */
    saveFavorite() {
        // Get the values of the form
        const areaWidth = parseFloat(document.getElementById('areaWidth').value);
        const areaHeight = parseFloat(document.getElementById('areaHeight').value);
        const areaOffsetX = parseFloat(document.getElementById('areaOffsetX').value);
        const areaOffsetY = parseFloat(document.getElementById('areaOffsetY').value);
        const customRatio = parseFloat(document.getElementById('customRatio').value);
        const areaRadius = parseInt(document.getElementById('areaRadius')?.value) || 0;
        
        // Get the tablet information if available
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
            // Check if it's a translation key
            if (tabletSelectorText.hasAttribute('data-i18n')) {
                presetInfo = 'i18n:' + tabletSelectorText.getAttribute('data-i18n');
            } else {
                presetInfo = tabletSelectorText.textContent;
            }
        }
        
        // Log for debugging
        console.log('Saving favorite, edit mode:', !!this.editingFavoriteId);
        
        // Check if we are in edit mode
        if (this.editingFavoriteId) {
            // Update an existing favorite - NO DIALOGUE, direct update
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
                lastModified: new Date().getTime() // Add the last modification date
            };
            
            const success = updateFavorite(this.editingFavoriteId, updatedData);
            if (success) {
                // Store the ID of the modified favorite
                const modifiedFavoriteId = this.editingFavoriteId;
                
                // Update the favorites cache to reflect the changes
                FavoritesInit.updateFavoriteCache(false);
                
                // Cancel the edit mode without notification
                this.cancelEditMode(true);
                
                // Find the modified favorite element and highlight it
                // without reloading the entire list
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${modifiedFavoriteId}"]`);
                if (favoriteElement) {
                    // Highlight the modified favorite
                    favoriteElement.classList.add('border-blue-500', 'highlight-effect');
                    
                    // Remove the highlight after a delay
                    setTimeout(() => {
                        favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
                    }, 1500);
                }
                
                if (typeof Notifications !== 'undefined' && Notifications.success) {
                    Notifications.success(localeManager.translate('notifications.configurationUpdated') || 'Configuration mise à jour');
                }
            } else {
                if (typeof Notifications !== 'undefined' && Notifications.error) {
                    Notifications.error(localeManager.translate('notifications.errorUpdatingConfig') || 'Erreur lors de la mise à jour de la configuration');
                }
            }
        } else {
            // Add a new favorite - show the dialog for the title and description
            FavoritesPopups.showCommentDialog((commentData) => {
                // If the title is empty, use the complete translation key
                if (!commentData.title || commentData.title.trim() === '') {
                    commentData.title = "i18n:favorites.defaultName";
                }
                
                // If it's a translation key, do not truncate
                if (!commentData.title.startsWith('i18n:') && commentData.title.length > 32) {
                    if (typeof Notifications !== 'undefined' && Notifications.warning) {
                        Notifications.warning(localeManager.translate('notifications.titleTruncated') || "Le titre a été tronqué à 32 caractères.");
                    }
                    commentData.title = commentData.title.substring(0, 32);
                }
                
                if (commentData.description && commentData.description.length > 144) {
                    if (typeof Notifications !== 'undefined' && Notifications.warning) {
                        Notifications.warning(localeManager.translate('notifications.descriptionTruncated') || "La description a été tronquée à 144 caractères.");
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
                    radius: areaRadius,
                    createdAt: Date.now()
                };
                
                console.log('Creating new favorite:', newFavorite);
                
                // Force the cache cleaning before adding
                if (typeof StorageManager !== 'undefined' && typeof StorageManager.clearCache === 'function') {
                    StorageManager.clearCache();
                }
                
                const savedFavorite = addFavorite(newFavorite);
                if (savedFavorite) {
                    // Get the complete list of favorites after adding for debugging
                    console.log('All favorites after adding:', getFavorites());
                    
                    // Update the cache and force a complete refresh
                    FavoritesInit.updateFavoriteCache(true);
                    
                    // Save preferences after a short delay to ensure the addition is complete
                    if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                        // Longer delay to ensure the storage is complete
                        setTimeout(() => {
                            // Debug: check if the favorite exists before saving preferences
                            const allFavs = getFavorites();
                            const favExists = allFavs.some(f => f.id === savedFavorite.id);
                            console.log(`Favorite ${savedFavorite.id} exists before saving prefs: ${favExists}`);
                            
                            window.PreferencesManager.saveCurrentState();
                        }, 300);
                    }
                    
                    // Wait a short moment to allow the DOM to update
                    setTimeout(() => {
                        // Highlight the added favorite
                        const favoriteElement = document.querySelector(`.favorite-item[data-id="${savedFavorite.id}"]`);
                        if (favoriteElement) {
                            favoriteElement.classList.add('highlight-effect');
                            setTimeout(() => {
                                favoriteElement.classList.remove('highlight-effect');
                            }, 2000);
                        }
                    }, 100);
                    
                    if (typeof Notifications !== 'undefined' && Notifications.success) {
                        Notifications.success(localeManager.translate('notifications.configurationSaved') || 'Configuration sauvegardée');
                    }
                } else {
                    if (typeof Notifications !== 'undefined' && Notifications.error) {
                        Notifications.error(localeManager.translate('notifications.errorSavingConfig') || 'Erreur lors de la sauvegarde de la configuration');
                    }
                }
            });
        }
    },

    /**
     * Schedule an automatic save after a delay
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            // Save changes
            const needsUpdate = this.saveChangesIfNeeded();
            
            // If the data has been modified, force a refresh 
            // of the favorites in the interface to reflect the changes
            if (needsUpdate) {
                FavoritesInit.updateFavoriteCache(true);
            }
        }, 600);
    },
    
    /**
     * Save the modifications made to the favorite fields if necessary
     * @returns {boolean} - true if modifications have been made, false otherwise
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
        
        // Get the values
        const newTitleValue = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        
        // Check if we need to preserve the i18n format
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
            } else {
                currentTranslation = translateWithFallback(key);
            }
            
            if (currentTranslation === newTitleValue) {
                // The user hasn't changed the translated text, keep the i18n key
                newTitle = originalTitle;
            } else if (newTitleValue === key) {
                // The user entered the raw key, keep the i18n format
                newTitle = originalTitle;
            } else if (key === 'favorites.defaultName') {
                // For favorites.defaultName, check if they typed one of the standard translations
                let isDefaultTranslation = false;
                
                if (newTitleValue === 'Configuration sauvegardée' ||
                    newTitleValue === 'Saved configuration' ||
                    newTitleValue === 'Configuración guardada') {
                    isDefaultTranslation = true;
                }
                
                if (isDefaultTranslation) {
                    newTitle = 'i18n:favorites.defaultName';
                }
            }
        }
        
        // Check if the values have changed
        const titleChanged = newTitle !== (favorite.title || '');
        const descChanged = newDescription !== (favorite.description || '');
        
        if (titleChanged || descChanged) {
            // Update the last modification date
            const now = new Date().getTime();
            
            // Update the title and description
            const updatedData = {
                ...favorite,
                title: newTitle,
                description: newDescription,
                lastModified: now // Add the last modification date
            };
            
            const success = updateFavorite(favoriteId, updatedData);
            
            if (success) {
                // Update the display of the last modification date in the popup
                const lastModifiedContainer = document.getElementById('details-last-modified-container');
                const lastModifiedContent = document.getElementById('details-last-modified');
                
                if (lastModifiedContainer && lastModifiedContent) {
                    const lastModifiedDate = new Date(now);
                    const formattedLastModified = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
                    lastModifiedContent.textContent = formattedLastModified;
                    lastModifiedContainer.classList.remove('hidden');
                    lastModifiedContainer.classList.add('flex');
                }
                
                // Update the cache to reflect the changes
                FavoritesInit.cachedFavorites = getFavorites();
                // Force a complete refresh of the favorites to ensure persistence
                FavoritesInit.updateFavoriteCache(true);
                
                return true; // Modifications have been made
            }
        }
        
        return false; // No modifications have been made
    },

    /**
     * Display a detailed popup for a favorite
     * @param {Object} favorite 
     */
    showFavoriteDetails(favorite) {
        FavoritesPopups.showFavoriteDetails(favorite, this);
    }
}; 