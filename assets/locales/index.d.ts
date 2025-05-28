// Type definitions for ../locales/index.js

interface TranslationValue {
  [key: string]: string | TranslationValue;
}

interface Translations {
  [lang: string]: {
    [key: string]: string | TranslationValue;
  };
}

export class LocaleManager {
  translations: Translations;
  currentLocale: string | null;

  constructor();

  initializeLocale(): void;
  getSafeLocalStorage(key: string): string | null;
  setSafeLocalStorage(key: string, value: string): void;
  safeSetLang(lang: string): void;
  getBrowserLanguage(): string;
  get(): object; // Returns the translations for the current locale
  getFlat(): { [key: string]: string }; // Returns flattened translations
  getCurrentLocale(): string;
  setLocale(locale: string): Promise<void>;
  triggerLocaleChangedEvent(locale: string): void;
  translate(key: string, fallback?: string): string;
  updatePageTranslations(): Promise<void>;
  updateTextElements(): void;
  updatePlaceholderElements(): void;
  updateMetaTags(): void;
  updateSpecificPopups(): void;
  triggerPopupEvent(popupId: string): void;
  updateTranslations(): Promise<void>;
  getAvailableLocales(): string[];
  resetLocale(): Promise<void>;
}

declare const localeManager: LocaleManager;
export default localeManager;

declare module '../../locales/index' {
    const localeManager: any; // You can replace 'any' with a more specific type if you know the structure
    export default localeManager;
} 