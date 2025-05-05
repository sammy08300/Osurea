// favorite-actions.js - Module de gestion des actions sur les favoris
import { translateWithFallback } from '../../../js/i18n-init.js';
import { getFavorites, getFavoriteById, addFavorite, updateFavorite, removeFavorite } from './favorite-storage.js';
import { FavoritesPopups } from './favorite-popup.js';
import { FavoritesRendering } from './favorite-rendering.js';
import { FavoritesInit } from './favorite-init.js';
import localeManager from '../../../locales/index.js';

/**
 * Formate un nombre avec un certain nombre de décimales
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(val, decimals = 1) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    return val.toFixed(decimals);
}

/**
 * Module de gestion des actions sur les favoris
 */
export const FavoritesActions = {
    editingFavoriteId: null,
    currentDetailedFavoriteId: null,
    autoSaveTimer: null,
    originalValues: null,

    /**
     * Charge un favori dans le formulaire principal
     * @param {string|number} id
     */
    loadFavorite(id) {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(localeManager.translate('notifications.favoriteNotFound') || `Favori ID ${id} introuvable`);
            }
            return;
        }
        try {
            // Exemple : mise à jour des champs du formulaire (à adapter selon l'app)
            document.getElementById('areaWidth').value = formatNumber(favorite.width);
            document.getElementById('areaHeight').value = formatNumber(favorite.height);
            document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
            document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
            if (favorite.ratio) {
                document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
            }
            if (typeof favorite.radius !== 'undefined') {
                document.getElementById('areaRadius').value = favorite.radius;
                const radiusInput = document.getElementById('radius-input');
                if (radiusInput) radiusInput.value = favorite.radius;
            }
            
            // Mettre à jour les dimensions de la tablette si disponibles
            if (typeof favorite.tabletW !== 'undefined' && typeof favorite.tabletH !== 'undefined') {
                const tabletWidth = document.getElementById('tabletWidth');
                const tabletHeight = document.getElementById('tabletHeight');
                
                if (tabletWidth) tabletWidth.value = formatNumber(favorite.tabletW);
                if (tabletHeight) tabletHeight.value = formatNumber(favorite.tabletH);
            }
            
            // Mettre à jour l'information du modèle si disponible
            if (favorite.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    const selectorText = tabletSelector.querySelector('#tabletSelectorText');
                    
                    // Vérifier si c'est une clé de traduction
                    if (favorite.presetInfo.startsWith('i18n:')) {
                        const key = favorite.presetInfo.substring(5);
                        
                        // Appliquer la clé de traduction à l'attribut data-i18n
                        selectorText.setAttribute('data-i18n', key);
                        
                        // Utiliser notre fonction de traduction robuste
                        selectorText.textContent = translateWithFallback(key);
                    } else {
                        // C'est un nom de modèle normal, pas une clé de traduction
                        selectorText.removeAttribute('data-i18n');
                        selectorText.textContent = favorite.presetInfo;
                    }
                }
            }
            
            // Mettre à jour l'affichage si besoin
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
            
            // Mettre en évidence le favori chargé sans recharger toute la liste
            FavoritesRendering.highlightFavorite(id);
            
            // Sauvegarder l'état actuel dans les préférences si disponible
            if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
            }
            
            // Notification
            if (typeof Notifications !== 'undefined' && Notifications.success) {
                Notifications.success(localeManager.translate('notifications.configurationLoaded') || 'Configuration chargée');
            }
        } catch (error) {
            console.error('Error loading the favorite:', error);
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(localeManager.translate('notifications.errorLoadingConfig') || 'Erreur lors du chargement de la configuration');
            }
        }
    },
    
    /**
     * Démarre l'édition d'un favori
     * @param {string|number} id - ID du favori à éditer
     */
    editFavorite(id) {
        const favorite = getFavoriteById(id);
        if (!favorite) {
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(localeManager.translate('notifications.favoriteNotFound') || 'Favori introuvable');
            }
            return;
        }
        
        // Stocker l'ID du favori en cours d'édition (dans l'état global ou local)
        this.editingFavoriteId = id;
        
        // Sauvegarder les valeurs originales pour pouvoir les restaurer
        this.originalValues = {
            width: favorite.width,
            height: favorite.height,
            x: favorite.x || favorite.offsetX,
            y: favorite.y || favorite.offsetY,
            ratio: favorite.ratio,
            tabletW: favorite.tabletW, 
            tabletH: favorite.tabletH,
            presetInfo: favorite.presetInfo,
            title: favorite.title,
            description: favorite.description,
            radius: favorite.radius || 0
        };
        
        // Mise à jour du state global si disponible
        if (typeof window.appState !== 'undefined') {
            window.appState.editingFavoriteId = id;
            window.appState.originalValues = this.originalValues;
        }
        
        // Afficher le bouton pour annuler l'édition
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.classList.add('flex');
            
            // Ajouter l'événement d'annulation
            cancelBtn.onclick = () => this.cancelEditMode();
        }
        
        // Remplacer le bouton de sauvegarde par un bouton "Confirmer la modification"
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            // Changer le contenu du bouton
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span data-i18n="favorites.confirmModification">Confirmer la modification</span>`;
            
            // S'assurer que la traduction est appliquée
            if (typeof localeManager !== 'undefined') {
                if (typeof localeManager.applyTranslations === 'function') {
                    localeManager.applyTranslations(saveBtn);
                } else if (typeof localeManager.translate === 'function') {
                    const span = saveBtn.querySelector('span[data-i18n]');
                    if (span) {
                        const key = span.getAttribute('data-i18n');
                        span.textContent = localeManager.translate(key);
                    }
                }
            }
        }
        
        // Remplir le formulaire avec les valeurs du favori
        document.getElementById('areaWidth').value = formatNumber(favorite.width);
        document.getElementById('areaHeight').value = formatNumber(favorite.height);
        document.getElementById('areaOffsetX').value = formatNumber(favorite.x || favorite.offsetX, 3);
        document.getElementById('areaOffsetY').value = formatNumber(favorite.y || favorite.offsetY, 3);
        if (favorite.ratio) {
            document.getElementById('customRatio').value = formatNumber(favorite.ratio, 3);
        }
        if (typeof favorite.radius !== 'undefined') {
            document.getElementById('areaRadius').value = favorite.radius;
            const radiusInput = document.getElementById('radius-input');
            if (radiusInput) radiusInput.value = favorite.radius;
        }
        
        // Mettre à jour l'affichage de l'interface si la fonction existe
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        } else if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
        
        // Mettre en surbrillance le favori en cours d'édition
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`);
        if (favoriteElement) {
            favoriteElement.classList.add('border-blue-500', 'highlight-effect');
            // Retirer la surbrillance après un délai
            setTimeout(() => {
                favoriteElement.classList.remove('highlight-effect');
                // Garder la bordure bleue pour indiquer l'élément en cours d'édition
            }, 1500);
        }
        
        // Afficher une notification
        if (typeof Notifications !== 'undefined' && Notifications.info) {
            Notifications.info(localeManager.translate('notifications.editModeActivated') || 'Mode édition activé - Modifiez les paramètres puis cliquez sur "Confirmer la modification"');
        }
    },

    /**
     * Annule le mode édition et restaure les valeurs originales
     * @param {boolean} skipNotification - Si vrai, n'affiche pas de notification
     */
    cancelEditMode(skipNotification = false) {
        // Vérifier qu'il y a un mode d'édition actif et des valeurs à restaurer
        if (!this.editingFavoriteId || !this.originalValues) {
            return;
        }
        
        // Stocker l'ID pour pouvoir l'utiliser après la réinitialisation
        const previousEditingId = this.editingFavoriteId;
        
        // Restaurer les valeurs originales
        const original = this.originalValues;
        
        if (original) {
            document.getElementById('areaWidth').value = formatNumber(original.width);
            document.getElementById('areaHeight').value = formatNumber(original.height);
            document.getElementById('areaOffsetX').value = formatNumber(original.x, 3);
            document.getElementById('areaOffsetY').value = formatNumber(original.y, 3);
            
            if (original.ratio) {
                document.getElementById('customRatio').value = formatNumber(original.ratio, 3);
            }
            
            if (typeof original.radius !== 'undefined') {
                document.getElementById('areaRadius').value = original.radius;
                const radiusInput = document.getElementById('radius-input');
                if (radiusInput) radiusInput.value = original.radius;
            }
            
            // Mettre à jour l'affichage
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            } else if (typeof window.updateDisplay === 'function') {
                window.updateDisplay();
            }
        }
        
        // Supprimer la mise en évidence du favori en cours d'édition
        // sans provoquer d'animation indésirable
        const favoriteElement = document.querySelector(`.favorite-item[data-id="${previousEditingId}"]`);
        if (favoriteElement) {
            // Supprimer les classes sans transition
            requestAnimationFrame(() => {
                favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
            });
        }
        
        // Réinitialiser le bouton de sauvegarde
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span data-i18n="save">Sauvegarder</span>`;
            
            // S'assurer que la traduction est appliquée
            if (typeof localeManager !== 'undefined') {
                if (typeof localeManager.applyTranslations === 'function') {
                    localeManager.applyTranslations(saveBtn);
                } else if (typeof localeManager.translate === 'function') {
                    const span = saveBtn.querySelector('span[data-i18n]');
                    if (span) {
                        const key = span.getAttribute('data-i18n');
                        span.textContent = localeManager.translate(key);
                    }
                }
            }
        }
        
        // Cacher le bouton d'annulation
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
            cancelBtn.classList.remove('flex');
        }
        
        // Réinitialiser les états
        this.editingFavoriteId = null;
        this.originalValues = null;
        
        // Réinitialiser également dans l'état global si disponible
        if (typeof window.appState !== 'undefined') {
            window.appState.editingFavoriteId = null;
            window.appState.originalValues = null;
        }
        
        // Afficher une notification sauf si demandé de ne pas le faire
        if (!skipNotification && typeof Notifications !== 'undefined' && Notifications.info) {
            Notifications.info(localeManager.translate('notifications.editModeCanceled') || 'Mode édition annulé');
        }
    },

    /**
     * Supprime un favori avec confirmation
     * @param {string|number} id
     */
    deleteFavorite(id) {
        FavoritesPopups.showDeleteDialog((confirmed) => {
            if (confirmed) {
                // Trouver l'élément avant de le supprimer pour pouvoir l'animer
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${id}"]`);
                
                if (favoriteElement) {
                    // Animer la disparition de l'élément avant de le supprimer
                    favoriteElement.classList.add('animate-fadeOut');
                    
                    // Attendre que l'animation soit terminée avant de supprimer définitivement
                    setTimeout(() => {
                        const success = removeFavorite(id);
                        
                        if (success) {
                            // Supprimer l'élément du DOM
                            if (favoriteElement.parentNode) {
                                favoriteElement.parentNode.removeChild(favoriteElement);
                            }
                            
                            // Mettre à jour le cache des favoris et forcer une mise à jour complète
                            FavoritesInit.updateFavoriteCache(true);
                            
                            // S'assurer que le favori est également supprimé des préférences
                            if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                                setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
                            }
                            
                            if (typeof Notifications !== 'undefined' && Notifications.success) {
                                Notifications.success(localeManager.translate('notifications.favoriteDeleted') || 'Favori supprimé');
                            }
                        } else {
                            // Si erreur, retirer l'animation et restaurer l'élément
                            favoriteElement.classList.remove('animate-fadeOut');
                            
                            if (typeof Notifications !== 'undefined' && Notifications.error) {
                                Notifications.error(localeManager.translate('notifications.errorDeletingFavorite') || 'Erreur lors de la suppression du favori');
                            }
                        }
                    }, 300); // Durée de l'animation fadeOut
                } else {
                    // Si l'élément n'est pas trouvé dans le DOM, suppression classique
                    const success = removeFavorite(id);
                    
                    if (success) {
                        // Mettre à jour le cache et l'interface
                        FavoritesInit.updateFavoriteCache(true);
                        
                        // S'assurer que le favori est également supprimé des préférences
                        if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                            setTimeout(() => window.PreferencesManager.saveCurrentState(), 100);
                        }
                        
                        if (typeof Notifications !== 'undefined' && Notifications.success) {
                            Notifications.success(localeManager.translate('notifications.favoriteDeleted') || 'Favori supprimé');
                        }
                    } else {
                        if (typeof Notifications !== 'undefined' && Notifications.error) {
                            Notifications.error(localeManager.translate('notifications.errorDeletingFavorite') || 'Erreur lors de la suppression du favori');
                        }
                    }
                }
            }
        });
    },

    /**
     * Sauvegarde un favori (ajout ou mise à jour selon le contexte, avec titre/description)
     */
    saveFavorite() {
        // Récupérer les valeurs du formulaire
        const areaWidth = parseFloat(document.getElementById('areaWidth').value);
        const areaHeight = parseFloat(document.getElementById('areaHeight').value);
        const areaOffsetX = parseFloat(document.getElementById('areaOffsetX').value);
        const areaOffsetY = parseFloat(document.getElementById('areaOffsetY').value);
        const customRatio = parseFloat(document.getElementById('customRatio').value);
        const areaRadius = parseInt(document.getElementById('areaRadius')?.value) || 0;
        
        // Récupérer les informations de la tablette si disponibles
        let tabletWidth = 0;
        let tabletHeight = 0;
        let presetInfo = null;
        
        const tabletWidthElement = document.getElementById('tabletWidth');
        const tabletHeightElement = document.getElementById('tabletHeight');
        const tabletSelectorText = document.getElementById('tabletSelectorText');
        
        if (tabletWidthElement) {
            tabletWidth = parseFloat(tabletWidthElement.value) || 0;
        }
        if (tabletHeightElement) {
            tabletHeight = parseFloat(tabletHeightElement.value) || 0;
        }
        if (tabletSelectorText) {
            // Vérifier si c'est une clé de traduction
            if (tabletSelectorText.hasAttribute('data-i18n')) {
                presetInfo = 'i18n:' + tabletSelectorText.getAttribute('data-i18n');
            } else {
                presetInfo = tabletSelectorText.textContent;
            }
        }
        
        // Log pour déboguer
        console.log('Saving favorite, edit mode:', !!this.editingFavoriteId);
        
        // Vérifier si on est en mode édition
        if (this.editingFavoriteId) {
            // Mise à jour d'un favori existant - PAS DE DIALOGUE, mise à jour directe
            const updatedData = {
                width: !isNaN(areaWidth) ? areaWidth : this.originalValues.width,
                height: !isNaN(areaHeight) ? areaHeight : this.originalValues.height,
                x: !isNaN(areaOffsetX) ? areaOffsetX : this.originalValues.x,
                y: !isNaN(areaOffsetY) ? areaOffsetY : this.originalValues.y,
                ratio: !isNaN(customRatio) ? customRatio : this.originalValues.ratio,
                tabletW: !isNaN(tabletWidth) ? tabletWidth : this.originalValues.tabletW,
                tabletH: !isNaN(tabletHeight) ? tabletHeight : this.originalValues.tabletH,
                presetInfo: presetInfo || this.originalValues.presetInfo,
                title: this.originalValues.title,
                description: this.originalValues.description,
                radius: !isNaN(areaRadius) ? areaRadius : (this.originalValues.radius || 0),
                lastModified: new Date().getTime() // Ajouter la date de dernière modification
            };
            
            const success = updateFavorite(this.editingFavoriteId, updatedData);
            if (success) {
                // Stocker l'ID du favori modifié
                const modifiedFavoriteId = this.editingFavoriteId;
                
                // Mettre à jour le cache des favoris pour refléter les changements
                FavoritesInit.updateFavoriteCache(false);
                
                // Annuler le mode édition sans notification
                this.cancelEditMode(true);
                
                // Trouver l'élément du favori modifié et le mettre en évidence
                // sans recharger toute la liste
                const favoriteElement = document.querySelector(`.favorite-item[data-id="${modifiedFavoriteId}"]`);
                if (favoriteElement) {
                    // Mettre en évidence la carte modifiée
                    favoriteElement.classList.add('border-blue-500', 'highlight-effect');
                    
                    // Retirer la mise en évidence après un délai
                    setTimeout(() => {
                        favoriteElement.classList.remove('border-blue-500', 'highlight-effect');
                    }, 1500);
                }
                
                if (typeof Notifications !== 'undefined' && Notifications.success) {
                    Notifications.success(localeManager.translate('notifications.configurationUpdated') || 'Configuration mise à jour');
                }
            } else {
                if (typeof Notifications !== 'undefined' && Notifications.error) {
                    Notifications.error(localeManager.translate('notifications.errorUpdatingConfig') || 'Erreur lors de la mise à jour de la configuration');
                }
            }
        } else {
            // Ajout d'un nouveau favori - afficher le dialogue pour le titre et la description
            FavoritesPopups.showCommentDialog((commentData) => {
                // Si le titre est vide, utiliser la clé de traduction complète
                if (!commentData.title || commentData.title.trim() === '') {
                    commentData.title = "i18n:favorites.defaultName";
                }
                
                // Si c'est une clé de traduction, ne pas tronquer
                if (!commentData.title.startsWith('i18n:') && commentData.title.length > 32) {
                    if (typeof Notifications !== 'undefined' && Notifications.warning) {
                        Notifications.warning(localeManager.translate('notifications.titleTruncated') || "Le titre a été tronqué à 32 caractères.");
                    }
                    commentData.title = commentData.title.substring(0, 32);
                }
                
                if (commentData.description && commentData.description.length > 144) {
                    if (typeof Notifications !== 'undefined' && Notifications.warning) {
                        Notifications.warning(localeManager.translate('notifications.descriptionTruncated') || "La description a été tronquée à 144 caractères.");
                    }
                    commentData.description = commentData.description.substring(0, 144);
                }
                
                const newFavorite = {
                    width: areaWidth,
                    height: areaHeight,
                    x: areaOffsetX,
                    y: areaOffsetY,
                    ratio: customRatio,
                    title: commentData.title,
                    description: commentData.description,
                    tabletW: tabletWidth,
                    tabletH: tabletHeight,
                    presetInfo: presetInfo,
                    radius: areaRadius,
                    createdAt: Date.now()
                };
                
                console.log('Creating new favorite:', newFavorite);
                
                // Forcer le nettoyage du cache avant d'ajouter
                if (typeof StorageManager !== 'undefined' && typeof StorageManager.clearCache === 'function') {
                    StorageManager.clearCache();
                }
                
                const savedFavorite = addFavorite(newFavorite);
                if (savedFavorite) {
                    // Récupérer la liste complète des favoris après l'ajout pour débogage
                    console.log('All favorites after adding:', getFavorites());
                    
                    // Mettre à jour le cache et forcer un rafraîchissement complet
                    FavoritesInit.updateFavoriteCache(true);
                    
                    // Sauvegarder les préférences après un court délai pour s'assurer que l'ajout est terminé
                    if (typeof window.PreferencesManager !== 'undefined' && typeof window.PreferencesManager.saveCurrentState === 'function') {
                        // Délai plus long pour garantir que le stockage est terminé
                        setTimeout(() => {
                            // Debug: vérifier si le favori existe avant de sauvegarder les préférences
                            const allFavs = getFavorites();
                            const favExists = allFavs.some(f => f.id === savedFavorite.id);
                            console.log(`Favorite ${savedFavorite.id} exists before saving prefs: ${favExists}`);
                            
                            window.PreferencesManager.saveCurrentState();
                        }, 300);
                    }
                    
                    // Attendre un court instant pour permettre au DOM de se mettre à jour
                    setTimeout(() => {
                        // Mettre en évidence le favori ajouté
                        const favoriteElement = document.querySelector(`.favorite-item[data-id="${savedFavorite.id}"]`);
                        if (favoriteElement) {
                            favoriteElement.classList.add('highlight-effect');
                            setTimeout(() => {
                                favoriteElement.classList.remove('highlight-effect');
                            }, 2000);
                        }
                    }, 100);
                    
                    if (typeof Notifications !== 'undefined' && Notifications.success) {
                        Notifications.success(localeManager.translate('notifications.configurationSaved') || 'Configuration sauvegardée');
                    }
                } else {
                    if (typeof Notifications !== 'undefined' && Notifications.error) {
                        Notifications.error(localeManager.translate('notifications.errorSavingConfig') || 'Erreur lors de la sauvegarde de la configuration');
                    }
                }
            });
        }
    },

    /**
     * Programme une sauvegarde automatique après un délai
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            // Sauvegarder les changements
            const needsUpdate = this.saveChangesIfNeeded();
            
            // Si les données ont été modifiées, forcer un rafraîchissement 
            // des favoris dans l'interface pour refléter les changements
            if (needsUpdate) {
                FavoritesInit.updateFavoriteCache(true);
            }
        }, 600);
    },
    
    /**
     * Sauvegarde les modifications apportées aux champs du favori si nécessaire
     * @returns {boolean} - true si des modifications ont été effectuées, false sinon
     */
    saveChangesIfNeeded() {
        const favoriteId = this.currentDetailedFavoriteId;
        if (!favoriteId) {
            return false;
        }
        
        const titleInput = document.getElementById('details-title');
        const descriptionInput = document.getElementById('details-description');
        
        if (!titleInput || !descriptionInput) {
            return false;
        }
        
        const favorite = getFavoriteById(favoriteId);
        if (!favorite) {
            return false;
        }
        
        // Récupérer les valeurs
        const newTitleValue = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        
        // Vérifier si on doit préserver le format i18n
        let newTitle = newTitleValue;
        
        // Si on a un titre original stocké et c'était une clé i18n,
        // et l'utilisateur n'a pas changé le texte affiché, préserver la clé i18n
        const originalTitle = titleInput.dataset.originalTitle;
        if (originalTitle && originalTitle.startsWith('i18n:')) {
            const key = originalTitle.substring(5);
            let currentTranslation = '';
            
            // Obtenir la traduction actuelle pour comparaison
            if (typeof localeManager !== 'undefined' && typeof localeManager.translate === 'function') {
                currentTranslation = localeManager.translate(key);
            } else {
                currentTranslation = translateWithFallback(key);
            }
            
            if (currentTranslation === newTitleValue) {
                // L'utilisateur n'a pas modifié le texte traduit, garder la clé i18n
                newTitle = originalTitle;
            } else if (newTitleValue === key) {
                // L'utilisateur a entré la clé brute, garder le format i18n
                newTitle = originalTitle;
            } else if (key === 'favorites.defaultName') {
                // Pour favorites.defaultName, vérifier s'ils ont tapé l'une des traductions standard
                let isDefaultTranslation = false;
                
                if (newTitleValue === 'Configuration sauvegardée' ||
                    newTitleValue === 'Saved configuration' ||
                    newTitleValue === 'Configuración guardada') {
                    isDefaultTranslation = true;
                }
                
                if (isDefaultTranslation) {
                    newTitle = 'i18n:favorites.defaultName';
                }
            }
        }
        
        // Vérifier si les valeurs ont changé
        const titleChanged = newTitle !== (favorite.title || '');
        const descChanged = newDescription !== (favorite.description || '');
        
        if (titleChanged || descChanged) {
            // Mettre à jour la date de dernière modification
            const now = new Date().getTime();
            
            // Mettre à jour le titre et la description
            const updatedData = {
                ...favorite,
                title: newTitle,
                description: newDescription,
                lastModified: now // Ajouter la date de dernière modification
            };
            
            const success = updateFavorite(favoriteId, updatedData);
            
            if (success) {
                // Mise à jour de l'affichage de la date de dernière modification dans la popup
                const lastModifiedContainer = document.getElementById('details-last-modified-container');
                const lastModifiedContent = document.getElementById('details-last-modified');
                
                if (lastModifiedContainer && lastModifiedContent) {
                    const lastModifiedDate = new Date(now);
                    const formattedLastModified = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
                    lastModifiedContent.textContent = formattedLastModified;
                    lastModifiedContainer.classList.remove('hidden');
                    lastModifiedContainer.classList.add('flex');
                }
                
                // Mettre à jour le cache pour refléter les changements
                FavoritesInit.cachedFavorites = getFavorites();
                // Forcer une mise à jour complète des favoris pour assurer la persistance
                FavoritesInit.updateFavoriteCache(true);
                
                return true; // Des modifications ont été effectuées
            }
        }
        
        return false; // Aucune modification n'a été effectuée
    },

    /**
     * Affiche un popup détaillé pour un favori
     * @param {Object} favorite 
     */
    showFavoriteDetails(favorite) {
        FavoritesPopups.showFavoriteDetails(favorite, this);
    }
}; 