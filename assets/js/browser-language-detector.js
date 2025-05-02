/**
 * Browser Language Detector
 * 
 * This module automatically detects the browser language
 * and applies the corresponding language to the site (French, Spanish, or English by default)
 */

import localeManager from '../locales/index.js';

/**
 * Detects the browser's interface language and applies the corresponding language.
 * - fr for any French variant
 * - es for any Spanish variant
 * - en otherwise (default)
 */
function detectAndApplyBrowserLanguage() {
  try {
    // Uses only the browser's interface language
    let lang = 'en'; // fallback
    if (navigator.language) {
      lang = navigator.language;
    }
    // Extracts the main language code (2 letters)
    const langCode = lang.slice(0, 2).toLowerCase();
    let appliedLang = 'en';
    if (langCode === 'fr') {
      appliedLang = 'fr';
    } else if (langCode === 'es') {
      appliedLang = 'es';
    }
    localeManager.setLocale(appliedLang);
    console.log(`[LangDetect] Browser interface language: ${lang} → Application: ${appliedLang}`);
  } catch (e) {
    localeManager.setLocale('en');
    console.error('[LangDetect] Error, fallback to English', e);
  }
}

// Calls detection automatically when the site opens
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectAndApplyBrowserLanguage);
} else {
  detectAndApplyBrowserLanguage();
}

export { detectAndApplyBrowserLanguage }; 