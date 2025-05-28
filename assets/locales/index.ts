import frLocale from './fr.js';
import enLocale from './en.js';
import esLocale from './es.js';

// Define the Locale interface (copied from en.ts, as it's generic)
interface App {
    title: string;
    description: string;
}

interface Tablet {
    settings: string;
    model: string;
    selectModel: string;
    search: string;
    searchTablet: string;
    custom: string;
    customDimensions: string;
    width: string;
    height: string;
    units: string;
    rotation: string;
    degrees: string;
}

interface Area {
    settings: string;
    width: string;
    height: string;
    radius: string;
    ratio: string;
    lockRatio: string;
    position: string;
    positionX: string;
    positionY: string;
    center: string;
    swap: string;
    drag: string;
    rightClick: string;
}

interface Visual {
    options: string;
    showGrid: string;
    snapGrid: string;
    visualization: string;
}

interface Favorites {
    title: string;
    noFavorites: string;
    save: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    defaultName: string;
    saveButton: string;
    cancelButton: string;
    deleteButton: string;
    editButton: string;
    sortBy: string;
    sortDate: string;
    sortName: string;
    sortSize: string;
    sortModified: string;
    creationDate: string;
    lastModified: string;
    dates: string;
    dimensions: string;
    surfaceArea: string;
    load: string;
    deleteConfirm: string;
    warning: string;
    confirmModification: string;
    deleteWarning: string;
    itemTitle: string;
}

interface Summary {
    title: string;
    currentConfig: string;
    copyInfo: string;
    copied: string;
}

interface Alignment {
    title: string;
    center: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
}

interface Messages {
    confirmDelete: string;
    yes: string;
    no: string;
    somethingWrong: string;
    noConnection: string;
    offlineFeature: string;
}

interface Language {
    title: string;
    fr: string;
    en: string;
    es: string;
    autoDetect: string;
}

interface Footer {
    credit: string;
    description: string;
    tabletSettings: string;
    spreadsheets: string;
    otherProjects: string;
}

interface Notifications {
    favoriteNotFound: string;
    configurationLoaded: string;
    errorLoadingConfig: string;
    editModeActivated: string;
    editModeCanceled: string;
    favoriteDeleted: string;
    errorDeletingFavorite: string;
    configurationUpdated: string;
    errorUpdatingConfig: string;
    titleTruncated: string;
    descriptionTruncated: string;
    configurationSaved: string;
    errorSavingConfig: string;
    areaPositionCenter: string;
    areaPositionLeft: string;
    areaPositionRight: string;
    areaPositionTop: string;
    areaPositionBottom: string;
    areaPositionTopLeft: string;
    areaPositionTopRight: string;
    areaPositionBottomLeft: string;
    areaPositionBottomRight: string;
    copiedInfo: string;
    copyError: string;
    invalidDimensions: string;
    tabletDataError: string;
    errorSavingPreferences: string;
    preferencesReset: string;
}

interface Locale {
    app: App;
    tablet: Tablet;
    area: Area;
    visual: Visual;
    favorites: Favorites;
    summary: Summary;
    alignment: Alignment;
    messages: Messages;
    language: Language;
    footer: Footer;
    notifications: Notifications;
}

// Type for flattened translations
type FlatTranslations = { [key: string]: string };

// Type for the structured translations object
type Translations = {
    [key: string]: Locale;
};

// Type for the flat translations object
type FlatTranslationsObject = {
    [key: string]: FlatTranslations;
};


/**
 * Finds a translation value by its path key
 * @param locale - The translation object
 * @param path - The path as a string (e.g., "app.title")
 * @param fallback - Fallback translation if key is not found
 * @returns The translated value or the key if not found
 * @private
 */
function getTranslationByPath(locale: Locale | null, path: string, fallback: Locale | null = null): string {
  if (!locale || !path) return path;
  
  try {
    const segments = path.split('.');
    let current: any = locale;
    for (const segment of segments) {
      if (current[segment] === undefined) {
        if (fallback) {
          return getTranslationByPath(fallback, path);
        }
        return path;
      }
      current = current[segment];
    }
    
    return current as string;
  } catch (e) {
    console.warn(`Error getting translation for path: ${path}`, e);
    return fallback ? getTranslationByPath(fallback, path) : path;
  }
}

