/**
 * UI Manager module for handling UI components and events
 */
import { FormManager } from './form-manager.js';
import { NumberUtils } from '../utils/number-utils.js';
import { DOMUtils } from '../utils/dom-utils.js';
import { FavoritesUI } from '../components/favorites/favoritesindex.js';
import { translateWithFallback } from '../i18n-init.js';

export const UIManager = {
    appState: null,
    
    /**
     * Initialize UI manager
     * @param {Object} appState - Application state reference
     */
    init(appState) {
        this.appState = appState;
        this.setupSaveButton();
        this.setupActionButtons();
        this.setupPreferencesReset();
    },
    
    /**
     * Update the UI elements for edit mode
     * @param {boolean} isEditing - Whether we're in edit mode
     */
    updateEditModeUI(isEditing) {
        const saveBtn = document.getElementById('save-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        if (!saveBtn || !cancelEditBtn) return;
        
        if (isEditing) {
            // Update button styling for edit mode
            const updateText = translateWithFallback('favorites.confirmModification') || "Mettre à Jour";
            const saveSpan = saveBtn.querySelector('span[data-i18n]');
            if (saveSpan) {
                saveSpan.textContent = updateText;
                saveSpan.setAttribute('data-i18n', 'favorites.confirmModification');
            } else {
                saveBtn.textContent = updateText;
            }
            
            saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
            saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
            cancelEditBtn.classList.remove('hidden');
        } else {
            // Reset to default styling
            const saveText = translateWithFallback('favorites.saveButton') || "Sauvegarder";
            const saveSpan = saveBtn.querySelector('span[data-i18n]');
            if (saveSpan) {
                saveSpan.textContent = saveText;
                saveSpan.setAttribute('data-i18n', 'favorites.saveButton');
            } else {
                saveBtn.textContent = saveText;
            }
            
            saveBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
            saveBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
            
            // Hide the cancel button
            cancelEditBtn.classList.add('hidden');
            cancelEditBtn.classList.remove('flex');
        }
    },
    
    /**
     * Setup the save button event handler
     */
    setupSaveButton() {
        const saveButton = document.getElementById('save-btn');
        if (!saveButton) return;
        
        saveButton.addEventListener('click', () => {
            // Check if we're in edit mode
            if (this.appState.editingFavoriteId) {
                this.handleUpdateFavorite();
            } else {
                this.handleSaveFavorite();
            }
        });
    },
    
    /**
     * Handle updating an existing favorite
     */
    handleUpdateFavorite() {
        // Get form values
        const elements = FormManager.getFormElements();
        const formValues = FormManager.getFormValues();
        
        // Create update object
        const updatedData = {
            width: !isNaN(formValues.areaWidth) ? formValues.areaWidth : this.appState.originalValues.width,
            height: !isNaN(formValues.areaHeight) ? formValues.areaHeight : this.appState.originalValues.height,
            x: !isNaN(formValues.areaOffsetX) ? formValues.areaOffsetX : this.appState.originalValues.x,
            y: !isNaN(formValues.areaOffsetY) ? formValues.areaOffsetY : this.appState.originalValues.y,
            ratio: !isNaN(formValues.customRatio) ? formValues.customRatio : this.appState.originalValues.ratio,
            tabletW: !isNaN(formValues.tabletWidth) ? formValues.tabletWidth : this.appState.originalValues.tabletW,
            tabletH: !isNaN(formValues.tabletHeight) ? formValues.tabletHeight : this.appState.originalValues.tabletH,
            presetInfo: formValues.presetInfo || this.appState.originalValues.presetInfo,
            title: this.appState.originalValues.title,
            description: this.appState.originalValues.description,
            radius: !isNaN(formValues.areaRadius) ? formValues.areaRadius : (this.appState.originalValues.radius || 0),
            lastModified: new Date().getTime()
        };
        
        // Update the favorite
        if (typeof FavoritesUI !== 'undefined' && typeof FavoritesUI.updateFavorite === 'function') {
            const success = FavoritesUI.updateFavorite(this.appState.editingFavoriteId, updatedData);
            
            if (success) {
                // Refresh favorites list
                FavoritesUI.cachedFavorites = null;
                FavoritesUI.loadFavoritesWithAnimation();
                
                // Cancel edit mode
                if (typeof FavoritesUI.cancelEditMode === 'function') {
                    FavoritesUI.cancelEditMode();
                }
                this.appState.cancelEditMode();
                
                // Notification with proper translation key
                if (typeof Notifications !== 'undefined') {
                    Notifications.success(translateWithFallback('notifications.configurationUpdated') || 'Configuration mise à jour');
                }
            } else if (typeof Notifications !== 'undefined') {
                Notifications.error(translateWithFallback('notifications.errorUpdatingConfig') || 'Erreur lors de la mise à jour de la configuration');
            }
        }
    },
    
    /**
     * Handle saving a new favorite
     */
    handleSaveFavorite() {
        if (typeof FavoritesUI !== 'undefined' && typeof FavoritesUI.saveFavorite === 'function') {
            FavoritesUI.saveFavorite();
        } else {
            console.error('FavoritesUI ou sa méthode saveFavorite n\'est pas disponible');
        }
    },
    
    /**
     * Setup all action buttons (swap, center, copy, etc.)
     */
    setupActionButtons() {
        // Get button elements
        const swapButton = document.getElementById('swap-btn');
        const centerButton = document.getElementById('center-btn');
        const copyButton = document.getElementById('copy-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        // Swap button handler
        if (swapButton) {
            swapButton.addEventListener('click', () => {
                this.appState.cancelEditMode();
                this.handleSwapDimensions();
            });
        }
        
        // Center button handler
        if (centerButton) {
            centerButton.addEventListener('click', () => {
                if (!this.appState.editingFavoriteId) {
                    this.appState.cancelEditMode();
                }
                if (typeof centerArea === 'function') {
                    centerArea();
                }
            });
        }
        
        // Copy button handler
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.handleCopyInfo();
            });
        }
        
        // Cancel edit button handler
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.appState.cancelEditMode();
            });
        }
    },
    
    /**
     * Handle swapping width and height dimensions
     */
    handleSwapDimensions() {
        const elements = FormManager.getFormElements();
        
        // Swap width and height with proper formatting
        const width = NumberUtils.parseFloatSafe(elements.areaWidth.value);
        const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
        elements.areaWidth.value = NumberUtils.formatNumber(height, 3);
        elements.areaHeight.value = NumberUtils.formatNumber(width, 3);
        
        // If the lock is activated, update the ratio immediately
        if (elements.lockRatio && elements.lockRatio.getAttribute('aria-pressed') === 'true') {
            const newWidth = NumberUtils.parseFloatSafe(elements.areaWidth.value);
            const newHeight = NumberUtils.parseFloatSafe(elements.areaHeight.value);
            
            if (newHeight > 0 && newWidth > 0) {
                this.appState.currentRatio = newWidth / newHeight;
                elements.customRatio.value = NumberUtils.formatNumber(this.appState.currentRatio, 3);
            }
            updateDisplay();
        } else {
            // Otherwise use the debounced function and update the display without the ratio
            this.appState.debouncedUpdateRatio();
            updateDisplayWithoutRatio();
        }
    },
    
    /**
     * Handle copying area information to clipboard
     */
    handleCopyInfo() {
        const elements = FormManager.getFormElements();
        
        const width = NumberUtils.parseFloatSafe(elements.areaWidth.value);
        const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
        const offsetX = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
        const offsetY = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
        const ratio = (height > 0) ? (width / height).toFixed(3) : 'N/A';
        const areaRadius = parseInt(elements.areaRadius?.value) || 0;
        
        // Traductions des labels
        const titleLabel = translateWithFallback('summary.currentConfig') || '-- Zone Active Réelle --';
        const widthLabel = translateWithFallback('area.width') || 'Largeur';
        const heightLabel = translateWithFallback('area.height') || 'Hauteur';
        const ratioLabel = translateWithFallback('area.ratio') || 'Ratio';
        const centerXLabel = translateWithFallback('area.positionX') || 'Centre X';
        const centerYLabel = translateWithFallback('area.positionY') || 'Centre Y';
        const borderRadiusLabel = translateWithFallback('area.radius') || 'Rayon de la bordure';

        const info = `${titleLabel}\n${widthLabel}: ${NumberUtils.formatNumber(width, 3)} mm\n${heightLabel}: ${NumberUtils.formatNumber(height, 3)} mm\n${ratioLabel}: ${ratio}\n${centerXLabel}: ${NumberUtils.formatNumber(offsetX, 3)} mm\n${centerYLabel}: ${NumberUtils.formatNumber(offsetY, 3)} mm\n${borderRadiusLabel}: ${areaRadius}%`;
        
        DOMUtils.copyToClipboard(info);
        
        // Show notification with proper translation key
        if (typeof Notifications !== 'undefined') {
            Notifications.success(translateWithFallback('notifications.copiedInfo') || 'Information copiée !');
        }
    },
    
    /**
     * Setup preferences reset button
     */
    setupPreferencesReset() {
        const resetPrefsBtn = document.getElementById('reset-prefs-btn');
        if (resetPrefsBtn && typeof PreferencesManager !== 'undefined') {
            resetPrefsBtn.addEventListener('click', () => {
                PreferencesManager.showResetConfirmation((confirmed) => {
                    if (confirmed) {
                        PreferencesManager.resetPreferences();
                    }
                });
            });
        }
    }
}; 
