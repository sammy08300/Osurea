/**
 * User preferences management module 
 * Automatically saves the application state with LocalStorage
 */

const PreferencesManager = {
    // Constants
    PREFERENCES_KEY: 'Osu!reaPreferences_v2',
    
    // State
    _preferences: null,
    _resetConfirmCallback: null,
    
    /**
     * Initialize the preferences manager
     */
    init() {
        console.log('DEBUG: Initialisation du gestionnaire de préférences');
        
        this._preferences = this.loadPreferences();
        console.log('DEBUG: Préférences chargées depuis localStorage:', this._preferences);
        
        this.createResetDialog();
        this.applyPreferences();
        this.setupEventListeners();
        
        console.log('Gestionnaire de préférences initialisé');
    },
    
    /**
     * Create the reset confirmation dialog
     */
    createResetDialog() {
        if (document.getElementById('reset-prefs-dialog')) {
            return;
        }
        
        const resetDialog = document.createElement('div');
        resetDialog.id = 'reset-prefs-dialog';
        resetDialog.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 hidden';
        resetDialog.innerHTML = this._getResetDialogHTML();
        
        document.body.appendChild(resetDialog);
        this._setupResetDialogListeners();
    },
    
    /**
     * Get the HTML content for the reset dialog
     * @returns {string} The HTML content
     */
    _getResetDialogHTML() {
        return `
            <div class="bg-gray-900 rounded-lg p-6 shadow-xl max-w-md w-full border border-gray-700">
                <h3 class="text-lg font-medium text-white mb-4">Confirmation de réinitialisation</h3>
                <p class="text-gray-300 text-sm mb-4">Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ? Cette action est irréversible et la page sera rechargée.</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-reset-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">Annuler</button>
                    <button id="confirm-reset-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">Réinitialiser</button>
                </div>
            </div>
        `;
    },
    
    /**
     * Setup event listeners for the reset dialog
     */
    _setupResetDialogListeners() {
        const cancelResetBtn = document.getElementById('cancel-reset-btn');
        const confirmResetBtn = document.getElementById('confirm-reset-btn');
        
        cancelResetBtn.addEventListener('click', () => this._handleResetDialogResponse(false));
        confirmResetBtn.addEventListener('click', () => this._handleResetDialogResponse(true));
    },
    
    /**
     * Handle the response from the reset dialog
     * @param {boolean} confirmed - Whether the reset was confirmed
     */
    _handleResetDialogResponse(confirmed) {
        const resetDialog = document.getElementById('reset-prefs-dialog');
        resetDialog.classList.add('hidden');
        
        if (this._resetConfirmCallback) {
            this._resetConfirmCallback(confirmed);
            this._resetConfirmCallback = null;
        }
    },
    
    /**
     * Show the reset confirmation dialog
     * @param {Function} callback - Function to call with the result (true/false)
     */
    showResetConfirmation(callback) {
        const resetDialog = document.getElementById('reset-prefs-dialog');
        
        if (!resetDialog) {
            console.error("Reset dialog element not found");
            if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ? Cette action est irréversible.')) {
                callback(true);
            }
            return;
        }
        
        this._resetConfirmCallback = callback;
        
        resetDialog.classList.remove('hidden');
        resetDialog.classList.add('flex');
    },
    
    /**
     * Configure the event listeners to save automatically
     */
    setupEventListeners() {
        this._setupInputListeners();
        this._setupCustomEventListeners();
        this._setupPeriodicSave();
    },
    
    /**
     * Setup input element listeners
     */
    _setupInputListeners() {
        // Tablet dimensions
        this._addChangeAndInputListeners('tabletWidth');
        this._addChangeAndInputListeners('tabletHeight');
        
        // Active area settings
        this._addChangeAndInputListeners('areaWidth');
        this._addChangeAndInputListeners('areaHeight');
        this._addChangeAndInputListeners('areaOffsetX');
        this._addChangeAndInputListeners('areaOffsetY');
        this._addChangeAndInputListeners('customRatio');
        
        // Lock ratio checkbox
        const lockRatioCheckbox = document.getElementById('lockRatio');
        if (lockRatioCheckbox) {
            lockRatioCheckbox.addEventListener('change', () => this.saveCurrentState());
            lockRatioCheckbox.addEventListener('click', () => this.saveCurrentState());
        }
    },
    
    /**
     * Add change and input event listeners to an element
     * @param {string} elementId - The ID of the element
     */
    _addChangeAndInputListeners(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', () => this.saveCurrentState());
            element.addEventListener('input', () => this.saveCurrentState());
        }
    },
    
    /**
     * Setup custom event listeners
     */
    _setupCustomEventListeners() {
        // Tablet selection
        document.addEventListener('tablet:selected', (e) => {
            if (e.detail && e.detail.tablet) {
                setTimeout(() => this.saveCurrentState(), 100);
            }
        });
        
        document.addEventListener('tablet:custom', () => {
            setTimeout(() => this.saveCurrentState(), 100);
        });
        
        // Active area positioning
        const areaEvents = ['activearea:positioned', 'activearea:moved', 'activearea:centered'];
        areaEvents.forEach(event => {
            document.addEventListener(event, () => {
                setTimeout(() => this.saveCurrentState(), 100);
            });
        });
    },
    
    /**
     * Setup periodic save and page unload handlers
     */
    _setupPeriodicSave() {
        // Save periodically
        setInterval(() => this.saveCurrentState(), 10000);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => this.saveCurrentState());
        
        // Save on F5 or Ctrl+R refresh
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                this.saveCurrentState();
            }
        });
    },
    
    /**
     * Load the preferences from localStorage
     * @returns {Object} The loaded preferences or the default object
     */
    loadPreferences() {
        try {
            const storedPrefs = localStorage.getItem(this.PREFERENCES_KEY);
            
            if (storedPrefs) {
                return JSON.parse(storedPrefs);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des préférences:', error);
        }
        
        return {};
    },
    
    /**
     * Save the preferences in localStorage
     * @param {Object} preferences - The preferences to save
     */
    savePreferences(preferences) {
        try {
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
            this._preferences = preferences;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
            if (typeof Notifications !== 'undefined') {
                Notifications.error(window.translateWithFallback('notifications.errorSavingPreferences') || 'Impossible de sauvegarder vos préférences');
            }
        }
    },
    
    /**
     * Save the current state of the application
     */
    saveCurrentState() {
        const preferences = {
            tablet: this._collectTabletSettings(),
            area: this._collectAreaSettings(),
            timestamp: Date.now()
        };
        
        this._validatePreferences(preferences);
        this.savePreferences(preferences);
        
        console.log('Préférences sauvegardées:', preferences);
    },
    
    /**
     * Collect tablet settings from the UI
     * @returns {Object} Tablet settings
     */
    _collectTabletSettings() {
        return {
            width: parseFloatSafe(document.getElementById('tabletWidth')?.value),
            height: parseFloatSafe(document.getElementById('tabletHeight')?.value),
            model: document.getElementById('tabletSelectorText')?.textContent || 'Sélectionner un modèle',
            isCustom: document.getElementById('tablet-dimensions-container')?.classList.contains('hidden') === false,
            brand: document.getElementById('tabletSelectorButton')?.dataset.tabletBrand || ''
        };
    },
    
    /**
     * Collect active area settings from the UI
     * @returns {Object} Area settings
     */
    _collectAreaSettings() {
        return {
            width: parseFloatSafe(document.getElementById('areaWidth')?.value),
            height: parseFloatSafe(document.getElementById('areaHeight')?.value),
            offsetX: parseFloatSafe(document.getElementById('areaOffsetX')?.value),
            offsetY: parseFloatSafe(document.getElementById('areaOffsetY')?.value),
            ratio: parseFloatSafe(document.getElementById('customRatio')?.value),
            lockRatio: document.getElementById('lockRatio')?.getAttribute('aria-pressed') === 'true' || false,
            radius: parseInt(document.getElementById('areaRadius')?.value) || 0
        };
    },
    
    /**
     * Validate preferences to ensure no invalid values are saved
     * @param {Object} preferences - The preferences to validate
     */
    _validatePreferences(preferences) {
        if (preferences.area.width <= 0) preferences.area.width = 1;
        if (preferences.area.height <= 0) preferences.area.height = 1;
        if (preferences.area.ratio <= 0) preferences.area.ratio = 1;
        if (preferences.tablet.width <= 0) preferences.tablet.width = 1;
        if (preferences.tablet.height <= 0) preferences.tablet.height = 1;
    },
    
    /**
     * Apply the saved preferences
     */
    applyPreferences() {
        if (!this._preferences || Object.keys(this._preferences).length === 0) {
            return;
        }
        
        try {
            if (this._preferences.tablet) {
                this._applyTabletPreferences(this._preferences.tablet);
            }
            
            if (this._preferences.area) {
                this._applyAreaPreferences(this._preferences.area);
            }
            
            this._updateUIAfterApplyingPreferences();
            
        } catch (error) {
            console.error('Erreur lors de l\'application des préférences:', error);
        }
    },
    
    /**
     * Apply tablet preferences
     * @param {Object} tablet - The tablet preferences
     */
    _applyTabletPreferences(tablet) {
        // Set dimensions
        if (isValidNumber(tablet.width) && isValidNumber(tablet.height)) {
            document.getElementById('tabletWidth').value = formatNumber(tablet.width);
            document.getElementById('tabletHeight').value = formatNumber(tablet.height);
        }
        
        // Toggle dimensions container
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        if (tabletDimensionsContainer) {
            tabletDimensionsContainer.classList.toggle('hidden', !tablet.isCustom);
        }
        
        // Apply saved tablet model
        if (tablet.model && tablet.brand) {
            const tabletData = { 
                model: tablet.model,
                brand: tablet.brand,
                width: tablet.width,
                height: tablet.height,
                isCustom: tablet.isCustom
            };
            
            setTimeout(() => {
                if (typeof TabletSelector !== 'undefined') {
                    document.dispatchEvent(new CustomEvent('preferences:loadTablet', { 
                        detail: tabletData
                    }));
                }
            }, 100);
        }
    },
    
    /**
     * Apply active area preferences
     * @param {Object} area - The area preferences
     */
    _applyAreaPreferences(area) {
        // Set dimensions and offsets
        const areaFields = {
            'areaWidth': [area.width, 1],
            'areaHeight': [area.height, 1],
            'areaOffsetX': [area.offsetX, 3],
            'areaOffsetY': [area.offsetY, 3],
            'customRatio': [area.ratio, 3]
        };
        
        Object.entries(areaFields).forEach(([id, [value, precision]]) => {
            if (isValidNumber(value)) {
                document.getElementById(id).value = formatNumber(value, precision);
            }
        });
        
        // Apply lock ratio
        this._applyLockRatio(area.lockRatio);
        
        // Apply radius
        if (typeof area.radius !== 'undefined') {
            this._applyRadius(area.radius);
        }
    },
    
    /**
     * Apply lock ratio setting
     * @param {boolean} locked - Whether ratio is locked
     */
    _applyLockRatio(locked) {
        const lockRatioButton = document.getElementById('lockRatio');
        if (lockRatioButton) {
            lockRatioButton.setAttribute('aria-pressed', locked.toString());
            
            const indicator = document.getElementById('lockRatioIndicator')?.firstElementChild;
            if (indicator) {
                indicator.style.transform = locked ? 'scale(1)' : 'scale(0)';
            }
        }
    },
    
    /**
     * Apply radius setting
     * @param {number} radius - The radius value
     */
    _applyRadius(radius) {
        const radiusElement = document.getElementById('areaRadius');
        if (radiusElement) {
            radiusElement.value = radius;
            window.currentRadius = radius;
            
            const radiusInput = document.getElementById('radius-input');
            if (radiusInput) radiusInput.value = radius;
        }
    },
    
    /**
     * Update UI after applying preferences
     */
    _updateUIAfterApplyingPreferences() {
        // Update display if function exists
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Show notification
        setTimeout(() => {
            if (typeof Notifications !== 'undefined') {
                const message = this._getRestorationMessage();
                Notifications.info(message);
            }
        }, 1000);
    },
    
    /**
     * Get the restoration message with formatted date
     * @returns {string} The formatted message
     */
    _getRestorationMessage() {
        const timestamp = this._preferences.timestamp;
        if (!timestamp) {
            return 'Configuration restaurée';
        }
        
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Configuration du ${formattedDate} à ${formattedTime} restaurée`;
    },
    
    /**
     * Reset all preferences
     */
    resetPreferences() {
        try {
            localStorage.removeItem(this.PREFERENCES_KEY);
            this._preferences = {};
            
            if (typeof Notifications !== 'undefined') {
                Notifications.success(window.translateWithFallback('notifications.preferencesReset') || 'Préférences réinitialisées');
            }
            
            window.location.reload();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation des préférences:', error);
        }
    }
}; 