/**
 * Main application module
 */

// Global application state
const appState = {
    tabletData: [],
    editingFavoriteId: null,
    currentRatio: 1.0,
    
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
            this.populateTabletPresets();
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
        // Tablet presets
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        const tabletWidthGroup = document.getElementById('tablet-width-group');
        const tabletHeightGroup = document.getElementById('tablet-height-group');
        const tabletManualHr = document.getElementById('tablet-manual-hr');
        
        tabletPresetSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            const selectedOption = e.target.selectedOptions[0];
            
            if (selectedValue === 'custom') {
                tabletWidthGroup.classList.remove('hidden');
                tabletHeightGroup.classList.remove('hidden');
                tabletManualHr.classList.remove('hidden');
                this.cancelEditMode();
                return;
            }
            
            if (selectedValue && selectedOption.dataset.width) {
                const width = parseFloat(selectedOption.dataset.width);
                const height = parseFloat(selectedOption.dataset.height);
                
                if (!isNaN(width) && !isNaN(height)) {
                    tabletWidthInput.value = formatNumber(width);
                    tabletHeightInput.value = formatNumber(height);
                    tabletWidthGroup.classList.add('hidden');
                    tabletHeightGroup.classList.add('hidden');
                    tabletManualHr.classList.add('hidden');
                    this.cancelEditMode();
                    updateDisplay();
                }
            } else {
                tabletWidthGroup.classList.add('hidden');
                tabletHeightGroup.classList.add('hidden');
                tabletManualHr.classList.add('hidden');
            }
        });
        
        // Tablet dimensions
        tabletWidthInput.addEventListener('input', () => {
            tabletPresetSelect.value = 'custom';
            tabletWidthGroup.classList.remove('hidden');
            tabletHeightGroup.classList.remove('hidden');
            tabletManualHr.classList.remove('hidden');
            this.cancelEditMode();
            updateDisplay();
        });
        
        tabletHeightInput.addEventListener('input', () => {
            tabletPresetSelect.value = 'custom';
            tabletWidthGroup.classList.remove('hidden');
            tabletHeightGroup.classList.remove('hidden');
            tabletManualHr.classList.remove('hidden');
            this.cancelEditMode();
            updateDisplay();
        });
        
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
        
        // Start with default values
        updateDisplay();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    appState.init();
});