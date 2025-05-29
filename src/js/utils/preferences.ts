/**
 * User preferences management module 
 * Automatically saves the application state with LocalStorage
 */
import { parseFloatSafe, formatNumber, isValidNumber } from './number-utils.js';

// Assume StorageManager and TabletSelector will be typed eventually or handled via 'any'
declare var StorageManager: any; // Placeholder for actual StorageManager type
declare var TabletSelector: any; // Placeholder for actual TabletSelector type
declare var Notifications: any; // Placeholder for Notifications global

interface TabletPreference {
    width: number;
    height: number;
    model: string;
    isCustom: boolean;
    brand: string;
}

interface AreaPreference {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    ratio: number;
    lockRatio: boolean;
    radius: number;
}

interface PreferenceData {
    tablet?: TabletPreference;
    area?: AreaPreference;
    timestamp?: number;
    lastLoadedFavoriteId?: string; 
}

type ResetConfirmCallback = (confirmed: boolean) => void;

export const PreferencesManager = {
    PREFERENCES_KEY: 'Osu!reaPreferences_v2',
    DEBUG_LOGS: false,
    
    _preferences: null as PreferenceData | null,
    _resetConfirmCallback: null as ResetConfirmCallback | null,
    _lastSavedState: null as string | null,
    _hasChanges: false as boolean,
    
    init(): void {
        this._preferences = this.loadPreferences();
        this._cleanupFavoriteReferences();
        this.createResetDialog();
        this.applyPreferences();
        this.setupEventListeners();
        this._initializeLastSavedState();
        console.log('Preferences manager initialized (optimized saving enabled)');
    },
    
    _cleanupFavoriteReferences(): void {
        if (!this._preferences || !this._preferences.lastLoadedFavoriteId) return;
        
        const win = window as any;
        if (typeof win.StorageManager === 'undefined' || !this._preferences.lastLoadedFavoriteId) {
            return;
        }
        
        console.log(`Checking favorite references: ${this._preferences.lastLoadedFavoriteId}`);
        
        if (win.StorageManager.getFavoriteById && 
            !win.StorageManager.getFavoriteById(this._preferences.lastLoadedFavoriteId)) {
            console.log(`Removing reference to favorite ${this._preferences.lastLoadedFavoriteId} (deleted)`);
            delete this._preferences.lastLoadedFavoriteId;
            this.savePreferences(this._preferences); // Save after modification
        }
    },
    
    createResetDialog(): void {
        if (document.getElementById('reset-prefs-dialog')) return;
        
        const resetDialog = document.createElement('div');
        resetDialog.id = 'reset-prefs-dialog';
        resetDialog.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 hidden';
        resetDialog.innerHTML = this._getResetDialogHTML();
        
        document.body.appendChild(resetDialog);
        this._setupResetDialogListeners();
    },
    
    _getResetDialogHTML(): string {
        return `
            <div class="bg-gray-900 rounded-lg p-6 shadow-xl max-w-md w-full border border-gray-700">
                <h3 class="text-lg font-medium text-white mb-4">Reset Confirmation</h3>
                <p class="text-gray-300 text-sm mb-4">Are you sure you want to reset all your preferences? This action is irreversible and the page will be reloaded.</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-reset-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">Cancel</button>
                    <button id="confirm-reset-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">Reset</button>
                </div>
            </div>
        `;
    },
    
    _setupResetDialogListeners(): void {
        const cancelResetBtn = document.getElementById('cancel-reset-btn');
        const confirmResetBtn = document.getElementById('confirm-reset-btn');
        
        if (cancelResetBtn) cancelResetBtn.addEventListener('click', () => this._handleResetDialogResponse(false));
        if (confirmResetBtn) confirmResetBtn.addEventListener('click', () => this._handleResetDialogResponse(true));
    },
    
    _handleResetDialogResponse(confirmed: boolean): void {
        const resetDialog = document.getElementById('reset-prefs-dialog');
        if (resetDialog) resetDialog.classList.add('hidden');
        
        if (this._resetConfirmCallback) {
            this._resetConfirmCallback(confirmed);
            this._resetConfirmCallback = null;
        }
    },
    
    showResetConfirmation(callback: ResetConfirmCallback): void {
        const resetDialog = document.getElementById('reset-prefs-dialog');
        
        if (!resetDialog) {
            console.error("Reset dialog element not found");
            if (confirm('Are you sure you want to reset all your preferences? This action is irreversible.')) {
                callback(true);
            }
            return;
        }
        
        this._resetConfirmCallback = callback;
        
        resetDialog.classList.remove('hidden');
        resetDialog.classList.add('flex');
    },
    
    setupEventListeners(): void {
        this._setupInputListeners();
        this._setupCustomEventListeners();
        this._setupPeriodicSave();
    },
    
    _setupInputListeners(): void {
        ['tabletWidth', 'tabletHeight', 'areaWidth', 'areaHeight', 'areaOffsetX', 'areaOffsetY', 'customRatio'].forEach(id => 
            this._addChangeAndInputListeners(id)
        );
        
        const lockRatioCheckbox = document.getElementById('lockRatio');
        if (lockRatioCheckbox) {
            const handler = () => {
                this.markChanges();
                setTimeout(() => this.saveCurrentState(), 100);
            };
            lockRatioCheckbox.addEventListener('change', handler);
            lockRatioCheckbox.addEventListener('click', handler);
        }
    },
    
    _addChangeAndInputListeners(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', () => {
                this.markChanges();
                setTimeout(() => this.saveCurrentState(), 100);
            });
            element.addEventListener('input', () => this.markChanges());
        }
    },
    
    _setupCustomEventListeners(): void {
        document.addEventListener('tablet:selected', (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.tablet) {
                this.markChanges();
                setTimeout(() => this.saveCurrentState(), 100);
            }
        });
        
        document.addEventListener('tablet:custom', () => {
            this.markChanges();
            setTimeout(() => this.saveCurrentState(), 100);
        });
        
        ['activearea:positioned', 'activearea:moved', 'activearea:centered'].forEach(event => {
            document.addEventListener(event, () => {
                this.markChanges();
                setTimeout(() => this.saveCurrentState(), 100);
            });
        });
    },
    
    _setupPeriodicSave(): void {
        setInterval(() => this.saveCurrentStateIfChanged(), 10000);
        window.addEventListener('beforeunload', () => this.saveCurrentState());
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                this.saveCurrentState();
            }
        });
    },
    
    loadPreferences(): PreferenceData {
        try {
            const storedPrefs = localStorage.getItem(this.PREFERENCES_KEY);
            if (storedPrefs) return JSON.parse(storedPrefs) as PreferenceData;
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
        return {};
    },
    
    savePreferences(preferences: PreferenceData | null): void {
        if (!preferences) return;
        try {
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
            this._preferences = preferences; // Update internal state
        } catch (error: any) {
            console.error('Error saving preferences:', error.message);
            const win = window as any;
            if (typeof win.Notifications !== 'undefined' && win.Notifications.error) {
                const msg = typeof win.translateWithFallback === 'function' ? 
                            win.translateWithFallback('notifications.errorSavingPreferences') : 
                            'Unable to save your preferences';
                win.Notifications.error(msg);
            }
        }
    },
    
    saveCurrentState(): void {
        const preferences: PreferenceData = {
            tablet: this._collectTabletSettings(),
            area: this._collectAreaSettings(),
            timestamp: Date.now(),
            lastLoadedFavoriteId: this._preferences?.lastLoadedFavoriteId // Preserve if exists
        };
        
        const win = window as any;
        if (preferences.lastLoadedFavoriteId && typeof win.StorageManager !== 'undefined') {
            if (!win.StorageManager.getFavoriteById || !win.StorageManager.getFavoriteById(preferences.lastLoadedFavoriteId)) {
                delete preferences.lastLoadedFavoriteId;
            }
        }
        
        this._validatePreferences(preferences);
        this.savePreferences(preferences);
        this._lastSavedState = JSON.stringify(preferences); // Update after successful save
        this._hasChanges = false;
        
        if (this.DEBUG_LOGS) console.log('Preferences saved:', preferences);
    },

    saveCurrentStateIfChanged(): void {
        const currentState: PreferenceData = {
            tablet: this._collectTabletSettings(),
            area: this._collectAreaSettings(),
            timestamp: Date.now(), // Timestamp will always change; compare content
            lastLoadedFavoriteId: this._preferences?.lastLoadedFavoriteId // Preserve if exists
        };
         const win = window as any;
        if (currentState.lastLoadedFavoriteId && typeof win.StorageManager !== 'undefined') {
            if (!win.StorageManager.getFavoriteById || !win.StorageManager.getFavoriteById(currentState.lastLoadedFavoriteId)) {
                delete currentState.lastLoadedFavoriteId;
            }
        }
        
        this._validatePreferences(currentState);
        
        const currentStateForComparison: Partial<PreferenceData> = { ...currentState };
        delete currentStateForComparison.timestamp;
        
        const lastStateForComparison: Partial<PreferenceData> | null = this._lastSavedState ? 
            (() => {
                const parsed = JSON.parse(this._lastSavedState!) as PreferenceData;
                delete parsed.timestamp;
                return parsed;
            })() : null;
        
        const currentStateString = JSON.stringify(currentStateForComparison);
        const lastStateString = lastStateForComparison ? JSON.stringify(lastStateForComparison) : null;
        
        if (currentStateString !== lastStateString) {
            this.savePreferences(currentState); // Save the full currentState with new timestamp
            // this._lastSavedState is updated by savePreferences through this.savePreferences(preferences)
            if (this.DEBUG_LOGS) console.log('Preferences saved (changes detected):', currentState);
        }
    },

    markChanges(): void {
        this._hasChanges = true;
    },

    _initializeLastSavedState(): void {
        const currentState: PreferenceData = {
            tablet: this._collectTabletSettings(),
            area: this._collectAreaSettings(),
            timestamp: Date.now(),
            lastLoadedFavoriteId: this._preferences?.lastLoadedFavoriteId
        };
        this._validatePreferences(currentState);
        this._lastSavedState = JSON.stringify(currentState);
        this._hasChanges = false;
    },
    
    _collectTabletSettings(): TabletPreference {
        const getElementValue = (id: string): string | undefined => (document.getElementById(id) as HTMLInputElement | null)?.value;
        const getElementText = (id: string): string | undefined => document.getElementById(id)?.textContent?.trim();
        const getElementDataset = (id: string, dataKey: string): string | undefined => (document.getElementById(id) as HTMLElement | null)?.dataset[dataKey];

        return {
            width: parseFloatSafe(getElementValue('tabletWidth')),
            height: parseFloatSafe(getElementValue('tabletHeight')),
            model: getElementText('tabletSelectorText') || 'Select a model',
            isCustom: document.getElementById('tablet-dimensions-container')?.classList.contains('hidden') === false,
            brand: getElementDataset('tabletSelectorButton', 'tabletBrand') || ''
        };
    },
    
    _collectAreaSettings(): AreaPreference {
        const getElementValue = (id: string): string | undefined => (document.getElementById(id) as HTMLInputElement | null)?.value;
        const getElementAttr = (id: string, attr: string): string | null | undefined => document.getElementById(id)?.getAttribute(attr);

        return {
            width: parseFloatSafe(getElementValue('areaWidth')),
            height: parseFloatSafe(getElementValue('areaHeight')),
            offsetX: parseFloatSafe(getElementValue('areaOffsetX')),
            offsetY: parseFloatSafe(getElementValue('areaOffsetY')),
            ratio: parseFloatSafe(getElementValue('customRatio')),
            lockRatio: getElementAttr('lockRatio', 'aria-pressed') === 'true' || false,
            radius: parseInt(getElementValue('areaRadius') || '0') || 0
        };
    },
    
    _validatePreferences(preferences: PreferenceData): void {
        if (preferences.area) {
            if (preferences.area.width <= 0) preferences.area.width = 1;
            if (preferences.area.height <= 0) preferences.area.height = 1;
            if (preferences.area.ratio <= 0) preferences.area.ratio = 1;
        }
        if (preferences.tablet) {
            if (preferences.tablet.width <= 0) preferences.tablet.width = 1;
            if (preferences.tablet.height <= 0) preferences.tablet.height = 1;
        }
    },
    
    applyPreferences(): void {
        if (!this._preferences || Object.keys(this._preferences).length === 0) return;
        try {
            if (this._preferences.tablet) this._applyTabletPreferences(this._preferences.tablet);
            if (this._preferences.area) this._applyAreaPreferences(this._preferences.area);
            this._updateUIAfterApplyingPreferences();
        } catch (error: any) {
            console.error('Error applying preferences:', error.message);
        }
    },
    
    _applyTabletPreferences(tablet: TabletPreference): void {
        const tabletWidthEl = document.getElementById('tabletWidth') as HTMLInputElement | null;
        const tabletHeightEl = document.getElementById('tabletHeight') as HTMLInputElement | null;

        if (isValidNumber(tablet.width) && isValidNumber(tablet.height)) {
            if (tabletWidthEl) tabletWidthEl.value = formatNumber(tablet.width);
            if (tabletHeightEl) tabletHeightEl.value = formatNumber(tablet.height);
        }
        
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        if (tabletDimensionsContainer) tabletDimensionsContainer.classList.toggle('hidden', !tablet.isCustom);
        
        const win = window as any;
        if (tablet.model && tablet.brand && typeof win.TabletSelector !== 'undefined') {
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('preferences:loadTablet', { detail: tablet }));
            }, 100);
        }
    },
    
    _applyAreaPreferences(area: AreaPreference): void {
        const areaFields: { [id: string]: [number | undefined, number] } = {
            'areaWidth': [area.width, 1], 'areaHeight': [area.height, 1],
            'areaOffsetX': [area.offsetX, 3], 'areaOffsetY': [area.offsetY, 3],
            'customRatio': [area.ratio, 3]
        };
        
        Object.entries(areaFields).forEach(([id, [value, precision]]) => {
            if (value !== undefined && isValidNumber(value)) {
                const el = document.getElementById(id) as HTMLInputElement | null;
                if (el) el.value = formatNumber(value, precision);
            }
        });
        
        this._applyLockRatio(area.lockRatio);
        if (typeof area.radius !== 'undefined') this._applyRadius(area.radius);
    },
    
    _applyLockRatio(locked: boolean): void {
        const lockRatioButton = document.getElementById('lockRatio');
        if (lockRatioButton) {
            lockRatioButton.setAttribute('aria-pressed', String(locked));
            const indicator = document.getElementById('lockRatioIndicator')?.firstElementChild as HTMLElement | null;
            if (indicator) indicator.style.transform = locked ? 'scale(1)' : 'scale(0)';
        }
    },
    
    _applyRadius(radius: number): void {
        const radiusElement = document.getElementById('areaRadius') as HTMLInputElement | null;
        const win = window as any;
        if (radiusElement) {
            radiusElement.value = String(radius);
            if (typeof win.currentRadius !== 'undefined') win.currentRadius = radius;
            
            const radiusInput = document.getElementById('radius-input') as HTMLInputElement | null;
            if (radiusInput) radiusInput.value = String(radius);
            
            if (typeof win.updateSliderProgress === 'function') {
                win.updateSliderProgress();
            } else {
                const value = parseFloat(radiusElement.value);
                const max = parseFloat(radiusElement.max);
                if (!isNaN(value) && !isNaN(max) && max !== 0) {
                    const percentage = (value / max) * 100;
                    radiusElement.style.setProperty('--range-progress', `${percentage}%`);
                }
            }
        }
    },
    
    _updateUIAfterApplyingPreferences(): void {
        const win = window as any;
        if (typeof win.updateDisplay === 'function') win.updateDisplay();
        
        setTimeout(() => {
            if (typeof win.Notifications !== 'undefined' && win.Notifications.info) {
                const message = this._getRestorationMessage();
                win.Notifications.info(message);
            }
        }, 1000);
    },
    
    _getRestorationMessage(): string {
        const timestamp = this._preferences?.timestamp;
        if (!timestamp) return 'Configuration restored';
        
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Configuration from ${formattedDate} at ${formattedTime} restored`;
    },
    
    resetPreferences(): void {
        try {
            localStorage.removeItem(this.PREFERENCES_KEY);
            this._preferences = {}; // Reset internal state
            const win = window as any;
            if (typeof win.Notifications !== 'undefined' && win.Notifications.success) {
                 const msg = typeof win.translateWithFallback === 'function' ? 
                            win.translateWithFallback('notifications.preferencesReset') : 
                            'Preferences reset';
                win.Notifications.success(msg);
            }
            win.location.reload();
        } catch (error: any) {
            console.error('Error resetting preferences:', error.message);
        }
    }
};
