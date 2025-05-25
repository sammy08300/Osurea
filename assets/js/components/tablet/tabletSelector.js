/**
 * Utility function to translate an i18n key with robust fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @returns {string} - The translation or a formatted default value
 */
import { translateWithFallback } from '../../i18n-init.js';

/**
 * Tablet selector component with popup
 */
const TabletSelector = {
    // DOM elements
    elements: {},
    
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
        defaultTabletBrand: 'Wacom',
        selectors: {
            selectorButton: '#tabletSelectorButton',
            selectorText: '#tabletSelectorText',
            selectorPopup: '#tabletSelectorPopup',
            brandsList: '#tabletBrandsList',
            modelsList: '#tabletModelsList',
            customButton: '#customTabletButton',
            searchInput: '#tabletSearch',
            searchInputMobile: '#tabletSearchMobile',
            tabletWidth: '#tabletWidth',
            tabletHeight: '#tabletHeight',
            tabletDimensionsContainer: '#tablet-dimensions-container',
            areaWidth: '#areaWidth',
            areaHeight: '#areaHeight',
            areaOffsetX: '#areaOffsetX',
            areaOffsetY: '#areaOffsetY'
        }
    },
    
    /**
     * Initialize the tablet selector
     * @param {Array} tabletData - Data of the tablets from the tablets.json file
     */
    init(tabletData) {
        console.log('Initializing tablet selector...');
        console.log('Tablet data received:', tabletData ? tabletData.length : 'null', 'items');
        
        // DOM elements recovery
        this.initElements();
        
        // Essential elements verification
        if (!this.validateElements()) {
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
     * Initialize DOM elements
     */
    initElements() {
        const { selectors } = this.constants;
        this.elements = Object.fromEntries(
            Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)])
        );
    },
    
    /**
     * Validate essential elements
     * @returns {boolean} - Whether all essential elements are present
     */
    validateElements() {
        const essential = ['selectorButton', 'selectorText', 'selectorPopup', 'brandsList', 'modelsList', 'customButton'];
        return essential.every(elem => this.elements[elem]);
    },
    
    /**
     * Initialize translations for UI elements
     */
    initializeTranslations() {
        const { searchInput, searchInputMobile, customButton } = this.elements;
        
        this.translatePlaceholder(searchInput);
        this.translatePlaceholder(searchInputMobile);
        
        // Translate custom button
        this.translateElement(customButton);
    },
    
    /**
     * Translate placeholder of an element
     * @param {HTMLElement} element - Element to translate placeholder
     */
    translatePlaceholder(element) {
        if (element?.hasAttribute('data-i18n-placeholder')) {
            const placeholderKey = element.getAttribute('data-i18n-placeholder');
            element.placeholder = translateWithFallback(placeholderKey);
        }
    },
    
    /**
     * Translate text content of an element
     * @param {HTMLElement} element - Element to translate
     */
    translateElement(element) {
        if (element?.hasAttribute('data-i18n')) {
            const key = element.getAttribute('data-i18n');
            element.textContent = translateWithFallback(key);
        }
    },
    
    /**
     * Load initial tablet value from preferences or default
     */
    loadInitialTablet() {
        const { selectorText, selectorButton } = this.elements;
        
        // Try to load from saved preferences
        const savedPrefs = this.loadPreferences();
        
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
            this.translateElement(selectorText);
            
            // For new users, load default tablet immediately
            this.loadDefaultTablet();
        } else {
            selectorText.title = selectorText.textContent;
            this.loadDefaultTablet();
        }
    },
    
    /**
     * Load preferences from localStorage
     * @returns {Object|null} - Loaded preferences or null
     */
    loadPreferences() {
        try {
            const savedPrefs = localStorage.getItem('Osu!reaPreferences_v2');
            return savedPrefs ? JSON.parse(savedPrefs) : null;
        } catch (e) {
            return null;
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
            this.triggerPreferencesLoadedEvent(true, true);
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
            this.triggerPreferencesLoadedEvent(true, false, tablet);
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
            this.triggerPreferencesLoadedEvent(true, false, tempTablet);
        } else {
            // If no valid dimensions, load default tablet
            this.loadDefaultTablet();
            
            // Emit event to signal failure
            this.triggerPreferencesLoadedEvent(false);
        }
    },
    
    /**
     * Trigger preferences loaded event
     * @param {boolean} success - Whether loading was successful
     * @param {boolean} isCustom - Whether it's a custom tablet
     * @param {Object} tablet - Tablet data if available
     */
    triggerPreferencesLoadedEvent(success, isCustom = false, tablet = null) {
        const detail = { success };
        
        if (success) {
            detail.isCustom = isCustom;
            if (tablet) detail.tablet = tablet;
        }
        
        document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { detail }));
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
            console.error('No tablet models available!');
        }
    },
    
    /**
     * Add the event listeners
     */
    addEventListeners() {
        const { selectorButton, selectorPopup, customButton, searchInput, searchInputMobile } = this.elements;
        
        // Open/close the popup on button click
        selectorButton?.addEventListener('click', () => this.togglePopup());
        
        // Custom dimensions
        customButton?.addEventListener('click', () => {
            this.selectCustomTablet();
            this.hidePopup();
        });
        
        // Search functionality
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInputMobile?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Close popup on outside click, scroll, or resize
        this.addOutsideClickListener();
        document.addEventListener('scroll', () => this.hidePopup());
        window.addEventListener('resize', () => this.hidePopup());
    },
    
    /**
     * Add listener to close popup on outside click
     */
    addOutsideClickListener() {
        const { selectorPopup, selectorButton } = this.elements;
        
        document.addEventListener('click', (e) => {
            if (selectorPopup.classList.contains('hidden')) return;
            
            if (!selectorPopup.contains(e.target) && !selectorButton.contains(e.target)) {
                this.hidePopup();
            }
        });
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
        this.syncSearchFields(query, searchInput, searchInputMobile);
        
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
     * Synchronize search fields values
     * @param {string} query - Search query
     * @param {...HTMLInputElement} fields - Fields to synchronize
     */
    syncSearchFields(query, ...fields) {
        fields.forEach(field => {
            if (field && field.value !== query) {
                field.value = query;
            }
        });
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
            this.showNoResultsMessage(modelsList);
        }
    },
    
    /**
     * Display no results message
     * @param {HTMLElement} container - Container to add message to
     */
    showNoResultsMessage(container) {
        const noResults = document.createElement('div');
        noResults.className = 'p-4 text-gray-400 text-center italic';
        noResults.textContent = translateWithFallback('no_results');
        container.appendChild(noResults);
    },
    
    /**
     * Render brands list with given brands
     * @param {Array} brands - List of brand names
     */
    renderBrandsList(brands) {
        const { brandsList } = this.elements;
        const { selectedBrand } = this.state;
        
        brands.forEach(brand => {
            const brandItem = this.createBrandItem(brand, selectedBrand);
            brandsList.appendChild(brandItem);
        });
    },
    
    /**
     * Create a brand item element
     * @param {string} brand - Brand name
     * @param {string} selectedBrand - Currently selected brand
     * @returns {HTMLElement} - Brand item element
     */
    createBrandItem(brand, selectedBrand) {
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
        
        return brandItem;
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
        
        console.log('Populating brands list with data:', tabletData ? tabletData.length : 'null', 'items');
        
        // Clear current list
        brandsList.innerHTML = '';
        
        // If no data, display message
        if (!tabletData || tabletData.length === 0) {
            console.error('No tablet data available for brands list');
            const noData = document.createElement('div');
            noData.className = 'p-4 text-gray-400 text-center italic';
            noData.textContent = 'No tablet data available';
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
            this.showNoResultsMessage(modelsList);
            return;
        }
        
        // Create element for each model
        const fragment = document.createDocumentFragment();
        models.forEach(tablet => {
            const modelItem = this.createModelItem(tablet);
            fragment.appendChild(modelItem);
        });
        modelsList.appendChild(fragment);
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
        // Get current dimensions
        const dimensions = this.getCurrentDimensions();
        
        // Update button text with animation
        this.updateSelectorButtonText(tablet);
        
        // Update the dimensions fields
        this.updateDimensionFields(tablet, dimensions);
        
        // Trigger custom event to inform other components
        this.triggerTabletSelectedEvent(tablet);
    },
    
    /**
     * Get current dimensions from inputs
     * @returns {Object} - Object with current dimensions
     */
    getCurrentDimensions() {
        const getInputValue = id => parseFloatSafe(document.getElementById(id)?.value);
        
        return {
            currentTabletWidth: getInputValue('tabletWidth'),
            currentTabletHeight: getInputValue('tabletHeight'),
            currentAreaWidth: getInputValue('areaWidth'),
            currentAreaHeight: getInputValue('areaHeight'),
            currentOffsetX: getInputValue('areaOffsetX'),
            currentOffsetY: getInputValue('areaOffsetY')
        };
    },
    
    /**
     * Trigger tablet selected event
     * @param {Object} tablet - Selected tablet
     */
    triggerTabletSelectedEvent(tablet) {
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
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        
        if (!tabletWidthInput || !tabletHeightInput) return;
        
        // Adapt active area if it's a tablet model change
        if (this.shouldAdaptActiveArea(currentDimensions, tablet)) {
            this.adaptActiveArea(currentDimensions, tablet);
        }
        
        // Update tablet dimensions
        tabletWidthInput.value = formatNumber(tablet.width);
        tabletHeightInput.value = formatNumber(tablet.height);
        
        // Hide manual fields
        if (tabletDimensionsContainer) {
            tabletDimensionsContainer.classList.add('hidden');
        }
        
        // Cancel edit mode if needed
        this.cancelEditModeIfNeeded();
        
        // Update display
        this.updateDisplayIfAvailable();
    },
    
    /**
     * Cancel edit mode if available
     */
    cancelEditModeIfNeeded() {
        if (typeof appState !== 'undefined' && appState.cancelEditMode) {
            appState.cancelEditMode();
        }
    },
    
    /**
     * Update display if function is available
     */
    updateDisplayIfAvailable() {
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    },
    
    /**
     * Adapt active area to the new tablet dimensions
     * @param {Object} currentDimensions - Current dimensions
     * @param {Object} tablet - New tablet
     */
    adaptActiveArea(currentDimensions, tablet) {
        const {
            currentTabletWidth, currentTabletHeight, 
            currentAreaWidth, currentAreaHeight,
            currentOffsetX, currentOffsetY
        } = currentDimensions;
        
        const oldTablet = { width: currentTabletWidth, height: currentTabletHeight };
        const newTablet = { width: tablet.width, height: tablet.height };
        const currentState = {
            areaWidth: currentAreaWidth,
            areaHeight: currentAreaHeight,
            offsetX: currentOffsetX,
            offsetY: currentOffsetY
        };
        
        // Adapt active area to new model
        const adaptedState = ConstraintUtils.adaptAreaToNewTablet(currentState, oldTablet, newTablet);
        
        // Update fields with new values
        document.getElementById('areaWidth').value = formatNumber(adaptedState.areaWidth);
        document.getElementById('areaHeight').value = formatNumber(adaptedState.areaHeight);
        document.getElementById('areaOffsetX').value = formatNumber(adaptedState.offsetX, 3);
        document.getElementById('areaOffsetY').value = formatNumber(adaptedState.offsetY, 3);
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
        this.cancelEditModeIfNeeded();
        
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
        
        this.updateDisplayIfAvailable();
        
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

// Export the TabletSelector
export default TabletSelector;

// Make TabletSelector available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.TabletSelector = TabletSelector;
} 
