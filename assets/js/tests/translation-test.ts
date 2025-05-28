/**
 * Test script to verify translations
 * Specifically tests the "Save" button and other critical elements
 */

// Define types for global objects if they are expected
interface LocaleManager {
    translations: {
        [lang: string]: {
            [group: string]: {
                [key: string]: string;
            };
        };
    };
    getCurrentLocale: () => string;
    setLocale: (locale: string) => Promise<void>;
    updatePageTranslations: () => Promise<void>;
    getAvailableLocales: () => string[];
    translate: (key: string, fallback?: string) => string;
}

declare global {
    interface Window {
        localeManager?: LocaleManager;
        translateWithFallback?: (key: string, fallback?: string) => string;
    }
}

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
    
    const currentLocaleManager = window.localeManager; // Use window.localeManager if available

    const tests: Test[] = [
        {
            name: 'LocaleManager exists',
            test: () => typeof currentLocaleManager !== 'undefined'
        },
        {
            name: 'TranslateWithFallback function exists',
            test: () => typeof window.translateWithFallback === 'function'
        },
        {
            name: 'Save button translation (FR)',
            test: () => {
                if (currentLocaleManager) {
                    const frTranslation = currentLocaleManager.translations?.fr?.favorites?.saveButton;
                    return frTranslation === 'Sauvegarder';
                }
                return false;
            }
        },
        {
            name: 'Save button translation (ES)',
            test: () => {
                if (currentLocaleManager) {
                    const esTranslation = currentLocaleManager.translations?.es?.favorites?.saveButton;
                    return esTranslation === 'Guardar';
                }
                return false;
            }
        },
        {
            name: 'Save button translation (EN)',
            test: () => {
                if (currentLocaleManager) {
                    const enTranslation = currentLocaleManager.translations?.en?.favorites?.saveButton;
                    return enTranslation === 'Save';
                }
                return false;
            }
        },
        {
            name: 'Save button DOM element exists',
            test: () => document.querySelector('#save-btn [data-i18n="favorites.saveButton"]') !== null
        },
        {
            name: 'Current locale detection',
            test: () => {
                if (currentLocaleManager) {
                    const currentLocale = currentLocaleManager.getCurrentLocale();
                    return ['fr', 'en', 'es'].includes(currentLocale);
                }
                return false;
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
                failed++;
            }
        } catch (error: any) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Translation Tests: ${passed} passed, ${failed} failed`);
    
    if (currentLocaleManager) {
        console.log('\n🔄 Testing language switching...');
        testLanguageSwitching(currentLocaleManager);
    }
    
    return { passed, failed, total: tests.length };
}

function testLanguageSwitching(manager: LocaleManager): void {
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
    console.log('🔄 Forcing translation update...');
    if (window.localeManager) {
        window.localeManager.updatePageTranslations().then(() => {
            console.log('✅ Translation update completed');
        }).catch(error => {
            console.error('❌ Translation update failed:', error);
        });
    } else {
        console.error('❌ LocaleManager not available');
    }
}

export function diagnoseTranslationIssues(): void {
    console.log('🔍 Diagnosing translation issues...');
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');
    console.log(`Found ${elementsWithI18n.length} elements with data-i18n attribute`);
    
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
    
    if (window.localeManager) {
        console.log('LocaleManager status:', {
            currentLocale: window.localeManager.getCurrentLocale(),
            availableLocales: window.localeManager.getAvailableLocales(),
            translations: Object.keys(window.localeManager.translations)
        });
        const directTranslation = window.localeManager.translate('favorites.saveButton');
        console.log(`Direct translation of "favorites.saveButton": "${directTranslation}"`);
    } else {
        console.log('❌ LocaleManager not available');
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
