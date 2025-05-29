/**
 * Test script to verify translations
 * Specifically tests the "Save" button and other critical elements
 */

import { TEST_CONFIG, TestLogger, TestUtils } from './test-config.js';
// Import the default export (the instance) and type it if needed,
// or rely on the global window.localeManager which is already typed in i18n-init.ts
import actualLocaleManagerInstance from '../../locales/index.js'; 

const logger = new TestLogger(); // Instantiate logger

// Removed Window interface declaration to avoid conflicts

interface Test {
    name: string;
    test: () => boolean;
}

interface TestResults {
    passed: number;
    failed: number;
    total: number;
}

export function testTranslations(): TestResults {
    console.log('🌍 Testing translations...');
    
    const resultsArray: { name: string, test: () => boolean, passed: boolean, error?: string }[] = [];

    // Tests primarily use window.localeManager, which should be populated by i18n-init.ts
    const currentLocaleManager = window.localeManager as any; 

    const addTest = (name: string, testFn: () => boolean) => {
        try {
            const pass = testFn();
            resultsArray.push({ name, test: testFn, passed: pass });
        } catch (e:any) {
            resultsArray.push({ name, test: testFn, passed: false, error: e.message });
        }
    };

    addTest('LocaleManager exists on window', () => typeof currentLocaleManager !== 'undefined');
    addTest('TranslateWithFallback function exists on window', () => typeof window.translateWithFallback === 'function');

    if (currentLocaleManager && typeof currentLocaleManager.translate === 'function') {
        addTest('Save button translation (FR)', () => {
            const frTranslation = currentLocaleManager.translate('favorites.saveButton');
            return frTranslation === 'Sauvegarder' || (typeof frTranslation === 'string' && frTranslation.includes('Sauvegarder'));
        });
        addTest('Save button translation (ES)', () => {
            const esTranslation = currentLocaleManager.translate('favorites.saveButton');
            return esTranslation === 'Guardar' || (typeof esTranslation === 'string' && esTranslation.includes('Guardar'));
        });
        addTest('Save button translation (EN)', () => {
            const enTranslation = currentLocaleManager.translate('favorites.saveButton');
            return enTranslation === 'Save' || (typeof enTranslation === 'string' && enTranslation.includes('Save'));
        });
    }

    addTest('Save button DOM element exists', () => document.querySelector('#save-btn [data-i18n="favorites.saveButton"]') !== null);

    if (currentLocaleManager && typeof currentLocaleManager.getCurrentLocale === 'function') {
        addTest('Current locale detection', () => {
            const currentLocale = currentLocaleManager.getCurrentLocale();
            return ['fr', 'en', 'es'].includes(currentLocale);
        });
    }
    
    let passed = resultsArray.filter(r => r.passed).length;
    let failed = resultsArray.length - passed;

    resultsArray.forEach(r => {
        if (r.passed) {
            logger.info(`✅ ${r.name}`);
        } else {
            logger.error(`❌ ${r.name}${r.error ? ' - Error: ' + r.error : ''}`);
        }
    });

    logger.info(`\n📊 Translation Tests: ${passed} passed, ${failed} failed`);

    if (currentLocaleManager && typeof currentLocaleManager.setLocale === 'function') {
        logger.info('\n🔄 Testing language switching...');
        testLanguageSwitching(currentLocaleManager as any);
    }
    
    return { passed, failed, total: resultsArray.length };
}

function testLanguageSwitching(manager: any): void {
    logger.info('Testing language switching...');
    if (!manager || typeof manager.setLocale !== 'function' || typeof manager.getCurrentLocale !== 'function') {
        logger.error('LocaleManager not available or lacks required methods for language switching test.');
        return;
    }
    
    const saveButton = document.querySelector<HTMLElement>('#save-btn [data-i18n="favorites.saveButton"]');
    if (!saveButton) {
        console.log('❌ Save button not found for language switching test');
        return;
    }
    
    const originalLocale = manager.getCurrentLocale();
    
    manager.setLocale('fr').then(() => {
        setTimeout(() => {
            const frText = saveButton.textContent;
            console.log(`🇫🇷 French: "${frText}" (should be "Sauvegarder")`);
            
            manager.setLocale('es').then(() => {
                setTimeout(() => {
                    const esText = saveButton.textContent;
                    console.log(`🇪🇸 Spanish: "${esText}" (should be "Guardar")`);
                    
                    manager.setLocale('en').then(() => {
                        setTimeout(() => {
                            const enText = saveButton.textContent;
                            console.log(`🇬🇧 English: "${enText}" (should be "Save")`);
                            manager.setLocale(originalLocale); // Restore
                        }, 100);
                    });
                }, 100);
            });
        }, 100);
    });
}

export function forceTranslationUpdate(): void {
    logger.info('Forcing translation update...');
    if (window.localeManager && typeof window.localeManager.updatePageTranslations === 'function') {
        window.localeManager.updatePageTranslations(); // Call synchronously
        logger.info('Translation update triggered.');
    } else {
        logger.warn('localeManager.updatePageTranslations not available.');
    }
}

export function diagnoseTranslationIssues(): void {
    logger.info('🔍 Diagnosing translation issues...');
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');
    logger.info(`Found ${elementsWithI18n.length} elements with data-i18n attribute`);
    
    const saveButton = document.querySelector<HTMLElement>('#save-btn [data-i18n="favorites.saveButton"]');
    if (saveButton) {
        console.log('Save button found:', {
            element: saveButton,
            textContent: saveButton.textContent,
            dataI18n: saveButton.getAttribute('data-i18n'),
            parentButton: saveButton.parentElement
        });
    } else {
        console.log('❌ Save button with data-i18n not found');
    }
    
    const currentLocaleManager = window.localeManager as any; // Cast here too
    if (currentLocaleManager) {
        const currentLocale = typeof currentLocaleManager.getCurrentLocale === 'function' ? currentLocaleManager.getCurrentLocale() : 'N/A';
        const availableLocales = typeof currentLocaleManager.getAvailableLocales === 'function' ? currentLocaleManager.getAvailableLocales().join(', ') : 'N/A';
        const translationsLoaded = currentLocaleManager.translations && Object.keys(currentLocaleManager.translations).length > 0;
        const testTranslation = typeof currentLocaleManager.translate === 'function' ? currentLocaleManager.translate('favorites.saveButton', 'Not Found') : 'N/A';

        logger.info(`Translation diagnosis:
            - Translations loaded: ${translationsLoaded}
            - Current Locale: ${currentLocale}
            - Available Locales: ${availableLocales}
            - Test translation (favorites.saveButton): ${testTranslation}`);
    } else {
        logger.warn('❌ LocaleManager not available on window for diagnosis.');
    }
}

if (typeof window !== 'undefined') {
    setTimeout(() => {
        if (document.readyState === 'complete') {
            console.log('🧪 Auto-running translation tests...');
            testTranslations();
        }
    }, 2000);
}

// Add to window for manual testing
(window as any).forceTranslationUpdate = forceTranslationUpdate;
(window as any).diagnoseTranslationIssues = diagnoseTranslationIssues;
(window as any).testTranslations = testTranslations;
