import localeManager from '../locales/index.js';
import { detectAndApplyBrowserLanguage } from './browser-language-detector.js';

/**
 * Robust utility function to translate an i18n key with fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @returns {string} - The translated text or a formatted default
 */
export function translateWithFallback(key) {
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
    
    // If standard translation failed, apply formatting or use browser language
    if (!translated || translated.startsWith('i18n:')) {
        const htmlLang = document.documentElement.lang || 'fr';
        let lang = 'fr'; // Default
        
        if (htmlLang.startsWith('en')) {
            lang = 'en';
        } else if (htmlLang.startsWith('es')) {
            lang = 'es';
        }
        
        // Try to get the translation from localeManager with the detected language
        if (localeManager && localeManager.translations && localeManager.translations[lang]) {
            try {
                // Handle hierarchical keys with dots
                if (key.includes('.')) {
                    const segments = key.split('.');
                    let current = localeManager.translations[lang];
                    
                    // Navigate the hierarchical structure
                    for (const segment of segments) {
                        if (current[segment] === undefined) {
                            return null; // Key path not found
                        }
                        current = current[segment];
                    }
                    
                    if (typeof current === 'string') {
                        return current; // Return the found translation
                    }
                } else {
                    // For flat keys
                    const langSpecificTranslation = localeManager.translations[lang][key];
                    if (langSpecificTranslation) {
                        return langSpecificTranslation;
                    }
                }
            } catch (e) {
                console.warn('Failed to get language-specific translation:', e);
            }
        }
        
        // Default formatting for unknown keys
        translated = key.replace(/_/g, ' ');
        // First letter capitalized
        translated = translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    return translated;
}

/**
 * Translates elements with data-i18n attributes
 * @param {HTMLElement} element - Element to translate or containing elements to translate
 */
function translateElement(element) {
    if (!element || element.nodeType !== 1) return;

    // Translate element itself if it has data-i18n attribute
    if (element.hasAttribute && element.hasAttribute('data-i18n')) {
        try {
            const key = element.getAttribute('data-i18n');
            element.textContent = localeManager.translate(key);
        } catch (e) {
            console.warn('Error translating element:', e);
        }
    }
    
    // Translate child elements with data-i18n
    if (element.querySelectorAll) {
        // Translate text content
        const elements = element.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            try {
                const key = el.getAttribute('data-i18n');
                el.textContent = localeManager.translate(key);
            } catch (e) {
                console.warn('Error translating child element:', e);
            }
        });
        
        // Translate placeholders
        const placeholderElements = element.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(el => {
            try {
                const key = el.getAttribute('data-i18n-placeholder');
                el.placeholder = localeManager.translate(key);
            } catch (e) {
                console.warn('Error translating placeholder:', e);
            }
        });
    }
}

/**
 * Observes DOM changes and applies translations to new elements
 */
function observeDOMChanges() {
    if (typeof MutationObserver === 'undefined') {
        console.warn('MutationObserver is not available in this browser');
        return;
    }
    
    const config = { childList: true, subtree: true };
    
    const callback = function(mutationsList) {
        try {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => translateElement(node));
                }
            }
        } catch (e) {
            console.warn('Error in MutationObserver callback:', e);
        }
    };
    
    const observer = new MutationObserver(callback);
    
    if (document && document.body) {
        observer.observe(document.body, config);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body) {
                observer.observe(document.body, config);
            }
        });
    }
}

/**
 * Sets up global translation functions
 */
function setupGlobalFunctions() {
    if (typeof window === 'undefined') return;
    
    // Make the robust translation function available globally
    window.translateWithFallback = translateWithFallback;
    
    // Global translation shorthand function
    window.__ = (key, defaultValue) => {
        try {
            const translation = localeManager.translate(key);
            return translation === key && defaultValue ? defaultValue : translation;
        } catch (e) {
            console.warn('Global translation error:', e);
            return defaultValue || key;
        }
    };
    
    // Expose function to force language detection
    window.forceLanguageDetection = () => {
        try {
            detectAndApplyBrowserLanguage(true);
            return true;
        } catch (e) {
            console.error('Error forcing language detection:', e);
            return false;
        }
    };
}

/**
 * Sets up event listeners for translation
 */
function setupEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Update translations when language changes
    document.addEventListener('localeChanged', () => {
        try {
            localeManager.updatePageTranslations();
        } catch (e) {
            console.warn('Error updating translations after language change:', e);
        }
    });

    // Translate newly added elements on demand
    document.addEventListener('i18n:translate', (event) => {
        try {
            if (event.detail && event.detail.element) {
                translateElement(event.detail.element);
            }
        } catch (e) {
            console.warn('Error processing i18n:translate event:', e); 
        }
    });
    
    // Handle popups specifically
    document.addEventListener('popup:created', (event) => {
        try {
            if (event.detail && event.detail.popupId) {
                const popup = document.getElementById(event.detail.popupId);
                if (popup) {
                    translateElement(popup);
                }
            }
        } catch (e) {
            console.warn('Error processing popup:created event:', e);
        }
    });
}

/**
 * Initializes the i18n system
 */
function initializeI18n() {
    try {
        // Setup global functions
        setupGlobalFunctions();
        
        // Detect and apply browser language
        detectAndApplyBrowserLanguage();
        
        // Apply translations to the page
        localeManager.updatePageTranslations();
        
        // Observe DOM changes for translation
        observeDOMChanges();
        
        // Setup event listeners
        setupEventListeners();
    } catch (e) {
        console.error('Error during translations initialization:', e);
    }
}

export default initializeI18n; 
