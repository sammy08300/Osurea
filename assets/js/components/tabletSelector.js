/**
 * Utility function to translate an i18n key with robust fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @returns {string} - The translation or a formatted default value
 */
function translateWithFallback(key) {
    // First try standard translation system
    let translated = null;
    
    try {
        if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
            translated = localeManager.translate(key);
            if (translated === key) translated = null; // Translation failed if it returns the key
        }
    } catch (e) {
        console.error("[ERROR] Translation failed for key:", key, e);
    }
    
    // If standard translation failed, use fallbacks
    if (!translated || translated.startsWith('i18n:')) {
        const htmlLang = document.documentElement.lang || 'fr';
        const lang = htmlLang.startsWith('en') ? 'en' : 
                    htmlLang.startsWith('es') ? 'es' : 'fr';
        
        // Manually defined translations for common keys
        const fallbackTranslations = {
            'select_model': {
                'en': 'Select a model',
                'es': 'Seleccionar modelo',
                'fr': 'Sélectionner un modèle'
            },
            'custom_dimensions': {
                'en': 'Custom dimensions',
                'es': 'Dimensiones personalizadas',
                'fr': 'Dimensions personnalisées'
            },
            'no_results': {
                'en': 'No results found',
                'es': 'No se encontraron resultados',
                'fr': 'Aucun résultat trouvé'
            },
            'search': {
                'en': 'Search',
                'es': 'Buscar',
                'fr': 'Rechercher'
            }
        };
        
        // Use fallback translation if available, otherwise format the key
        translated = fallbackTranslations[key]?.[lang] || 
                     key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1);
    }
    
    return translated;
}

/**
 * Tablet selector component with popup
 */
