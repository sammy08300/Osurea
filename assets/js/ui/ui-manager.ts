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
        if (!this.appState || !this.appState.originalValues || typeof this.appState.editingFavoriteId === 'undefined' || this.appState.editingFavoriteId === null) return;

        const formValues = FormManager.getFormValues();
        
        const updatedData: Partial<FavoriteObject> = { // Ensure all fields are optional or provide defaults
            width: !isNaN(formValues.areaWidth!) ? formValues.areaWidth : this.appState.originalValues.width,
            height: !isNaN(formValues.areaHeight!) ? formValues.areaHeight : this.appState.originalValues.height,
            x: !isNaN(formValues.areaOffsetX!) ? formValues.areaOffsetX : this.appState.originalValues.x,
            y: !isNaN(formValues.areaOffsetY!) ? formValues.areaOffsetY : this.appState.originalValues.y,
            ratio: !isNaN(formValues.customRatio!) ? formValues.customRatio : this.appState.originalValues.ratio,
            tabletW: !isNaN(formValues.tabletWidth!) ? formValues.tabletWidth : this.appState.originalValues.tabletW,
            tabletH: !isNaN(formValues.tabletHeight!) ? formValues.tabletHeight : this.appState.originalValues.tabletH,
            presetInfo: formValues.presetInfo || this.appState.originalValues.presetInfo,
            title: this.appState.originalValues.title,
            description: this.appState.originalValues.description,
            radius: !isNaN(formValues.areaRadius) ? formValues.areaRadius : (this.appState.originalValues.radius || 0),
            lastModified: new Date().getTime()
        };
        
        if (typeof FavoritesUI !== 'undefined' && FavoritesUI.updateFavorite) {
            const success = FavoritesUI.updateFavorite(this.appState.editingFavoriteId, updatedData);
            if (success) {
                FavoritesUI.cachedFavorites = null; // Assuming FavoritesUI has this structure
                if (FavoritesUI.loadFavoritesWithAnimation) FavoritesUI.loadFavoritesWithAnimation();
                
                if (FavoritesUI.cancelEditMode) FavoritesUI.cancelEditMode();
                this.appState.cancelEditMode();
                
                if (Notifications) Notifications.success(translateWithFallback('notifications.configurationUpdated', 'Configuration mise à jour'));
            } else if (Notifications) {
                Notifications.error(translateWithFallback('notifications.errorUpdatingConfig', 'Erreur lors de la mise à jour'));
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
        const swapButton = document.getElementById('swap-btn') as HTMLButtonElement | null;
        const centerButton = document.getElementById('center-btn') as HTMLButtonElement | null;
        const copyButton = document.getElementById('copy-btn') as HTMLButtonElement | null;
        const cancelEditBtn = document.getElementById('cancel-edit-btn') as HTMLButtonElement | null;
        
        swapButton?.addEventListener('click', () => {
            this.appState?.cancelEditMode();
            this.handleSwapDimensions();
        });
        
        centerButton?.addEventListener('click', () => {
            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            if (typeof centerArea === 'function') centerArea();
        });
        
        copyButton?.addEventListener('click', () => this.handleCopyInfo());
        cancelEditBtn?.addEventListener('click', () => this.appState?.cancelEditMode());
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
        const elements = FormManager.getFormElements();
        if (!elements.areaWidth || !elements.areaHeight || !elements.areaOffsetX || !elements.areaOffsetY || !elements.areaRadius) return;

        const width = NumberUtils.parseFloatSafe(elements.areaWidth.value);
        const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
        const offsetX = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
        const offsetY = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
        const ratio = (height > 0) ? (width / height).toFixed(3) : 'N/A';
        const areaRadius = parseInt(elements.areaRadius.value) || 0;
        
        const titleLabel = translateWithFallback('summary.currentConfig', '-- Zone Active Réelle --');
        const widthLabel = translateWithFallback('area.width', 'Largeur');
        const heightLabel = translateWithFallback('area.height', 'Hauteur');
        const ratioLabel = translateWithFallback('area.ratio', 'Ratio');
        const centerXLabel = translateWithFallback('area.positionX', 'Centre X');
        const centerYLabel = translateWithFallback('area.positionY', 'Centre Y');
        const borderRadiusLabel = translateWithFallback('area.radius', 'Rayon de la bordure');

        const info = `${titleLabel}\n${widthLabel}: ${NumberUtils.formatNumber(width)} mm\n${heightLabel}: ${NumberUtils.formatNumber(height)} mm\n${ratioLabel}: ${ratio}\n${centerXLabel}: ${NumberUtils.formatNumber(offsetX, 3)} mm\n${centerYLabel}: ${NumberUtils.formatNumber(offsetY, 3)} mm\n${borderRadiusLabel}: ${areaRadius}%`;
        
        DOMUtils.copyToClipboard(info);
        
        if (Notifications) {
            Notifications.success(translateWithFallback('notifications.copiedInfo', 'Information copiée !'));
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
