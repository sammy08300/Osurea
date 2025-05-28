import { translateWithFallback } from '../../i18n-init';
import { adaptAreaToNewTablet } from '../../utils/constraintHelpers';
import { appState } from '../../app'; // Import appState

// Define interfaces for the data structures
export interface Tablet {
    brand: string;
    model: string;
    width: number;
    height: number;
    isCustom?: boolean; // Optional for custom tablets
}

interface TabletSelectorState {
    tabletData: Tablet[];
    selectedBrand: string | null;
    filteredModels: Tablet[];
    loadedFromPreferences: boolean;
}

interface DOMElements {
    [key: string]: HTMLElement | null;
}

interface TabletSelectorConstants {
    defaultTabletModel: string;
    defaultTabletBrand: string;
    selectors: { [key: string]: string };
}

// Helper function types (assuming these are defined elsewhere or can be defined here)
declare function parseFloatSafe(value: string | undefined): number;
declare function isValidNumber(value: any): value is number; // Type guard
declare function formatNumber(value: number, precision?: number): string;

// Global state/functions (assuming these exist and might be typed elsewhere)
// declare const appState: { cancelEditMode?: () => void } | undefined;
declare function updateDisplay(): void;

const TabletSelector = {
    elements: {} as DOMElements,
    state: {
        tabletData: [],
        selectedBrand: null,
        filteredModels: [],
        loadedFromPreferences: false
    } as TabletSelectorState,
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
            tabletWidth: '#tabletWidth',
            tabletHeight: '#tabletHeight',
            tabletDimensionsContainer: '#tablet-dimensions-container',
            areaWidth: '#areaWidth',
            areaHeight: '#areaHeight',
            areaOffsetX: '#areaOffsetX',
            areaOffsetY: '#areaOffsetY'
        }
    } as TabletSelectorConstants,
    
    init(tabletData: Tablet[]): void {
        console.log('TabletSelector init received tabletData:', tabletData);
        this.initElements();
        if (!this.validateElements()) {
            console.error('Tablet selector: essential elements not found');
            return;
        }
        this.state.tabletData = tabletData;
        this.initializeTranslations();
        this.loadInitialTablet();
        this.populateBrandsList();
        this.addEventListeners();
        
        document.addEventListener('preferences:loadTablet', (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) {
                this.loadTabletFromPreferences(detail as Tablet & {isCustom?: boolean});
            }
        });
        setTimeout(() => this.ensureTabletIsLoaded(), 300);
    },
    
    initElements(): void {
        const { selectors } = this.constants;
        this.elements = Object.fromEntries(
            Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector) as HTMLElement | null])
        ) as DOMElements;
    },
    
    validateElements(): boolean {
        const essential = ['selectorButton', 'selectorText', 'selectorPopup', 'brandsList', 'modelsList', 'customButton'];
        return essential.every(elemKey => this.elements[elemKey]);
    },
    
    initializeTranslations(): void {
        this.translatePlaceholder(this.elements.searchInput as HTMLInputElement | null);
        this.translateElement(this.elements.customButton);
    },
    
    translatePlaceholder(element: HTMLInputElement | null): void {
        if (element?.hasAttribute('data-i18n-placeholder')) {
            const placeholderKey = element.getAttribute('data-i18n-placeholder');
            if (placeholderKey) element.placeholder = translateWithFallback(placeholderKey, '');
        }
    },
    
    translateElement(element: HTMLElement | null): void {
        if (element?.hasAttribute('data-i18n')) {
            const key = element.getAttribute('data-i18n');
            if (key) element.textContent = translateWithFallback(key, '');
        }
    },
    
    loadInitialTablet(): void {
        const { selectorText, selectorButton } = this.elements;
        if (!selectorText || !selectorButton) return;

        const savedPrefs = this.loadPreferences();
        
        if (savedPrefs?.tablet?.brand && savedPrefs?.tablet?.model) {
            const { brand, model } = savedPrefs.tablet as {brand: string, model: string};
            const displayText = model.includes(brand) ? model : `${brand} ${model}`;
            selectorText.textContent = displayText;
            selectorText.title = displayText;
            (selectorButton as HTMLElement).dataset.tabletBrand = brand;
            (selectorButton as HTMLElement).dataset.tabletModel = model;
            this.state.loadedFromPreferences = true;
        } else if (selectorText.hasAttribute('data-i18n')) {
            this.translateElement(selectorText);
            this.loadDefaultTablet();
        } else {
            selectorText.title = selectorText.textContent || '';
            this.loadDefaultTablet();
        }
    },
    
    loadPreferences(): { tablet?: { brand: string, model: string } } | null {
        try {
            const savedPrefs = localStorage.getItem('Osu!reaPreferences_v2');
            return savedPrefs ? JSON.parse(savedPrefs) : null;
        } catch (e) {
            return null;
        }
    },
    
    ensureTabletIsLoaded(): void {
        const { selectorText } = this.elements;
        if (!selectorText) return;
        const currentText = selectorText.textContent;
        const defaultText = translateWithFallback('select_model', 'Select Model');
        
        if ((currentText === defaultText || !currentText) && !this.state.loadedFromPreferences) {
            this.loadDefaultTablet();
        }
    },
    
    loadTabletFromPreferences(tabletData: Tablet & {isCustom?: boolean, width?: number, height?: number}): void {
        if (!tabletData?.brand || !tabletData?.model) return;
        
        this.state.loadedFromPreferences = true;
        const { selectorButton } = this.elements;
        if(selectorButton) {
            (selectorButton as HTMLElement).dataset.tabletBrand = tabletData.brand;
            (selectorButton as HTMLElement).dataset.tabletModel = tabletData.model;
        }
        
        if (tabletData.isCustom) {
            this.selectCustomTablet();
            this.triggerPreferencesLoadedEvent(true, true);
            return;
        }
        
        const tablet = this.state.tabletData.find(t => t.brand === tabletData.brand && t.model === tabletData.model);
        
        if (tablet) {
            this.selectBrand(tablet.brand);
            this.selectModel(tablet);
            this.triggerPreferencesLoadedEvent(true, false, tablet);
        } else if (this.hasValidDimensions(tabletData)) {
             const tempTablet: Tablet = {
                brand: tabletData.brand,
                model: tabletData.model,
                width: tabletData.width!, // Assert non-null as per hasValidDimensions
                height: tabletData.height! // Assert non-null
            };
            this.selectModel(tempTablet);
            this.triggerPreferencesLoadedEvent(true, false, tempTablet);
        } else {
            this.loadDefaultTablet();
            this.triggerPreferencesLoadedEvent(false);
        }
    },
    
    triggerPreferencesLoadedEvent(success: boolean, isCustom: boolean = false, tablet: Tablet | null = null): void {
        const detail: {success: boolean, isCustom?: boolean, tablet?: Tablet} = { success };
        if (success) {
            detail.isCustom = isCustom;
            if (tablet) detail.tablet = tablet;
        }
        document.dispatchEvent(new CustomEvent('tablet:loaded-from-preferences', { detail }));
    },
    
    hasValidDimensions(tabletData: {width?: number, height?: number}): tabletData is {width: number, height: number} {
         return typeof tabletData.width === 'number' && !isNaN(tabletData.width) && 
               typeof tabletData.height === 'number' && !isNaN(tabletData.height);
    },
    
    loadDefaultTablet(): void {
        const { tabletData } = this.state;
        const { defaultTabletBrand, defaultTabletModel } = this.constants;
        const { selectorButton } = this.elements;
        if (!selectorButton) return;

        const defaultTablet = tabletData.find(t => t.brand === defaultTabletBrand && t.model === defaultTabletModel);
        
        if (defaultTablet) {
            (selectorButton as HTMLElement).dataset.tabletBrand = defaultTablet.brand;
            (selectorButton as HTMLElement).dataset.tabletModel = defaultTablet.model;
            this.selectBrand(defaultTablet.brand);
            this.selectModel(defaultTablet);
        } else if (tabletData.length > 0) {
            (selectorButton as HTMLElement).dataset.tabletBrand = tabletData[0].brand;
            (selectorButton as HTMLElement).dataset.tabletModel = tabletData[0].model;
            this.selectBrand(tabletData[0].brand);
            this.selectModel(tabletData[0]);
        } else {
            console.error('No tablet models available!');
        }
    },
    
    addEventListeners(): void {
        const { selectorButton, customButton, searchInput } = this.elements;
        selectorButton?.addEventListener('click', () => this.togglePopup());
        customButton?.addEventListener('click', () => { this.selectCustomTablet(); this.hidePopup(); });
        searchInput?.addEventListener('input', (e) => this.handleSearch((e.target as HTMLInputElement).value));
        this.addOutsideClickListener();
    },
    
    addOutsideClickListener(): void {
        const { selectorPopup, selectorButton } = this.elements;
        if (!selectorPopup || !selectorButton) return;

        document.addEventListener('click', (e: MouseEvent) => {
            if (selectorPopup.classList.contains('hidden')) return;
            if (!selectorPopup.contains(e.target as Node) && !selectorButton.contains(e.target as Node)) {
                this.hidePopup();
            }
        });
        
        const closePopup = () => {
            if (!selectorPopup.classList.contains('hidden')) this.hidePopup();
        };
        window.addEventListener('scroll', closePopup, { passive: true });
        window.addEventListener('resize', closePopup, { passive: true });
    },
    
    handleSearch(query: string): void {
        query = query.toLowerCase().trim();
        if (!query) {
            this.populateBrandsList();
            if (this.state.selectedBrand) this.selectBrand(this.state.selectedBrand);
            return;
        }
        this.state.filteredModels = this.state.tabletData.filter(tablet => 
            tablet.brand.toLowerCase().includes(query) ||
            tablet.model.toLowerCase().includes(query) ||
            `${tablet.width}x${tablet.height}`.includes(query)
        );
        this.displaySearchResults();
    },
    
    displaySearchResults(): void {
        const { brandsList, modelsList } = this.elements;
        const { filteredModels, selectedBrand } = this.state;
        if (!brandsList || !modelsList) return;

        brandsList.innerHTML = '';
        modelsList.innerHTML = '';
        
        if (filteredModels.length > 0) {
            const brands = [...new Set(filteredModels.map(t => t.brand))].sort();
            this.renderBrandsList(brands);
            
            let modelsToShow = filteredModels;
            if (selectedBrand && brands.includes(selectedBrand)) {
                modelsToShow = filteredModels.filter(t => t.brand === selectedBrand);
            } else if (brands.length > 0) {
                this.state.selectedBrand = brands[0];
                modelsToShow = filteredModels.filter(t => t.brand === brands[0]);
                this.updateActiveBrand(brands[0]);
            }
            this.displayModels(modelsToShow);
        } else {
            this.showNoResultsMessage(modelsList);
        }
    },
    
    showNoResultsMessage(container: HTMLElement): void {
        const noResults = document.createElement('div');
        noResults.className = 'p-4 text-gray-400 text-center italic';
        noResults.textContent = translateWithFallback('no_results', 'No results');
        container.appendChild(noResults);
    },
    
    renderBrandsList(brands: string[]): void {
        const { brandsList } = this.elements;
        const { selectedBrand } = this.state;
        if (!brandsList) return;
        brands.forEach(brand => brandsList.appendChild(this.createBrandItem(brand, selectedBrand)));
    },
    
    createBrandItem(brand: string, selectedBrand: string | null): HTMLElement {
        const brandItem = document.createElement('div');
        brandItem.className = 'brand-item';
        if (brand === selectedBrand) brandItem.classList.add('active');
        brandItem.textContent = brand;
        brandItem.dataset.brand = brand;
        brandItem.addEventListener('click', () => this.selectBrand(brand, this.state.filteredModels.length > 0));
        return brandItem;
    },
    
    updateActiveBrand(brand: string): void {
        const { brandsList } = this.elements;
        if (!brandsList) return;
        const brandItems = brandsList.querySelectorAll<HTMLElement>('.brand-item');
        brandItems.forEach(item => {
            item.classList.toggle('active', item.dataset.brand === brand);
        });
    },
    
    populateBrandsList(): void {
        const { brandsList } = this.elements;
        const { tabletData, selectedBrand } = this.state;
        if (!brandsList) return;
        brandsList.innerHTML = '';
        
        if (!tabletData || tabletData.length === 0) {
            console.error('No tablet data available for brands list');
            const noData = document.createElement('div');
            noData.className = 'p-4 text-gray-400 text-center italic';
            noData.textContent = 'No tablet data available';
            brandsList.appendChild(noData);
            return;
        }
        
        const brands = [...new Set(tabletData.map(tablet => tablet.brand))].sort();
        this.renderBrandsList(brands);
        
        if (!selectedBrand && brands.length > 0) {
            this.selectBrand(brands[0]);
        } else if (selectedBrand) {
            this.selectBrand(selectedBrand);
        }
    },
    
    selectBrand(brand: string, filterSearch: boolean = false): void {
        this.state.selectedBrand = brand;
        this.updateActiveBrand(brand);
        
        let models: Tablet[];
        if (filterSearch && this.state.filteredModels.length > 0) {
            models = this.state.filteredModels.filter(tablet => tablet.brand === brand);
        } else {
            models = this.state.tabletData.filter(tablet => tablet.brand === brand);
        }
        this.displayModels(models);
    },
    
    displayModels(models: Tablet[]): void {
        const { modelsList } = this.elements;
        if (!modelsList) return;
        modelsList.innerHTML = '';
        
        if (models.length === 0) {
            this.showNoResultsMessage(modelsList);
            return;
        }
        const fragment = document.createDocumentFragment();
        models.forEach(tablet => fragment.appendChild(this.createModelItem(tablet)));
        modelsList.appendChild(fragment);
    },
    
    createModelItem(tablet: Tablet): HTMLElement {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        
        const modelName = document.createElement('div');
        modelName.className = 'text-gray-100';
        modelName.textContent = tablet.model;
        
        const modelDimensions = document.createElement('div');
        modelDimensions.className = 'text-sm text-gray-400';
        modelDimensions.textContent = `${tablet.width} × ${tablet.height} mm`;
        
        modelItem.appendChild(modelName);
        modelItem.appendChild(modelDimensions);
        
        modelItem.dataset.brand = tablet.brand;
        modelItem.dataset.model = tablet.model;
        modelItem.dataset.width = tablet.width.toString();
        modelItem.dataset.height = tablet.height.toString();
        
        modelItem.addEventListener('click', () => {
            modelItem.classList.add('active');
            setTimeout(() => { this.selectModel(tablet); this.hidePopup(); }, 150);
        });
        return modelItem;
    },
    
    selectModel(tablet: Tablet): void {
        const dimensions = this.getCurrentDimensions();
        this.updateSelectorButtonText(tablet);
        this.updateDimensionFields(tablet, dimensions);
        this.triggerTabletSelectedEvent(tablet);
    },
    
    getCurrentDimensions(): { [key: string]: number } {
        const getInputValue = (id: string) => parseFloatSafe((document.getElementById(id) as HTMLInputElement | null)?.value);
        return {
            currentTabletWidth: getInputValue('tabletWidth'),
            currentTabletHeight: getInputValue('tabletHeight'),
            currentAreaWidth: getInputValue('areaWidth'),
            currentAreaHeight: getInputValue('areaHeight'),
            currentOffsetX: getInputValue('areaOffsetX'),
            currentOffsetY: getInputValue('areaOffsetY')
        };
    },
    
    triggerTabletSelectedEvent(tablet: Tablet): void {
        const event = new CustomEvent('tablet:selected', { detail: { tablet } });
        document.dispatchEvent(event);
    },
    
    updateSelectorButtonText(tablet: Tablet): void {
        const { selectorButton, selectorText } = this.elements;
        if (!selectorButton || !selectorText) return;

        selectorButton.classList.add('updating');
        const displayText = tablet.model.includes(tablet.brand) ? tablet.model : `${tablet.brand} ${tablet.model}`;
        selectorText.textContent = displayText;
        selectorText.title = displayText;
        (selectorButton as HTMLElement).dataset.tabletBrand = tablet.brand;
        (selectorButton as HTMLElement).dataset.tabletModel = tablet.model;
        setTimeout(() => selectorButton.classList.remove('updating'), 300);
    },
    
    updateDimensionFields(tablet: Tablet, currentDimensions: { [key: string]: number }): void {
        const tabletWidthInput = document.getElementById('tabletWidth') as HTMLInputElement | null;
        const tabletHeightInput = document.getElementById('tabletHeight') as HTMLInputElement | null;
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        
        if (!tabletWidthInput || !tabletHeightInput) return;
        
        if (this.shouldAdaptActiveArea(currentDimensions, tablet)) {
            this.adaptActiveArea(currentDimensions, tablet);
        }
        
        tabletWidthInput.value = formatNumber(tablet.width);
        tabletHeightInput.value = formatNumber(tablet.height);
        
        if (tabletDimensionsContainer) tabletDimensionsContainer.classList.add('hidden');
        this.cancelEditModeIfNeeded();
        this.updateDisplayIfAvailable();
    },
    
    cancelEditModeIfNeeded(): void {
        if (typeof appState !== 'undefined' && appState.cancelEditMode) {
            appState.cancelEditMode();
        }
    },
    
    updateDisplayIfAvailable(): void {
        if (typeof updateDisplay === 'function') updateDisplay();
    },
    
    adaptActiveArea(currentDimensions: { [key: string]: number }, tablet: Tablet): void {
        const { currentTabletWidth, currentTabletHeight, currentAreaWidth, currentAreaHeight, currentOffsetX, currentOffsetY } = currentDimensions;
        const oldTablet = { width: currentTabletWidth, height: currentTabletHeight };
        const newTablet = { width: tablet.width, height: tablet.height };
        const currentState = { areaWidth: currentAreaWidth, areaHeight: currentAreaHeight, offsetX: currentOffsetX, offsetY: currentOffsetY };
        
        const adaptedState = adaptAreaToNewTablet(currentState, oldTablet, newTablet);
        
        (document.getElementById('areaWidth') as HTMLInputElement).value = formatNumber(adaptedState.areaWidth);
        (document.getElementById('areaHeight') as HTMLInputElement).value = formatNumber(adaptedState.areaHeight);
        (document.getElementById('areaOffsetX') as HTMLInputElement).value = formatNumber(adaptedState.offsetX, 3);
        (document.getElementById('areaOffsetY') as HTMLInputElement).value = formatNumber(adaptedState.offsetY, 3);
    },
    
    shouldAdaptActiveArea(currentDimensions: { [key: string]: number }, tablet: Tablet): boolean {
        const { currentTabletWidth, currentTabletHeight, currentAreaWidth, currentAreaHeight, currentOffsetX, currentOffsetY } = currentDimensions;
        return isValidNumber(currentTabletWidth) && isValidNumber(currentTabletHeight) &&
               isValidNumber(currentAreaWidth) && isValidNumber(currentAreaHeight) &&
               isValidNumber(currentOffsetX) && isValidNumber(currentOffsetY) &&
               (currentTabletWidth !== tablet.width || currentTabletHeight !== tablet.height);
    },
    
    selectCustomTablet(): void {
        const { selectorText, selectorButton } = this.elements;
        if (!selectorText || !selectorButton) return;

        this.cancelEditModeIfNeeded();
        const customText = translateWithFallback('custom_dimensions', 'Custom Dimensions');
        selectorText.textContent = customText;
        selectorText.title = customText;
        selectorText.removeAttribute('data-i18n');
        selectorText.setAttribute('data-custom', 'true');
        
        delete (selectorButton as HTMLElement).dataset.tabletBrand;
        delete (selectorButton as HTMLElement).dataset.tabletModel;
        
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        if (tabletDimensionsContainer) tabletDimensionsContainer.classList.remove('hidden');
        
        this.updateDisplayIfAvailable();
        document.dispatchEvent(new CustomEvent('tablet:custom'));
    },
    
    togglePopup(): void {
        const { selectorPopup } = this.elements;
        if (!selectorPopup) return;
        selectorPopup.classList.contains('hidden') ? this.showPopup() : this.hidePopup();
    },
    
    showPopup(): void {
        const { selectorPopup, searchInput } = this.elements;
        const { selectedBrand } = this.state;
        if (!selectorPopup) return;

        selectorPopup.classList.remove('hidden');
        selectorPopup.style.left = '';
        selectorPopup.style.top = '';
        selectorPopup.style.width = '';
        
        if (searchInput) (searchInput as HTMLInputElement).value = '';
        if (selectedBrand) this.selectBrand(selectedBrand);
    },
    
    hidePopup(): void {
        this.elements.selectorPopup?.classList.add('hidden');
    }
};

export default TabletSelector;
