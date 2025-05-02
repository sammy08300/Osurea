/**
 * User preferences management module 
 * Automatically saves the application state with LocalStorage
 */

const PreferencesManager = {
    // Key used to save all preferences
    PREFERENCES_KEY: 'Osu!reaPreferences_v2',
    
    // Current preferences state
    _preferences: null,
    
    // Callback for the reset confirmation
    _resetConfirmCallback: null,
    
    /**
     * Initialize the preferences manager
     */
    init() {
        // Load existing preferences
        this._preferences = this.loadPreferences();
        
        // Create the reset confirmation dialog
        this.createResetDialog();
        
        // Apply the preferences on initial load
        this.applyPreferences();
        
        // Configure the event listeners to save automatically
        this.setupEventListeners();
        
        console.log('Gestionnaire de préférences initialisé');
    },
    
    /**
     * Create the reset confirmation dialog
     */
    createResetDialog() {
        // Check if the dialog already exists
        if (document.getElementById('reset-prefs-dialog')) {
            return;
        }
        
        // Create the dialog
        const resetDialog = document.createElement('div');
        resetDialog.id = 'reset-prefs-dialog';
        resetDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden';
        resetDialog.innerHTML = `
            <div class="bg-gray-900 rounded-lg p-6 shadow-xl max-w-md w-full border border-gray-700">
                <h3 class="text-lg font-medium text-white mb-4">Confirmation de réinitialisation</h3>
                <p class="text-gray-300 text-sm mb-4">Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ? Cette action est irréversible et la page sera rechargée.</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-reset-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">Annuler</button>
                    <button id="confirm-reset-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">Réinitialiser</button>
                </div>
            </div>
        `;
        
        // Add the dialog to the document   
        document.body.appendChild(resetDialog);
        
        // Configure the event listeners
        const cancelResetBtn = document.getElementById('cancel-reset-btn');
        const confirmResetBtn = document.getElementById('confirm-reset-btn');
        
        cancelResetBtn.addEventListener('click', () => {
            resetDialog.classList.add('hidden');
            if (this._resetConfirmCallback) {
                this._resetConfirmCallback(false);
                this._resetConfirmCallback = null;
            }
        });
        
        confirmResetBtn.addEventListener('click', () => {
            resetDialog.classList.add('hidden');
            if (this._resetConfirmCallback) {
                this._resetConfirmCallback(true);
                this._resetConfirmCallback = null;
            }
        });
    },
    
    /**
     * Show the reset confirmation dialog
     * @param {Function} callback - Function to call with the result (true/false)
     */
    showResetConfirmation(callback) {
        const resetDialog = document.getElementById('reset-prefs-dialog');
        
        if (!resetDialog) {
            console.error("Reset dialog element not found");
            // Fallback to native confirmation
            if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ? Cette action est irréversible.')) {
                callback(true);
            }
            return;
        }
        
        // Store the callback
        this._resetConfirmCallback = callback;
        
        // Show the dialog
        resetDialog.classList.remove('hidden');
    },
    
    /**
     * Configure the event listeners to save automatically
     */
    setupEventListeners() {
        // Monitor changes on the tablet dimensions
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        
        if (tabletWidthInput && tabletHeightInput) {
            tabletWidthInput.addEventListener('change', () => this.saveCurrentState());
            tabletHeightInput.addEventListener('change', () => this.saveCurrentState());
        }
        
        // Monitor changes on the active area
        const areaWidthInput = document.getElementById('areaWidth');
        const areaHeightInput = document.getElementById('areaHeight');
        const areaOffsetXInput = document.getElementById('areaOffsetX');
        const areaOffsetYInput = document.getElementById('areaOffsetY');
        const customRatioInput = document.getElementById('customRatio');
        const lockRatioCheckbox = document.getElementById('lockRatio');
        
        if (areaWidthInput) areaWidthInput.addEventListener('change', () => this.saveCurrentState());
        if (areaHeightInput) areaHeightInput.addEventListener('change', () => this.saveCurrentState());
        if (areaOffsetXInput) areaOffsetXInput.addEventListener('change', () => this.saveCurrentState());
        if (areaOffsetYInput) areaOffsetYInput.addEventListener('change', () => this.saveCurrentState());
        if (customRatioInput) customRatioInput.addEventListener('change', () => this.saveCurrentState());
        if (lockRatioCheckbox) lockRatioCheckbox.addEventListener('change', () => this.saveCurrentState());
        
        // Listen to the tablet selection event
        document.addEventListener('tablet:selected', (e) => {
            if (e.detail && e.detail.tablet) {
                // Save the state after selecting a tablet
                setTimeout(() => this.saveCurrentState(), 100);
            }
        });
        
        document.addEventListener('tablet:custom', () => {
            // Save the state after passing to custom mode
            setTimeout(() => this.saveCurrentState(), 100);
        });
        
        // Save periodically (every 10 seconds)
        setInterval(() => this.saveCurrentState(), 10000);
        
        // Save just before the user leaves the page
        window.addEventListener('beforeunload', () => this.saveCurrentState());
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
        
        // Return an empty object by default
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
            // Show a notification to the user
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Impossible de sauvegarder vos préférences');
            }
        }
    },
    
    /**
     * Save the current state of the application
     */
    saveCurrentState() {
        // Get the current values
        const preferences = {
            // Tablet
            tablet: {
                width: parseFloatSafe(document.getElementById('tabletWidth')?.value),
                height: parseFloatSafe(document.getElementById('tabletHeight')?.value),
                model: document.getElementById('tabletSelectorText')?.textContent || 'Sélectionner un modèle',
                isCustom: document.getElementById('tablet-dimensions-container')?.classList.contains('hidden') === false
            },
            
            // Active area
            area: {
                width: parseFloatSafe(document.getElementById('areaWidth')?.value),
                height: parseFloatSafe(document.getElementById('areaHeight')?.value),
                offsetX: parseFloatSafe(document.getElementById('areaOffsetX')?.value),
                offsetY: parseFloatSafe(document.getElementById('areaOffsetY')?.value),
                ratio: parseFloatSafe(document.getElementById('customRatio')?.value),
                lockRatio: document.getElementById('lockRatio')?.getAttribute('aria-pressed') === 'true' || false
            },
            
            // Timestamp
            timestamp: Date.now()
        };
        
        // Save the preferences
        this.savePreferences(preferences);
    },
    
    /**
     * Apply the saved preferences
     */
    applyPreferences() {
        if (!this._preferences || Object.keys(this._preferences).length === 0) {
            return; // No preferences to apply
        }
        
        try {
            // Apply the tablet preferences
            if (this._preferences.tablet) {
                const tablet = this._preferences.tablet;
                
                // Set the tablet dimensions
                if (isValidNumber(tablet.width) && isValidNumber(tablet.height)) {
                    document.getElementById('tabletWidth').value = formatNumber(tablet.width);
                    document.getElementById('tabletHeight').value = formatNumber(tablet.height);
                }
                
                // Show or hide the dimensions container
                const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
                if (tabletDimensionsContainer) {
                    if (tablet.isCustom) {
                        tabletDimensionsContainer.classList.remove('hidden');
                    } else {
                        tabletDimensionsContainer.classList.add('hidden');
                    }
                }
                
                // Update the tablet selector
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText && tablet.model) {
                    selectorText.textContent = tablet.model;
                    selectorText.title = tablet.model;
                }
            }
            
            // Apply the active area preferences
            if (this._preferences.area) {
                const area = this._preferences.area;
                
                // Set the dimensions and offsets
                if (isValidNumber(area.width)) document.getElementById('areaWidth').value = formatNumber(area.width);
                if (isValidNumber(area.height)) document.getElementById('areaHeight').value = formatNumber(area.height);
                if (isValidNumber(area.offsetX)) document.getElementById('areaOffsetX').value = formatNumber(area.offsetX, 3);
                if (isValidNumber(area.offsetY)) document.getElementById('areaOffsetY').value = formatNumber(area.offsetY, 3);
                if (isValidNumber(area.ratio)) document.getElementById('customRatio').value = formatNumber(area.ratio, 3);
                
                // Lock the ratio
                const lockRatioButton = document.getElementById('lockRatio');
                if (lockRatioButton) {
                    lockRatioButton.setAttribute('aria-pressed', area.lockRatio.toString());
                    
                    // Update visually the indicator
                    const indicator = document.getElementById('lockRatioIndicator')?.firstElementChild;
                    if (indicator) {
                        indicator.style.transform = area.lockRatio ? 'scale(1)' : 'scale(0)';
                    }
                }
            }
            
            // Update the display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
            
            // Show a notification if the notification system is available
            // Wait for the interface to be fully loaded
            setTimeout(() => {
                if (typeof Notifications !== 'undefined') {
                    const timestamp = this._preferences.timestamp;
                    let message = 'Configuration restaurée';
                    
                    if (timestamp) {
                        const date = new Date(timestamp);
                        // Format the date to be more readable
                        const formattedDate = date.toLocaleDateString();
                        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        message = `Configuration du ${formattedDate} à ${formattedTime} restaurée`;
                    }
                    
                    Notifications.info(message);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Erreur lors de l\'application des préférences:', error);
        }
    },
    
    /**
     * Reset all preferences
     */
    resetPreferences() {
        try {
            localStorage.removeItem(this.PREFERENCES_KEY);
            this._preferences = {};
            
            // Show a notification to the user
            if (typeof Notifications !== 'undefined') {
                Notifications.success('Préférences réinitialisées');
            }
            
            // Reload the page to apply the default values
            window.location.reload();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation des préférences:', error);
        }
    }
}; 