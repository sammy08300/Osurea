/**
 * Main application module
 */

// Global application state
const appState = {
    tabletData: [],
    editingFavoriteId: null,
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
            
            // Initialiser le nouveau sélecteur de tablettes
            if (typeof TabletSelector !== 'undefined') {
                TabletSelector.init(this.tabletData);
            } else {
                // Fallback vers l'ancienne méthode si nécessaire
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
        
        console.warn('Utilisation de la méthode populateTabletPresets obsolète. Utilisez TabletSelector si possible.');
        
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
        // Tablet presets - ancienne méthode - gardée pour compatibilité
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
                // Si l'ancien sélecteur existe, mettre à jour sa valeur
                if (tabletPresetSelect) {
                    tabletPresetSelect.value = 'custom';
                }
                
                // Mettre à jour le texte du nouveau sélecteur
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText) {
                    selectorText.textContent = 'Dimensions personnalisées';
                    selectorText.title = 'Dimensions personnalisées';
                }
                
                // S'assurer que le conteneur de dimensions est visible
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
                // Si l'ancien sélecteur existe, mettre à jour sa valeur
                if (tabletPresetSelect) {
                    tabletPresetSelect.value = 'custom';
                }
                
                // Mettre à jour le texte du nouveau sélecteur
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText) {
                    selectorText.textContent = 'Dimensions personnalisées';
                    selectorText.title = 'Dimensions personnalisées';
                }
                
                // S'assurer que le conteneur de dimensions est visible
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
        const lockRatioCheckbox = document.getElementById('lockRatio');
        
        areaWidthInput.addEventListener('input', () => {
            this.cancelEditMode();
            
            if (lockRatioCheckbox.checked && this.currentRatio > 0 && !isNaN(this.currentRatio)) {
                const newHeight = parseFloatSafe(areaWidthInput.value) / this.currentRatio;
                if (!isNaN(newHeight) && newHeight >= 0) {
                    areaHeightInput.value = formatNumber(newHeight);
                }
            } else if (lockRatioCheckbox.checked) {
                // Recalculer et mettre à jour le ratio si le verrou est actif
                const width = parseFloatSafe(areaWidthInput.value);
                const height = parseFloatSafe(areaHeightInput.value);
                
                if (height > 0) {
                    this.currentRatio = width / height;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
            } else {
                // Appliquer la mise à jour du ratio avec délai quand le verrou n'est pas actif
                this.debouncedUpdateRatio();
            }
            
            updateDisplay();
        });
        
        areaHeightInput.addEventListener('input', () => {
            this.cancelEditMode();
            
            if (lockRatioCheckbox.checked && this.currentRatio > 0 && !isNaN(this.currentRatio)) {
                const newWidth = parseFloatSafe(areaHeightInput.value) * this.currentRatio;
                if (!isNaN(newWidth) && newWidth >= 0) {
                    areaWidthInput.value = formatNumber(newWidth);
                }
            } else if (lockRatioCheckbox.checked) {
                // Recalculer et mettre à jour le ratio si le verrou est actif
                const width = parseFloatSafe(areaWidthInput.value);
                const height = parseFloatSafe(areaHeightInput.value);
                
                if (height > 0) {
                    this.currentRatio = width / height;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
            } else {
                // Appliquer la mise à jour du ratio avec délai quand le verrou n'est pas actif
                this.debouncedUpdateRatio();
            }
            
            updateDisplay();
        });
        
        customRatioInput.addEventListener('input', () => {
            this.cancelEditMode();
            
            const newRatio = parseFloatSafe(customRatioInput.value);
            if (!isNaN(newRatio) && newRatio > 0) {
                this.currentRatio = newRatio;
                
                if (lockRatioCheckbox.checked) {
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
        
        // Ajouter un événement focus pour empêcher les mises à jour pendant l'édition directe
        customRatioInput.addEventListener('focus', () => {
            customRatioInput.dataset.editing = 'true';
        });
        
        customRatioInput.addEventListener('blur', () => {
            delete customRatioInput.dataset.editing;
            // Recalculer le ratio en fonction des dimensions actuelles si nécessaire
            if (!lockRatioCheckbox.checked) {
                this.debouncedUpdateRatio();
            }
        });
        
        lockRatioCheckbox.addEventListener('change', () => {
            if (lockRatioCheckbox.checked) {
                const width = parseFloatSafe(areaWidthInput.value);
                const height = parseFloatSafe(areaHeightInput.value);
                
                if (height > 0) {
                    this.currentRatio = width / height;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                } else {
                    const ratio = parseFloatSafe(customRatioInput.value);
                    if (!isNaN(ratio) && ratio > 0) {
                        this.currentRatio = ratio;
                    } else {
                        this.currentRatio = 1.0;
                        customRatioInput.value = formatNumber(this.currentRatio, 3);
                    }
                }
            }
            
            updateDisplay();
        });
        
        // Area position
        const areaOffsetXInput = document.getElementById('areaOffsetX');
        const areaOffsetYInput = document.getElementById('areaOffsetY');
        
        areaOffsetXInput.addEventListener('input', () => {
            this.cancelEditMode();
            updateDisplay();
        });
        
        areaOffsetYInput.addEventListener('input', () => {
            this.cancelEditMode();
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
            
            if (lockRatioCheckbox.checked) {
                const newWidth = parseFloatSafe(areaWidthInput.value);
                const newHeight = parseFloatSafe(areaHeightInput.value);
                
                if (newHeight > 0) {
                    this.currentRatio = newWidth / newHeight;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
            }
            
            updateDisplay();
        });
        
        centerButton.addEventListener('click', () => {
            this.cancelEditMode();
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
                    Notifications.success('Informations copiées !');
                })
                .catch(() => {
                    Notifications.error('Erreur lors de la copie');
                    console.error('Failed to copy text: ', info);
                });
        });
        
        saveButton.addEventListener('click', () => {
            Favorites.saveFavorite();
        });
        
        cancelEditBtn.addEventListener('click', () => {
            this.cancelEditMode();
        });
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
        if (!this.editingFavoriteId) return;
        
        this.editingFavoriteId = null;
        
        const saveBtn = document.getElementById('save-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        // Reset button styling
        saveBtn.textContent = "Sauvegarder Area";
        saveBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
        saveBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
        cancelEditBtn.classList.add('hidden');
    },
    
    /**
     * Initialize app components and load data
     */
    async init() {
        // Initialize notification system
        Notifications.init();
        
        // Load tablet data
        await this.loadTabletData();
        
        // Setup input event listeners
        this.setupInputListeners();
        
        // Initialize favorites
        Favorites.init();
        
        // Création d'une fonction debounce pour mettre à jour le ratio
        this.debouncedUpdateRatio = debounce(() => {
            const areaWidthInput = document.getElementById('areaWidth');
            const areaHeightInput = document.getElementById('areaHeight');
            const customRatioInput = document.getElementById('customRatio');
            const lockRatioCheckbox = document.getElementById('lockRatio');
            
            const width = parseFloatSafe(areaWidthInput.value);
            const height = parseFloatSafe(areaHeightInput.value);
            
            if (height > 0 && width > 0) {
                const calculatedRatio = width / height;
                // Ne pas mettre à jour si le verrou est activé ou si l'utilisateur édite directement le champ
                if (!lockRatioCheckbox.checked && !customRatioInput.dataset.editing && !customRatioInput.matches(':focus')) {
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
    
    // Empêcher le menu contextuel du navigateur sur toute la page
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // S'assurer que le menu contextuel est initialisé après le visualiseur
    setTimeout(() => {
        ContextMenu.init();
        console.log('Menu contextuel initialisé depuis le chargement du DOM');
    }, 500);

    // Gestion du menu dépliant du récapitulatif
    const recapToggle = document.getElementById('recap-toggle');
    const recapContent = document.getElementById('recap-content');
    const recapArrow = document.getElementById('recap-arrow');
    
    // État initial : plié
    let isRecapExpanded = false;
    
    // Fonction pour mettre à jour l'état visuel
    const updateRecapState = () => {
        if (isRecapExpanded) {
            recapContent.style.maxHeight = recapContent.scrollHeight + 'px';
            recapContent.style.opacity = '1';
            recapArrow.style.transform = 'rotate(0deg)';
        } else {
            recapContent.style.maxHeight = '0';
            recapContent.style.opacity = '0';
            recapArrow.style.transform = 'rotate(180deg)';
        }
    };
    
    // Initialiser l'état
    recapContent.style.transition = 'max-height 0.2s ease-in-out, opacity 0.2s ease-in-out';
    updateRecapState();
    
    // Gérer le clic
    recapToggle.addEventListener('click', () => {
        isRecapExpanded = !isRecapExpanded;
        updateRecapState();
    });
});