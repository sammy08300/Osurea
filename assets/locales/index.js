import fr from './fr.js';
import en from './en.js';
import es from './es.js';

/**
 * Trouve une valeur de traduction par sa clé de chemin
 * @param {Object} locale - L'objet de traduction
 * @param {string} path - Le chemin sous forme de chaîne (ex: "app.title")
 * @param {Object} fallback - Traduction de secours si la clé n'est pas trouvée
 * @returns {string} La valeur traduite ou la clé si non trouvée
 * @private
 */
function getTranslationByPath(locale, path, fallback = null) {
  if (!locale || !path) return path;
  
  try {
    // Diviser le chemin en segments (app.title -> ['app', 'title'])
    const segments = path.split('.');
    
    // Parcourir l'objet de traduction pour trouver la valeur
    let current = locale;
    for (const segment of segments) {
      if (current[segment] === undefined) {
        // Si le segment n'existe pas, essayer le fallback
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
 * Transforme une traduction hiérarchique en objet plat
 * @param {Object} locale - L'objet de traduction hiérarchique
 * @param {string} prefix - Préfixe pour les clés
 * @returns {Object} Un objet plat avec les clés au format "category_key"
 * @private
 */
function flattenTranslations(locale, prefix = '') {
  if (!locale || typeof locale !== 'object') return {};
  
  const result = {};
  
  Object.entries(locale).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value && typeof value === 'object') {
      // Si la valeur est un objet, on continue la récursion
      Object.assign(result, flattenTranslations(value, newKey));
    } else {
      // Sinon, on ajoute la clé avec sa valeur
      result[newKey] = value;
    }
  });
  
  return result;
}

/**
 * Gestionnaire de localisation pour l'application
 * Gère le chargement, le changement et l'utilisation des traductions
 */
class LocaleManager {
  /**
   * Initialise le gestionnaire de localisation
   */
  constructor() {
    // Traductions structurées (nouvelles)
    this.translations = {
      fr,
      en,
      es
    };

    // Traductions aplaties pour compatibilité avec l'ancien code
    this.flatTranslations = {
      fr: flattenTranslations(fr),
      en: flattenTranslations(en),
      es: flattenTranslations(es)
    };
    
    // Liste des locales disponibles
    this.availableLocales = Object.keys(this.translations);
    
    // Anglais par défaut
    this.currentLocale = 'en';
    
    // Initialisation de la locale
    this.initializeLocale();
  }
  
  /**
   * Initialise la locale à partir des préférences utilisateur ou du navigateur
   * @private
   */
  initializeLocale() {
    try {
      // Récupérer la préférence utilisateur
      const savedLocale = this.getSafeLocalStorage('osureaLocale');
      
      if (savedLocale && this.translations[savedLocale]) {
        // Si une préférence valide existe, l'utiliser
        this.currentLocale = savedLocale;
        this.safeSetLang(this.currentLocale);
      } else {
        // Sinon, détecter la langue du navigateur
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
   * Récupère une valeur depuis le localStorage de manière sécurisée
   * @param {string} key - Clé de stockage
   * @returns {string|null} Valeur stockée ou null en cas d'erreur
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
   * Écrit une valeur dans le localStorage de manière sécurisée
   * @param {string} key - Clé de stockage
   * @param {string} value - Valeur à stocker
   * @returns {boolean} True si l'opération a réussi, false sinon
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
   * Définit l'attribut lang du document de manière sécurisée
   * @param {string} lang - Code de langue à 2 lettres
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
   * Détecte la langue du navigateur
   * @returns {string|null} Code de langue à 2 lettres ou null si non supportée
   */
  getBrowserLanguage() {
    try {
      const browserLang = navigator && (navigator.language || navigator.userLanguage);
      if (browserLang) {
        // Récupérer les 2 premiers caractères (fr-FR -> fr)
        const langCode = browserLang.substring(0, 2).toLowerCase();
        // Vérifier si cette langue est disponible
        return this.availableLocales.includes(langCode) ? langCode : null;
      }
    } catch (e) {
      console.warn('Error during browser language detection:', e);
    }
    return null;
  }
  
  /**
   * Récupère la traduction actuelle
   * @returns {Object} Objet de traduction
   */
  get() {
    return this.translations[this.currentLocale || 'en'];
  }
  
  /**
   * Récupère la traduction actuelle au format plat (pour rétrocompatibilité)
   * @returns {Object} Objet de traduction au format plat
   */
  getFlat() {
    return this.flatTranslations[this.currentLocale || 'en'];
  }
  
  /**
   * Obtient la locale actuelle
   * @returns {string} Code de langue à 2 lettres
   */
  getCurrentLocale() {
    return this.currentLocale || 'en';
  }
  
  /**
   * Change la langue et met à jour la page
   * @param {string} locale - Code de langue à 2 lettres
   * @returns {Promise<boolean>} True si la langue a été changée, false sinon
   */
  async setLocale(locale) {
    try {
      if (this.translations[locale]) {
        this.currentLocale = locale;
        // Sauvegarder la préférence utilisateur
        this.setSafeLocalStorage('osureaLocale', locale);
        this.safeSetLang(locale);
        
        // Déclencher un événement pour notifier du changement de langue
        this.triggerLocaleChangedEvent(locale);
        
        // Mettre à jour les textes affichés
        await this.updatePageTranslations();
        
        return true;
      }
    } catch (e) {
      console.error('Error during language change:', e);
      // En cas d'erreur, revenir à l'anglais
      this.setLocale('en');
    }
    return false;
  }
  
  /**
   * Déclenche un événement customisé pour le changement de langue
   * @param {string} locale - Code de langue
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
   * Traduit une clé dans la langue actuelle
   * @param {string} key - Clé de traduction (peut être une clé plate ou un chemin)
   * @returns {string} Texte traduit ou la clé si non trouvée
   */
  translate(key) {
    try {
      // Si la clé contient un point, c'est un chemin
      if (key.includes('.')) {
        return getTranslationByPath(this.get(), key, this.translations['en']) || key;
      }
      
      // Sinon, essayer dans les traductions plates (rétrocompatibilité)
      const flatTranslations = this.getFlat();
      return (flatTranslations && flatTranslations[key]) || key;
    } catch (e) {
      console.warn('Translation error for the key:', key, e);
      return key;
    }
  }
  
  /**
   * Met à jour tous les textes de la page avec les traductions
   * @returns {Promise<boolean>} True si la mise à jour a réussi
   */
  async updatePageTranslations() {
    try {
      this.updateTextElements();
      this.updatePlaceholderElements();
      this.updateMetaTags();
      this.updateSpecificPopups();
      
      // Pour éviter les erreurs, on ajoute cette implémentation vide
      await this.updateTranslations();
      
      return true;
    } catch (error) {
      console.error('Error during translation update:', error);
      return false;
    }
  }
  
  /**
   * Met à jour les éléments HTML avec l'attribut data-i18n
   * @private
   */
  updateTextElements() {
    try {
      // Sélectionner tous les éléments avec l'attribut data-i18n
      const elements = document.querySelectorAll('[data-i18n]');
      
      elements.forEach(element => {
        try {
          const key = element.getAttribute('data-i18n');
          const translation = this.translate(key);
          
          // Mettre à jour le contenu de l'élément selon son type
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
          console.warn('Error updating element:', e);
        }
      });
    } catch (e) {
      console.warn('Error during text elements update:', e);
    }
  }
  
  /**
   * Met à jour les éléments avec des placeholders traduits
   * @private
   */
  updatePlaceholderElements() {
    try {
      // Sélectionner tous les éléments avec l'attribut data-i18n-placeholder
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
   * Met à jour les balises meta avec les traductions
   * @private
   */
  updateMetaTags() {
    try {
      // Mettre à jour la description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.content = this.translate('app.description');
      }
      
      // Mettre à jour la description Open Graph
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.content = this.translate('app.description');
      }
    } catch (e) {
      console.warn('Error updating meta tags:', e);
    }
  }
  
  /**
   * Met à jour des popups spécifiques qui nécessitent une attention particulière
   * @private
   */
  updateSpecificPopups() {
    try {
      // Gérer spécifiquement les popups de favoris
      const favoritePopup = document.getElementById('favorite-details-popup');
      if (favoritePopup) {
        this.triggerPopupEvent('favorite-details-popup');
      }
      
      // Gérer d'autres popups spécifiques si nécessaire
      const commentDialog = document.getElementById('comment-dialog');
      if (commentDialog) {
        this.triggerPopupEvent('comment-dialog');
      }
    } catch (e) {
      console.warn('Error updating popups:', e);
    }
  }
  
  /**
   * Déclenche un événement de création de popup pour mettre à jour son contenu
   * @param {string} popupId - ID du popup
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
   * Implémentation vide d'updateTranslations pour éviter les erreurs
   * @returns {Promise<boolean>} True (toujours)
   * @private
   */
  async updateTranslations() {
    console.log('updateTranslations called but not implemented');
    return true;
  }
  
  /**
   * Retourne la liste des langues disponibles
   * @returns {Array<string>} Liste des codes de langues disponibles
   */
  getAvailableLocales() {
    return this.availableLocales;
  }
  
  /**
   * Réinitialise la préférence de langue et force la détection automatique
   * @returns {Promise<boolean>} True si l'opération a réussi
   */
  async resetLocale() {
    try {
      // Supprimer la préférence de langue du localStorage
      try {
        localStorage.removeItem('osureaLocale');
      } catch (e) {
        console.warn('Error removing language preference:', e);
      }
      
      // Réinitialiser la langue actuelle
      this.currentLocale = null;
      
      // Forcer la détection de langue du navigateur si la fonction existe
      if (window.forceLanguageDetection && typeof window.forceLanguageDetection === 'function') {
        window.forceLanguageDetection();
      }
      
      // Utiliser la langue détectée par le navigateur
      const browserLang = this.getBrowserLanguage();
      this.currentLocale = browserLang || 'en';
      
      // Effectuer la mise à jour après un bref délai pour plus de stabilité
      await this.setLocale(this.currentLocale);
      return true;
    } catch (e) {
      console.error('Error resetting language:', e);
      return false;
    }
  }
}

// Créer une instance unique du gestionnaire de traduction
const localeManager = new LocaleManager();

export default localeManager; 