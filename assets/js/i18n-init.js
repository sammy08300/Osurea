import localeManager from '../locales/index.js';
import { detectAndApplyBrowserLanguage } from './browser-language-detector.js';

/**
 * Robust utility function to translate an i18n key with fallback
 * @param {string} key - The translation key without the i18n: prefix
 * @returns {string} - The translated text or a formatted default
 */
export function translateWithFallback(key) {
    // First try to use the standard translation system
    let translated = null;
    
    if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
        try {
            translated = localeManager.translate(key);
            if (translated === key) translated = null; // If translation returns the key, consider it a failure
        } catch (e) {
            console.error("[ERROR] Translation failed for key:", key, e);
        }
    }
    
    // If standard translation failed, use fallbacks
    if (!translated || translated.startsWith('i18n:')) {
        const htmlLang = document.documentElement.lang || 'fr';
        
        // Manually defined translations for common keys
        const fallbackTranslations = {
            'select_model': {
                'en': 'Select a model',
                'es': 'Seleccionar modelo',
                'fr': 'Sélectionner un modèle'
            },
            'default_favorite_name': {
                'en': 'Saved configuration',
                'es': 'Configuración guardada',
                'fr': 'Configuration sauvegardée'
            },
            'custom_dimensions': {
                'en': 'Custom dimensions',
                'es': 'Dimensiones personalizadas',
                'fr': 'Dimensions personnalisées'
            },
            'no_results': {
                'en': 'No results found',
                'es': 'No se encontraron resultados',
                'fr': 'Aucun résultat trouvé'
            },
            'search': {
                'en': 'Search',
                'es': 'Buscar',
                'fr': 'Rechercher'
            },
            'load': {
                'en': 'Load',
                'es': 'Cargar',
                'fr': 'Charger'
            },
            'edit': {
                'en': 'Edit',
                'es': 'Editar',
                'fr': 'Modifier'
            },
            'delete': {
                'en': 'Delete',
                'es': 'Eliminar',
                'fr': 'Supprimer'
            },
            'tablet_model': {
                'en': 'Model',
                'es': 'Modelo',
                'fr': 'Modèle'
            },
            'dimensions': {
                'en': 'Dimensions',
                'es': 'Dimensiones',
                'fr': 'Dimensions'
            },
            'ratio': {
                'en': 'Ratio',
                'es': 'Relación',
                'fr': 'Ratio'
            },
            'tablet_settings': {
                'en': 'TABLET',
                'es': 'TABLETA',
                'fr': 'TABLETTE'
            },
            'area_settings': {
                'en': 'ACTIVE AREA',
                'es': 'ZONA ACTIVA',
                'fr': 'ZONE ACTIVE'
            },
            'area_position': {
                'en': 'Position',
                'es': 'Posición',
                'fr': 'Position'
            },
            'surface_area': {
                'en': 'Surface',
                'es': 'Superficie',
                'fr': 'Surface'
            },
            'last_modified': {
                'en': 'Last modified:',
                'es': 'Última modificación:',
                'fr': 'Dernière modification:'
            },
            'creation_date': {
                'en': 'Created:',
                'es': 'Creado:',
                'fr': 'Création:'
            },
            'title': {
                'en': 'Title',
                'es': 'Título',
                'fr': 'Titre'
            },
            'favorite_name': {
                'en': 'Title',
                'es': 'Título',
                'fr': 'Titre'
            },
            'description': {
                'en': 'Description',
                'es': 'Descripción',
                'fr': 'Description'
            },
            'favorite_description': {
                'en': 'Description',
                'es': 'Descripción',
                'fr': 'Description'
            },
            'current_config': {
                'en': 'Configuration',
                'es': 'Configuración',
                'fr': 'Configuration'
            },
            'radius': {
                'en': 'Radius:',
                'es': 'Radio:',
                'fr': 'Rayon:'
            },
            'save': {
                'en': 'Save',
                'es': 'Guardar',
                'fr': 'Sauvegarder'
            },
            'cancel': {
                'en': 'Cancel',
                'es': 'Cancelar',
                'fr': 'Annuler'
            },
            'save_favorite': {
                'en': 'Save current configuration',
                'es': 'Guardar configuración actual',
                'fr': 'Enregistrer la configuration actuelle'
            },
            'delete_confirm': {
                'en': 'Confirm deletion',
                'es': 'Confirmar eliminación',
                'fr': 'Confirmer la suppression'
            },
            'warning': {
                'en': 'Warning',
                'es': 'Advertencia',
                'fr': 'Attention'
            },
            'confirm_modification': {
                'en': 'Confirm modification',
                'es': 'Confirmar modificación',
                'fr': 'Confirmer la modification'
            },
            'delete_warning': {
                'en': 'Are you sure you want to delete this configuration? This action cannot be undone.',
                'es': '¿Está seguro de que desea eliminar esta configuración? Esta acción no se puede deshacer.',
                'fr': 'Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible et ne peut pas être annulée.'
            }
        };
        
        // Determine the language to use (prefix only)
        let lang = 'fr'; // Default
        if (htmlLang.startsWith('en')) {
            lang = 'en';
        } else if (htmlLang.startsWith('es')) {
            lang = 'es';
        }
        
        // Use the fallback translation if available
        if (fallbackTranslations[key] && fallbackTranslations[key][lang]) {
            translated = fallbackTranslations[key][lang];
        } else {
            // Default formatting for unknown keys
            translated = key.replace(/_/g, ' ');
            // First letter capitalized
            translated = translated.charAt(0).toUpperCase() + translated.slice(1);
        }
    }
    
    return translated;
}

