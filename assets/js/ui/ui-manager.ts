/**
 * UI Manager module for handling UI components and events
 */
import { FormManager } from './form-manager';
import { NumberUtils } from '../utils/number-utils';
import { DOMUtils } from '../utils/dom-utils';
import { FavoritesUI } from '../components/favorites/favoritesindex'; // Assuming .ts extension
import { translateWithFallback } from '../i18n-init';
import { FavoriteObject } from '../components/favorites/types'; // Import FavoriteObject

// Define types for global objects/functions if they are expected
declare function updateDisplay(): void;
declare function updateDisplayWithoutRatio(): void;
declare function centerArea(): void;

interface AppState {
    editingFavoriteId?: string | number | null;
    originalValues?: Partial<FavoriteObject>; // Using Partial as not all values might be present
    currentRatio?: number;
    cancelEditMode: () => void;
    debouncedUpdateRatio: () => void;
    // Add other appState properties if known
}

interface NotificationsGlobal {
    success: (message: string) => void;
    error: (message: string) => void;
    // Add other notification types if they exist
}
declare const Notifications: NotificationsGlobal | undefined; // Or window.Notifications

interface PreferencesManagerGlobal {
    showResetConfirmation: (callback: (confirmed: boolean) => void) => void;
    resetPreferences: () => void;
    saveCurrentState: () => void;
}
declare const PreferencesManager: PreferencesManagerGlobal | undefined; // Or window.PreferencesManager


