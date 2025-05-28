// favorite-actions.ts - Module de gestion des actions sur les favoris
import { translateWithFallback } from '../../../js/i18n-init';
import { getFavorites, getFavoriteById, addFavorite, updateFavorite, removeFavorite } from './favorite-storage';
import { FavoritesPopups } from './favorite-popup';
import { FavoritesRendering } from './favorite-rendering';
import { FavoritesInit } from './favorite-init';
import localeManager from '../../../locales';
import { FavoriteObject, FavoritesState } from './types'; // Import types

import { formatNumber, getElement, showNotification, logError } from './favorites-utils';
import { FAVORITES_CONFIG } from './favorites-config';

/**
 * Module of actions on favorites
 */
export const FavoritesActions = {
    editingFavoriteId: null as string | number | null,
    currentDetailedFavoriteId: null as string | number | null,
    autoSaveTimer: null as number | null,
    originalValues: null as Partial<FavoriteObject> | null,

    /**
     * Load a favorite into the main form
     * @param {string|number} id
     */
    loadFavorite(id: string | number): void {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (window.Notifications?.error) {
                window.Notifications.error(localeManager.translate('notifications.favoriteNotFound') || `Favori ID ${id} introuvable`);
            }
            return;
        }
        try {
            (getElement('areaWidth') as HTMLInputElement).value = formatNumber(favorite.width);
            (getElement('areaHeight') as HTMLInputElement).value = formatNumber(favorite.height);
            (getElement('areaOffsetX') as HTMLInputElement).value = formatNumber(favorite.x ?? favorite.offsetX ?? 0, 3);
            (getElement('areaOffsetY') as HTMLInputElement).value = formatNumber(favorite.y ?? favorite.offsetY ?? 0, 3);
            if (favorite.ratio) {
                (getElement('customRatio') as HTMLInputElement).value = formatNumber(favorite.ratio, 3);
            }
            if (typeof favorite.radius !== 'undefined') {
                (getElement('areaRadius') as HTMLInputElement).value = favorite.radius.toString();
                const radiusInput = getElement('radius-input') as HTMLInputElement;
                if (radiusInput) radiusInput.value = favorite.radius.toString();
            }
            
            if (typeof favorite.tabletW !== 'undefined' && typeof favorite.tabletH !== 'undefined') {
                const tabletWidth = getElement('tabletWidth') as HTMLInputElement;
                const tabletHeight = getElement('tabletHeight') as HTMLInputElement;
                
                if (tabletWidth) tabletWidth.value = formatNumber(favorite.tabletW);
                if (tabletHeight) tabletHeight.value = formatNumber(favorite.tabletH);
            }
            
            if (favorite.presetInfo) {
                const tabletSelector = getElement('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText') as HTMLElement;
                    if (selectorText) {
                        if (favorite.presetInfo.startsWith('i18n:')) {
                            const key = favorite.presetInfo.substring(5);
                            selectorText.setAttribute('data-i18n', key);
                            selectorText.textContent = translateWithFallback(key, '');
                        } else {
                            selectorText.removeAttribute('data-i18n');
                            selectorText.textContent = favorite.presetInfo;
                        }
                    }
                }
            }
            
            if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
            
            FavoritesRendering.highlightFavorite(id);
            
            if (window.PreferencesManager?.saveCurrentState) {
                setTimeout(() => window.PreferencesManager!.saveCurrentState(), 100);
            }
            
            if (window.Notifications?.success) {
                window.Notifications.success(localeManager.translate('notifications.configurationLoaded') || 'Configuration chargée');
            }
        } catch (error) {
            console.error('Error loading the favorite:', error);
            if (window.Notifications?.error) {
                window.Notifications.error(localeManager.translate('notifications.errorLoadingConfig') || 'Erreur lors du chargement de la configuration');
            }
        }
    },
    
    /**
     * Start the edition of a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    editFavorite(id: string | number): void {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (window.Notifications?.error) {
                window.Notifications.error(localeManager.translate('notifications.favoriteNotFound') || 'Favori introuvable');
            }
            return;
        }
        
        this.editingFavoriteId = id;
        
        this.originalValues = {
            width: favorite.width,
            height: favorite.height,
            x: favorite.x ?? favorite.offsetX,
            y: favorite.y ?? favorite.offsetY,
            ratio: favorite.ratio,
            tabletW: favorite.tabletW, 
            tabletH: favorite.tabletH,
            presetInfo: favorite.presetInfo,
            title: favorite.title,
            description: favorite.description,
            radius: favorite.radius ?? 0
        };
        
        if (window.appState) {
            window.appState.editingFavoriteId = id;
            window.appState.originalValues = this.originalValues;
        }
        
        const cancelBtn = getElement('cancel-edit-btn') as HTMLButtonElement;
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.classList.add('flex');
            cancelBtn.onclick = () => this.cancelEditMode();
        }
        
        const saveBtn = getElement('save-btn') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span data-i18n="favorites.confirmModification">Confirmer la modification</span>`;
            
            if (localeManager.updatePageTranslations) {
                 localeManager.updatePageTranslations();
            } else {
                const span = saveBtn.querySelector('span[data-i18n]') as HTMLSpanElement;
                if (span) {
                    const key = span.getAttribute('data-i18n');
                    if (key) span.textContent = localeManager.translate(key);
                }
            }
        }
        
        (getElement('areaWidth') as HTMLInputElement).value = formatNumber(favorite.width);
        (getElement('areaHeight') as HTMLInputElement).value = formatNumber(favorite.height);
        (getElement('areaOffsetX') as HTMLInputElement).value = formatNumber(favorite.x ?? favorite.offsetX ?? 0, 3);
        (getElement('areaOffsetY') as HTMLInputElement).value = formatNumber(favorite.y ?? favorite.offsetY ?? 0, 3);
        if (favorite.ratio) {
            (getElement('customRatio') as HTMLInputElement).value = formatNumber(favorite.ratio, 3);
        }
        if (typeof favorite.radius !== 'undefined') {
            (getElement('areaRadius') as HTMLInputElement).value = favorite.radius.toString();
            const radiusInput = getElement('radius-input') as HTMLInputElement;
            if (radiusInput) radiusInput.value = favorite.radius.toString();
        }
        
        if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
        
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`) as HTMLElement;
        if (favoriteElement) {
            favoriteElement.classList.add('border-blue-500', 'highlight-effect');
            setTimeout(() => {
                favoriteElement.classList.remove('highlight-effect');
            }, 1500);
        }
        
        if (window.Notifications?.info) {
            window.Notifications.info(localeManager.translate('notifications.editModeActivated') || 'Mode édition activé - Modifiez les paramètres puis cliquez sur "Confirmer la modification"');
        }
    },

    /**
     * Cancel the edit mode and restore the original values
     * @param {boolean} skipNotification - If true, do not display a notification
     */
    cancelEditMode(skipNotification: boolean = false): void {
        if (!this.editingFavoriteId || !this.originalValues) {
            return;
        }
        
        const previousEditingId = this.editingFavoriteId;
        const original = this.originalValues;
        
        if (original) {
            if (original.width) (getElement('areaWidth') as HTMLInputElement).value = formatNumber(original.width);
            if (original.height) (getElement('areaHeight') as HTMLInputElement).value = formatNumber(original.height);
            if (original.x) (getElement('areaOffsetX') as HTMLInputElement).value = formatNumber(original.x, 3);
            if (original.y) (getElement('areaOffsetY') as HTMLInputElement).value = formatNumber(original.y, 3);
            
            if (original.ratio) {
                (getElement('customRatio') as HTMLInputElement).value = formatNumber(original.ratio, 3);
            }
            
            if (typeof original.radius !== 'undefined') {
                (getElement('areaRadius') as HTMLInputElement).value = original.radius.toString();
                const radiusInput = getElement('radius-input') as HTMLInputElement;
                if (radiusInput) radiusInput.value = original.radius.toString();
            }
            
            if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
        }
        
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${previousEditingId}"]`) as HTMLElement;
        if (favoriteElement) {
            requestAnimationFrame(() => {
                favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
            });
        }
        
        const saveBtn = getElement('save-btn') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span data-i18n="save">Sauvegarder</span>`;
            
            if (localeManager.updatePageTranslations) {
                localeManager.updatePageTranslations();
            } else {
                const span = saveBtn.querySelector('span[data-i18n]') as HTMLSpanElement;
                if (span) {
                    const key = span.getAttribute('data-i18n');
                    if (key) span.textContent = localeManager.translate(key);
                }
            }
        }
        
        const cancelBtn = getElement('cancel-edit-btn') as HTMLButtonElement;
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
            cancelBtn.classList.remove('flex');
        }
        
        this.editingFavoriteId = null;
        this.originalValues = null;
        
        if (window.appState) {
            window.appState.editingFavoriteId = null;
            window.appState.originalValues = null;
        }
        
        if (!skipNotification && window.Notifications?.info) {
            window.Notifications.info(localeManager.translate('notifications.editModeCanceled') || 'Edit mode canceled');
        }
    },

    /**
     * Delete a favorite with confirmation
     * @param {string|number} id
     */
    deleteFavorite(id: string | number): void {
        FavoritesPopups.showDeleteDialog((confirmed: boolean) => {
            if (confirmed) {
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`) as HTMLElement;
                
                if (favoriteElement) {
                    favoriteElement.classList.add('animate-fadeOut');
                    
                    setTimeout(() => {
                        const success = removeFavorite(id);
                        
                        if (success) {
                            if (favoriteElement.parentNode) {
                                favoriteElement.parentNode.removeChild(favoriteElement);
                            }
                            FavoritesInit.updateFavoriteCache(true);
                            
                            if (window.PreferencesManager?.saveCurrentState) {
                                setTimeout(() => window.PreferencesManager!.saveCurrentState(), 100);
                            }
                            
                            if (window.Notifications?.success) {
                                window.Notifications.success(localeManager.translate('notifications.favoriteDeleted') || 'Favori supprimé');
                            }
                        } else {
                            favoriteElement.classList.remove('animate-fadeOut');
                            if (window.Notifications?.error) {
                                window.Notifications.error(localeManager.translate('notifications.errorDeletingFavorite') || 'Erreur lors de la suppression du favori');
                            }
                        }
                    }, 300); 
                } else {
                    const success = removeFavorite(id);
                    if (success) {
                        FavoritesInit.updateFavoriteCache(true);
                        if (window.PreferencesManager?.saveCurrentState) {
                            setTimeout(() => window.PreferencesManager!.saveCurrentState(), 100);
                        }
                        if (window.Notifications?.success) {
                            window.Notifications.success(localeManager.translate('notifications.favoriteDeleted') || 'Favori supprimé');
                        }
                    } else {
                        if (window.Notifications?.error) {
                            window.Notifications.error(localeManager.translate('notifications.errorDeletingFavorite') || 'Erreur lors de la suppression du favori');
                        }
                    }
                }
            }
        });
    },

    /**
     * Save a favorite (add or update depending on the context, with title/description)
     */
    saveFavorite(): void {
        const areaWidth = parseFloat((getElement('areaWidth') as HTMLInputElement).value);
        const areaHeight = parseFloat((getElement('areaHeight') as HTMLInputElement).value);
        const areaOffsetX = parseFloat((getElement('areaOffsetX') as HTMLInputElement).value);
        const areaOffsetY = parseFloat((getElement('areaOffsetY') as HTMLInputElement).value);
        const customRatio = parseFloat((getElement('customRatio') as HTMLInputElement).value);
        const areaRadius = parseInt((getElement('areaRadius') as HTMLInputElement)?.value || '0');
        
        let tabletWidth = 0;
        let tabletHeight = 0;
        let presetInfo: string | null = null;
        
        const tabletWidthElement = getElement('tabletWidth') as HTMLInputElement;
        const tabletHeightElement = getElement('tabletHeight') as HTMLInputElement;
        const tabletSelectorText = getElement('tabletSelectorText') as HTMLElement;
        
        if (tabletWidthElement) tabletWidth = parseFloat(tabletWidthElement.value) || 0;
        if (tabletHeightElement) tabletHeight = parseFloat(tabletHeightElement.value) || 0;
        if (tabletSelectorText) {
            if (tabletSelectorText.hasAttribute('data-i18n')) {
                presetInfo = 'i18n:' + tabletSelectorText.getAttribute('data-i18n');
            } else {
                presetInfo = tabletSelectorText.textContent;
            }
        }
        
        console.log('Saving favorite, edit mode:', !!this.editingFavoriteId);
        
        if (this.editingFavoriteId && this.originalValues) {
            const updatedData: Partial<FavoriteObject> = { // Use Partial for update
                width: !isNaN(areaWidth) ? areaWidth : this.originalValues.width,
                height: !isNaN(areaHeight) ? areaHeight : this.originalValues.height,
                x: !isNaN(areaOffsetX) ? areaOffsetX : this.originalValues.x,
                y: !isNaN(areaOffsetY) ? areaOffsetY : this.originalValues.y,
                ratio: !isNaN(customRatio) ? customRatio : this.originalValues.ratio,
                tabletW: !isNaN(tabletWidth) ? tabletWidth : this.originalValues.tabletW,
                tabletH: !isNaN(tabletHeight) ? tabletHeight : this.originalValues.tabletH,
                presetInfo: presetInfo ?? this.originalValues.presetInfo,
                title: this.originalValues.title,
                description: this.originalValues.description,
                radius: !isNaN(areaRadius) ? areaRadius : (this.originalValues.radius ?? 0),
                lastModified: new Date().getTime()
            };
            
            const success = updateFavorite(this.editingFavoriteId, updatedData);
            if (success) {
                const modifiedFavoriteId = this.editingFavoriteId;
                FavoritesInit.updateFavoriteCache(false);
                this.cancelEditMode(true);
                
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${modifiedFavoriteId}"]`) as HTMLElement;
                if (favoriteElement) {
                    favoriteElement.classList.add('border-blue-500', 'highlight-effect');
                    setTimeout(() => {
                        favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
                    }, 1500);
                }
                if (window.Notifications?.success) {
                    window.Notifications.success(localeManager.translate('notifications.configurationUpdated') || 'Configuration mise à jour');
                }
            } else {
                if (window.Notifications?.error) {
                    window.Notifications.error(localeManager.translate('notifications.errorUpdatingConfig') || 'Erreur lors de la mise à jour de la configuration');
                }
            }
        } else {
            FavoritesPopups.showCommentDialog((commentData: { title: string; description: string }) => {
                if (!commentData.title || commentData.title.trim() === '') {
                    commentData.title = "i18n:favorites.defaultName";
                }
                
                if (!commentData.title.startsWith('i18n:') && commentData.title.length > 32) {
                    if (window.Notifications?.warning) {
                        window.Notifications.warning(localeManager.translate('notifications.titleTruncated') || "Le titre a été tronqué à 32 caractères.");
                    }
                    commentData.title = commentData.title.substring(0, 32);
                }
                
                if (commentData.description && commentData.description.length > 144) {
                     if (window.Notifications?.warning) {
                        window.Notifications.warning(localeManager.translate('notifications.descriptionTruncated') || "La description a été tronquée à 144 caractères.");
                    }
                    commentData.description = commentData.description.substring(0, 144);
                }
                
                const newFavorite: Partial<FavoriteObject> = { // Use Partial for new favorite
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
                
                if (window.StorageManager?.clearCache) {
                    window.StorageManager.clearCache();
                }
                
                const savedFavorite = addFavorite(newFavorite as FavoriteObject); // Cast to FavoriteObject
                if (savedFavorite) {
                    console.log('All favorites after adding:', getFavorites());
                    FavoritesInit.updateFavoriteCache(true);
                    
                    if (window.PreferencesManager?.saveCurrentState) {
                        setTimeout(() => {
                            const allFavs = getFavorites();
                            const favExists = allFavs.some(f => f.id === savedFavorite.id);
                            console.log(`Favorite ${savedFavorite.id} exists before saving prefs: ${favExists}`);
                            window.PreferencesManager!.saveCurrentState();
                        }, 300);
                    }
                    
                    setTimeout(() => {
                        const favoriteElement = document.querySelector(`.favorite-item[data-id="${savedFavorite.id}"]`) as HTMLElement;
                        if (favoriteElement) {
                            favoriteElement.classList.add('highlight-effect');
                            setTimeout(() => {
                                favoriteElement.classList.remove('highlight-effect');
                            }, 2000);
                        }
                    }, 100);
                    
                    if (window.Notifications?.success) {
                        window.Notifications.success(localeManager.translate('notifications.configurationSaved') || 'Configuration sauvegardée');
                    }
                } else {
                    if (window.Notifications?.error) {
                        window.Notifications.error(localeManager.translate('notifications.errorSavingConfig') || 'Erreur lors de la sauvegarde de la configuration');
                    }
                }
            });
        }
    },

    /**
     * Schedule an automatic save after a delay
     */
    scheduleAutoSave(): void {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = window.setTimeout(() => { // Use window.setTimeout for NodeJS compatibility
            const needsUpdate = this.saveChangesIfNeeded();
            if (needsUpdate) {
                FavoritesInit.updateFavoriteCache(true);
            }
        }, 600);
    },
    
    /**
     * Save the modifications made to the favorite fields if necessary
     * @returns {boolean} - true if modifications have been made, false otherwise
     */
    saveChangesIfNeeded(): boolean {
        const favoriteId = this.currentDetailedFavoriteId;
        if (!favoriteId) return false;
        
        const titleInput = getElement('details-title') as HTMLInputElement;
        const descriptionInput = getElement('details-description') as HTMLTextAreaElement;
        
        if (!titleInput || !descriptionInput) return false;
        
        const favorite = getFavoriteById(favoriteId);
        if (!favorite) return false;
        
        const newTitleValue = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        let newTitle = newTitleValue;
        
        const originalTitle = titleInput.dataset.originalTitle;
        if (originalTitle && originalTitle.startsWith('i18n:')) {
            const key = originalTitle.substring(5);
            let currentTranslation = localeManager.translate(key) || translateWithFallback(key, '');
            
            if (currentTranslation === newTitleValue || newTitleValue === key) {
                newTitle = originalTitle;
            } else if (key === 'favorites.defaultName') {
                const defaultTranslations = ['Configuration sauvegardée', 'Saved configuration', 'Configuración guardada'];
                if (defaultTranslations.includes(newTitleValue)) {
                    newTitle = 'i18n:favorites.defaultName';
                }
            }
        }
        
        const titleChanged = newTitle !== (favorite.title || '');
        const descChanged = newDescription !== (favorite.description || '');
        
        if (titleChanged || descChanged) {
            const now = new Date().getTime();
            const updatedData: Partial<FavoriteObject> = { // Use Partial for update
                ...favorite,
                title: newTitle,
                description: newDescription,
                lastModified: now
            };
            
            const success = updateFavorite(favoriteId, updatedData);
            
            if (success) {
                const lastModifiedContainer = getElement('details-last-modified-container');
                const lastModifiedContent = getElement('details-last-modified');
                
                if (lastModifiedContainer && lastModifiedContent) {
                    const lastModifiedDate = new Date(now);
                    lastModifiedContent.textContent = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
                    lastModifiedContainer.classList.remove('hidden');
                    lastModifiedContainer.classList.add('flex');
                }
                
                FavoritesInit.cachedFavorites = getFavorites();
                FavoritesInit.updateFavoriteCache(true);
                return true; 
            }
        }
        return false; 
    },

    /**
     * Display a detailed popup for a favorite
     * @param {FavoriteObject} favorite 
     */
    showFavoriteDetails(favorite: FavoriteObject): void {
        FavoritesPopups.showFavoriteDetails(favorite, this);
    }
};