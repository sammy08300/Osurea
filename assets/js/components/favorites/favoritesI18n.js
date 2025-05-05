// i18n.js - Fonctions de traduction et helpers
export function translateWithFallback(key) {
    let translated = null;
    if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
        try {
            translated = localeManager.translate(key);
            if (translated === key) translated = null;
        } catch (e) {
            console.error("[ERROR] Translation failed for key:", key, e);
        }
    }
    if (!translated || translated.startsWith('i18n:')) {
        const htmlLang = document.documentElement.lang || 'fr';
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
            'favorite_name': {
                'en': 'Title',
                'es': 'Título',
                'fr': 'Titre'
            },
            'title': {
                'en': 'Title',
                'es': 'Título',
                'fr': 'Titre'
            },
            'favorite_description': {
                'en': 'Description',
                'es': 'Descripción',
                'fr': 'Description'
            },
            'description': {
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
        let lang = 'fr';
        if (htmlLang.startsWith('en')) {
            lang = 'en';
        } else if (htmlLang.startsWith('es')) {
            lang = 'es';
        }
        if (fallbackTranslations[key] && fallbackTranslations[key][lang]) {
            translated = fallbackTranslations[key][lang];
        } else {
            translated = key.replace(/_/g, ' ');
            translated = translated.charAt(0).toUpperCase() + translated.slice(1);
        }
    }
    return translated;
} 