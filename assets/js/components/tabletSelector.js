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

/**
 * Tablet selector component with popup
 */

const TabletSelector = {
    selectorButton: null,
    selectorText: null,
    selectorPopup: null,
    brandsList: null,
    modelsList: null,
    customButton: null,
    searchInput: null,
    searchInputMobile: null,
    tabletData: [],
    selectedBrand: null,
    filteredModels: [],
    defaultTabletModel: 'CTL-472 Small (One by Wacom S)',
    defaultTabletBrand: 'Wacom',
    
    /**
     * Initialize the tablet selector
     * @param {Array} tabletData - Data of the tablets from the tablets.json file
     */
    init(tabletData) {
        console.log('Initializing tablet selector...');
        
        // DOM elements recovery
        this.selectorButton = document.getElementById('tabletSelectorButton');
        this.selectorText = document.getElementById('tabletSelectorText');
        this.selectorPopup = document.getElementById('tabletSelectorPopup');
        this.brandsList = document.getElementById('tabletBrandsList');
        this.modelsList = document.getElementById('tabletModelsList');
        this.customButton = document.getElementById('customTabletButton');
        this.searchInput = document.getElementById('tabletSearch');
        this.searchInputMobile = document.getElementById('tabletSearchMobile');
        
        // Flag to track if tablet was loaded from preferences
        this.loadedFromPreferences = false;
        
        // Essential elements verification
        if (!this.selectorButton || !this.selectorText || !this.selectorPopup || 
            !this.brandsList || !this.modelsList || !this.customButton) {
            console.error('Tablet selector: essential elements not found');
            return;
        }
        
        // Data storage
        this.tabletData = tabletData;
        
        // Éviter d'afficher "Sélectionner un modèle" si on a des préférences sauvegardées
        let savedPrefs = null;
        try {
            savedPrefs = localStorage.getItem('Osu!reaPreferences_v2');
            if (savedPrefs) savedPrefs = JSON.parse(savedPrefs);
        } catch (e) { savedPrefs = null; }
        
        if (savedPrefs && savedPrefs.tablet && savedPrefs.tablet.brand && savedPrefs.tablet.model) {
            // Déterminer le texte à afficher en vérifiant si le modèle inclut déjà la marque
            let displayText = '';
            if (savedPrefs.tablet.model.includes(savedPrefs.tablet.brand)) {
                // Si le modèle contient déjà la marque, l'utiliser tel quel
                displayText = savedPrefs.tablet.model;
            } else {
                // Sinon, afficher la marque suivie du modèle
                displayText = `${savedPrefs.tablet.brand} ${savedPrefs.tablet.model}`;
            }
            
            // Afficher le texte
            this.selectorText.textContent = displayText;
            this.selectorText.title = displayText;
            
            // Stocker ces informations sur le bouton pour la persistance
            this.selectorButton.dataset.tabletBrand = savedPrefs.tablet.brand;
            this.selectorButton.dataset.tabletModel = savedPrefs.tablet.model;
            this.loadedFromPreferences = true;
        } else if (this.selectorText.hasAttribute('data-i18n')) {
            // Si pas de préférences, utiliser la traduction mais de façon optimisée
            // pour éviter le flash du texte par défaut
            const translationKey = this.selectorText.getAttribute('data-i18n');
            const translatedText = translateWithFallback(translationKey);
            this.selectorText.textContent = translatedText;
            this.selectorText.title = translatedText;
            
            // Pour les nouveaux utilisateurs, charger la tablette par défaut immédiatement
            this.loadDefaultTablet();
        } else {
            this.selectorText.title = this.selectorText.textContent;
            
            // Pour les nouveaux utilisateurs, charger la tablette par défaut immédiatement
            this.loadDefaultTablet();
        }
        
        // Translate search placeholders if they have data-i18n-placeholder attributes
        if (this.searchInput && this.searchInput.hasAttribute('data-i18n-placeholder')) {
            const placeholderKey = this.searchInput.getAttribute('data-i18n-placeholder');
            this.searchInput.placeholder = translateWithFallback(placeholderKey);
        }
        
        if (this.searchInputMobile && this.searchInputMobile.hasAttribute('data-i18n-placeholder')) {
            const placeholderKey = this.searchInputMobile.getAttribute('data-i18n-placeholder');
            this.searchInputMobile.placeholder = translateWithFallback(placeholderKey);
        }
        
        // Translate custom button if it has data-i18n attribute
        if (this.customButton.hasAttribute('data-i18n')) {
            const buttonKey = this.customButton.getAttribute('data-i18n');
            this.customButton.textContent = translateWithFallback(buttonKey);
        }
        
        // Brands list creation
        this.populateBrandsList();
        
        // Event listeners addition
        this.addEventListeners();
        
        // Listen for the preferences:loadTablet event
        document.addEventListener('preferences:loadTablet', (e) => {
            if (e.detail) {
                this.loadTabletFromPreferences(e.detail);
            }
        });
        
        console.log('Tablet selector successfully initialized');
        
        // Vérifier à nouveau si aucune tablette n'a été chargée
        // Ce timeout est maintenu pour s'assurer que toute l'initialisation est terminée
        setTimeout(() => {
            const currentText = this.selectorText.textContent;
            const defaultText = translateWithFallback('select_model');
            
            if ((currentText === defaultText || !currentText) && !this.loadedFromPreferences) {
                this.loadDefaultTablet();
            }
        }, 300);
    },
    
    /**
     * Load tablet model from preferences
     * @param {Object} tabletData - Information about the tablet (brand, model, etc.)
     */
    loadTabletFromPreferences(tabletData) {
        if (!tabletData || !tabletData.brand || !tabletData.model) {
            return;
        }
        
        this.loadedFromPreferences = true; // Marquer comme chargé depuis les préférences
        
        // Stockage immédiat des données sur le bouton pour éviter le flash
        this.selectorButton.dataset.tabletBrand = tabletData.brand;
        this.selectorButton.dataset.tabletModel = tabletData.model;
        
        if (tabletData.isCustom) {
            // If it's a custom tablet, just select custom mode
            this.selectCustomTablet();
            
            // Émettre un événement pour confirmer le chargement
            document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                detail: { success: true, isCustom: true }
            }));
            return;
        }
        
        // Find the tablet in our database
        const tablet = this.tabletData.find(t => 
            t.brand === tabletData.brand && 
            t.model === tabletData.model
        );
        
        if (tablet) {
            // If we found the tablet in our database, select it
            this.selectBrand(tablet.brand);
            this.selectModel(tablet);
            
            // Émettre un événement pour confirmer le chargement
            document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                detail: { success: true, tablet }
            }));
        } else {
            // If the tablet is not found in our database but we have width and height
            if (isValidNumber(tabletData.width) && isValidNumber(tabletData.height)) {
                // Create a temporary tablet object
                const tempTablet = {
                    brand: tabletData.brand,
                    model: tabletData.model,
                    width: tabletData.width,
                    height: tabletData.height
                };
                
                // Apply it directly
                this.selectModel(tempTablet);
                
                // Émettre un événement pour confirmer le chargement
                document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                    detail: { success: true, tablet: tempTablet }
                }));
            } else {
                // If we don't have valid dimensions, load the default tablet
                this.loadDefaultTablet();
                
                // Émettre un événement pour signaler l'échec
                document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { 
                    detail: { success: false }
                }));
            }
        }
    },
    
    /**
     * Load the default tablet (CTL-472)
     */
    loadDefaultTablet() {
        // Find the default tablet in the data
        const defaultTablet = this.tabletData.find(t => 
            t.brand === this.defaultTabletBrand && 
            t.model === this.defaultTabletModel
        );
        
        if (defaultTablet) {
            // Stockage immédiat des données sur le bouton pour éviter le flash
            this.selectorButton.dataset.tabletBrand = defaultTablet.brand;
            this.selectorButton.dataset.tabletModel = defaultTablet.model;
            
            // If the default tablet is found, select it
            this.selectBrand(defaultTablet.brand);
            this.selectModel(defaultTablet);
        } else {
            // If the default tablet is not found, just select the first tablet in the list
            if (this.tabletData.length > 0) {
                // Stockage immédiat des données sur le bouton pour éviter le flash
                this.selectorButton.dataset.tabletBrand = this.tabletData[0].brand;
                this.selectorButton.dataset.tabletModel = this.tabletData[0].model;
                
                this.selectBrand(this.tabletData[0].brand);
                this.selectModel(this.tabletData[0]);
            } else {
                console.error('Aucun modèle de tablette disponible!');
            }
        }
    },
    
    /**
     * Add the event listeners
     */
    addEventListeners() {
        // Open/close the popup on the button click
        this.selectorButton.addEventListener('click', () => {
            this.togglePopup();
        });
        
        // Custom dimensions
        this.customButton.addEventListener('click', () => {
            this.selectCustomTablet();
            this.hidePopup();
        });
        
        // Search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (this.searchInputMobile) {
            this.searchInputMobile.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Close the popup on outside click
        document.addEventListener('click', (e) => {
            if (this.selectorPopup.classList.contains('hidden')) return;
            
            // If we click outside the popup and the button
            if (!this.selectorPopup.contains(e.target) && !this.selectorButton.contains(e.target)) {
                this.hidePopup();
            }
        });
        
        // Close the popup on scroll or resize
        document.addEventListener('scroll', () => this.hidePopup());
        window.addEventListener('resize', () => this.hidePopup());
    },
    
    /**
     * Handle the search in the tablets
     * @param {string} query - Search terms
     */
    handleSearch(query) {
        query = query.toLowerCase().trim();
        
        // If the search is empty, reset the display
        if (!query) {
            // Reset the lists
            this.populateBrandsList();
            if (this.selectedBrand) {
                this.selectBrand(this.selectedBrand);
            }
            return;
        }
        
        // Synchronize the search fields if necessary
        if (this.searchInput && this.searchInput.value !== query) {
            this.searchInput.value = query;
        }
        if (this.searchInputMobile && this.searchInputMobile.value !== query) {
            this.searchInputMobile.value = query;
        }
        
        // Filter the tablets corresponding to the search
        this.filteredModels = this.tabletData.filter(tablet => {
            return tablet.brand.toLowerCase().includes(query) || 
                   tablet.model.toLowerCase().includes(query) ||
                   `${tablet.width}x${tablet.height}`.includes(query);
        });
        
        // Display the search results
        this.displaySearchResults();
    },
    
    /**
     * Display the search results
     */
    displaySearchResults() {
        // Clear the two lists
        this.brandsList.innerHTML = '';
        this.modelsList.innerHTML = '';
        
        // If there are results
        if (this.filteredModels.length > 0) {
            // Get the unique brands of the results
            const brands = [...new Set(this.filteredModels.map(t => t.brand))].sort();
            
            // Display the filtered brands
            brands.forEach(brand => {
                const brandItem = document.createElement('div');
                brandItem.className = 'brand-item';
                if (brand === this.selectedBrand) {
                    brandItem.classList.add('active');
                }
                
                brandItem.textContent = brand;
                brandItem.dataset.brand = brand;
                
                brandItem.addEventListener('click', () => {
                    this.selectBrand(brand, true);
                });
                
                this.brandsList.appendChild(brandItem);
            });
            
            // By default, show all models or those of the selected brand
            let modelsToShow = this.filteredModels;
            if (this.selectedBrand && brands.includes(this.selectedBrand)) {
                modelsToShow = this.filteredModels.filter(t => t.brand === this.selectedBrand);
            } else if (brands.length > 0) {
                // If the selected brand is not in the results, select a new one
                this.selectedBrand = brands[0];
                modelsToShow = this.filteredModels.filter(t => t.brand === this.selectedBrand);
                
                // Update the visual display of the brands
                const brandItems = this.brandsList.querySelectorAll('.brand-item');
                brandItems.forEach(item => {
                    if (item.dataset.brand === this.selectedBrand) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            // Display the corresponding models
            this.displayModels(modelsToShow);
        } else {
            // No results
            const noResults = document.createElement('div');
            noResults.className = 'p-4 text-gray-400 text-center italic';
            
            // Use translation for "No results found"
            noResults.textContent = translateWithFallback('no_results');
            
            this.modelsList.appendChild(noResults);
        }
    },
    
    /**
     * Fill the brands list
     */
    populateBrandsList() {
        // Clear the current list
        this.brandsList.innerHTML = '';
        
        // If no data, display a message
        if (!this.tabletData || this.tabletData.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'p-4 text-gray-400 text-center italic';
            noData.textContent = 'Aucune donnée de tablette disponible';
            this.brandsList.appendChild(noData);
            return;
        }
        
        // Get the unique brands
        const brands = [...new Set(this.tabletData.map(tablet => tablet.brand))].sort();
        
        // Create an element for each brand
        brands.forEach(brand => {
            const brandItem = document.createElement('div');
            brandItem.className = 'brand-item';
            if (brand === this.selectedBrand) {
                brandItem.classList.add('active');
            }
            
            brandItem.textContent = brand;
            brandItem.dataset.brand = brand;
            
            // Add an event listener
            brandItem.addEventListener('click', () => {
                this.selectBrand(brand);
            });
            
            this.brandsList.appendChild(brandItem);
        });
        
        // By default, display the first brand if no one is selected
        if (!this.selectedBrand && brands.length > 0) {
            this.selectBrand(brands[0]);
        } else if (this.selectedBrand) {
            // Display the models for the already selected brand
            this.selectBrand(this.selectedBrand);
        }
    },
    
    /**
     * Select a brand and display its models
     * @param {string} brand - Brand name
     * @param {boolean} filterSearch - Indicates if we filter by the search results
     */
    selectBrand(brand, filterSearch = false) {
        // Update the selected brand
        this.selectedBrand = brand;
        
        // Visual update of the selected elements
        const brandItems = this.brandsList.querySelectorAll('.brand-item');
        brandItems.forEach(item => {
            if (item.dataset.brand === brand) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Filter the models of this brand
        let models;
        if (filterSearch && this.filteredModels.length > 0) {
            models = this.filteredModels.filter(tablet => tablet.brand === brand);
        } else {
            models = this.tabletData.filter(tablet => tablet.brand === brand);
        }
        
        // Display the models
        this.displayModels(models);
    },
    
    /**
     * Display the models in the list
     * @param {Array} models - List of models to display
     */
    displayModels(models) {
        // Clear the models list
        this.modelsList.innerHTML = '';
        
        if (models.length === 0) {
            const noModels = document.createElement('div');
            noModels.className = 'p-4 text-gray-400 text-center italic';
            noModels.textContent = 'Aucun modèle disponible';
            this.modelsList.appendChild(noModels);
        } else {
            // Create an element for each model
            models.forEach(tablet => {
                const modelItem = document.createElement('div');
                modelItem.className = 'model-item';
                
                // Creation of the content with name and dimensions
                const modelName = document.createElement('div');
                modelName.className = 'text-gray-100';
                modelName.textContent = tablet.model;
                
                const modelDimensions = document.createElement('div');
                modelDimensions.className = 'text-sm text-gray-400';
                modelDimensions.textContent = `${tablet.width} × ${tablet.height} mm`;
                
                modelItem.appendChild(modelName);
                modelItem.appendChild(modelDimensions);
                
                // Storage of the model data
                modelItem.dataset.brand = tablet.brand;
                modelItem.dataset.model = tablet.model;
                modelItem.dataset.width = tablet.width;
                modelItem.dataset.height = tablet.height;
                
                // Event on the model click
                modelItem.addEventListener('click', () => {
                    // Add a temporary active class
                    modelItem.classList.add('active');
                    setTimeout(() => {
                        this.selectModel(tablet);
                        this.hidePopup();
                    }, 150);
                });
                
                this.modelsList.appendChild(modelItem);
            });
        }
    },
    
    /**
     * Select a tablet model
     * @param {Object} tablet - Object tablet with brand, model, width, height
     */
    selectModel(tablet) {
        // Get the current dimensions of the tablet
        const currentTabletWidth = parseFloatSafe(document.getElementById('tabletWidth')?.value);
        const currentTabletHeight = parseFloatSafe(document.getElementById('tabletHeight')?.value);
        
        // Get the current dimensions of the active area
        const currentAreaWidth = parseFloatSafe(document.getElementById('areaWidth')?.value);
        const currentAreaHeight = parseFloatSafe(document.getElementById('areaHeight')?.value);
        const currentOffsetX = parseFloatSafe(document.getElementById('areaOffsetX')?.value);
        const currentOffsetY = parseFloatSafe(document.getElementById('areaOffsetY')?.value);
        
        // Update the button text with an animation
        this.selectorButton.classList.add('updating');
        
        // Vérifier si le modèle inclut déjà la marque pour éviter la duplication
        let displayText = '';
        if (tablet.model.includes(tablet.brand)) {
            // Si le nom du modèle contient déjà la marque, l'utiliser tel quel
            displayText = tablet.model;
        } else {
            // Sinon, afficher la marque suivie du modèle
            displayText = `${tablet.brand} ${tablet.model}`;
        }
        
        this.selectorText.textContent = displayText;
        this.selectorText.title = displayText; // Add a title for the tooltip
        
        // Store the model and brand information on the button for persistence
        this.selectorButton.dataset.tabletBrand = tablet.brand;
        this.selectorButton.dataset.tabletModel = tablet.model;
        
        setTimeout(() => {
            this.selectorButton.classList.remove('updating');
        }, 300);
        
        // Update the dimensions fields
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        
        if (tabletWidthInput && tabletHeightInput) {
            // Adapt the active area if it is a tablet model change
            if (isValidNumber(currentTabletWidth) && isValidNumber(currentTabletHeight) &&
                isValidNumber(currentAreaWidth) && isValidNumber(currentAreaHeight) &&
                isValidNumber(currentOffsetX) && isValidNumber(currentOffsetY) &&
                (currentTabletWidth !== tablet.width || currentTabletHeight !== tablet.height)) {
                
                // Adapt the active area intelligently for the new model
                const oldTablet = { width: currentTabletWidth, height: currentTabletHeight };
                const newTablet = { width: tablet.width, height: tablet.height };
                const currentState = { 
                    areaWidth: currentAreaWidth, 
                    areaHeight: currentAreaHeight, 
                    offsetX: currentOffsetX, 
                    offsetY: currentOffsetY 
                };
                
                // Adapt the active area to the new model
                const adaptedState = adaptAreaToNewTablet(currentState, oldTablet, newTablet);
                
                // Update the fields with the new values
                document.getElementById('areaWidth').value = formatNumber(adaptedState.areaWidth);
                document.getElementById('areaHeight').value = formatNumber(adaptedState.areaHeight);
                document.getElementById('areaOffsetX').value = formatNumber(adaptedState.offsetX, 3);
                document.getElementById('areaOffsetY').value = formatNumber(adaptedState.offsetY, 3);
            }
            
            // Update the tablet dimensions
            tabletWidthInput.value = formatNumber(tablet.width);
            tabletHeightInput.value = formatNumber(tablet.height);
            
            // Hide the manual fields
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
        
        // Trigger a custom event to inform other components
        const event = new CustomEvent('tablet:selected', { 
            detail: { tablet } 
        });
        document.dispatchEvent(event);
    },
    
    /**
     * Select custom dimensions
     */
    selectCustomTablet() {
        // Cancel edit mode if necessary
        if (typeof appState !== 'undefined' && appState.cancelEditMode) {
            appState.cancelEditMode();
        }
        
        // Update the button text
        const customText = translateWithFallback('custom_dimensions');
        this.selectorText.textContent = customText;
        this.selectorText.title = customText;
        
        // Remove the i18n data attribute and add a custom attribute to mark as customized
        this.selectorText.removeAttribute('data-i18n');
        this.selectorText.setAttribute('data-custom', 'true');
        
        // Clear the tablet brand and model data
        delete this.selectorButton.dataset.tabletBrand;
        delete this.selectorButton.dataset.tabletModel;
        
        // Show the dimensions fields
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        if (tabletDimensionsContainer) {
            tabletDimensionsContainer.classList.remove('hidden');
        }
        
        // Update the display
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Trigger a custom event to notify other components
        const event = new CustomEvent('tablet:custom');
        document.dispatchEvent(event);
    },
    
    /**
     * Display or hide the popup
     */
    togglePopup() {
        if (this.selectorPopup.classList.contains('hidden')) {
            this.showPopup();
        } else {
            this.hidePopup();
        }
    },
    
    /**
     * Display the popup
     */
    showPopup() {
        this.selectorPopup.classList.remove('hidden');
        
        // Reset the search
        if (this.searchInput) this.searchInput.value = '';
        if (this.searchInputMobile) this.searchInputMobile.value = '';
        
        // Refresh the models display
        if (this.selectedBrand) {
            this.selectBrand(this.selectedBrand);
        }
    },
    
    /**
     * Hide the popup
     */
    hidePopup() {
        this.selectorPopup.classList.add('hidden');
    }
}; 