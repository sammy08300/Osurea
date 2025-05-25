import fr from './fr.js';
import en from './en.js';
import es from './es.js';

/**
 * Finds a translation value by its path key
 * @param {Object} locale - The translation object
 * @param {string} path - The path as a string (e.g., "app.title")
 * @param {Object} fallback - Fallback translation if key is not found
 * @returns {string} The translated value or the key if not found
 * @private
 */
function getTranslationByPath(locale, path, fallback = null) {
  if (!locale || !path) return path;
  
  try {
    // Split the path into segments (app.title -> ['app', 'title'])
    const segments = path.split('.');
    
    // Traverse the translation object to find the value
    let current = locale;
    for (const segment of segments) {
      if (current[segment] === undefined) {
        // If the segment doesn't exist, try the fallback
        if (fallback) {
          return getTranslationByPath(fallback, path);
        }
        return path;
      }
      current = current[segment];
    }
    
    return current;
  } catch (e) {
    console.warn(`Error getting translation for path: ${path}`, e);
    return fallback ? getTranslationByPath(fallback, path) : path;
  }
}

/**
 * Transforms a hierarchical translation into a flat object
 * @param {Object} locale - The hierarchical translation object
 * @param {string} prefix - Prefix for the keys
 * @returns {Object} A flat object with keys in "category_key" format
 * @private
 */
function flattenTranslations(locale, prefix = '') {
  if (!locale || typeof locale !== 'object') return {};
  
  const result = {};
  
  Object.entries(locale).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value && typeof value === 'object') {
      // If the value is an object, continue recursion
      Object.assign(result, flattenTranslations(value, newKey));
    } else {
      // Otherwise, add the key with its value
      result[newKey] = value;
    }
  });
  
  return result;
}

/**
 * Localization manager for the application
 * Handles loading, changing and using translations
 */
class LocaleManager {
  /**
   * Initializes the localization manager
   */
  constructor() {
    // Structured translations (new)
    this.translations = {
      fr,
      en,
      es
    };

    // Flattened translations for compatibility with old code
    this.flatTranslations = {
      fr: flattenTranslations(fr),
      en: flattenTranslations(en),
      es: flattenTranslations(es)
    };
    
    // List of available locales
    this.availableLocales = Object.keys(this.translations);
    
    // English by default
    this.currentLocale = 'en';
    
    // Locale initialization
    this.initializeLocale();
  }
  
  /**
   * Initializes locale from user preferences or browser
   * @private
   */
  initializeLocale() {
    try {
      // Get user preference
      const savedLocale = this.getSafeLocalStorage('osureaLocale');
      
      if (savedLocale && this.translations[savedLocale]) {
        // If a valid preference exists, use it
        this.currentLocale = savedLocale;
        this.safeSetLang(this.currentLocale);
      } else {
        // Otherwise, detect browser language
        const browserLang = this.getBrowserLanguage();
        if (browserLang) {
          this.currentLocale = browserLang;
          this.safeSetLang(this.currentLocale);
        }
      }
    } catch (e) {
      console.warn('Error during initialization of LocaleManager:', e);
    }
  }
  
