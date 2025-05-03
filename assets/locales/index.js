import fr from './fr.js';
import en from './en.js';
import es from './es.js';

class LocaleManager {
  constructor() {
    this.translations = {
      fr,
      en,
      es
    };
    
    // Initialize with English as fallback
    this.currentLocale = 'en';
    
    try {
      // Get the user preference if it exists
      const savedLocale = this.getSafeLocalStorage('osureaLocale');
      
      // If a user preference exists and is valid, use it
      if (savedLocale && this.translations[savedLocale]) {
        this.currentLocale = savedLocale;
        // Update the page's lang attribute
        this.safeSetLang(this.currentLocale);
      } else {
        // If no saved preference, use browser detection
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
  
  // Secure method to access localStorage
  getSafeLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Error during access to localStorage:', e);
      return null;
    }
  }
  
  // Secure method to write to localStorage
  setSafeLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Error during writing to localStorage:', e);
      return false;
    }
  }
  
  // Secure method to set the document's lang attribute
  safeSetLang(lang) {
    try {
      if (document && document.documentElement) {
        document.documentElement.lang = lang;
      }
    } catch (e) {
      console.warn('Error during definition of lang attribute:', e);
    }
  }
  
  // Get the browser language as a 2-letter code (fr, en, etc.)
  getBrowserLanguage() {
    try {
      const browserLang = navigator && (navigator.language || navigator.userLanguage);
      if (browserLang) {
        // Return the first 2 characters (fr-FR -> fr)
        const langCode = browserLang.substring(0, 2).toLowerCase();
        // Check if this language is available
        return this.translations[langCode] ? langCode : null;
      }
    } catch (e) {
      console.warn('Error during browser language detection:', e);
    }
    return null;
  }
  
  // Get the current translation
  get() {
    // If no language is defined, use English as a temporary fallback
    return this.translations[this.currentLocale || 'en'];
  }
  
  // Get the current language (fr, en, etc.)
  getCurrentLocale() {
    // If no language is defined, use English as a temporary fallback
    return this.currentLocale || 'en';
  }
  
  // Change the language and update the page
  async setLocale(locale) {
    try {
      if (this.translations[locale]) {
        this.currentLocale = locale;
        // Always save the user's choice to localStorage
        this.setSafeLocalStorage('osureaLocale', locale);
        this.safeSetLang(locale);
        
        // Trigger an event to notify the language change
        try {
          const event = new CustomEvent('localeChanged', { detail: { locale } });
          document.dispatchEvent(event);
        } catch (e) {
          console.warn('Error creating the language change event:', e);
        }
        
        // Update the displayed texts
        await this.updatePageTranslations();
        
        return true;
      }
    } catch (e) {
      // Fallback to English if an error occurs
      this.setLocale('en');
      console.error('Error during language change:', e);
    }
    return false;
  }
  
  // Translate a key in the current language
  translate(key) {
    try {
      // If no language is defined, use English as a temporary fallback
      const translations = this.translations[this.currentLocale || 'en'];
      return (translations && translations[key]) || key; // Return the key if no translation
    } catch (e) {
      console.warn('Translation error for the key:', key, e);
      return key;
    }
  }
  
  // Update all texts on the page with translations
  async updatePageTranslations() {
    try {
      // Select all elements with the data-i18n attribute
      const elements = document.querySelectorAll('[data-i18n]');
      
      elements.forEach(element => {
        try {
          const key = element.getAttribute('data-i18n');
          const translation = this.translate(key);
          
          // Update the content of the element
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.placeholder) {
              element.placeholder = translation;
            } else {
              element.value = translation;
            }
          } else {
            element.textContent = translation;
          }
        } catch (e) {
          console.warn('Error during update of an element:', e);
        }
      });
      
      // Select all elements with the data-i18n-placeholder attribute
      const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
      
      placeholderElements.forEach(element => {
        try {
          const placeholderKey = element.getAttribute('data-i18n-placeholder');
          const placeholderTranslation = this.translate(placeholderKey);
          element.placeholder = placeholderTranslation;
        } catch (e) {
          console.warn('Error during update of a placeholder:', e);
        }
      });
      
      // Update the meta tags
      try {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.content = this.translate('app_description');
        }
        
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
          ogDescription.content = this.translate('app_description');
        }
      } catch (e) {
        console.warn('Error during update of meta tags:', e);
      }
      
      // Handle specifically the favorite popups
      try {
        const favoritePopup = document.getElementById('favorite-details-popup');
        if (favoritePopup) {
          // Trigger an event to update the popups
          const event = new CustomEvent('popup:created', { 
            detail: { popupId: 'favorite-details-popup' } 
          });
          document.dispatchEvent(event);
        }
        
        // Handle other specific popups if necessary
        const commentDialog = document.getElementById('comment-dialog');
        if (commentDialog) {
          const event = new CustomEvent('popup:created', { 
            detail: { popupId: 'comment-dialog' } 
          });
          document.dispatchEvent(event);
        }
      } catch (e) {
        console.warn('Error during update of popups:', e);
      }
      
      // This was causing an error because updateTranslations doesn't exist
      // Adding an empty implementation to avoid errors
      await this.updateTranslations();
    } catch (error) {
      console.error('Error during translation update:', error);
    }
  }
  
  // Empty implementation of updateTranslations to avoid errors
  async updateTranslations() {
    // This method was being called but was not implemented
    // This is a placeholder implementation that does nothing
    console.log('updateTranslations called but not implemented');
    return true;
  }
  
  // Give the list of available languages
  getAvailableLocales() {
    return Object.keys(this.translations);
  }
  
  // Reset the language preference and force the browser language detection
  async resetLocale() {
    try {
      // Delete the language preference from localStorage
      try {
        localStorage.removeItem('osureaLocale');
      } catch (e) {
        console.warn('Error during removal of language preference:', e);
      }
      
      // Reset the current language
      this.currentLocale = null;
      
      // Force the browser language detection if the function exists
      if (window.forceLanguageDetection && typeof window.forceLanguageDetection === 'function') {
        window.forceLanguageDetection();
      }
      
      // Perform the actual update after a brief delay for stability
      await this.setLocale(this.currentLocale);
    } catch (e) {
      console.error('Error resetting language:', e);
    }
  }
}

// Create a unique instance of the translation manager
const localeManager = new LocaleManager();

export default localeManager; 