const TabletSelector = {
    // DOM elements
    elements: {
        selectorButton: null,
        selectorText: null,
        selectorPopup: null,
        brandsList: null,
        modelsList: null,
        customButton: null,
        searchInput: null,
        searchInputMobile: null
    },
    
    // Data
    state: {
        tabletData: [],
        selectedBrand: null,
        filteredModels: [],
        loadedFromPreferences: false
    },
    
    // Constants
    constants: {
        defaultTabletModel: 'CTL-472 Small (One by Wacom S)',
        defaultTabletBrand: 'Wacom'
    },
    
    /**
     * Initialize the tablet selector
     * @param {Array} tabletData - Data of the tablets from the tablets.json file
     */
    init(tabletData) {
        console.log('Initializing tablet selector...');
        
        // DOM elements recovery
        this.elements = {
            selectorButton: document.getElementById('tabletSelectorButton'),
            selectorText: document.getElementById('tabletSelectorText'),
            selectorPopup: document.getElementById('tabletSelectorPopup'),
            brandsList: document.getElementById('tabletBrandsList'),
            modelsList: document.getElementById('tabletModelsList'),
            customButton: document.getElementById('customTabletButton'),
            searchInput: document.getElementById('tabletSearch'),
            searchInputMobile: document.getElementById('tabletSearchMobile')
        };
        
        // Essential elements verification
        if (!this.elements.selectorButton || !this.elements.selectorText || 
            !this.elements.selectorPopup || !this.elements.brandsList || 
            !this.elements.modelsList || !this.elements.customButton) {
            console.error('Tablet selector: essential elements not found');
            return;
        }
        
        // Data storage
        this.state.tabletData = tabletData;
        
        this.initializeTranslations();
        this.loadInitialTablet();
        this.populateBrandsList();
        this.addEventListeners();
        
        // Listen for the preferences:loadTablet event
        document.addEventListener('preferences:loadTablet', (e) => {
            if (e.detail) {
                this.loadTabletFromPreferences(e.detail);
            }
        });
        
        console.log('Tablet selector successfully initialized');
        
        // Check once more if no tablet has been loaded
        setTimeout(() => this.ensureTabletIsLoaded(), 300);
    },
    
    /**
     * Initialize translations for UI elements
     */
    initializeTranslations() {
        // Translate search placeholders
        const { searchInput, searchInputMobile, customButton } = this.elements;
        
        if (searchInput?.hasAttribute('data-i18n-placeholder')) {
            const placeholderKey = searchInput.getAttribute('data-i18n-placeholder');
            searchInput.placeholder = translateWithFallback(placeholderKey);
        }
        
        if (searchInputMobile?.hasAttribute('data-i18n-placeholder')) {
            const placeholderKey = searchInputMobile.getAttribute('data-i18n-placeholder');
            searchInputMobile.placeholder = translateWithFallback(placeholderKey);
        }
        
        // Translate custom button
        if (customButton.hasAttribute('data-i18n')) {
            const buttonKey = customButton.getAttribute('data-i18n');
            customButton.textContent = translateWithFallback(buttonKey);
        }
    },
    
    /**
     * Load initial tablet value from preferences or default
     */
    loadInitialTablet() {
        const { selectorText, selectorButton } = this.elements;
        
        // Try to load from saved preferences
        let savedPrefs = null;
        try {
            savedPrefs = localStorage.getItem('Osu!reaPreferences_v2');
            if (savedPrefs) savedPrefs = JSON.parse(savedPrefs);
        } catch (e) { savedPrefs = null; }
        
        if (savedPrefs?.tablet?.brand && savedPrefs?.tablet?.model) {
            // Determine text to display by checking if model already includes brand
            const { brand, model } = savedPrefs.tablet;
            const displayText = model.includes(brand) ? model : `${brand} ${model}`;
            
            // Display the text
            selectorText.textContent = displayText;
            selectorText.title = displayText;
            
            // Store info on button for persistence
            selectorButton.dataset.tabletBrand = brand;
            selectorButton.dataset.tabletModel = model;
            this.state.loadedFromPreferences = true;
        } else if (selectorText.hasAttribute('data-i18n')) {
            // If no preferences, use translation
            const translationKey = selectorText.getAttribute('data-i18n');
            const translatedText = translateWithFallback(translationKey);
            selectorText.textContent = translatedText;
            selectorText.title = translatedText;
            
            // For new users, load default tablet immediately
            this.loadDefaultTablet();
        } else {
            selectorText.title = selectorText.textContent;
            this.loadDefaultTablet();
        }
    },
    
    /**
     * Ensure a tablet is loaded
     */
    ensureTabletIsLoaded() {
        const { selectorText } = this.elements;
        const currentText = selectorText.textContent;
        const defaultText = translateWithFallback('select_model');
        
        if ((currentText === defaultText || !currentText) && !this.state.loadedFromPreferences) {
            this.loadDefaultTablet();
        }
    },
    
    /**
     * Load tablet model from preferences
     * @param {Object} tabletData - Information about the tablet (brand, model, etc.)
     */
    loadTabletFromPreferences(tabletData) {
        if (!tabletData?.brand || !tabletData?.model) {
            return;
        }
        
        this.state.loadedFromPreferences = true;
        
        // Store data on button to avoid flash
        const { selectorButton } = this.elements;
        selectorButton.dataset.tabletBrand = tabletData.brand;
        selectorButton.dataset.tabletModel = tabletData.model;
        
        if (tabletData.isCustom) {
            // If it's a custom tablet, select custom mode
            this.selectCustomTablet();
            
            // Emit event to confirm loading
            document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                detail: { success: true, isCustom: true }
            }));
            return;
        }
        
        // Find tablet in database
        const tablet = this.state.tabletData.find(t => 
            t.brand === tabletData.brand && 
            t.model === tabletData.model
        );
        
        if (tablet) {
            // If found in database, select it
            this.selectBrand(tablet.brand);
            this.selectModel(tablet);
            
            // Emit event to confirm loading
            document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                detail: { success: true, tablet }
            }));
        } else if (this.hasValidDimensions(tabletData)) {
            // If not found but we have width and height
            const tempTablet = {
                brand: tabletData.brand,
                model: tabletData.model,
                width: tabletData.width,
                height: tabletData.height
            };
            
            // Apply directly
            this.selectModel(tempTablet);
            
            // Emit event to confirm loading
            document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                detail: { success: true, tablet: tempTablet }
            }));
        } else {
            // If no valid dimensions, load default tablet
            this.loadDefaultTablet();
            
            // Emit event to signal failure
            document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                detail: { success: false }
            }));
        }
    },
    
    /**
     * Check if tablet data has valid dimensions
     * @param {Object} tabletData - Tablet data
     * @returns {boolean} - Whether dimensions are valid
     */
    hasValidDimensions(tabletData) {
        return isValidNumber(tabletData.width) && isValidNumber(tabletData.height);
    },
    
    /**
     * Load the default tablet (CTL-472)
     */
    loadDefaultTablet() {
        const { tabletData } = this.state;
        const { defaultTabletBrand, defaultTabletModel } = this.constants;
        const { selectorButton } = this.elements;
        
        // Find default tablet in data
        const defaultTablet = tabletData.find(t => 
            t.brand === defaultTabletBrand && 
            t.model === defaultTabletModel
        );
        
        if (defaultTablet) {
            // Store data on button to avoid flash
            selectorButton.dataset.tabletBrand = defaultTablet.brand;
            selectorButton.dataset.tabletModel = defaultTablet.model;
            
            // Select default tablet
            this.selectBrand(defaultTablet.brand);
            this.selectModel(defaultTablet);
        } else if (tabletData.length > 0) {
            // If default not found, select first tablet
            selectorButton.dataset.tabletBrand = tabletData[0].brand;
            selectorButton.dataset.tabletModel = tabletData[0].model;
            
            this.selectBrand(tabletData[0].brand);
            this.selectModel(tabletData[0]);
        } else {
            console.error('Aucun modèle de tablette disponible!');
        }
    },
    
    /**
     * Add the event listeners
     */
    addEventListeners() {
        const { selectorButton, selectorPopup, customButton, searchInput, searchInputMobile } = this.elements;
        
        // Open/close the popup on button click
        selectorButton.addEventListener('click', () => this.togglePopup());
        
        // Custom dimensions
        customButton.addEventListener('click', () => {
            this.selectCustomTablet();
            this.hidePopup();
        });
        
        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        if (searchInputMobile) {
            searchInputMobile.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Close popup on outside click
        document.addEventListener('click', (e) => {
            if (selectorPopup.classList.contains('hidden')) return;
            
            if (!selectorPopup.contains(e.target) && !selectorButton.contains(e.target)) {
                this.hidePopup();
            }
        });
        
        // Close popup on scroll or resize
        document.addEventListener('scroll', () => this.hidePopup());
        window.addEventListener('resize', () => this.hidePopup());
    },
    
    /**
     * Handle the search in the tablets
     * @param {string} query - Search terms
     */
    handleSearch(query) {
        const { searchInput, searchInputMobile } = this.elements;
        query = query.toLowerCase().trim();
        
        // If search is empty, reset display
        if (!query) {
            this.populateBrandsList();
            if (this.state.selectedBrand) {
                this.selectBrand(this.state.selectedBrand);
            }
            return;
        }
        
        // Synchronize search fields if necessary
        if (searchInput && searchInput.value !== query) {
            searchInput.value = query;
        }
        if (searchInputMobile && searchInputMobile.value !== query) {
            searchInputMobile.value = query;
        }
        
        // Filter tablets matching the search
        this.state.filteredModels = this.state.tabletData.filter(tablet => 
            tablet.brand.toLowerCase().includes(query) ||
            tablet.model.toLowerCase().includes(query) ||
            `${tablet.width}x${tablet.height}`.includes(query)
        );
        
        // Display search results
        this.displaySearchResults();
    },
    
    /**
     * Display the search results
     */
    displaySearchResults() {
        const { brandsList, modelsList } = this.elements;
        const { filteredModels, selectedBrand } = this.state;
        
        // Clear both lists
        brandsList.innerHTML = '';
        modelsList.innerHTML = '';
        
        // If there are results
        if (filteredModels.length > 0) {
            // Get unique brands from results
            const brands = [...new Set(filteredModels.map(t => t.brand))].sort();
            
            // Display filtered brands
            this.renderBrandsList(brands);
            
            // Show models of selected brand or all models
            let modelsToShow = filteredModels;
            if (selectedBrand && brands.includes(selectedBrand)) {
                modelsToShow = filteredModels.filter(t => t.brand === selectedBrand);
            } else if (brands.length > 0) {
                // If selected brand not in results, select a new one
                this.state.selectedBrand = brands[0];
                modelsToShow = filteredModels.filter(t => t.brand === brands[0]);
                
                // Update visual display of brands
                this.updateActiveBrand(brands[0]);
            }
            
            // Display corresponding models
            this.displayModels(modelsToShow);
        } else {
            // No results
            const noResults = document.createElement('div');
            noResults.className = 'p-4 text-gray-400 text-center italic';
            noResults.textContent = translateWithFallback('no_results');
            modelsList.appendChild(noResults);
        }
    },
    
    /**
     * Render brands list with given brands
     * @param {Array} brands - List of brand names
     */
    renderBrandsList(brands) {
        const { brandsList } = this.elements;
        const { selectedBrand } = this.state;
        
        brands.forEach(brand => {
            const brandItem = document.createElement('div');
            brandItem.className = 'brand-item';
            if (brand === selectedBrand) {
                brandItem.classList.add('active');
            }
            
            brandItem.textContent = brand;
            brandItem.dataset.brand = brand;
            
            brandItem.addEventListener('click', () => {
                const isFiltered = this.state.filteredModels.length > 0;
                this.selectBrand(brand, isFiltered);
            });
            
            brandsList.appendChild(brandItem);
        });
    },
    
    /**
     * Update the active brand highlighting
     * @param {string} brand - Brand to highlight as active
     */
    updateActiveBrand(brand) {
        const { brandsList } = this.elements;
        const brandItems = brandsList.querySelectorAll('.brand-item');
        
        brandItems.forEach(item => {
            if (item.dataset.brand === brand) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    /**
     * Fill the brands list
     */
    populateBrandsList() {
        const { brandsList } = this.elements;
        const { tabletData, selectedBrand } = this.state;
        
        // Clear current list
        brandsList.innerHTML = '';
        
        // If no data, display message
        if (!tabletData || tabletData.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'p-4 text-gray-400 text-center italic';
            noData.textContent = 'Aucune donnée de tablette disponible';
            brandsList.appendChild(noData);
            return;
        }
        
        // Get unique brands
        const brands = [...new Set(tabletData.map(tablet => tablet.brand))].sort();
        
        // Render the brands list
        this.renderBrandsList(brands);
        
        // Select default brand if needed
        if (!selectedBrand && brands.length > 0) {
            this.selectBrand(brands[0]);
        } else if (selectedBrand) {
            // Display models for already selected brand
            this.selectBrand(selectedBrand);
        }
    },
    
    /**
     * Select a brand and display its models
     * @param {string} brand - Brand name
     * @param {boolean} filterSearch - Indicates if we filter by search results
     */
    selectBrand(brand, filterSearch = false) {
        // Update selected brand
        this.state.selectedBrand = brand;
        
        // Update visual highlighting
        this.updateActiveBrand(brand);
        
        // Filter models for this brand
        let models;
        if (filterSearch && this.state.filteredModels.length > 0) {
            models = this.state.filteredModels.filter(tablet => tablet.brand === brand);
        } else {
            models = this.state.tabletData.filter(tablet => tablet.brand === brand);
        }
        
        // Display models
        this.displayModels(models);
    },
    
    /**
     * Display the models in the list
     * @param {Array} models - List of models to display
     */
    displayModels(models) {
        const { modelsList } = this.elements;
        
        // Clear models list
        modelsList.innerHTML = '';
        
        if (models.length === 0) {
            const noModels = document.createElement('div');
            noModels.className = 'p-4 text-gray-400 text-center italic';
            noModels.textContent = 'Aucun modèle disponible';
            modelsList.appendChild(noModels);
            return;
        }
        
        // Create element for each model
        models.forEach(tablet => {
            const modelItem = this.createModelItem(tablet);
            modelsList.appendChild(modelItem);
        });
    },
    
    /**
     * Create a model list item
     * @param {Object} tablet - Tablet data object
     * @returns {HTMLElement} - The created model item
     */
    createModelItem(tablet) {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        
        // Create content with name and dimensions
        const modelName = document.createElement('div');
        modelName.className = 'text-gray-100';
        modelName.textContent = tablet.model;
        
        const modelDimensions = document.createElement('div');
        modelDimensions.className = 'text-sm text-gray-400';
        modelDimensions.textContent = `${tablet.width} × ${tablet.height} mm`;
        
        modelItem.appendChild(modelName);
        modelItem.appendChild(modelDimensions);
        
        // Store model data
        modelItem.dataset.brand = tablet.brand;
        modelItem.dataset.model = tablet.model;
        modelItem.dataset.width = tablet.width;
        modelItem.dataset.height = tablet.height;
        
        // Event on model click
        modelItem.addEventListener('click', () => {
            // Add temporary active class
            modelItem.classList.add('active');
            setTimeout(() => {
                this.selectModel(tablet);
                this.hidePopup();
            }, 150);
        });
        
        return modelItem;
    },
    
    /**
     * Select a tablet model
     * @param {Object} tablet - Object tablet with brand, model, width, height
     */
    selectModel(tablet) {
        // Get current tablet dimensions
        const currentTabletWidth = parseFloatSafe(document.getElementById('tabletWidth')?.value);
        const currentTabletHeight = parseFloatSafe(document.getElementById('tabletHeight')?.value);
        
        // Get current active area dimensions
        const currentAreaWidth = parseFloatSafe(document.getElementById('areaWidth')?.value);
        const currentAreaHeight = parseFloatSafe(document.getElementById('areaHeight')?.value);
        const currentOffsetX = parseFloatSafe(document.getElementById('areaOffsetX')?.value);
        const currentOffsetY = parseFloatSafe(document.getElementById('areaOffsetY')?.value);
        
        // Update button text with animation
        this.updateSelectorButtonText(tablet);
        
        // Update the dimensions fields
        this.updateDimensionFields(tablet, {
            currentTabletWidth,
            currentTabletHeight,
            currentAreaWidth,
            currentAreaHeight,
            currentOffsetX,
            currentOffsetY
        });
        
        // Trigger custom event to inform other components
        const event = new CustomEvent('tablet:selected', {
            detail: { tablet }
        });
        document.dispatchEvent(event);
    },
    
    /**
     * Update the selector button text
     * @param {Object} tablet - Selected tablet
     */
    updateSelectorButtonText(tablet) {
        const { selectorButton, selectorText } = this.elements;
        
        selectorButton.classList.add('updating');
        
        // Check if model already includes brand to avoid duplication
        const displayText = tablet.model.includes(tablet.brand) 
            ? tablet.model 
            : `${tablet.brand} ${tablet.model}`;
        
        selectorText.textContent = displayText;
        selectorText.title = displayText;
        
        // Store model and brand info on button for persistence
        selectorButton.dataset.tabletBrand = tablet.brand;
        selectorButton.dataset.tabletModel = tablet.model;
        
        setTimeout(() => {
            selectorButton.classList.remove('updating');
        }, 300);
    },
    
    /**
     * Update dimension fields based on selected tablet
     * @param {Object} tablet - Selected tablet
     * @param {Object} currentDimensions - Current dimensions
     */
    updateDimensionFields(tablet, currentDimensions) {
        const {
            currentTabletWidth, currentTabletHeight, 
            currentAreaWidth, currentAreaHeight,
            currentOffsetX, currentOffsetY
        } = currentDimensions;
        
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        
        if (tabletWidthInput && tabletHeightInput) {
            // Adapt active area if it's a tablet model change
            if (this.shouldAdaptActiveArea(currentDimensions, tablet)) {
                // Adapt active area intelligently for new model
                const oldTablet = { width: currentTabletWidth, height: currentTabletHeight };
                const newTablet = { width: tablet.width, height: tablet.height };
                const currentState = {
                    areaWidth: currentAreaWidth,
                    areaHeight: currentAreaHeight,
                    offsetX: currentOffsetX,
                    offsetY: currentOffsetY
                };
                
                // Adapt active area to new model
                const adaptedState = adaptAreaToNewTablet(currentState, oldTablet, newTablet);
                
                // Update fields with new values
                document.getElementById('areaWidth').value = formatNumber(adaptedState.areaWidth);
                document.getElementById('areaHeight').value = formatNumber(adaptedState.areaHeight);
                document.getElementById('areaOffsetX').value = formatNumber(adaptedState.offsetX, 3);
                document.getElementById('areaOffsetY').value = formatNumber(adaptedState.offsetY, 3);
            }
            
            // Update tablet dimensions
            tabletWidthInput.value = formatNumber(tablet.width);
            tabletHeightInput.value = formatNumber(tablet.height);
            
            // Hide manual fields
            if (tabletDimensionsContainer) {
                tabletDimensionsContainer.classList.add('hidden');
            }
            
            // Cancel edit mode if needed
            if (typeof appState !== 'undefined' && appState.cancelEditMode) {
                appState.cancelEditMode();
            }
            
            // Update display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }
    },
    
    /**
     * Check if active area should be adapted
     * @param {Object} currentDimensions - Current dimensions
     * @param {Object} tablet - New tablet
     * @returns {boolean} - Whether active area should be adapted
     */
    shouldAdaptActiveArea(currentDimensions, tablet) {
        const {
            currentTabletWidth, currentTabletHeight, 
            currentAreaWidth, currentAreaHeight,
            currentOffsetX, currentOffsetY
        } = currentDimensions;
        
        return isValidNumber(currentTabletWidth) && 
               isValidNumber(currentTabletHeight) &&
               isValidNumber(currentAreaWidth) && 
               isValidNumber(currentAreaHeight) &&
               isValidNumber(currentOffsetX) && 
               isValidNumber(currentOffsetY) &&
               (currentTabletWidth !== tablet.width || currentTabletHeight !== tablet.height);
    },
    
    /**
     * Select custom dimensions
     */
    selectCustomTablet() {
        const { selectorText, selectorButton } = this.elements;
        
        // Cancel edit mode if necessary
        if (typeof appState !== 'undefined' && appState.cancelEditMode) {
            appState.cancelEditMode();
        }
        
        // Update button text
        const customText = translateWithFallback('custom_dimensions');
        selectorText.textContent = customText;
        selectorText.title = customText;
        
        // Remove i18n attribute and add custom attribute
        selectorText.removeAttribute('data-i18n');
        selectorText.setAttribute('data-custom', 'true');
        
        // Clear tablet brand and model data
        delete selectorButton.dataset.tabletBrand;
        delete selectorButton.dataset.tabletModel;
        
        // Show dimensions fields
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        if (tabletDimensionsContainer) {
            tabletDimensionsContainer.classList.remove('hidden');
        }
        
        // Update display
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('tablet:custom'));
    },
    
    /**
     * Display or hide the popup
     */
    togglePopup() {
        const { selectorPopup } = this.elements;
        
        if (selectorPopup.classList.contains('hidden')) {
            this.showPopup();
        } else {
            this.hidePopup();
        }
    },
    
    /**
     * Display the popup
     */
    showPopup() {
        const { selectorPopup, searchInput, searchInputMobile } = this.elements;
        const { selectedBrand } = this.state;
        
        selectorPopup.classList.remove('hidden');
        
        // Reset search
        if (searchInput) searchInput.value = '';
        if (searchInputMobile) searchInputMobile.value = '';
        
        // Refresh models display
        if (selectedBrand) {
            this.selectBrand(selectedBrand);
        }
    },
    
    /**
     * Hide the popup
     */
    hidePopup() {
        this.elements.selectorPopup.classList.add('hidden');
    }
}; 