/**
 * Transforms a hierarchical translation into a flat object
 * @param locale - The hierarchical translation object
 * @param prefix - Prefix for the keys
 * @returns A flat object with keys in "category_key" format
 * @private
 */
function flattenTranslations(locale: Locale | null, prefix: string = ''): FlatTranslations {
  if (!locale || typeof locale !== 'object') return {};
  
  const result: FlatTranslations = {};
  
  Object.entries(locale).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value && typeof value === 'object') {
      Object.assign(result, flattenTranslations(value as Locale, newKey));
    } else {
      result[newKey] = value as string;
    }
  });
  
  return result;
}

/**
 * Localization manager for the application
 * Handles loading, changing and using translations
 */
class LocaleManager {
  public translations: Translations;
  public flatTranslations: FlatTranslationsObject;
  public availableLocales: string[];
  public currentLocale: string;

  constructor() {
    this.translations = {
      fr: frLocale,
      en: enLocale,
      es: esLocale
    };

    this.flatTranslations = {
      fr: flattenTranslations(frLocale),
      en: flattenTranslations(enLocale),
      es: flattenTranslations(esLocale)
    };
    
    this.availableLocales = Object.keys(this.translations);
    this.currentLocale = 'en'; // Default locale
    this.initializeLocale();
  }
  
  private initializeLocale(): void {
    try {
      const savedLocale = this.getSafeLocalStorage('osureaLocale'); // Now public, can be called
      
      if (savedLocale && this.translations[savedLocale]) {
        this.currentLocale = savedLocale;
        this.safeSetLang(this.currentLocale);
      } else {
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
  
  public getSafeLocalStorage(key: string): string | null { // Changed to public
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Error during access to localStorage:', e);
      return null;
    }
  }
  
  private setSafeLocalStorage(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Error during writing to localStorage:', e);
      return false;
    }
  }
  
  private safeSetLang(lang: string): void {
    try {
      if (document && document.documentElement) {
        document.documentElement.lang = lang;
      }
    } catch (e) {
      console.warn('Error during definition of lang attribute:', e);
    }
  }
  
  private getBrowserLanguage(): string | null {
    try {
      const browserLang = navigator && (navigator.language || (navigator as any).userLanguage);
      if (browserLang) {
        const langCode = browserLang.substring(0, 2).toLowerCase();
        return this.availableLocales.includes(langCode) ? langCode : null;
      }
    } catch (e) {
      console.warn('Error during browser language detection:', e);
    }
    return null;
  }
  
  public get(): Locale {
    return this.translations[this.currentLocale || 'en'];
  }
  
  public getFlat(): FlatTranslations {
    return this.flatTranslations[this.currentLocale || 'en'];
  }
  
  public getCurrentLocale(): string {
    return this.currentLocale || 'en';
  }
  
  public async setLocale(locale: string): Promise<boolean> {
    try {
      if (this.translations[locale]) {
        this.currentLocale = locale;
        this.setSafeLocalStorage('osureaLocale', locale);
        this.safeSetLang(locale);
        
        this.triggerLocaleChangedEvent(locale);
        await this.updatePageTranslations();
        
        return true;
      }
    } catch (e) {
      console.error('Error during language change:', e);
      await this.setLocale('en'); // Revert to English on error
    }
    return false;
  }
  
  private triggerLocaleChangedEvent(locale: string): void {
    try {
      const event = new CustomEvent('localeChanged', { detail: { locale } });
      document.dispatchEvent(event);
    } catch (e) {
      console.warn('Error creating the language change event:', e);
    }
  }
  
  public translate(key: string): string {
    try {
      if (key.includes('.')) {
        return getTranslationByPath(this.get(), key, this.translations['en']) || key;
      }
      
      const flatTranslations = this.getFlat();
      return (flatTranslations && flatTranslations[key]) || key;
    } catch (e) {
      console.warn('Translation error for the key:', key, e);
      return key;
    }
  }
  
  public async updatePageTranslations(): Promise<boolean> {
    try {
      this.updateTextElements();
      this.updatePlaceholderElements();
      this.updateMetaTags();
      this.updateSpecificPopups();
      
      await this.updateTranslations(); // Empty implementation
      
      return true;
    } catch (error) {
      console.error('Error during translation update:', error);
      return false;
    }
  }
  
  private updateTextElements(): void {
    try {
      const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
      
      elements.forEach(element => {
        try {
          const key = element.getAttribute('data-i18n');
          if (!key) return;
          const translation = this.translate(key);
          
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            if (element.placeholder) {
              element.placeholder = translation;
            } else {
              element.value = translation;
            }
          } else {
            element.textContent = translation;
            
            if (element.parentElement && element.parentElement.tagName === 'BUTTON') {
              const button = element.parentElement;
              const svgs = button.querySelectorAll('svg');
              if (svgs.length > 0) {
                button.innerHTML = '';
                svgs.forEach(svg => button.appendChild(svg.cloneNode(true)));
                button.appendChild(element);
              }
            }
          }
        } catch (e) {
          console.warn('Error updating element:', element, e);
        }
      });
    } catch (e) {
      console.warn('Error during text elements update:', e);
    }
  }
  
