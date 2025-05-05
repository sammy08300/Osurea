/**
 * Main application module
 */

// Import the FavoritesUI module
import { FavoritesUI } from './components/favorites/favoritesindex.js';

/**
 * Utility function to translate an i18n key with robust fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @returns {string} - The translation or a formatted default value
 */
function translateWithFallback(key) {
    // First try to use the standard translation system
    let translated = null;
    
    if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
        try {
            translated = localeManager.translate(key);
            if (translated === key) translated = null; // If translation returns the key, consider it a failure
        } catch (e) {
            console.error("[ERROR] Translation failed for key:", key, e);
        }
    }
    
    // If standard translation failed, use fallbacks
    if (!translated || translated.startsWith('i18n:')) {
        const htmlLang = document.documentElement.lang || 'fr';
        
        // Manually defined translations for common keys
        const fallbackTranslations = {
            'select_model': {
                'en': 'Select a model',
                'es': 'Seleccionar modelo',
                'fr': 'Sélectionner un modèle'
            },
            'default_favorite_name': {
                'en': 'Saved configuration',
                'es': 'Configuración guardada',
                'fr': 'Configuration sauvegardée'
            },
            'custom_dimensions': {
                'en': 'Custom dimensions',
                'es': 'Dimensiones personalizadas',
                'fr': 'Dimensions personnalisées'
            }
        };
        
        // Determine the language to use (prefix only)
        let lang = 'fr'; // Default
        if (htmlLang.startsWith('en')) {
            lang = 'en';
        } else if (htmlLang.startsWith('es')) {
            lang = 'es';
        }
        
        // Use fallback translation if available
        if (fallbackTranslations[key] && fallbackTranslations[key][lang]) {
            translated = fallbackTranslations[key][lang];
        } else {
            // Default formatting for unknown keys
            translated = key.replace(/_/g, ' ');
            // First letter uppercase
            translated = translated.charAt(0).toUpperCase() + translated.slice(1);
        }
    }
    
    return translated;
}

