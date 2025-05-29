// favorite-rendering.ts - Module de création et rendu des éléments de favoris
import { translateWithFallback } from '../../../js/i18n-init.js';
import { getFavorites } from './favorite-storage.js';
import { sortFavorites as favoriteSortFavorites } from './favorite-sort.js'; // Renamed for clarity
import { FavoritesActions } from './favorite-actions.js';
import { FavoritesInit } from './favorite-init.js';
import { FavoriteObject } from './types.js'; // Import types

/**
 * Formate un nombre avec un certain nombre de décimales
 * @param {number | undefined} val 
 * @param {number} decimals 
 * @returns {string}
 */
function formatNumber(val: number | undefined, decimals: number = 1): string {
    if (typeof val !== 'number' || isNaN(val)) return '';
    return val.toFixed(decimals);
}

/**
 * Calcule le ratio largeur/hauteur
 * @param {number | undefined} w
 * @param {number | undefined} h
 * @returns {number}
 */
function calculateRatio(w: number | undefined, h: number | undefined): number {
    if (!w || !h) return 0;
    return w / h;
}

interface FavoritesRenderingModule {
    loadFavoritesWithAnimation(isInitialLoad?: boolean): void;
    createFavoriteElement(favorite: FavoriteObject & { _originalTitle?: string }): HTMLElement;
    updateFavoriteElementContent(element: HTMLElement, favorite: FavoriteObject): void;
    highlightFavorite(id: string | number, withScroll?: boolean): void;
}

/**
 * Module de rendu et création des éléments de favoris
 */
