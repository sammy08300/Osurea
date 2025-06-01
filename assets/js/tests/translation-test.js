/**
 * Test script to verify translations
 * Specifically tests the "Save" button and other critical elements
 */

export function testTranslations() {
    console.log('🌍 Testing translations...');
    
    const tests = [
        {
            name: 'LocaleManager exists',
            test: () => typeof window.localeManager !== 'undefined' || typeof localeManager !== 'undefined'
        },
        {
            name: 'TranslateWithFallback function exists',
            test: () => typeof window.translateWithFallback === 'function'
        },
        {
            name: 'Save button translation (FR)',
            test: () => {
                const saveButton = document.querySelector('[data-i18n="favorites.saveButton"]');
                if (!saveButton) return false;
                
                // Test French translation
                if (typeof localeManager !== 'undefined') {
                    const frTranslation = localeManager.translations.fr.favorites.saveButton;
                    return frTranslation === 'Sauvegarder';
                }
                return false;
            }
        },
        {
            name: 'Save button translation (ES)',
            test: () => {
                if (typeof localeManager !== 'undefined') {
                    const esTranslation = localeManager.translations.es.favorites.saveButton;
                    return esTranslation === 'Guardar';
                }
                return false;
            }
        },
        {
            name: 'Save button translation (EN)',
            test: () => {
                if (typeof localeManager !== 'undefined') {
                    const enTranslation = localeManager.translations.en.favorites.saveButton;
                    return enTranslation === 'Save';
                }
                return false;
            }
        },
        {
            name: 'Save button DOM element exists',
            test: () => {
                const saveButton = document.querySelector('#save-btn [data-i18n="favorites.saveButton"]');
                return saveButton !== null;
            }
        },
        {
            name: 'Current locale detection',
            test: () => {
                if (typeof localeManager !== 'undefined') {
                    const currentLocale = localeManager.getCurrentLocale();
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
        } catch (error) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Translation Tests: ${passed} passed, ${failed} failed`);
    
    // Language switching test
    if (typeof localeManager !== 'undefined') {
        console.log('\n🔄 Testing language switching...');
        testLanguageSwitching();
    }
    
    return { passed, failed, total: tests.length };
}

function testLanguageSwitching() {
    const saveButton = document.querySelector('#save-btn [data-i18n="favorites.saveButton"]');
    if (!saveButton) {
        console.log('❌ Save button not found for language switching test');
        return;
    }
    
    const originalLocale = localeManager.getCurrentLocale();
    
    // Test French
    localeManager.setLocale('fr').then(() => {
        setTimeout(() => {
            const frText = saveButton.textContent;
            console.log(`🇫🇷 French: "${frText}" (should be "Sauvegarder")`);
            
            // Test Spanish
            localeManager.setLocale('es').then(() => {
                setTimeout(() => {
                    const esText = saveButton.textContent;
                    console.log(`🇪🇸 Spanish: "${esText}" (should be "Guardar")`);
                    
                    // Test English
                    localeManager.setLocale('en').then(() => {
                        setTimeout(() => {
                            const enText = saveButton.textContent;
                            console.log(`🇬🇧 English: "${enText}" (should be "Save")`);
                            
                            // Restore original locale
                            localeManager.setLocale(originalLocale);
                        }, 100);
                    });
                }, 100);
            });
        }, 100);
    });
}

/**
 * Forces translation update for all elements
 */
export function forceTranslationUpdate() {
    console.log('🔄 Forcing translation update...');
    
    if (typeof localeManager !== 'undefined') {
        localeManager.updatePageTranslations().then(() => {
            console.log('✅ Translation update completed');
        }).catch(error => {
            console.error('❌ Translation update failed:', error);
        });
    } else {
        console.error('❌ LocaleManager not available');
    }
}

/**
 * Diagnoses translation problems
 */
export function diagnoseTranslationIssues() {
    console.log('🔍 Diagnosing translation issues...');
    
    // Check elements with data-i18n
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');
    console.log(`Found ${elementsWithI18n.length} elements with data-i18n attribute`);
    
    // Check specifically the save button
    const saveButton = document.querySelector('#save-btn [data-i18n="favorites.saveButton"]');
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
    
    // Check localeManager
    if (typeof localeManager !== 'undefined') {
        console.log('LocaleManager status:', {
            currentLocale: localeManager.getCurrentLocale(),
            availableLocales: localeManager.getAvailableLocales(),
            translations: Object.keys(localeManager.translations)
        });
        
        // Test direct translation
        const directTranslation = localeManager.translate('favorites.saveButton');
        console.log(`Direct translation of "favorites.saveButton": "${directTranslation}"`);
    } else {
        console.log('❌ LocaleManager not available');
    }
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
    // Wait for everything to be loaded
    setTimeout(() => {
        if (document.readyState === 'complete') {
            console.log('🧪 Auto-running translation tests...');
            testTranslations();
        }
    }, 2000);
} 
