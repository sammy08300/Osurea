import localeManager from '../locales/index.js';

/**
 * LocaleSwitcher - Module responsible for the language change interface
 */
class LocaleSwitcher {
    constructor() {
        // DOM elements cache
        this.elements = null;
        
        // Reference to event listeners for cleanup
        this.eventListeners = {
            documentClick: null,
            buttonClick: null,
            buttonKeydown: null,
            dropdownClick: null
        };
        
        // Component state
        this.isInitialized = false;
    }
    
    /**
     * Retrieves and caches necessary DOM elements
     * @returns {Object} The DOM elements
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
        
        // Check if necessary elements exist
        if (!this.validateElements()) {
            console.warn('LocaleSwitcher: Some required DOM elements are missing');
            return;
        }
        
        // Initially hide the selector
        if (selector) {
            selector.style.visibility = 'hidden';
            selector.style.opacity = '0';
        }
        
        // Start initialization with retry mechanism
        this.attemptInitialization();
    }
    
    /**
     * Checks if all necessary DOM elements are present
     * @returns {boolean} True if all elements are present
     */
    validateElements() {
        const { selector, button, dropdown, selectedText } = this.getElements();
        return selector && button && dropdown && selectedText;
    }
    
    /**
     * Attempts to initialize the selector, with retry if localeManager is not ready
     */
    attemptInitialization() {
        // Limit the number of attempts to avoid infinite loops
        if (!this._initAttempts) this._initAttempts = 0;
        this._initAttempts++;
        
        // Abandon after 20 attempts (1 second)
        if (this._initAttempts > 20) {
            console.error('LocaleSwitcher: Unable to initialize after multiple attempts');
            return;
        }
        
        try {
            if (localeManager.getCurrentLocale()) {
                const { selector } = this.getElements();
                
                // Initialize all components
                this.createDropdown();
                this.setupEventListeners();
                this.updateSelectedLocale();
                
                // Display the selector with fade-in animation
                if (selector) {
                    selector.style.visibility = 'visible';
                    requestAnimationFrame(() => selector.style.opacity = '1');
                }
                
                this.isInitialized = true;
                this._initAttempts = 0; // Reset for future use
            } else {
                // Retry after a short delay
                setTimeout(() => this.attemptInitialization(), 50);
            }
        } catch (error) {
            console.error('LocaleSwitcher: Error during initialization', error);
            // Retry one last time after a longer delay
            if (this._initAttempts < 20) {
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
        
        // Clear existing options
        dropdown.innerHTML = '';
        
        // Create options with a fragment for better performance
        const fragment = document.createDocumentFragment();
        const currentLocale = localeManager.getCurrentLocale();
        const availableLocales = localeManager.getAvailableLocales();
        
        if (!availableLocales || availableLocales.length === 0) {
            console.warn('LocaleSwitcher: No available languages');
            return;
        }
        
        // Cache translations to avoid repeated calls
        const translations = {};
        availableLocales.forEach(locale => {
            try {
                translations[locale] = localeManager.translate(`language_${locale}`) || locale;
            } catch (error) {
                translations[locale] = locale;
            }
        });
        
        // Create options for each language
        availableLocales.forEach(locale => {
            const option = document.createElement('div');
            option.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded text-center';
            option.setAttribute('data-locale', locale);
            option.setAttribute('role', 'menuitem');
            option.setAttribute('tabindex', '0');
            
            // Use cached translation
            option.textContent = translations[locale];
            
            // Highlight current language
            if (locale === currentLocale) {
                option.classList.add('bg-gray-750', 'text-osu-blue');
            }
            
            fragment.appendChild(option);
        });
        
        // Add all options to the DOM in a single operation
        dropdown.appendChild(fragment);
    }
    
    /**
     * Sets up all event listeners for the language selector
     */
    setupEventListeners() {
        const { button, dropdown } = this.getElements();
        
        if (!button || !dropdown) return;
        
        // Clean up existing listeners if necessary
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
        button.addEventListener('click', this.eventListeners.buttonClick);
        
        // Keyboard support for accessibility
        this.eventListeners.buttonKeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                dropdown.classList.remove('hidden');
                button.setAttribute('aria-expanded', 'true');
                
                // Focus on the first option
                const firstOption = dropdown.querySelector('.locale-option');
                if (firstOption) firstOption.focus();
            }
        };
        button.addEventListener('keydown', this.eventListeners.buttonKeydown);
        
        // Use event delegation for language options
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
                    button.focus(); // Return focus to the button
                } catch (error) {
                    console.error(`LocaleSwitcher: Error changing language to ${locale}`, error);
                }
            }
        };
        dropdown.addEventListener('click', this.eventListeners.dropdownClick);
        
        // Close dropdown when clicking elsewhere
        this.eventListeners.documentClick = () => {
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                button.setAttribute('aria-expanded', 'false');
            }
        };
        document.addEventListener('click', this.eventListeners.documentClick);
    }
    
    /**
     * Removes event listeners to prevent memory leaks
     */
    removeEventListeners() {
        const { button, dropdown } = this.getElements();
        
        if (this.eventListeners.buttonClick && button) {
            button.removeEventListener('click', this.eventListeners.buttonClick);
        }
        
        if (this.eventListeners.buttonKeydown && button) {
            button.removeEventListener('keydown', this.eventListeners.buttonKeydown);
        }
        
        if (this.eventListeners.dropdownClick && dropdown) {
            dropdown.removeEventListener('click', this.eventListeners.dropdownClick);
        }
        
        if (this.eventListeners.documentClick) {
            document.removeEventListener('click', this.eventListeners.documentClick);
        }
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
            } catch (error) {
                console.warn(`LocaleSwitcher: Unable to translate language ${currentLocale}`, error);
                selectedText.textContent = currentLocale;
            }
        }
        
        // Update classes for all language options
        document.querySelectorAll('.locale-option').forEach(option => {
            const locale = option.getAttribute('data-locale');
            const isSelected = locale === currentLocale;
            
            option.classList.toggle('bg-gray-750', isSelected);
            option.classList.toggle('text-osu-blue', isSelected);
        });
    }
    
    /**
     * Completely resets the language selector
     * Useful after dynamic changes in the application
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

// Create a single instance of the language selector
const localeSwitcher = new LocaleSwitcher();

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    localeSwitcher.init();
});

/**
 * Public function to create the language selector
 * Maintained for compatibility with existing code
 */
function createLocaleSwitcher() {
    localeSwitcher.createDropdown();
}

/**
 * Public function to update the language selector
 * Maintained for compatibility with existing code
 */
function updateLocaleSwitcher() {
    localeSwitcher.updateSelectedLocale();
}

// Export public functions and instance
export { createLocaleSwitcher, updateLocaleSwitcher };
export default localeSwitcher;