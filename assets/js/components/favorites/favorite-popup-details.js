// favorite-popup-details.js - Module de gestion des popups détaillées
import { translateWithFallback } from '../../../js/i18n-init.js';
import { getFavoriteById } from './favorite-storage.js';

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
 * Calcule le ratio largeur/hauteur
 * @param {number} w
 * @param {number} h
 * @returns {number}
 */
function calculateRatio(w, h) {
    if (!w || !h) return 0;
    return w / h;
}

/**
 * Module de gestion des popups détaillées 
 */
export const FavoritesDetailsPopup = {
    detailsPopup: null,
    
    /**
     * Affiche un popup détaillé pour un favori
     * @param {Object} favorite - Le favori à afficher
     * @param {Object} actionsHandler - Le gestionnaire d'actions pour les boutons
     */
    showFavoriteDetails(favorite, actionsHandler) {
        let popup = document.getElementById('favorite-details-popup');
        if (!popup) {
            this.createDetailsPopup();
            popup = document.getElementById('favorite-details-popup');
            if (!popup) {
                console.error("[ERROR] Impossible de créer la popup de détails");
                return;
            }
        }
        
        // Remplir les champs
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const titleInput = popup.querySelector('#details-title');
        const descriptionInput = popup.querySelector('#details-description');
        const dateSpan = popup.querySelector('#details-date');
        const areaDim = popup.querySelector('#details-area-dimensions');
        const areaRatio = popup.querySelector('#details-area-ratio');
        const areaSize = popup.querySelector('#details-area-size');
        const areaPos = popup.querySelector('#details-area-position');
        const areaRadius = popup.querySelector('#details-area-radius');
        const tabletDim = popup.querySelector('#details-tablet-dimensions');
        const tabletRatio = popup.querySelector('#details-tablet-ratio');
        const tabletName = popup.querySelector('#details-tablet-name');
        const titleCounter = popup.querySelector('#details-title-counter');
        const descriptionCounter = popup.querySelector('#details-description-counter');
        
        // Store l'ID du favori actuellement affiché dans le gestionnaire d'actions
        actionsHandler.currentDetailedFavoriteId = favorite.id;
        
        let title = favorite.title || favorite.comment || 'i18n:favorites.defaultName';
        let translatedTitle = title;
        
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        
        titleInput.value = translatedTitle;
        titleInput.dataset.originalTitle = title; // Store le titre original pour la sauvegarde
        descriptionInput.value = favorite.description || '';
        dateSpan.textContent = formattedDate;
        
        // Mettre à jour les compteurs de caractères
        if (titleCounter) {
            titleCounter.textContent = `${translatedTitle.length}/32`;
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            if (translatedTitle.length >= 32) {
                titleCounter.classList.add('text-red-500');
            } else if (translatedTitle.length > 25) {
                titleCounter.classList.add('text-yellow-500');
            }
        }
        
        if (descriptionCounter) {
            const descLength = (favorite.description || '').length;
            descriptionCounter.textContent = `${descLength}/144`;
            descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            
            if (descLength >= 144) {
                descriptionCounter.classList.add('text-red-500');
            } else if (descLength > 120) {
                descriptionCounter.classList.add('text-yellow-500');
            }
        }
        
        // Display la date de dernière modification si elle existe
        const lastModifiedContainer = popup.querySelector('#details-last-modified-container');
        const lastModifiedContent = popup.querySelector('#details-last-modified');
        
        if (favorite.lastModified && lastModifiedContainer && lastModifiedContent) {
            const lastModifiedDate = new Date(favorite.lastModified);
            const formattedLastModified = lastModifiedDate.toLocaleDateString() + ' ' + lastModifiedDate.toLocaleTimeString();
            lastModifiedContent.textContent = formattedLastModified;
            lastModifiedContainer.classList.remove('hidden');
            lastModifiedContainer.classList.add('flex');
        } else if (lastModifiedContainer) {
            lastModifiedContainer.classList.add('hidden');
            lastModifiedContainer.classList.remove('flex');
        }
        
        // Zone active
        areaDim.textContent = `${formatNumber(favorite.areaWidth || favorite.width, 3)} × ${formatNumber(favorite.areaHeight || favorite.height, 3)} mm`;
        areaRatio.textContent = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        areaSize.textContent = `${formatNumber((favorite.areaWidth || favorite.width) * (favorite.areaHeight || favorite.height), 1)} mm²`;
        areaPos.textContent = `X: ${formatNumber(favorite.x || favorite.offsetX, 3)}, Y: ${formatNumber(favorite.y || favorite.offsetY, 3)}`;
        areaRadius.textContent = `${typeof favorite.radius !== 'undefined' ? favorite.radius : 0}%`;
        
        // Tablette
        if (favorite.tabletW && favorite.tabletH) {
            tabletDim.textContent = `${formatNumber(favorite.tabletW, 1)} × ${formatNumber(favorite.tabletH, 1)} mm`;
            tabletRatio.textContent = formatNumber(calculateRatio(favorite.tabletW, favorite.tabletH), 3);
        } else {
            tabletDim.textContent = '-- × -- mm';
            tabletRatio.textContent = '--';
        }
        
        if (favorite.presetInfo) {
            if (favorite.presetInfo.startsWith('i18n:')) {
                const key = favorite.presetInfo.substring(5);
                tabletName.textContent = translateWithFallback(key);
            } else {
                tabletName.textContent = favorite.presetInfo;
            }
        } else {
            tabletName.textContent = translateWithFallback('tablet.selectModel');
        }
        
        // Préparation de l'animation simplifiée
        const dialogContent = popup.querySelector('div');
        if (dialogContent) {
            dialogContent.style.transform = 'scale(0.95)';
        }
        
        // Display la popup
        popup.classList.remove('hidden');
        popup.classList.add('flex');
        popup.style.opacity = '0';
        
        // Add la classe show après un court délai pour assurer une transition fluide
        // Retarder légèrement pour permettre à l'animation de clic de la carte de se terminer
        setTimeout(() => {
            popup.classList.add('show');
            popup.style.opacity = '1';
            
            // Ensure que le contenu est également animé correctement
            if (dialogContent) {
                dialogContent.style.transform = 'scale(1)';
            }
        }, 20); // Réduit de 50ms à 20ms pour une réponse plus rapide
        
        // Configurer les événements pour l'auto-sauvegarde
        this.setupAutoSave(titleInput, descriptionInput, titleCounter, descriptionCounter, actionsHandler);
        
        // Configurer les boutons d'action
        const loadBtn = popup.querySelector('#details-load-btn');
        const editBtn = popup.querySelector('#details-edit-btn');
        const deleteBtn = popup.querySelector('#details-delete-btn');
        const closeBtn = popup.querySelector('#close-details-btn');
        
        // Nettoyer les anciens gestionnaires d'événements
        loadBtn.onclick = null;
        editBtn.onclick = null;
        deleteBtn.onclick = null;
        closeBtn.onclick = null;
        
        // Add les nouveaux gestionnaires
        loadBtn.onclick = () => {
            actionsHandler.loadFavorite(favorite.id);
            this.closeDetailsPopup(actionsHandler);
        };
        
        editBtn.onclick = () => {
            actionsHandler.editFavorite(favorite.id);
            this.closeDetailsPopup(actionsHandler);
        };
        
        deleteBtn.onclick = () => {
            actionsHandler.deleteFavorite(favorite.id);
            this.closeDetailsPopup(actionsHandler);
        };
        
        closeBtn.onclick = () => {
            this.closeDetailsPopup(actionsHandler);
        };
        
        // Close la popup en cliquant à l'extérieur
        popup.onclick = (e) => {
            if (e.target === popup) {
                this.closeDetailsPopup(actionsHandler);
            }
        };
    },
    
    /**
     * Configure l'auto-sauvegarde des champs de la popup
     */
    setupAutoSave(titleInput, descriptionInput, titleCounter, descriptionCounter, actionsHandler) {
        // Remove les anciens écouteurs pour éviter les doublons
        const oldTitleListener = titleInput._inputListener;
        const oldDescListener = descriptionInput._inputListener;
        
        if (oldTitleListener) {
            titleInput.removeEventListener('input', oldTitleListener);
        }
        
        if (oldDescListener) {
            descriptionInput.removeEventListener('input', oldDescListener);
        }
        
        // Définir les nouveaux écouteurs
        const titleInputListener = () => {
            const length = titleInput.value.length;
            if (titleCounter) {
                titleCounter.textContent = `${length}/32`;
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                if (length >= 32) {
                    titleCounter.classList.add('text-red-500');
                } else if (length > 25) {
                    titleCounter.classList.add('text-yellow-500');
                }
            }
            
            // Programmer une sauvegarde automatique
            actionsHandler.scheduleAutoSave();
        };
        
        const descInputListener = () => {
            const length = descriptionInput.value.length;
            if (descriptionCounter) {
                descriptionCounter.textContent = `${length}/144`;
                descriptionCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
                
                if (length >= 144) {
                    descriptionCounter.classList.add('text-red-500');
                } else if (length > 120) {
                    descriptionCounter.classList.add('text-yellow-500');
                }
            }
            
            // Programmer une sauvegarde automatique
            actionsHandler.scheduleAutoSave();
        };
        
        // Store les références pour pouvoir les supprimer plus tard
        titleInput._inputListener = titleInputListener;
        descriptionInput._inputListener = descInputListener;
        
        // Add les écouteurs
        titleInput.addEventListener('input', titleInputListener);
        descriptionInput.addEventListener('input', descInputListener);
        
        // Activer la touche Entrée pour passer au champ description
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                descriptionInput.focus();
            }
        });
    },
    
    /**
     * Ferme la popup de détails
     * @param {Object} actionsHandler - Le gestionnaire d'actions pour la sauvegarde
     */
    closeDetailsPopup(actionsHandler) {
        if (this.detailsPopup) {
            // Sauvegarde automatique avant la fermeture
            const hasChanges = actionsHandler.saveChangesIfNeeded();
            
            // Si des changements ont été effectués, s'assurer que les données sont persistées
            if (hasChanges && typeof FavoritesInit !== 'undefined') {
                // Actuellement les changements sont déjà persistés par saveChangesIfNeeded()
                // Cette vérification supplémentaire est une sécurité
            }
            
            // Réinitialiser les compteurs et leurs classes
            const titleCounter = this.detailsPopup.querySelector('#details-title-counter');
            const descCounter = this.detailsPopup.querySelector('#details-description-counter');
            
            if (titleCounter) {
                titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
            
            if (descCounter) {
                descCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            }
            
            // Animation de fermeture simplifiée
            this.detailsPopup.classList.remove('show');
            this.detailsPopup.style.opacity = '0';
            
            // Attendre la fin de la transition
            setTimeout(() => {
                this.detailsPopup.classList.add('hidden');
                this.detailsPopup.classList.remove('flex');
            }, 300);
        }
    },
    
    /**
     * Crée la popup de détails des favoris
     */
    createDetailsPopup() {
        // Vérifier d'abord si le popup existe déjà dans le DOM
        let existingPopup = document.getElementById('favorite-details-popup');
        if (existingPopup) {
            this.detailsPopup = existingPopup;
            return;
        }

        const popup = document.createElement('div');
        popup.id = 'favorite-details-popup';
        popup.className = 'fixed inset-0 items-center justify-center bg-black bg-opacity-50 z-50 hidden transition-opacity duration-300 opacity-0';
        
        popup.innerHTML = `
            <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-5xl w-full border border-gray-800 transform transition-all duration-300 scale-95 mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <!-- En-tête avec bouton de fermeture -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span data-i18n="summary.currentConfig">Configuration</span>
                    </h2>
                    <button id="close-details-btn" class="bg-gray-800 hover:bg-gray-700 transition-colors p-1.5 rounded-md text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- Contenu principal en deux colonnes -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- COLONNE GAUCHE : Édition -->
                    <div class="space-y-6">
                        <!-- Titre -->
                        <div class="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                            <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span data-i18n="favorites.name">Titre</span>
                                </div>
                                <span id="details-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/32</span>
                            </h3>
                            <input type="text" id="details-title" maxlength="32" data-i18n-placeholder="favorites.namePlaceholder" placeholder="" 
                                    class="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-200">
                        </div>
                        
                        <!-- Description -->
                        <div class="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                            <h3 class="text-lg font-medium text-white pb-2 mb-3 border-b border-gray-700 flex items-center justify-between">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span data-i18n="favorites.description">Description</span>
                                </div>
                                <span id="details-description-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                            </h3>
                            <textarea id="details-description" maxlength="144" data-i18n-placeholder="favorites.descriptionPlaceholder" placeholder="" rows="5"
                                        class="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-colors duration-200 min-h-[120px]"></textarea>
                        </div>
                    </div>
                    
                    <!-- COLONNE DROITE : Informations techniques -->
                    <div class="space-y-6">
                
                        <!-- Informations Tablette -->
                        <div class="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                            <h4 class="text-lg font-semibold text-white mb-3 pb-2 border-b border-gray-700 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                <span data-i18n="tablet.settings">Tablette</span>
                            </h4>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-300 text-sm" data-i18n="tablet.model">Modèle:</span>
                                    <span class="text-white font-medium text-sm" id="details-tablet-name" data-i18n="tablet.selectModel">Sélectionner un modèle</span>
                                </div>
                                <div class="grid grid-cols-2 gap-3 text-sm">
                                    <div class="flex flex-col">
                                        <span class="text-gray-400 text-xs" data-i18n="tablet.dimensions">Dimensions:</span>
                                        <span class="text-white font-medium" id="details-tablet-dimensions">--</span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-gray-400 text-xs" data-i18n="ratio">Ratio:</span>
                                        <span class="text-white font-medium" id="details-tablet-ratio">--</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Informations Zone Active -->
                        <div class="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                            <h4 class="text-lg font-semibold text-white mb-3 pb-2 border-b border-gray-700 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span data-i18n="area.settings">Zone Active</span>
                            </h4>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div class="flex flex-col">
                                    <span class="text-gray-400 text-xs" data-i18n="area.dimensions">Dimensions:</span>
                                    <span class="text-white font-medium" id="details-area-dimensions">--</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-gray-400 text-xs" data-i18n="area.ratio">Ratio:</span>
                                    <span class="text-white font-medium" id="details-area-ratio">--</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-gray-400 text-xs" data-i18n="favorites.surfaceArea">Surface:</span>
                                    <span class="text-white font-medium" id="details-area-size">--</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-gray-400 text-xs" data-i18n="area.radius">Rayon:</span>
                                    <span class="text-white font-medium" id="details-area-radius">--</span>
                                </div>
                                <div class="flex flex-col col-span-2">
                                    <span class="text-gray-400 text-xs" data-i18n="area.position">Position:</span>
                                    <span class="text-white font-medium" id="details-area-position">--</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Dates -->
                        <div class="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                            <h4 class="text-lg font-semibold text-white mb-3 pb-2 border-b border-gray-700 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span data-i18n="favorites.dates">Dates</span>
                            </h4>
                            <div class="space-y-3">
                                <div class="text-sm text-gray-300 flex items-center justify-between">
                                    <span class="text-gray-400" data-i18n="favorites.creationDate">Création:</span>
                                    <span id="details-date" class="text-white font-medium"></span>
                                </div>
                                <div id="details-last-modified-container" class="text-sm text-gray-300 items-center justify-between hidden">
                                    <span class="text-gray-400" data-i18n="favorites.lastModified">Modifiée:</span>
                                    <span id="details-last-modified" class="text-white font-medium"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Boutons d'action -->
                <div class="mt-6 pt-4 border-t border-gray-700">
                    <div class="grid grid-cols-3 gap-4">
                        <button id="details-load-btn" class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span class="text-sm font-medium" data-i18n="favorites.load">Charger</span>
                        </button>
                        <button id="details-edit-btn" class="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span class="text-sm font-medium" data-i18n="favorites.editButton">Modifier</span>
                        </button>
                        <button id="details-delete-btn" class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span class="text-sm font-medium" data-i18n="favorites.deleteButton">Supprimer</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Attacher le popup au document
        document.body.appendChild(popup);
        
        // Référencer le popup pour une utilisation future
        this.detailsPopup = popup;
        
        // Add la classe pour les animations
        popup.addEventListener('transitionend', () => {
            if (!popup.classList.contains('show')) {
                popup.classList.add('hidden');
            }
        });
        
        // Déclencher un événement pour que le système de traduction puisse gérer ce popup
        try {
            const event = new CustomEvent('popup:created', { 
                detail: { popupId: 'favorite-details-popup' } 
            });
            document.dispatchEvent(event);
        } catch (e) {
            console.error("[ERROR] Impossible de déclencher l'événement popup:created", e);
        }
        
        // Add les styles CSS pour les animations
        if (!document.getElementById('favorite-details-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'favorite-details-popup-styles';
            style.textContent = `
                /* Styles d'animation pour le popup de détails */
                #details-title-counter.text-red-500, #details-description-counter.text-red-500 {
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}; 
