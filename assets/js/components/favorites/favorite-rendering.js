// favorite-rendering.js - Module de création et rendu des éléments de favoris
import { translateWithFallback } from '../../../js/i18n-init.js';
import { getFavorites } from './favorite-storage.js';
import { favoriteSortFavorites } from './favorite-sort.js';
import { FavoritesActions } from './favorite-actions.js';
import { FavoritesInit } from './favorite-init.js';

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
 * Module de rendu et création des éléments de favoris
 */
export const FavoritesRendering = {
    /**
     * Charge et affiche les favoris avec animation
     * @param {boolean} isInitialLoad - Si c'est le chargement initial (pas d'animation de sortie)
     */
    loadFavoritesWithAnimation(isInitialLoad = false) {
        // Récupérer tous les favoris depuis le module d'initialisation
        const favorites = FavoritesInit.cachedFavorites || getFavorites();
        
        // Cas où il n'y a pas de favoris
        if (favorites.length === 0) {
            if (FavoritesInit.favoritesPlaceholder) {
                FavoritesInit.favoritesPlaceholder.classList.remove('hidden');
                if (!FavoritesInit.favoritesPlaceholder.classList.contains('col-span-full')) {
                    FavoritesInit.favoritesPlaceholder.classList.add('col-span-full');
                }
            }
            
            // Vider la liste (excepté le placeholder)
            const existingCards = FavoritesInit.favoritesList.querySelectorAll('.favorite-item');
            existingCards.forEach(card => card.remove());
            
            FavoritesInit.favoritesList.classList.remove('favorites-loading');
            return;
        }
        
        // Masquer le placeholder s'il y a des favoris
        if (FavoritesInit.favoritesPlaceholder) {
            FavoritesInit.favoritesPlaceholder.classList.add('hidden');
        }
        
        // Trier les favoris selon le critère actuel
        const sortedFavorites = favoriteSortFavorites(favorites, FavoritesInit.currentSortCriteria);
        
        // Supprimer tous les éléments existants
        const existingCards = FavoritesInit.favoritesList.querySelectorAll('.favorite-item');
        existingCards.forEach(card => card.remove());
        
        // Trouver le dernier favori ajouté (celui avec l'ID le plus récent)
        const lastAddedId = Math.max(...sortedFavorites.map(f => parseInt(f.id)));
        
        // Créer et insérer tous les favoris dans l'ordre trié
        sortedFavorites.forEach(favorite => {
            // Créer un nouvel élément pour chaque favori
            const cardElement = this.createFavoriteElement(favorite);
            
            // Animer seulement si c'est le dernier ajouté et ce n'est pas le chargement initial
            if (!isInitialLoad && favorite.id == lastAddedId) {
                cardElement.style.opacity = '0';
                cardElement.classList.add('animate-fadeIn-smooth');
                
                // Animation complète après un court délai
                setTimeout(() => {
                    cardElement.style.opacity = '1';
                    // Ajouter un gestionnaire pour marquer l'animation comme terminée
                    cardElement.addEventListener('animationend', () => {
                        cardElement.classList.remove('animate-fadeIn-smooth');
                        cardElement.classList.add('animation-complete');
                    }, { once: true });
                }, 50);
            }
            
            FavoritesInit.favoritesList.appendChild(cardElement);
        });
        
        FavoritesInit.favoritesList.classList.remove('favorites-loading');
    },

    /**
     * Crée un élément DOM pour un favori
     * @param {Object} favorite
     * @returns {HTMLElement}
     */
    createFavoriteElement(favorite) {
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const item = document.createElement('div');
        item.className = 'favorite-item bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-blue-500/30 shadow-lg';
        item.dataset.id = favorite.id;
        let title = favorite.title || favorite.comment || 'i18n:favorites.defaultName';
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        const displayTitle = translatedTitle.length > 32 ? translatedTitle.substring(0, 32) + '...' : translatedTitle;
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width, 3);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        item.innerHTML = `
            <div class="relative">
                <div class="flex items-center mb-2">
                    <div class="flex-1">
                        <h3 class="font-medium text-white text-sm truncate mb-0.5">${displayTitle}</h3>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                ${areaWidth}×${areaHeight}
                            </span>
                            <span class="text-xs text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                ${areaRatio}
                            </span>
                            <span class="text-xs text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4a8 8 0 100 16 8 8 0 000-16z" />
                                </svg>
                                ${areaRadius}%
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        ${formattedDate}
                    </div>
                    <div class="flex gap-1.5">
                        <button class="load-favorite-btn bg-blue-600 hover:bg-blue-500 text-white rounded-md p-1 flex items-center justify-center transition-colors duration-200 w-7 h-7 shadow-md favorite-btn" title="Charger la configuration" aria-label="Charger la configuration">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button class="edit-favorite-btn bg-gray-600 hover:bg-gray-500 text-white rounded-md p-1 flex items-center justify-center transition-colors duration-200 w-7 h-7 shadow-md favorite-btn" title="Modifier" aria-label="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-favorite-btn bg-red-500 hover:bg-red-400 text-white rounded-md p-1 flex items-center justify-center transition-colors duration-200 w-7 h-7 shadow-md favorite-btn" title="Supprimer" aria-label="Supprimer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>`;

        // Ajouter un gestionnaire de clic à la carte elle-même (excluant les boutons)
        item.addEventListener('click', (e) => {
            // Si le clic est sur un bouton ou à l'intérieur d'un bouton, ne rien faire
            if (e.target.closest('.favorite-btn')) {
                return;
            }
            
            // Sinon, ajouter un effet visuel de clic avant d'ouvrir la popup
            e.stopPropagation();
            
            // S'assurer que nous avons l'élément de carte correct
            const card = e.currentTarget;
            
            // Ajouter une classe pour l'effet visuel de clic
            card.classList.add('card-click-effect');
            
            // Stocker les données originales
            favorite._originalTitle = title;
            
            // Attendre un court instant pour que l'effet de clic soit visible
            setTimeout(() => {
                // Retirer la classe d'effet
                card.classList.remove('card-click-effect');
                
                // Ouvrir la popup des détails
                FavoritesActions.showFavoriteDetails && FavoritesActions.showFavoriteDetails(favorite);
            }, 80); // Réduit de 150ms à 80ms pour une réaction plus rapide
        });
        
        // Ajouter des gestionnaires de clic séparés pour chaque bouton
        const loadBtn = item.querySelector('.load-favorite-btn');
        const editBtn = item.querySelector('.edit-favorite-btn');
        const deleteBtn = item.querySelector('.delete-favorite-btn');
        
        loadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            FavoritesActions.loadFavorite && FavoritesActions.loadFavorite(favorite.id);
        });
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            FavoritesActions.editFavorite && FavoritesActions.editFavorite(favorite.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            FavoritesActions.deleteFavorite && FavoritesActions.deleteFavorite(favorite.id);
        });
        
        item.style.marginTop = '8px';
        
        // Ajouter la classe animate-fadeIn-smooth pour l'animation d'entrée
        if (FavoritesInit.isInitialized) {
            item.classList.add('animate-fadeIn-smooth');
        }
        
        return item;
    },

    /**
     * Met à jour un favori existant dans l'interface
     * @param {HTMLElement} element - L'élément DOM à mettre à jour
     * @param {Object} favorite - Les données du favori
     */
    updateFavoriteElementContent(element, favorite) {
        // Extraire les informations nécessaires pour la mise à jour
        let title = favorite.title || favorite.comment || 'i18n:favorites.defaultName';
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key);
        }
        
        // Formater les valeurs pour l'affichage
        const displayTitle = translatedTitle.length > 32 ? translatedTitle.substring(0, 32) + '...' : translatedTitle;
        const date = new Date(favorite.id);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const areaWidth = formatNumber(favorite.areaWidth || favorite.width, 3);
        const areaHeight = formatNumber(favorite.areaHeight || favorite.height, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(favorite.areaWidth || favorite.width, favorite.areaHeight || favorite.height), 3);
        
        // Mettre à jour les éléments spécifiques dans la carte
        const titleElement = element.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = displayTitle;
        }
        
        // Mettre à jour les dimensions
        const dimensions = element.querySelectorAll('.flex-1 .flex span');
        if (dimensions.length >= 3) {
            // Format: largeur × hauteur
            const dimensionText = dimensions[0].querySelector('svg').nextSibling;
            if (dimensionText) {
                dimensionText.textContent = `${areaWidth}×${areaHeight}`;
            }
            
            // Ratio
            const ratioText = dimensions[1].querySelector('svg').nextSibling;
            if (ratioText) {
                ratioText.textContent = areaRatio;
            }
            
            // Rayon
            const radiusText = dimensions[2].querySelector('svg').nextSibling;
            if (radiusText) {
                radiusText.textContent = `${areaRadius}%`;
            }
        }
        
        // Mettre à jour la date
        const dateElement = element.querySelector('.text-xs.text-gray-500 svg').nextSibling;
        if (dateElement) {
            dateElement.textContent = formattedDate;
        }
        
        // Mettre à jour l'attribut de données
        element._originalTitle = title;
    },

    /**
     * Met en évidence un favori pour une courte durée
     * @param {string|number} id - ID du favori à mettre en surbrillance
     * @param {boolean} withScroll - Si true, fait défiler la vue pour montrer le favori
     */
    highlightFavorite(id, withScroll = true) {
        // Supprimer toutes les mises en évidence existantes
        const highlightedFavorites = document.querySelectorAll('.favorite-item.border-blue-500, .favorite-item.highlight-effect');
        highlightedFavorites.forEach(item => {
            requestAnimationFrame(() => {
                item.classList.remove('border-blue-500', 'highlight-effect');
            });
        });
        
        // Trouver et mettre en évidence le nouveau favori
        const favoriteItem = document.querySelector(`.favorite-item[data-id="${id}"]`);
        if (favoriteItem) {
            requestAnimationFrame(() => {
                favoriteItem.classList.add('border-blue-500', 'highlight-effect');
            });
            
            // Faire défiler la vue si nécessaire pour montrer le favori
            if (withScroll && typeof favoriteItem.scrollIntoView === 'function') {
                favoriteItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            // Supprimer l'effet après un délai
            setTimeout(() => {
                favoriteItem.classList.remove('highlight-effect');
            }, 1500);
        }
    }
}; 