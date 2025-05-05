import localeManager from '../locales/index.js';

/**
 * LocaleSwitcher - Module responsible for the language change interface
 */
class LocaleSwitcher {
    constructor() {
        this.elements = null;
        this.eventListeners = {};
        this.isInitialized = false;
        this._initAttempts = 0;
    }
    
    /**
     * Retrieves and caches necessary DOM elements
     */
    getElements() {
        if (this.elements) return this.elements;
        
        this.elements = {
            selector: document.getElementById('locale-switcher'),
            button: document.getElementById('locale-button'),
            dropdown: document.getElementById('locale-dropdown'),
            selectedText: document.getElementById('selected-locale-text')
        };
        
        return this.elements;
    }
    
    /**
     * Initializes the language selector
     */
    init() {
        if (this.isInitialized) return;
        
        const { selector } = this.getElements();
        
        if (!this.validateElements()) {
            console.warn('LocaleSwitcher: Some required DOM elements are missing');
            return;
        }
        
        if (selector) {
            selector.style.visibility = 'hidden';
            selector.style.opacity = '0';
        }
        
        this.attemptInitialization();
    }
    
    /**
     * Checks if all necessary DOM elements are present
     */
    validateElements() {
        const elements = this.getElements();
        return Object.values(elements).every(el => el !== null);
    }
    
    /**
     * Attempts to initialize the selector, with retry if localeManager is not ready
     */
    attemptInitialization() {
        const MAX_ATTEMPTS = 20;
        this._initAttempts++;
        
        if (this._initAttempts > MAX_ATTEMPTS) {
            console.error('LocaleSwitcher: Unable to initialize after multiple attempts');
            return;
        }
        
        try {
            if (localeManager.getCurrentLocale()) {
                const { selector } = this.getElements();
                
                this.createDropdown();
                this.setupEventListeners();
                this.updateSelectedLocale();
                
                if (selector) {
                    selector.style.visibility = 'visible';
                    requestAnimationFrame(() => selector.style.opacity = '1');
                }
                
                this.isInitialized = true;
                this._initAttempts = 0;
            } else {
                setTimeout(() => this.attemptInitialization(), 50);
            }
        } catch (error) {
            console.error('LocaleSwitcher: Error during initialization', error);
            
            if (this._initAttempts < MAX_ATTEMPTS) {
                setTimeout(() => this.attemptInitialization(), 100);
            }
        }
    }
    
    /**
     * Creates the dropdown menu with all available languages
     */
    createDropdown() {
        const { dropdown } = this.getElements();
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        const currentLocale = localeManager.getCurrentLocale();
        const availableLocales = localeManager.getAvailableLocales();
        
        if (!availableLocales?.length) {
            console.warn('LocaleSwitcher: No available languages');
            return;
        }
        
        const getLocaleName = (locale) => {
            try {
                return localeManager.translate(`language_${locale}`) || locale;
            } catch {
                return locale;
            }
        };
        
        availableLocales.forEach(locale => {
            const option = document.createElement('div');
            option.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded text-center';
            option.setAttribute('data-locale', locale);
            option.setAttribute('role', 'menuitem');
            option.setAttribute('tabindex', '0');
            option.textContent = getLocaleName(locale);
            
            if (locale === currentLocale) {
                option.classList.add('bg-gray-750', 'text-osu-blue');
            }
            
            fragment.appendChild(option);
        });
        
        dropdown.appendChild(fragment);
    }
    
    /**
     * Sets up all event listeners for the language selector
     */
    setupEventListeners() {
        const { button, dropdown } = this.getElements();
        if (!button || !dropdown) return;
        
        this.removeEventListeners();
        
        // Improve accessibility
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('role', 'menu');
        
        // Toggle dropdown visibility
        this.eventListeners.buttonClick = (e) => {
            const isExpanded = dropdown.classList.toggle('hidden');
            button.setAttribute('aria-expanded', !isExpanded);
            e.stopPropagation();
        };
        
        // Keyboard support
        this.eventListeners.buttonKeydown = (e) => {
            if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                dropdown.classList.remove('hidden');
                button.setAttribute('aria-expanded', 'true');
                
                const firstOption = dropdown.querySelector('.locale-option');
                if (firstOption) firstOption.focus();
            }
        };
        
        // Handle locale selection
        this.eventListeners.dropdownClick = (e) => {
            const option = e.target.closest('.locale-option');
            if (!option) return;
            
            const locale = option.getAttribute('data-locale');
            if (locale) {
                try {
                    localeManager.setLocale(locale);
                    this.updateSelectedLocale();
                    dropdown.classList.add('hidden');
                    button.setAttribute('aria-expanded', 'false');
                    button.focus();
                } catch (error) {
                    console.error(`LocaleSwitcher: Error changing language to ${locale}`, error);
                }
            }
        };
        
        // Close dropdown when clicking elsewhere
        this.eventListeners.documentClick = () => {
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                button.setAttribute('aria-expanded', 'false');
            }
        };
        
        // Attach event listeners
        button.addEventListener('click', this.eventListeners.buttonClick);
        button.addEventListener('keydown', this.eventListeners.buttonKeydown);
        dropdown.addEventListener('click', this.eventListeners.dropdownClick);
        document.addEventListener('click', this.eventListeners.documentClick);
    }
    
    /**
     * Removes event listeners to prevent memory leaks
     */
    removeEventListeners() {
        const { button, dropdown } = this.getElements();
        
        Object.entries(this.eventListeners).forEach(([key, listener]) => {
            if (!listener) return;
            
            if (key === 'buttonClick' || key === 'buttonKeydown') {
                button?.removeEventListener(key.replace('button', '').toLowerCase(), listener);
            } else if (key === 'dropdownClick') {
                dropdown?.removeEventListener('click', listener);
            } else if (key === 'documentClick') {
                document.removeEventListener('click', listener);
            }
        });
        
        this.eventListeners = {};
    }
    
    /**
     * Updates the display of the selected language and highlights the current locale
     */
    updateSelectedLocale() {
        const { selectedText } = this.getElements();
        const currentLocale = localeManager.getCurrentLocale();
        
        if (!currentLocale) {
            console.warn('LocaleSwitcher: No current language set');
            return;
        }
        
        if (selectedText) {
            try {
                selectedText.textContent = localeManager.translate(`language_${currentLocale}`) || currentLocale;
            } catch {
                selectedText.textContent = currentLocale;
            }
        }
        
        document.querySelectorAll('.locale-option').forEach(option => {
            const locale = option.getAttribute('data-locale');
            const isSelected = locale === currentLocale;
            
            option.classList.toggle('bg-gray-750', isSelected);
            option.classList.toggle('text-osu-blue', isSelected);
        });
    }
    
    /**
     * Completely resets the language selector
     */
    reset() {
        this.destroy();
        this.init();
    }
    
    /**
     * Cleans up resources when destroying the component
     */
    destroy() {
        this.removeEventListeners();
        this.elements = null;
        this.isInitialized = false;
    }
}

// Create a single instance
const localeSwitcher = new LocaleSwitcher();

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    localeSwitcher.init();
});

// Export public functions and instance
export const createLocaleSwitcher = () => localeSwitcher.createDropdown();
export const updateLocaleSwitcher = () => localeSwitcher.updateSelectedLocale();
export default localeSwitcher;