  /**
   * Safely retrieves a value from localStorage
   * @param {string} key - Storage key
   * @returns {string|null} Stored value or null on error
   */
  getSafeLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Error during access to localStorage:', e);
      return null;
    }
  }
  
  /**
   * Safely writes a value to localStorage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {boolean} True if operation succeeded, false otherwise
   */
  setSafeLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Error during writing to localStorage:', e);
      return false;
    }
  }
  
  /**
   * Safely sets the document's lang attribute
   * @param {string} lang - 2-letter language code
   */
  safeSetLang(lang) {
    try {
      if (document && document.documentElement) {
        document.documentElement.lang = lang;
      }
    } catch (e) {
      console.warn('Error during definition of lang attribute:', e);
    }
  }
  
  /**
   * Detects browser language
   * @returns {string|null} 2-letter language code ou null si non supportée
   */
  getBrowserLanguage() {
    try {
      const browserLang = navigator && (navigator.language || navigator.userLanguage);
      if (browserLang) {
        // Get the first 2 characters (fr-FR -> fr)
        const langCode = browserLang.substring(0, 2).toLowerCase();
        // Check if this language is available
        return this.availableLocales.includes(langCode) ? langCode : null;
      }
    } catch (e) {
      console.warn('Error during browser language detection:', e);
    }
    return null;
  }
  
  /**
   * Gets the current translation
   * @returns {Object} Translation object
   */
  get() {
    return this.translations[this.currentLocale || 'en'];
  }
  
  /**
   * Gets the current translation au format plat (for backward compatibility)
   * @returns {Object} Translation object au format plat
   */
  getFlat() {
    return this.flatTranslations[this.currentLocale || 'en'];
  }
  
  /**
   * Gets the current locale
   * @returns {string} 2-letter language code
   */
  getCurrentLocale() {
    return this.currentLocale || 'en';
  }
  
  /**
   * Changes language and updates the page
   * @param {string} locale - 2-letter language code
   * @returns {Promise<boolean>} True if language was changed, false otherwise
   */
  async setLocale(locale) {
    try {
      if (this.translations[locale]) {
        this.currentLocale = locale;
        // Save user preference
        this.setSafeLocalStorage('osureaLocale', locale);
        this.safeSetLang(locale);
        
        // Trigger an event to notify language change
        this.triggerLocaleChangedEvent(locale);
        
        // Update displayed texts
        await this.updatePageTranslations();
        
        return true;
      }
    } catch (e) {
      console.error('Error during language change:', e);
      // In case of error, revert to English
      this.setLocale('en');
    }
    return false;
  }
  
  /**
   * Triggers a custom event for language change
   * @param {string} locale - Language code
   * @private
   */
  triggerLocaleChangedEvent(locale) {
    try {
      const event = new CustomEvent('localeChanged', { detail: { locale } });
      document.dispatchEvent(event);
    } catch (e) {
      console.warn('Error creating the language change event:', e);
    }
  }
  
  /**
   * Translates a key in the current language
   * @param {string} key - Translation key (can be a flat key or path)
   * @returns {string} Translated text or the key if not found
   */
  translate(key) {
    try {
      // If the key contains a dot, it's a path
      if (key.includes('.')) {
        return getTranslationByPath(this.get(), key, this.translations['en']) || key;
      }
      
      // Otherwise, try in flat translations (for backward compatibility)
      const flatTranslations = this.getFlat();
      return (flatTranslations && flatTranslations[key]) || key;
    } catch (e) {
      console.warn('Translation error for the key:', key, e);
      return key;
    }
  }
  
  /**
   * Updates all page texts with translations
   * @returns {Promise<boolean>} True if update succeeded
   */
  async updatePageTranslations() {
    try {
      this.updateTextElements();
      this.updatePlaceholderElements();
      this.updateMetaTags();
      this.updateSpecificPopups();
      
      // To avoid errors, we add this empty implementation
      await this.updateTranslations();
      
      return true;
    } catch (error) {
      console.error('Error during translation update:', error);
      return false;
    }
  }
  
  /**
   * Updates HTML elements with data-i18n attribute
   * @private
   */
  updateTextElements() {
    try {
      // Select all elements with data-i18n attribute
      const elements = document.querySelectorAll('[data-i18n]');
      
      elements.forEach(element => {
        try {
          const key = element.getAttribute('data-i18n');
          const translation = this.translate(key);
          
          // Update element content according to its type
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.placeholder) {
              element.placeholder = translation;
            } else {
              element.value = translation;
            }
          } else {
            // For other elements, update textContent
            element.textContent = translation;
            
            // Special case for buttons with SVG icons
            // If parent element is a button and contains SVGs, preserve SVGs
            if (element.parentElement && element.parentElement.tagName === 'BUTTON') {
              const button = element.parentElement;
              const svgs = button.querySelectorAll('svg');
              if (svgs.length > 0) {
                // Rebuild button content while preserving SVGs
                button.innerHTML = '';
                svgs.forEach(svg => button.appendChild(svg.cloneNode(true)));
                button.appendChild(element);
              }
            }
          }
        } catch (e) {
          console.warn('Error updating element:', e);
        }
      });
    } catch (e) {
      console.warn('Error during text elements update:', e);
    }
  }
  
  /**
   * Updates elements with translated placeholders
   * @private
   */
  updatePlaceholderElements() {
    try {
      // Select all elements with data-i18n attribute-placeholder
      const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
      
      placeholderElements.forEach(element => {
        try {
          const placeholderKey = element.getAttribute('data-i18n-placeholder');
          const placeholderTranslation = this.translate(placeholderKey);
          element.placeholder = placeholderTranslation;
        } catch (e) {
          console.warn('Error updating placeholder:', e);
        }
      });
    } catch (e) {
      console.warn('Error during placeholder update:', e);
    }
  }
  
  /**
   * Updates meta tags with translations
   * @private
   */
  updateMetaTags() {
    try {
      // Update description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.content = this.translate('app.description');
      }
      
      // Update description Open Graph
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.content = this.translate('app.description');
      }
    } catch (e) {
      console.warn('Error updating meta tags:', e);
    }
  }
  
  /**
   * Updates specific popups that require special attention
   * @private
   */
  updateSpecificPopups() {
    try {
      // Specifically handle favorite popups
      const favoritePopup = document.getElementById('favorite-details-popup');
      if (favoritePopup) {
        this.triggerPopupEvent('favorite-details-popup');
      }
      
      // Handle other specific popups if needed
      const commentDialog = document.getElementById('comment-dialog');
      if (commentDialog) {
        this.triggerPopupEvent('comment-dialog');
      }
    } catch (e) {
      console.warn('Error updating popups:', e);
    }
  }
  
  /**
   * Triggers a popup creation event to update its content
   * @param {string} popupId - Popup ID
   * @private
   */
  triggerPopupEvent(popupId) {
    try {
      const event = new CustomEvent('popup:created', { 
        detail: { popupId } 
      });
      document.dispatchEvent(event);
    } catch (e) {
      console.warn(`Error triggering popup event for ${popupId}:`, e);
    }
  }
  
  /**
   * Empty implementation of updateTranslations to avoid errors
   * @returns {Promise<boolean>} True (always)
   * @private
   */
  async updateTranslations() {
    console.log('updateTranslations called but not implemented');
    return true;
  }
  
  /**
   * Returns the list of available languages
   * @returns {Array<string>} List of available language codes
   */
  getAvailableLocales() {
    return this.availableLocales;
  }
  
  /**
   * Resets language preference and forces automatic detection
   * @returns {Promise<boolean>} True if operation succeeded
   */
  async resetLocale() {
    try {
      // Remove language preference from localStorage
      try {
        localStorage.removeItem('osureaLocale');
      } catch (e) {
        console.warn('Error removing language preference:', e);
      }
      
      // Reset current language
      this.currentLocale = null;
      
      // Force browser language detection if function exists
      if (window.forceLanguageDetection && typeof window.forceLanguageDetection === 'function') {
        window.forceLanguageDetection();
      }
      
      // Use browser-detected language
      const browserLang = this.getBrowserLanguage();
      this.currentLocale = browserLang || 'en';
      
      // Perform update after a brief delay for more stability
      await this.setLocale(this.currentLocale);
      return true;
    } catch (e) {
      console.error('Error resetting language:', e);
      return false;
    }
  }
}

// Create a unique instance of the translation manager
const localeManager = new LocaleManager();

export default localeManager; 
