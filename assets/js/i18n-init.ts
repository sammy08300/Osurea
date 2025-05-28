import localeManager from '../locales/index'; // .ts extension will be resolved
import { detectAndApplyBrowserLanguage } from './browser-language-detector'; // .ts

// Define types for global objects if they are expected
interface LocaleManager {
    translations: {
        [lang: string]: {
            [key: string]: string | { [key: string]: string }; // Allow nested keys
        };
    };
    translate: (key: string) => string;
    updatePageTranslations: () => void; // Assuming it returns void or Promise<void>
}

declare global {
    interface Window {
        localeManager?: LocaleManager; // Assuming localeManager might be global
        translateWithFallback?: (key: string, fallback?: string) => string;
        __?: (key: string, defaultValue?: string) => string;
        forceLanguageDetection?: (force?: boolean) => boolean;
    }
    interface Element { // Extend Element for setAttribute on placeholder for InputElement
        placeholder?: string;
    }
}


/**
 * Robust utility function to translate an i18n key with fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @param {string} [fallback] - Optional fallback string if key not found
 * @returns {string} - The translated text or a formatted default/fallback
 */
export function translateWithFallback(key: string, fallback?: string): string {
    let translated: string | null = null;
    const currentLocaleManager = window.localeManager || localeManager; // Prefer window.localeManager if set

    if (currentLocaleManager && typeof currentLocaleManager.translate === 'function') {
        try {
            translated = currentLocaleManager.translate(key);
            if (translated === key && fallback) translated = fallback;
            else if (translated === key) translated = null;
        } catch (e) {
            console.error("[ERROR] Translation failed for key:", key, e);
        }
    }
    
    if (!translated || translated.startsWith('i18n:')) { // Check if still needs processing
        const htmlLang = document.documentElement.lang || 'fr';
        let lang = 'fr'; // Default language
        if (htmlLang.startsWith('en')) lang = 'en';
        else if (htmlLang.startsWith('es')) lang = 'es';
        
        if (currentLocaleManager && currentLocaleManager.translations && currentLocaleManager.translations[lang]) {
            try {
                let current: any = currentLocaleManager.translations[lang];
                if (key.includes('.')) {
                    const segments = key.split('.');
                    for (const segment of segments) {
                        if (current[segment] === undefined) {
                            translated = null; break;
                        }
                        current = current[segment];
                    }
                    if (typeof current === 'string') translated = current;
                } else {
                    if (typeof current[key] === 'string') translated = current[key];
                }
            } catch (e) {
                console.warn('Failed to get language-specific translation:', e);
            }
        }
        
        if (!translated || translated === key) { // If still not found or is the key itself
            if (fallback) return fallback;
            // Default formatting for unknown keys if no fallback
            translated = key.replace(/_/g, ' ');
            translated = translated.charAt(0).toUpperCase() + translated.slice(1);
        }
    }
    return translated!; // Assert non-null as we provide fallbacks or formatted key
}

/**
 * Translates elements with data-i18n attributes
 * @param {Node} node - Element to translate or containing elements to translate
 */
function translateElement(node: Node): void {
    if (!(node instanceof HTMLElement || node instanceof Element)) return; // Ensure it's an Element
    const element = node as HTMLElement;


    if (element.hasAttribute && element.hasAttribute('data-i18n')) {
        try {
            const key = element.getAttribute('data-i18n');
            if (key && window.localeManager) element.textContent = window.localeManager.translate(key);
        } catch (e) {
            console.warn('Error translating element:', e);
        }
    }
    
    if (element.querySelectorAll) {
        const elements = element.querySelectorAll<HTMLElement>('[data-i18n]');
        elements.forEach(el => {
            try {
                const key = el.getAttribute('data-i18n');
                if (key && window.localeManager) el.textContent = window.localeManager.translate(key);
            } catch (e) {
                console.warn('Error translating child element:', e);
            }
        });
        
        const placeholderElements = element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
        placeholderElements.forEach(el => {
            try {
                const key = el.getAttribute('data-i18n-placeholder');
                if (key && window.localeManager) el.placeholder = window.localeManager.translate(key);
            } catch (e) {
                console.warn('Error translating placeholder:', e);
            }
        });
    }
}

function observeDOMChanges(): void {
    if (typeof MutationObserver === 'undefined') {
        console.warn('MutationObserver is not available in this browser');
        return;
    }
    const config = { childList: true, subtree: true };
    const callback = function(mutationsList: MutationRecord[]) {
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
    if (document.body) {
        observer.observe(document.body, config);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body) observer.observe(document.body, config);
        });
    }
}

function setupGlobalFunctions(): void {
    if (typeof window === 'undefined') return;
    window.translateWithFallback = translateWithFallback;
    window.__ = (key: string, defaultValue?: string): string => {
        try {
            if (window.localeManager) {
                const translation = window.localeManager.translate(key);
                return translation === key && defaultValue ? defaultValue : translation;
            }
            return defaultValue || key; // Fallback if localeManager is not available
        } catch (e) {
            console.warn('Global translation error:', e);
            return defaultValue || key;
        }
    };
    window.forceLanguageDetection = (force?: boolean): boolean => { // Added optional param type
        try {
            detectAndApplyBrowserLanguage(); // Assuming detectAndApply takes optional boolean
            return true;
        } catch (e) {
            console.error('Error forcing language detection:', e);
            return false;
        }
    };
}

function setupEventListeners(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('localeChanged', () => {
        try {
            window.localeManager?.updatePageTranslations();
        } catch (e) {
            console.warn('Error updating translations after language change:', e);
        }
    });

    document.addEventListener('i18n:translate', (event: Event) => {
        try {
            const customEvent = event as CustomEvent; // Type assertion
            if (customEvent.detail && customEvent.detail.element) {
                translateElement(customEvent.detail.element);
            }
        } catch (e) {
            console.warn('Error processing i18n:translate event:', e); 
        }
    });
    
    document.addEventListener('popup:created', (event: Event) => {
        try {
            const customEvent = event as CustomEvent; // Type assertion
            if (customEvent.detail && customEvent.detail.popupId) {
                const popup = document.getElementById(customEvent.detail.popupId);
                if (popup) translateElement(popup);
            }
        } catch (e) {
            console.warn('Error processing popup:created event:', e);
        }
    });
}

function initializeI18n(): void {
    try {
        setupGlobalFunctions();
        detectAndApplyBrowserLanguage(); // Assumes this function is available
        window.localeManager?.updatePageTranslations();
        observeDOMChanges();
        setupEventListeners();
    } catch (e) {
        console.error('Error during translations initialization:', e);
    }
}

export default initializeI18n;