export const UIManager = {
    appState: null as AppState | null,
    
    init(appState: AppState): void {
        this.appState = appState;
        this.setupSaveButton();
        this.setupActionButtons();
        this.setupPreferencesReset();
    },
    
    updateEditModeUI(isEditing: boolean): void {
        const saveBtn = document.getElementById('save-btn') as HTMLButtonElement | null;
        const cancelEditBtn = document.getElementById('cancel-edit-btn') as HTMLButtonElement | null;
        
        if (!saveBtn || !cancelEditBtn) return;
        
        const saveSpan = saveBtn.querySelector('span[data-i18n]') as HTMLSpanElement | null;

        if (isEditing) {
            const updateText = translateWithFallback('favorites.confirmModification', "Mettre à Jour");
            if (saveSpan) {
                saveSpan.textContent = updateText;
                saveSpan.setAttribute('data-i18n', 'favorites.confirmModification');
            } else {
                saveBtn.textContent = updateText;
            }
            saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
            saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
            cancelEditBtn.classList.remove('hidden');
            cancelEditBtn.classList.add('flex'); // Ensure it's visible if flex is used
        } else {
            const saveText = translateWithFallback('favorites.saveButton', "Sauvegarder");
            if (saveSpan) {
                saveSpan.textContent = saveText;
                saveSpan.setAttribute('data-i18n', 'favorites.saveButton');
            } else {
                saveBtn.textContent = saveText;
            }
            saveBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
            saveBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
            cancelEditBtn.classList.add('hidden');
            cancelEditBtn.classList.remove('flex');
        }
    },
    
    setupSaveButton(): void {
        const saveButton = document.getElementById('save-btn') as HTMLButtonElement | null;
        if (!saveButton) return;
        
        saveButton.addEventListener('click', () => {
            if (this.appState?.editingFavoriteId) {
                this.handleUpdateFavorite();
            } else {
                this.handleSaveFavorite();
            }
        });
    },
    
    handleUpdateFavorite(): void {
        if (!this.appState || this.appState.editingFavoriteId === null) {
            console.warn('No favorite is being edited.');
            return;
        }

        const updatedData = FormManager.getFormValues();
        const favoriteId = this.appState.editingFavoriteId;

        if (favoriteId === undefined) {
            console.warn('Favorite ID is undefined.');
            return;
        }

        if (typeof window.FavoritesUI?.updateFavorite === 'function') {
            const success = window.FavoritesUI.updateFavorite(favoriteId, updatedData);
            if (success) {
                if (Notifications && typeof Notifications.success === 'function') {
                    Notifications.success(
                        window.translateWithFallback ?
                        window.translateWithFallback('notifications.favoriteUpdated', 'Favorite updated successfully!') :
                        'Favorite updated successfully!'
                    );
                }
                this.updateEditModeUI(false);
                if (typeof updateDisplay === 'function') {
                    updateDisplay();
                }
            } else {
                if (Notifications && typeof Notifications.error === 'function') {
                    Notifications.error(
                        window.translateWithFallback ?
                        window.translateWithFallback('notifications.favoriteUpdateError', 'Failed to update favorite.') :
                        'Failed to update favorite.'
                    );
                }
            }
        } else {
            if (Notifications && typeof Notifications.error === 'function') {
                Notifications.error('Update function not available.');
            }
        }
    },
    
    handleSaveFavorite(): void {
        if (typeof FavoritesUI !== 'undefined' && FavoritesUI.saveFavorite) {
            FavoritesUI.saveFavorite();
        } else {
            console.error('FavoritesUI or saveFavorite method is not available');
        }
    },
    
    setupActionButtons(): void {
        const swapButton = document.getElementById('swap-dimensions-btn');
        const copyInfoButton = document.getElementById('copy-info-btn');
        const centerAreaButton = document.getElementById('center-area-btn');

        if (swapButton) {
            swapButton.addEventListener('click', () => this.handleSwapDimensions());
        }
        if (copyInfoButton) {
            copyInfoButton.addEventListener('click', () => this.handleCopyInfo());
        }

        if (centerAreaButton && typeof centerArea === 'function') {
            centerAreaButton.addEventListener('click', centerArea);
        } else if (centerAreaButton) {
            centerAreaButton.addEventListener('click', () => {
                if (typeof window.centerArea === 'function') {
                    window.centerArea();
                } else {
                    console.warn('centerArea function not found on window.');
                }
            });
        }
    },
    
    handleSwapDimensions(): void {
        const elements = FormManager.getFormElements();
        if (!elements.areaWidth || !elements.areaHeight || !elements.lockRatio || !elements.customRatio || !this.appState) return;

        const width = elements.areaWidth.value;
        elements.areaWidth.value = elements.areaHeight.value;
        elements.areaHeight.value = width;
        
        if (elements.lockRatio.getAttribute('aria-pressed') === 'true') {
            const newWidth = NumberUtils.parseFloatSafe(elements.areaWidth.value);
            const newHeight = NumberUtils.parseFloatSafe(elements.areaHeight.value);
            if (newHeight > 0 && newWidth > 0) {
                this.appState.currentRatio = newWidth / newHeight;
                elements.customRatio.value = NumberUtils.formatNumber(this.appState.currentRatio, 3);
            }
            if (typeof updateDisplay === 'function') updateDisplay();
        } else {
            this.appState.debouncedUpdateRatio();
            if (typeof updateDisplayWithoutRatio === 'function') updateDisplayWithoutRatio();
        }
    },
    
    handleCopyInfo(): void {
        const formValues = FormManager.getFormValues();
        const recapText = `
            Tablet: ${formValues.presetInfo || 'Custom'}
            Area: ${formValues.areaWidth}x${formValues.areaHeight} mm
            Offset: X=${formValues.areaOffsetX}, Y=${formValues.areaOffsetY} mm
            Ratio: ${formValues.customRatio ? formValues.customRatio.toFixed(3) : 'N/A'}
            Radius: ${formValues.areaRadius}%
        `.trim().replace(/^ +/gm, '');

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(recapText)
                .then(() => {
                    if (Notifications && typeof Notifications.success === 'function') {
                        Notifications.success(
                            window.translateWithFallback ?
                            window.translateWithFallback('notifications.copiedSuccess', 'Information copied!') :
                            'Information copied!'
                        );
                    }
                })
                .catch(err => {
                    console.error('Failed to copy info:', err);
                    if (Notifications && typeof Notifications.error === 'function') {
                        Notifications.error(
                            window.translateWithFallback ?
                            window.translateWithFallback('notifications.copiedError', 'Could not copy information.') :
                            'Could not copy information.'
                        );
                    }
                });
        } else if (Notifications && typeof Notifications.error === 'function') {
             Notifications.error(
                window.translateWithFallback ?
                window.translateWithFallback('notifications.clipboardUnavailable', 'Clipboard API not available.') :
                'Clipboard API not available.'
             );
        }
    },
    
    setupPreferencesReset(): void {
        const resetPrefsBtn = document.getElementById('reset-prefs-btn') as HTMLButtonElement | null;
        if (resetPrefsBtn && typeof PreferencesManager !== 'undefined') {
            resetPrefsBtn.addEventListener('click', () => {
                PreferencesManager.showResetConfirmation((confirmed: boolean) => {
                    if (confirmed) PreferencesManager.resetPreferences();
                });
            });
        }
    }
};
