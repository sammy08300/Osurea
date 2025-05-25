/**
 * Browser Language Detector
 * 
 * This module automatically detects the browser language
 * and applies the corresponding language to the site (French, Spanish, or English by default)
 */

import localeManager from '../locales/index.js';

// Supported language codes
const SUPPORTED_LANGUAGES = {
  fr: 'fr',
  es: 'es',
  en: 'en' // default
};

/**
 * Extracts the main language code from the browser's language setting
 * @returns {string} Two-letter language code
 */
function getBrowserLanguageCode() {
  const browserLang = navigator.language || 'en';
  return browserLang.slice(0, 2).toLowerCase();
}

/**
 * Determines which supported language to use based on browser language
 * @param {string} langCode - Two-letter language code
 * @returns {string} Supported language code (fr, es, or en)
 */
function getSupportedLanguage(langCode) {
  return SUPPORTED_LANGUAGES[langCode] || SUPPORTED_LANGUAGES.en;
}

/**
 * Detects the browser's interface language and applies the corresponding language.
 * Supports French, Spanish, or English (default)
 */
function detectAndApplyBrowserLanguage() {
  try {
    // Check if user has already chosen a language
    const savedLocale = localeManager.getSafeLocalStorage('osureaLocale');
    if (savedLocale && localeManager.translations[savedLocale]) {
      console.log(`[LangDetect] User has already chosen language: ${savedLocale}, skipping auto-detection`);
      return;
    }
    
    const langCode = getBrowserLanguageCode();
    const appliedLang = getSupportedLanguage(langCode);
    
    localeManager.setLocale(appliedLang);
    console.log(`[LangDetect] Browser interface language: ${navigator.language} → Application: ${appliedLang}`);
  } catch (e) {
    localeManager.setLocale(SUPPORTED_LANGUAGES.en);
    console.error('[LangDetect] Error, fallback to English', e);
  }
}

// Initialize language detection
function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndApplyBrowserLanguage);
  } else {
    detectAndApplyBrowserLanguage();
  }
}

init();

export { detectAndApplyBrowserLanguage }; 