export const FavoritesRendering: FavoritesRenderingModule = {
    /**
     * Charge et affiche les favoris avec animation
     * @param {boolean} isInitialLoad - Si c'est le chargement initial (pas d'animation de sortie)
     */
    loadFavoritesWithAnimation(isInitialLoad: boolean = false): void {
        const favorites = FavoritesInit.cachedFavorites || getFavorites();
        
        if (!FavoritesInit.favoritesList) return; // Guard clause

        if (favorites.length === 0) {
            const existingCards = FavoritesInit.favoritesList.querySelectorAll<HTMLElement>('.favorite-item');
            existingCards.forEach((card: HTMLElement) => card.remove());
            
            if (FavoritesInit.favoritesPlaceholder) {
                FavoritesInit.favoritesPlaceholder.classList.remove('hidden');
                (FavoritesInit.favoritesPlaceholder as HTMLElement).style.display = 'block';
            }
            FavoritesInit.favoritesList.classList.remove('favorites-loading');
            return;
        }
        
        if (FavoritesInit.favoritesPlaceholder) {
            FavoritesInit.favoritesPlaceholder.classList.add('hidden');
            (FavoritesInit.favoritesPlaceholder as HTMLElement).style.display = 'none';
        }
        
        const sortedFavorites: FavoriteObject[] = favoriteSortFavorites(favorites, FavoritesInit.currentSortCriteria);
        
        const existingCards = FavoritesInit.favoritesList.querySelectorAll<HTMLElement>('.favorite-item');
        existingCards.forEach((card: HTMLElement) => card.remove());
        
        const lastAddedId = Math.max(...sortedFavorites.map((f: FavoriteObject) => parseInt(f.id as string))); // Assuming id is string or number
        
        sortedFavorites.forEach((favorite: FavoriteObject) => {
            const cardElement = this.createFavoriteElement(favorite);
            if (!isInitialLoad && favorite.id == lastAddedId) { // Use == for potential string/number comparison
                cardElement.style.opacity = '0';
                cardElement.classList.add('animate-fadeIn-smooth');
                setTimeout(() => {
                    cardElement.style.opacity = '1';
                    cardElement.addEventListener('animationend', () => {
                        cardElement.classList.remove('animate-fadeIn-smooth');
                        cardElement.classList.add('animation-complete');
                    }, { once: true });
                }, 50);
            }
            FavoritesInit.favoritesList!.appendChild(cardElement); // Non-null assertion due to guard clause
        });
        
        FavoritesInit.favoritesList.classList.remove('favorites-loading');
    },

    /**
     * Crée un élément DOM pour un favori
     * @param {FavoriteObject & { _originalTitle?: string }} favorite
     * @returns {HTMLElement}
     */
    createFavoriteElement(favorite: FavoriteObject & { _originalTitle?: string }): HTMLElement {
        const date = new Date(favorite.id as string); // Assuming id can be a string date
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const item = document.createElement('div');
        item.className = 'favorite-item bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-blue-500/30 shadow-lg';
        item.dataset.id = favorite.id.toString();
        
        let title = favorite.title || favorite.comment || 'i18n:favorites.defaultName';
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key, title); // Provide fallback
        }
        const displayTitle = translatedTitle.length > 32 ? translatedTitle.substring(0, 32) + '...' : translatedTitle;
        
        const areaW = favorite.width; // Use width directly
        const areaH = favorite.height; // Use height directly
        const areaWidth = formatNumber(areaW, 3);
        const areaHeight = formatNumber(areaH, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(areaW, areaH), 3);

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

        item.addEventListener('click', (e: MouseEvent) => {
            const currentTarget = e.currentTarget as HTMLElement;
            if ((e.target as HTMLElement).closest('.favorite-btn')) {
                return;
            }
            e.stopPropagation();
            currentTarget.classList.add('card-click-effect');
            (favorite as any)._originalTitle = title; // Assuming _originalTitle is a dynamic property
            
            setTimeout(() => {
                currentTarget.classList.remove('card-click-effect');
                if (FavoritesActions.showFavoriteDetails) { // Check if function exists
                    FavoritesActions.showFavoriteDetails(favorite);
                }
            }, 80);
        });
        
        const loadBtn = item.querySelector<HTMLButtonElement>('.load-favorite-btn');
        const editBtn = item.querySelector<HTMLButtonElement>('.edit-favorite-btn');
        const deleteBtn = item.querySelector<HTMLButtonElement>('.delete-favorite-btn');
        
        if (loadBtn) loadBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (FavoritesActions.loadFavorite) FavoritesActions.loadFavorite(favorite.id);
        });
        
        if (editBtn) editBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (FavoritesActions.editFavorite) FavoritesActions.editFavorite(favorite.id);
        });
        
        if (deleteBtn) deleteBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (FavoritesActions.deleteFavorite) FavoritesActions.deleteFavorite(favorite.id);
        });
        
        item.style.marginTop = '0';
        
        if (FavoritesInit.isInitialized) {
            item.classList.add('animate-fadeIn-smooth');
        }
        
        return item;
    },

    /**
     * Met à jour un favori existant dans l'interface
     * @param {HTMLElement} element - L'élément DOM à mettre à jour
     * @param {FavoriteObject} favorite - Les données du favori
     */
    updateFavoriteElementContent(element: HTMLElement, favorite: FavoriteObject): void {
        let title = favorite.title || favorite.comment || 'i18n:favorites.defaultName';
        let translatedTitle = title;
        if (title.startsWith('i18n:')) {
            const key = title.substring(5);
            translatedTitle = translateWithFallback(key, title); // Provide fallback
        }
        
        const displayTitle = translatedTitle.length > 32 ? translatedTitle.substring(0, 32) + '...' : translatedTitle;
        const date = new Date(favorite.id as string); // Assuming id can be a string date
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const areaW = favorite.width; 
        const areaH = favorite.height;
        const areaWidth = formatNumber(areaW, 3);
        const areaHeight = formatNumber(areaH, 3);
        const areaRadius = typeof favorite.radius !== 'undefined' ? favorite.radius : 0;
        const areaRatio = formatNumber(calculateRatio(areaW, areaH), 3);
        
        const titleElement = element.querySelector<HTMLHeadingElement>('h3');
        if (titleElement) titleElement.textContent = displayTitle;
        
        const dimensions = element.querySelectorAll<HTMLSpanElement>('.flex-1 .flex span');
        if (dimensions.length >= 3) {
            const dimensionSvg = dimensions[0].querySelector('svg');
            if (dimensionSvg && dimensionSvg.nextSibling) (dimensionSvg.nextSibling as Text).textContent = ` ${areaWidth}×${areaHeight}`;
            
            const ratioSvg = dimensions[1].querySelector('svg');
            if (ratioSvg && ratioSvg.nextSibling) (ratioSvg.nextSibling as Text).textContent = ` ${areaRatio}`;
            
            const radiusSvg = dimensions[2].querySelector('svg');
            if (radiusSvg && radiusSvg.nextSibling) (radiusSvg.nextSibling as Text).textContent = ` ${areaRadius}%`;
        }
        
        const dateSvg = element.querySelector<SVGElement>('.text-xs.text-gray-500 svg');
        if (dateSvg && dateSvg.nextSibling) (dateSvg.nextSibling as Text).textContent = ` ${formattedDate}`;
        
        (element as any)._originalTitle = title; // Assuming _originalTitle is a dynamic property
    },

    /**
     * Met en évidence un favori pour une courte durée
     * @param {string|number} id - ID du favori à mettre en surbrillance
     * @param {boolean} withScroll - Si true, fait défiler la vue pour montrer le favori
     */
    highlightFavorite(id: string | number, withScroll: boolean = true): void {
        const highlightedFavorites = document.querySelectorAll<HTMLElement>('.favorite-item.border-blue-500, .favorite-item.highlight-effect');
        highlightedFavorites.forEach(item => {
            requestAnimationFrame(() => {
                item.classList.remove('border-blue-500', 'highlight-effect');
            });
        });
        
        const favoriteItem = document.querySelector<HTMLElement>(`.favorite-item[data-id="${id}"]`);
        if (favoriteItem) {
            requestAnimationFrame(() => {
                favoriteItem.classList.add('border-blue-500', 'highlight-effect');
            });
            
            if (withScroll && typeof favoriteItem.scrollIntoView === 'function') {
                favoriteItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            setTimeout(() => {
                if (favoriteItem) favoriteItem.classList.remove('highlight-effect'); // Check again
            }, 1500);
        }
    }
};