  private updatePlaceholderElements(): void {
    try {
      const placeholderElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
      
      placeholderElements.forEach(element => {
        try {
          const placeholderKey = element.getAttribute('data-i18n-placeholder');
          if (!placeholderKey) return;
          const placeholderTranslation = this.translate(placeholderKey);
          element.placeholder = placeholderTranslation;
        } catch (e) {
          console.warn('Error updating placeholder:', element, e);
        }
      });
    } catch (e) {
      console.warn('Error during placeholder update:', e);
    }
  }
  
  private updateMetaTags(): void {
    try {
      const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (metaDescription) {
        metaDescription.content = this.translate('app.description');
      }
      
      const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.content = this.translate('app.description');
      }
    } catch (e) {
      console.warn('Error updating meta tags:', e);
    }
  }
  
  private updateSpecificPopups(): void {
    try {
      const favoritePopup = document.getElementById('favorite-details-popup');
      if (favoritePopup) {
        this.triggerPopupEvent('favorite-details-popup');
      }
      
      const commentDialog = document.getElementById('comment-dialog');
      if (commentDialog) {
        this.triggerPopupEvent('comment-dialog');
      }
    } catch (e) {
      console.warn('Error updating popups:', e);
    }
  }
  
  private triggerPopupEvent(popupId: string): void {
    try {
      const event = new CustomEvent('popup:created', { 
        detail: { popupId } 
      });
      document.dispatchEvent(event);
    } catch (e) {
      console.warn(`Error triggering popup event for ${popupId}:`, e);
    }
  }
  
  private async updateTranslations(): Promise<boolean> {
    // updateTranslations not implemented
    return true;
  }
  
  public getAvailableLocales(): string[] {
    return this.availableLocales;
  }
  
  public async resetLocale(): Promise<boolean> {
    try {
      try {
        localStorage.removeItem('osureaLocale');
      } catch (e) {
        console.warn('Error removing language preference:', e);
      }
      
      (this.currentLocale as any) = null; // Reset current locale
      
      // Assuming window.forceLanguageDetection is globally available
      if ((window as any).forceLanguageDetection && typeof (window as any).forceLanguageDetection === 'function') {
        (window as any).forceLanguageDetection();
      }
      
      const browserLang = this.getBrowserLanguage();
      this.currentLocale = browserLang || 'en';
      
      await this.setLocale(this.currentLocale);
      return true;
    } catch (e) {
      console.error('Error resetting language:', e);
      return false;
    }
  }
}

const localeManager = new LocaleManager();

export default localeManager;
