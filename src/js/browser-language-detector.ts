/**
 * Browser Language Detector
 * 
 * This module automatically detects the browser language
 * and applies the corresponding language to the site (French, Spanish, or English by default)
 */

import localeManager from '../locales/index.js'; // Remove the .js extension

// Define types for better code clarity and safety
type SupportedLanguageCode = 'fr' | 'es' | 'en';

interface SupportedLanguagesMap {
  fr: 'fr';
  es: 'es';
  en: 'en';
  [key: string]: SupportedLanguageCode | undefined; // Index signature for dynamic access
}

// Supported language codes
const SUPPORTED_LANGUAGES: SupportedLanguagesMap = {
  fr: 'fr',
  es: 'es',
  en: 'en' // default
};

/**
 * Extracts the main language code from the browser's language setting
 * @returns {string} Two-letter language code
 */
function getBrowserLanguageCode(): string {
  const browserLang: string = navigator.language || 'en';
  return browserLang.slice(0, 2).toLowerCase();
}

/**
 * Determines which supported language to use based on browser language
 * @param {string} langCode - Two-letter language code
 * @returns {SupportedLanguageCode} Supported language code (fr, es, or en)
 */
function getSupportedLanguage(langCode: string): SupportedLanguageCode {
  return SUPPORTED_LANGUAGES[langCode] || SUPPORTED_LANGUAGES.en;
}

/**
 * Detects the browser's interface language and applies the corresponding language.
 * Supports French, Spanish, or English (default)
 */
function detectAndApplyBrowserLanguage(): void {
  try {
    // Check if user has already chosen a language
    const savedLocale = localeManager.getSafeLocalStorage('osureaLocale');
    if (savedLocale && localeManager.translations[savedLocale]) {
      // User language already set, skipping detection
      return;
    }
    
    const langCode = getBrowserLanguageCode();
    const appliedLang = getSupportedLanguage(langCode);
    
    localeManager.setLocale(appliedLang); // Assuming setLocale handles Promise or is synchronous
    console.log(`[LangDetect] Browser interface language: ${navigator.language} → Application: ${appliedLang}`);
  } catch (e: any) { // Catch any error type
    localeManager.setLocale(SUPPORTED_LANGUAGES.en);
    console.error('[LangDetect] Error, fallback to English', e);
  }
}

// Initialize language detection
function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndApplyBrowserLanguage);
  } else {
    detectAndApplyBrowserLanguage();
  }
}

init();

export { detectAndApplyBrowserLanguage };