// function to initialize the translations
function initializeI18n() {
    try {
        // Make the robust translation function available globally
        if (typeof window !== 'undefined') {
            window.translateWithFallback = translateWithFallback;
        }
        
        // Detect and apply the browser language before translating the page
        detectAndApplyBrowserLanguage();
        
        // Apply the translations to the first load
        localeManager.updatePageTranslations();
        
        // Add the event listener for the new elements added to the DOM
        observeDOMChanges();
        
        // Make the translation function available globally
        if (typeof window !== 'undefined') {
            window.__ = (key, defaultValue) => {
                try {
                    const translation = localeManager.translate(key);
                    return translation === key && defaultValue ? defaultValue : translation;
                } catch (e) {
                    console.warn('Global translation error:', e);
                    return defaultValue || key;
                }
            };
            
            // Expose the function to force the language detection
            window.forceLanguageDetection = () => {
                try {
                    // Force the language detection by ignoring saved preferences
                    detectAndApplyBrowserLanguage(true);
                    return true;
                } catch (e) {
                    console.error('Error forcing language detection:', e);
                    return false;
                }
            };
        }
        
        // Add a custom event listener for specific popups
        if (typeof document !== 'undefined') {
            document.addEventListener('popup:created', (event) => {
                try {
                    if (event.detail && event.detail.popupId) {
                        const popup = document.getElementById(event.detail.popupId);
                        if (popup) {
                            // Update explicitly all translations in the popup
                            const elementsToTranslate = popup.querySelectorAll('[data-i18n]');
                            elementsToTranslate.forEach(element => {
                                try {
                                    const key = element.getAttribute('data-i18n');
                                    const translation = localeManager.translate(key);
                                    element.textContent = translation;
                                } catch (e) {
                                    console.warn('Error translating a popup element:', e);
                                }
                            });
                            
                            // Update the placeholders
                            const placeholderElements = popup.querySelectorAll('[data-i18n-placeholder]');
                            placeholderElements.forEach(element => {
                                try {
                                    const key = element.getAttribute('data-i18n-placeholder');
                                    const translation = localeManager.translate(key);
                                    element.placeholder = translation;
                                } catch (e) {
                                    console.warn('Error translating a popup placeholder:', e);
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Error processing a popup:created event:', e);
                }
            });
        }
    } catch (e) {
        console.error('Error during the translations initialization:', e);
    }
}

// Function to observe the DOM changes and apply the translations to the new elements
function observeDOMChanges() {
    try {
        // Check that MutationObserver is available
        if (typeof MutationObserver === 'undefined') {
            console.warn('MutationObserver is not available in this browser');
            return;
        }
        
        // Configuration of the observer
        const config = { childList: true, subtree: true };
        
        // Callback of the observer that will be called for each mutation
        const callback = function(mutationsList, observer) {
            try {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // For each new node added, apply the translations if necessary
                        mutation.addedNodes.forEach(node => {
                            try {
                                if (node.nodeType === 1) {  // Type 1 = element
                                    // Check if the node itself has a data-i18n attribute
                                    if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                        const key = node.getAttribute('data-i18n');
                                        node.textContent = localeManager.translate(key);
                                    }
                                    
                                    // Check if the node has descendants with data-i18n
                                    if (node.querySelectorAll) {
                                        const elements = node.querySelectorAll('[data-i18n]');
                                        elements.forEach(element => {
                                            try {
                                                const key = element.getAttribute('data-i18n');
                                                element.textContent = localeManager.translate(key);
                                            } catch (e) {
                                                console.warn('Error translating a new element:', e);
                                            }
                                        });
                                        
                                        // Also handle the placeholders
                                        const placeholderElements = node.querySelectorAll('[data-i18n-placeholder]');
                                        placeholderElements.forEach(element => {
                                            try {
                                                const key = element.getAttribute('data-i18n-placeholder');
                                                element.placeholder = localeManager.translate(key);
                                            } catch (e) {
                                                console.warn('Error translating a new placeholder:', e);
                                            }
                                        });
                                    }
                                }
                            } catch (e) {
                                console.warn('Error processing a new node:', e);
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('Error in the MutationObserver callback:', e);
            }
        };
        
        // Create and start the observer
        const observer = new MutationObserver(callback);
        
        if (document && document.body) {
            observer.observe(document.body, config);
        } else {
            // If the document is not yet ready, wait for the DOM to be loaded
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    observer.observe(document.body, config);
                }
            });
        }
    } catch (e) {
        console.error('Error during the MutationObserver configuration:', e);
    }
}

// Event listener to update the translations when the language changes
if (typeof document !== 'undefined') {
    document.addEventListener('localeChanged', () => {
        try {
            localeManager.updatePageTranslations();
        } catch (e) {
            console.warn('Error updating the translations after a language change:', e);
        }
    });

    // Add an event to translate any newly added element to the DOM
    document.addEventListener('i18n:translate', (event) => {
        try {
            if (event.detail && event.detail.element) {
                const element = event.detail.element;
                if (element.nodeType === 1) {  // Type 1 = element
                    // Check if the element itself has a data-i18n attribute
                    if (element.hasAttribute && element.hasAttribute('data-i18n')) {
                        const key = element.getAttribute('data-i18n');
                        element.textContent = localeManager.translate(key);
                    }
                    
                    // Check if the element has descendants with data-i18n
                    if (element.querySelectorAll) {
                        const elements = element.querySelectorAll('[data-i18n]');
                        elements.forEach(elem => {
                            try {
                                const key = elem.getAttribute('data-i18n');
                                elem.textContent = localeManager.translate(key);
                            } catch (e) {
                                console.warn('Error translating a requested element:', e);
                            }
                        });
                        
                        // Also handle the placeholders
                        const placeholderElements = element.querySelectorAll('[data-i18n-placeholder]');
                        placeholderElements.forEach(elem => {
                            try {
                                const key = elem.getAttribute('data-i18n-placeholder');
                                elem.placeholder = localeManager.translate(key);
                            } catch (e) {
                                console.warn('Error translating a requested placeholder:', e);
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Error processing the i18n:translate event:', e); 
        }
    });
}

export default initializeI18n; 