// Global application state
const appState = {
    tabletData: [],
    editingFavoriteId: null,
    originalValues: null,
    currentRatio: 1.0,
    debouncedUpdateRatio: null,
    
    /**
     * Load tablet data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadTabletData() {
        try {
            const response = await fetch('data/tablets.json');
            if (!response.ok) {
                throw new Error('Failed to load tablet data');
            }
            this.tabletData = await response.json();
            
            // Initialize the new tablet selector
            if (typeof TabletSelector !== 'undefined') {
                TabletSelector.init(this.tabletData);
            } else {
                // Fallback to the old method if necessary
                this.populateTabletPresets();
            }
        } catch (error) {
            console.error('Error loading tablet data:', error);
            Notifications.error('Erreur de chargement des données tablettes');
        }
    },
    
    /**
     * Populate tablet preset dropdown
     */
    populateTabletPresets() {
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        
        if (!tabletPresetSelect || !this.tabletData.length) {
            return;
        }
        
        console.warn('Using the obsolete populateTabletPresets method. Please use TabletSelector if possible.');
        
        // Group tablets by brand
        const tabletsByBrand = this.tabletData.reduce((groups, tablet) => {
            if (!groups[tablet.brand]) {
                groups[tablet.brand] = [];
            }
            groups[tablet.brand].push(tablet);
            return groups;
        }, {});
        
        // Clear existing options except the first two
        while (tabletPresetSelect.options.length > 2) {
            tabletPresetSelect.remove(2);
        }
        
        // Add option groups by brand
        Object.keys(tabletsByBrand).sort().forEach(brand => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = brand;
            
            // Add options for each tablet model
            tabletsByBrand[brand].forEach(tablet => {
                const option = document.createElement('option');
                option.value = `${brand}_${tablet.model}`.replace(/\s+/g, '_');
                option.textContent = tablet.model;
                option.dataset.width = tablet.width;
                option.dataset.height = tablet.height;
                option.dataset.brand = tablet.brand;
                optgroup.appendChild(option);
            });
            
            tabletPresetSelect.appendChild(optgroup);
        });
    },
    
    /**
     * Setup all input listeners
     */
    setupInputListeners() {
        // Tablet presets - old method - kept for compatibility
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        if (tabletPresetSelect) {
            tabletPresetSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                const selectedOption = e.target.selectedOptions[0];
                
                if (selectedValue === 'custom') {
                    const tabletWidthGroup = document.getElementById('tablet-width-group');
                    const tabletHeightGroup = document.getElementById('tablet-height-group');
                    const tabletManualHr = document.getElementById('tablet-manual-hr');
                    
                    if (tabletWidthGroup && tabletHeightGroup && tabletManualHr) {
                        tabletWidthGroup.classList.remove('hidden');
                        tabletHeightGroup.classList.remove('hidden');
                        tabletManualHr.classList.remove('hidden');
                    }
                    
                    this.cancelEditMode();
                    return;
                }
                
                if (selectedValue && selectedOption.dataset.width) {
                    const width = parseFloat(selectedOption.dataset.width);
                    const height = parseFloat(selectedOption.dataset.height);
                    const tabletWidthInput = document.getElementById('tabletWidth');
                    const tabletHeightInput = document.getElementById('tabletHeight');
                    const tabletWidthGroup = document.getElementById('tablet-width-group');
                    const tabletHeightGroup = document.getElementById('tablet-height-group');
                    const tabletManualHr = document.getElementById('tablet-manual-hr');
                    
                    if (!isNaN(width) && !isNaN(height) && tabletWidthInput && tabletHeightInput) {
                        tabletWidthInput.value = formatNumber(width);
                        tabletHeightInput.value = formatNumber(height);
                        
                        if (tabletWidthGroup && tabletHeightGroup && tabletManualHr) {
                            tabletWidthGroup.classList.add('hidden');
                            tabletHeightGroup.classList.add('hidden');
                            tabletManualHr.classList.add('hidden');
                        }
                        
                        this.cancelEditMode();
                        updateDisplay();
                    }
                } else {
                    const tabletWidthGroup = document.getElementById('tablet-width-group');
                    const tabletHeightGroup = document.getElementById('tablet-height-group');
                    const tabletManualHr = document.getElementById('tablet-manual-hr');
                    
                    if (tabletWidthGroup && tabletHeightGroup && tabletManualHr) {
                        tabletWidthGroup.classList.add('hidden');
                        tabletHeightGroup.classList.add('hidden');
                        tabletManualHr.classList.add('hidden');
                    }
                }
            });
        }
        
        // Tablet dimensions
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        
        if (tabletWidthInput) {
            tabletWidthInput.addEventListener('input', () => {
                // If the old selector exists, update its value
                if (tabletPresetSelect) {
                    tabletPresetSelect.value = 'custom';
                }
                
                // Update the text of the new selector
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText) {
                    selectorText.textContent = 'Custom dimensions';
                    selectorText.title = 'Custom dimensions';
                }
                
                // Ensure the dimensions container is visible
                const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
                if (tabletDimensionsContainer) {
                    tabletDimensionsContainer.classList.remove('hidden');
                }
                
                this.cancelEditMode();
                updateDisplay();
            });
        }
        
        if (tabletHeightInput) {
            tabletHeightInput.addEventListener('input', () => {
                // If the old selector exists, update its value
                if (tabletPresetSelect) {
                    tabletPresetSelect.value = 'custom';
                }
                
                // Update the text of the new selector
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText) {
                    selectorText.textContent = 'Custom dimensions';
                    selectorText.title = 'Custom dimensions';
                }
                
                // Ensure the dimensions container is visible
                const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
                if (tabletDimensionsContainer) {
                    tabletDimensionsContainer.classList.remove('hidden');
                }
                
                this.cancelEditMode();
                updateDisplay();
            });
        }
        
        // Area dimensions
        const areaWidthInput = document.getElementById('areaWidth');
        const areaHeightInput = document.getElementById('areaHeight');
        const customRatioInput = document.getElementById('customRatio');
        const lockRatioButton = document.getElementById('lockRatio');
        
        // Function to update the ratio field state based on the lock state
        const updateRatioFieldState = () => {
            const isLocked = lockRatioButton.getAttribute('aria-pressed') === 'true';
            customRatioInput.readOnly = !isLocked;
            
            // Apply the appropriate styles based on the state
            if (isLocked) {
                // If locked, the input is editable and keeps the same appearance as the other inputs
                customRatioInput.classList.remove('ratio-editable');
                customRatioInput.classList.add('ratio-locked');
                // Reset the inline styles
                customRatioInput.style.backgroundColor = "";
                customRatioInput.style.color = "";
                customRatioInput.style.pointerEvents = ""; // Allow interaction
                customRatioInput.title = "Custom ratio (editable)";
            } else {
                // If unlocked, the input is not editable and has a darker appearance
                customRatioInput.classList.remove('ratio-locked');
                customRatioInput.classList.add('ratio-editable');
                customRatioInput.style.backgroundColor = "#111827"; // bg-gray-900 - darker
                customRatioInput.style.color = "#9CA3AF"; // text-gray-400 - lighter
                customRatioInput.style.pointerEvents = "none"; // Prevent interaction
                customRatioInput.title = "Automatically calculated ratio (not editable)";
            }
        };
        
        // Make the function accessible globally
        window.updateRatioFieldState = updateRatioFieldState;
        
        // Initialize the ratio field state
        updateRatioFieldState();
        
        // Apply the initial style if unlocked
        if (lockRatioButton.getAttribute('aria-pressed') !== 'true') {
            customRatioInput.style.backgroundColor = "#111827"; // bg-gray-900 - darker
            customRatioInput.style.color = "#9CA3AF"; // text-gray-400 - lighter
            customRatioInput.style.pointerEvents = "none"; // Prevent interaction
        }
        
        // Add an event listener to the lock button to update the field state
        lockRatioButton.addEventListener('click', () => {
            // The button state will change after this event execution
            const willBeLocked = lockRatioButton.getAttribute('aria-pressed') !== 'true';
            
            if (willBeLocked) {
                // If we are going to lock, take the current ratio of the dimensions
                const width = parseFloatSafe(areaWidthInput.value);
                const height = parseFloatSafe(areaHeightInput.value);
                
                if (height > 0 && width > 0) {
                    this.currentRatio = width / height;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
            } else {
                // If we are going to unlock, recalculate the ratio from the dimensions
                // (even if it's the same, it's for consistency)
                this.debouncedUpdateRatio();
            }
            
            // Update the field state after the button state change
            setTimeout(() => {
                updateRatioFieldState();
            }, 0);
        });
        
        if (areaWidthInput) {
            areaWidthInput.addEventListener('input', () => {
                if (!appState.editingFavoriteId) {
                    this.cancelEditMode();
                }
                
                // Get the tablet and active area dimensions
                const tabletWidth = parseFloatSafe(tabletWidthInput.value);
                const tabletHeight = parseFloatSafe(tabletHeightInput.value);
                const areaWidth = parseFloatSafe(areaWidthInput.value);
                
                // Constrain the active area width
                const constrainedWidth = Math.min(areaWidth, tabletWidth);
                if (constrainedWidth !== areaWidth) {
                    areaWidthInput.value = formatNumber(constrainedWidth);
                }
                
                // Only update the height if the ratio is locked
                if (lockRatioButton.getAttribute('aria-pressed') === 'true' && this.currentRatio > 0 && !isNaN(this.currentRatio)) {
                    let newHeight = constrainedWidth / this.currentRatio;
                    
                    // Constrain also the height
                    newHeight = Math.min(newHeight, tabletHeight);
                    
                    if (!isNaN(newHeight) && newHeight >= 0) {
                        areaHeightInput.value = formatNumber(newHeight);
                    }
                } else {
                    this.debouncedUpdateRatio();
                }
                
                // Constrain also the offset to avoid the area exceeding
                const areaHeight = parseFloatSafe(areaHeightInput.value);
                const offsetX = parseFloatSafe(document.getElementById('areaOffsetX').value);
                const offsetY = parseFloatSafe(document.getElementById('areaOffsetY').value);
                
                const constrainedOffsets = constrainAreaOffset(
                    offsetX, 
                    offsetY, 
                    constrainedWidth, 
                    areaHeight, 
                    tabletWidth, 
                    tabletHeight
                );
                
                document.getElementById('areaOffsetX').value = formatNumber(constrainedOffsets.x, 3);
                document.getElementById('areaOffsetY').value = formatNumber(constrainedOffsets.y, 3);
                
                updateDisplayWithoutRatio();
            });
        }
        
        if (areaHeightInput) {
            areaHeightInput.addEventListener('input', () => {
                if (!appState.editingFavoriteId) {
                    this.cancelEditMode();
                }
                
                // Get the tablet and active area dimensions
                const tabletWidth = parseFloatSafe(tabletWidthInput.value);
                const tabletHeight = parseFloatSafe(tabletHeightInput.value);
                const areaHeight = parseFloatSafe(areaHeightInput.value);
                
                // Constrain the active area height
                const constrainedHeight = Math.min(areaHeight, tabletHeight);
                if (constrainedHeight !== areaHeight) {
                    areaHeightInput.value = formatNumber(constrainedHeight);
                }
                
                // Only update the width if the ratio is locked
                if (lockRatioButton.getAttribute('aria-pressed') === 'true' && this.currentRatio > 0 && !isNaN(this.currentRatio)) {
                    let newWidth = constrainedHeight * this.currentRatio;
                    
                    // Constrain also the width
                    newWidth = Math.min(newWidth, tabletWidth);
                    
                    if (!isNaN(newWidth) && newWidth >= 0) {
                        areaWidthInput.value = formatNumber(newWidth);
                    }
                } else {
                    this.debouncedUpdateRatio();
                }
                
                // Constrain also the offset to avoid the area exceeding
                const areaWidth = parseFloatSafe(areaWidthInput.value);
                const offsetX = parseFloatSafe(document.getElementById('areaOffsetX').value);
                const offsetY = parseFloatSafe(document.getElementById('areaOffsetY').value);
                
                const constrainedOffsets = constrainAreaOffset(
                    offsetX, 
                    offsetY, 
                    areaWidth, 
                    constrainedHeight, 
                    tabletWidth, 
                    tabletHeight
                );
                
                document.getElementById('areaOffsetX').value = formatNumber(constrainedOffsets.x, 3);
                document.getElementById('areaOffsetY').value = formatNumber(constrainedOffsets.y, 3);
                
                updateDisplayWithoutRatio();
            });
        }
        
        customRatioInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            
            // If the field is read-only, ignore the input
            if (customRatioInput.readOnly) {
                return;
            }
            
            const newRatio = parseFloatSafe(customRatioInput.value);
            if (!isNaN(newRatio) && newRatio > 0) {
                this.currentRatio = newRatio;
                
                if (lockRatioButton.getAttribute('aria-pressed') === 'true') {
                    const currentWidth = parseFloatSafe(areaWidthInput.value);
                    const newHeight = currentWidth / this.currentRatio;
                    
                    if (!isNaN(newHeight) && newHeight >= 0) {
                        areaHeightInput.value = formatNumber(newHeight);
                    }
                }
            } else {
                this.currentRatio = NaN;
            }
            
            updateDisplay();
        });
        
        // Add an event focus to prevent updates during direct editing
        customRatioInput.addEventListener('focus', () => {
            // Allow editing only if the ratio is locked
            if (!customRatioInput.readOnly) {
                customRatioInput.dataset.editing = 'true';
            }
        });
        
        customRatioInput.addEventListener('blur', () => {
            delete customRatioInput.dataset.editing;
            // Recalculate the ratio based on the current dimensions if necessary
            if (lockRatioButton.getAttribute('aria-pressed') !== 'true') {
                this.debouncedUpdateRatio();
            }
        });
        
        // Area position
        const areaOffsetXInput = document.getElementById('areaOffsetX');
        const areaOffsetYInput = document.getElementById('areaOffsetY');
        
        // Ajout d'un debounce pour l'updateDisplay sur l'offset
        const debouncedUpdateDisplayOffset = debounce(() => {
            updateDisplay();
        }, 700);

        areaOffsetXInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            // On laisse l'utilisateur écrire ce qu'il veut, même si c'est temporairement invalide
            debouncedUpdateDisplayOffset();
        });

        areaOffsetXInput.addEventListener('blur', () => {
            // Ici, on applique la contrainte si besoin
            const tabletWidth = parseFloatSafe(tabletWidthInput.value);
            const tabletHeight = parseFloatSafe(tabletHeightInput.value);
            const areaWidth = parseFloatSafe(areaWidthInput.value);
            const areaHeight = parseFloatSafe(areaHeightInput.value);
            let offsetX = parseFloatSafe(areaOffsetXInput.value);
            const offsetY = parseFloatSafe(areaOffsetYInput.value);

            // Si la valeur est vide ou invalide, on ne fait rien
            if (!isValidNumber(offsetX)) return;

            // Ici, tu peux décider si tu veux vraiment contraindre ou non.
            // Si tu veux autoriser n'importe quelle valeur, ne fais rien.
            // Sinon, décommente la ligne suivante pour contraindre :
            // const constrainedOffsets = constrainAreaOffset(offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight);
            // areaOffsetXInput.value = formatNumber(constrainedOffsets.x, 3);

            updateDisplay();
        });

        areaOffsetYInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            debouncedUpdateDisplayOffset();
        });

        areaOffsetYInput.addEventListener('blur', () => {
            const tabletWidth = parseFloatSafe(tabletWidthInput.value);
            const tabletHeight = parseFloatSafe(tabletHeightInput.value);
            const areaWidth = parseFloatSafe(areaWidthInput.value);
            const areaHeight = parseFloatSafe(areaHeightInput.value);
            const offsetX = parseFloatSafe(areaOffsetXInput.value);
            let offsetY = parseFloatSafe(areaOffsetYInput.value);

            if (!isValidNumber(offsetY)) return;

            // Si tu veux contraindre, décommente :
            // const constrainedOffsets = constrainAreaOffset(offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight);
            // areaOffsetYInput.value = formatNumber(constrainedOffsets.y, 3);

            updateDisplay();
        });
        
        // Action buttons
        const swapButton = document.getElementById('swap-btn');
        const centerButton = document.getElementById('center-btn');
        const copyButton = document.getElementById('copy-btn');
        const saveButton = document.getElementById('save-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        swapButton.addEventListener('click', () => {
            this.cancelEditMode();
            
            const width = areaWidthInput.value;
            areaWidthInput.value = areaHeightInput.value;
            areaHeightInput.value = width;
            
            // If the lock is activated, update the ratio immediately
            if (lockRatioButton.getAttribute('aria-pressed') === 'true') {
                const newWidth = parseFloatSafe(areaWidthInput.value);
                const newHeight = parseFloatSafe(areaHeightInput.value);
                
                if (newHeight > 0 && newWidth > 0) {
                    this.currentRatio = newWidth / newHeight;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
                updateDisplay();
            } else {
                // Otherwise use the debounced function and update the display without the ratio
                this.debouncedUpdateRatio();
                updateDisplayWithoutRatio();
            }
        });
        
        centerButton.addEventListener('click', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            centerArea();
        });
        
        copyButton.addEventListener('click', () => {
            const width = parseFloatSafe(areaWidthInput.value);
            const height = parseFloatSafe(areaHeightInput.value);
            const offsetX = parseFloatSafe(areaOffsetXInput.value);
            const offsetY = parseFloatSafe(areaOffsetYInput.value);
            const ratio = (height > 0) ? (width / height).toFixed(3) : 'N/A';
            
            const info = `-- Zone Active Réelle --
Largeur: ${formatNumber(width)} mm
Hauteur: ${formatNumber(height)} mm
Ratio: ${ratio}
Centre X: ${formatNumber(offsetX, 3)} mm
Centre Y: ${formatNumber(offsetY, 3)} mm`;
            
            navigator.clipboard.writeText(info)
                .then(() => {
                    Notifications.success('copied_info');
                })
                .catch(() => {
                    Notifications.error('copy_error'); 
                    console.error('Failed to copy text: ', info);
                });
        });
        
        // Le bouton de sauvegarde est déjà géré par le module FavoritesEvents
        
        cancelEditBtn.addEventListener('click', () => {
            this.cancelEditMode();
        });
        
        // Reset preferences button
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
    },
    
    /**
     * Start editing a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    startEditFavorite(id) {
        this.editingFavoriteId = id;
        
        const saveBtn = document.getElementById('save-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        // Update button styling
        saveBtn.textContent = "Mettre à Jour";
        saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
        saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
        cancelEditBtn.classList.remove('hidden');
    },
    
    /**
     * Cancel edit mode
     */
    cancelEditMode() {
        if (this.editingFavoriteId && this.originalValues) {
            // Restore the original values
            document.getElementById('areaWidth').value = formatNumber(this.originalValues.width);
            document.getElementById('areaHeight').value = formatNumber(this.originalValues.height);
            document.getElementById('areaOffsetX').value = formatNumber(this.originalValues.x, 3);
            document.getElementById('areaOffsetY').value = formatNumber(this.originalValues.y, 3);
            
            if (this.originalValues.ratio) {
                document.getElementById('customRatio').value = formatNumber(this.originalValues.ratio, 3);
            }
            
            if (this.originalValues.tabletW && this.originalValues.tabletH) {
                document.getElementById('tabletWidth').value = formatNumber(this.originalValues.tabletW);
                document.getElementById('tabletHeight').value = formatNumber(this.originalValues.tabletH);
            }
            
            if (this.originalValues.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                    
                    // Vérifier si presetInfo est une clé de traduction
                    if (this.originalValues.presetInfo.startsWith('i18n:')) {
                        const key = this.originalValues.presetInfo.substring(5);
                        
                        // Appliquer la clé de traduction à l'attribut data-i18n
                        selectorText.setAttribute('data-i18n', key);
                        
                        // Utiliser translateWithFallback pour obtenir la traduction si disponible
                        let translated = translateWithFallback(key);
                        
                        selectorText.textContent = translated;
                    } else {
                        // C'est un nom de modèle normal, pas une clé de traduction
                        selectorText.removeAttribute('data-i18n');
                        selectorText.textContent = this.originalValues.presetInfo;
                    }
                }
            }
            
            // Update the display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
            
            // Reset the edit mode
            this.editingFavoriteId = null;
            this.originalValues = null;
            
            // Hide the cancel button
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) {
                cancelBtn.classList.add('hidden');
                cancelBtn.classList.remove('flex');
            }
            
            Notifications.info('Modifications annulées');
        }
    },
    
    /**
     * Initialize app components and load data
     */
    async init() {
        // Initialize notification system
        Notifications.init();
        
        // Preload favorites during the loading of other data
        if (typeof FavoritesUI !== 'undefined') {
            // Initialize Favorites as soon as possible to avoid the flash
            FavoritesUI.init();
        }
        
        // Initialize the preferences manager if it exists
        if (typeof PreferencesManager !== 'undefined') {
            PreferencesManager.init();
        }
        
        // Load tablet data
        await this.loadTabletData();
        
        // Setup input event listeners
        this.setupInputListeners();
        
        // Apply the initial state of the ratio field
        const lockRatioButton = document.getElementById('lockRatio');
        const customRatioInput = document.getElementById('customRatio');
        if (lockRatioButton && customRatioInput && typeof window.updateRatioFieldState === 'function') {
            window.updateRatioFieldState();
        }
        
        // Creation of a debounce function to update the ratio
        this.debouncedUpdateRatio = debounce(() => {
            const areaWidthInput = document.getElementById('areaWidth');
            const areaHeightInput = document.getElementById('areaHeight');
            const customRatioInput = document.getElementById('customRatio');
            const lockRatioButton = document.getElementById('lockRatio');
            
            const width = parseFloatSafe(areaWidthInput.value);
            const height = parseFloatSafe(areaHeightInput.value);
            
            if (height > 0 && width > 0) {
                const calculatedRatio = width / height;
                // Always update the ratio, unless the user is directly editing the field
                if (!customRatioInput.dataset.editing && !customRatioInput.matches(':focus')) {
                    customRatioInput.value = formatNumber(calculatedRatio, 3);
                    this.currentRatio = calculatedRatio;
                }
            }
        }, 300); // 300ms delay
        
        // Start with default values
        updateDisplay();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    appState.init();
    
    // Ajout d'un event listener direct sur le bouton de sauvegarde
    const saveButton = document.getElementById('save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            // Vérifier si nous sommes en mode édition
            if (appState.editingFavoriteId) {
                // En mode édition, on récupère les valeurs du formulaire
                const areaWidth = parseFloat(document.getElementById('areaWidth').value);
                const areaHeight = parseFloat(document.getElementById('areaHeight').value);
                const areaOffsetX = parseFloat(document.getElementById('areaOffsetX').value);
                const areaOffsetY = parseFloat(document.getElementById('areaOffsetY').value);
                const customRatio = parseFloat(document.getElementById('customRatio').value);
                const areaRadius = parseInt(document.getElementById('areaRadius')?.value) || 0;
                
                // Récupérer les informations de la tablette
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
                    if (tabletSelectorText.hasAttribute('data-i18n')) {
                        presetInfo = 'i18n:' + tabletSelectorText.getAttribute('data-i18n');
                    } else {
                        presetInfo = tabletSelectorText.textContent;
                    }
                }
                
                // Créer l'objet de mise à jour
                const updatedData = {
                    width: !isNaN(areaWidth) ? areaWidth : appState.originalValues.width,
                    height: !isNaN(areaHeight) ? areaHeight : appState.originalValues.height,
                    x: !isNaN(areaOffsetX) ? areaOffsetX : appState.originalValues.x,
                    y: !isNaN(areaOffsetY) ? areaOffsetY : appState.originalValues.y,
                    ratio: !isNaN(customRatio) ? customRatio : appState.originalValues.ratio,
                    tabletW: !isNaN(tabletWidth) ? tabletWidth : appState.originalValues.tabletW,
                    tabletH: !isNaN(tabletHeight) ? tabletHeight : appState.originalValues.tabletH,
                    presetInfo: presetInfo || appState.originalValues.presetInfo,
                    title: appState.originalValues.title,
                    description: appState.originalValues.description,
                    radius: !isNaN(areaRadius) ? areaRadius : (appState.originalValues.radius || 0),
                    lastModified: new Date().getTime()
                };
                
                // Mettre à jour le favori
                if (typeof FavoritesUI !== 'undefined' && typeof FavoritesUI.updateFavorite === 'function') {
                    const success = FavoritesUI.updateFavorite(appState.editingFavoriteId, updatedData);
                    
                    if (success) {
                        // Rafraîchir la liste des favoris
                        FavoritesUI.cachedFavorites = null;
                        FavoritesUI.loadFavoritesWithAnimation();
                        
                        // Annuler le mode édition
                        FavoritesUI.cancelEditMode();
                        appState.cancelEditMode();
                        
                        // Rétablir l'apparence du bouton
                        saveButton.textContent = "Sauvegarder";
                        saveButton.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
                        saveButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
                        
                        // Notification
                        if (typeof Notifications !== 'undefined' && Notifications.success) {
                            Notifications.success('Configuration mise à jour');
                        }
                    }
                }
            } else {
                // En mode création, on appelle normalement saveFavorite
                if (typeof FavoritesUI !== 'undefined' && typeof FavoritesUI.saveFavorite === 'function') {
                    console.log('Bouton de sauvegarde cliqué - appelant FavoritesUI.saveFavorite()');
                    FavoritesUI.saveFavorite();
                } else {
                    console.error('FavoritesUI ou sa méthode saveFavorite n\'est pas disponible');
                }
            }
        });
    }
    
    // Prevent the browser context menu on the entire page
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Ensure the context menu is initialized after the visualizer
    setTimeout(() => {
        ContextMenu.init();
        console.log('Context menu initialized from the DOM loading');
    }, 500);

    // Handling of the collapsible recap menu
    const recapCard = document.getElementById('recap-card');
    const recapToggle = document.getElementById('recap-toggle');
    const recapContent = document.getElementById('recap-content');
    const recapArrow = document.getElementById('recap-arrow');
    
    // Initial state: collapsed
    let isRecapExpanded = false;
    
    // Function to update the visual state
    const updateRecapState = () => {
        if (isRecapExpanded) {
            // Expand the content
            const contentHeight = recapContent.scrollHeight;
            recapContent.style.maxHeight = `${contentHeight}px`;
            recapContent.style.opacity = '1';
            recapContent.classList.add('border-t', 'border-gray-800', 'mt-2', 'pt-2');
            recapArrow.style.transform = 'rotate(0deg)';
            recapCard.classList.add('bg-gray-850');
            recapCard.classList.remove('bg-gray-900');
            recapCard.classList.remove('cursor-pointer');
            recapToggle.classList.remove('py-1');
            recapToggle.classList.add('py-2');
            
            // Update the height after a short delay to handle content changes
            setTimeout(() => {
                recapContent.style.maxHeight = `${recapContent.scrollHeight}px`;
            }, 50);
        } else {
            // Collapse the content
            recapContent.style.maxHeight = '0';
            recapContent.style.opacity = '0';
            recapContent.classList.remove('border-t', 'border-gray-800', 'mt-2', 'pt-2');
            recapArrow.style.transform = 'rotate(180deg)';
            recapCard.classList.remove('bg-gray-850');
            recapCard.classList.add('bg-gray-900');
            recapCard.classList.add('cursor-pointer');
            recapToggle.classList.remove('py-2');
            recapToggle.classList.add('py-1');
        }
    };
    
    // Initialize the state
    recapContent.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
    updateRecapState();
    
    // Handle the click on the title
    recapToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the propagation to the parent
        
        // Toggle the state
        isRecapExpanded = !isRecapExpanded;
        updateRecapState();
        
        // Visual effect on the click
        const ripple = document.createElement('div');
        ripple.className = 'bg-gray-700/30 absolute rounded-full pointer-events-none';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.left = (e.offsetX - 10) + 'px';
        ripple.style.top = (e.offsetY - 10) + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.6s, opacity 0.6s';
        
        recapToggle.style.position = 'relative';
        recapToggle.style.overflow = 'hidden';
        recapToggle.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(40)';
            ripple.style.opacity = '0';
            
            setTimeout(() => {
                recapToggle.removeChild(ripple);
            }, 600);
        }, 10);
    });
    
    // Handle the click on the card when the menu is collapsed
    recapCard.addEventListener('click', (e) => {
        // Only process if the menu is collapsed and the click is not on the toggle
        if (!isRecapExpanded && !recapToggle.contains(e.target)) {
            isRecapExpanded = true;
            updateRecapState();
        }
    });
});