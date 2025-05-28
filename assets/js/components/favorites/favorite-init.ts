// favorite-init.ts - Favorites initialization module
import { FavoritesEvents } from './favorite-events';
import { translateWithFallback } from '../../../js/i18n-init';
import { getFavorites } from './favorite-storage';
import { sortFavorites as favoriteSortFavorites } from './favorite-sort'; // Renamed for clarity
import { FavoritesRendering } from './favorite-rendering';
import { FavoritesPopups } from './favorite-popup';
import { FavoriteObject, SortCriteria } from './types'; // Import types
import localeManager from '../../../locales'; // Assuming localeManager has its own types or is any

interface FavoritesInitModule {
    favoritesList: HTMLElement | null;
    favoritesPlaceholder: Element | null;
    currentSortCriteria: SortCriteria;
    isInitialized: boolean;
    cachedFavorites: FavoriteObject[] | null;
    boundHandleLocaleChange?: (event: Event) => void;
    init(): void;
    handleLocaleChange(event: Event): void;
    manualLanguageUpdate(language: string | undefined): void;
    forceRefreshFavorites(): void;
    refreshAllFavorites(): void;
    updateFavoriteCache(forceFullRefresh?: boolean): void;
    setupSortButtons(): void;
    handleSortButtonClick(button: HTMLElement): void;
}

/**
 * Favorites initialization and configuration management module
 */
export const FavoritesInit: FavoritesInitModule = {
    favoritesList: null,
    favoritesPlaceholder: null,
    currentSortCriteria: 'date' as SortCriteria,
    isInitialized: false,
    cachedFavorites: null,
    
    /**
     * Initialize the favorites component (DOM, listeners, sorting, etc.)
     */
    init(): void {
        this.favoritesList = document.getElementById('favorites-list');
        if (!this.favoritesList) {
            console.error('Favorites list element not found');
            return;
        }
        
        document.body.classList.add('loading-favorites');
        this.favoritesList.style.visibility = 'hidden';
        this.favoritesList.style.opacity = '0';
        
        this.cachedFavorites = null;
        
        if (window.StorageManager) {
            if (typeof window.StorageManager.forceReset === 'function') {
                console.log("Using forceReset during favorites initialization");
                const cleanFavorites = window.StorageManager.forceReset();
                this.cachedFavorites = cleanFavorites;
            } else if (typeof window.StorageManager.clearCache === 'function') {
                window.StorageManager.clearCache();
                this.cachedFavorites = getFavorites();
            } else {
                this.cachedFavorites = getFavorites();
            }
        } else {
            this.cachedFavorites = getFavorites();
        }
        
        this.favoritesPlaceholder = this.favoritesList.querySelector('.col-span-full');
        this.setupSortButtons();
        
        FavoritesPopups.createDialogs();
        FavoritesPopups.createDetailsPopup();
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                FavoritesRendering.loadFavoritesWithAnimation(true);
                
                this.isInitialized = true;
                if (this.favoritesList) { // Check again as it's in a timeout
                    this.favoritesList.style.visibility = 'visible';
                    this.favoritesList.style.opacity = '1';
                }
                document.body.classList.remove('loading-favorites');
                
                FavoritesEvents.init();
                
                if (this.boundHandleLocaleChange) {
                    document.removeEventListener('localeChanged', this.boundHandleLocaleChange);
                }
                this.boundHandleLocaleChange = this.handleLocaleChange.bind(this);
                document.addEventListener('localeChanged', this.boundHandleLocaleChange);
                
                window.addEventListener('languageChanged', (event) => {
                    this.manualLanguageUpdate((event as CustomEvent).detail?.language);
                });
            }, 50);
        });
    },
    
    /**
     * Handles language changes
     * @param {Event} event - The language change event
     */
    handleLocaleChange(event: Event): void {
        this.cachedFavorites = null;
        
        if (this.favoritesList) {
            this.favoritesList.classList.add('favorites-transition-out');
            
            setTimeout(() => {
                if (this.favoritesList) { // Check again
                    while (this.favoritesList.firstChild) {
                        this.favoritesList.removeChild(this.favoritesList.firstChild);
                    }
                    this.favoritesList.classList.remove('favorites-transition-out');
                }
                FavoritesRendering.loadFavoritesWithAnimation(false);
            }, 120);
        }
    },

    /**
     * Force favorites update during manual language change
     * @param {string | undefined} language - The new language
     */
    manualLanguageUpdate(language: string | undefined): void {
        this.cachedFavorites = null;
        
        if (this.favoritesList) {
            this.favoritesList.classList.add('favorites-loading');
            this.favoritesList.classList.add('favorites-transition-out');
        }
        
        setTimeout(() => {
            this.forceRefreshFavorites();
        }, 120);
    },

    /**
     * Force a complete refresh of favorites
     */
    forceRefreshFavorites(): void {
        try {
            const currentLang = document.documentElement.lang || localeManager?.getCurrentLocale() || 'unknown';
            
            if (this.favoritesList) {
                const existingCards = this.favoritesList.querySelectorAll('.favorite-item');
                existingCards.forEach(card => card.remove());
            }
            
            setTimeout(() => {
                const favorites = getFavorites();
                this.cachedFavorites = favorites;
                FavoritesRendering.loadFavoritesWithAnimation(false);
            }, 20);
        } catch (error) {
            console.error("[ERROR] Error refreshing favorites:", error);
        }
    },

    /**
     * Force a complete refresh of all favorites
     */
    refreshAllFavorites(): void {
        this.cachedFavorites = null;
        
        if (this.favoritesList) {
            while (this.favoritesList.firstChild) {
                this.favoritesList.removeChild(this.favoritesList.firstChild);
            }
        }
        FavoritesRendering.loadFavoritesWithAnimation(false);
    },

    /**
     * Update the favorites cache and refresh the display
     * @param {boolean} forceFullRefresh - If true, force a complete refresh of the list
     */
    updateFavoriteCache(forceFullRefresh: boolean = false): void {
        this.cachedFavorites = getFavorites();
        
        if (forceFullRefresh) {
            requestAnimationFrame(() => {
                if (this.favoritesList) {
                    while (this.favoritesList.firstChild) {
                        this.favoritesList.removeChild(this.favoritesList.firstChild);
                    }
                }
                FavoritesRendering.loadFavoritesWithAnimation(false);
            });
        } else {
            if (!this.favoritesList || !this.cachedFavorites) return;
            const favorites = this.cachedFavorites;
            const existingItems = this.favoritesList.querySelectorAll<HTMLElement>('.favorite-item');
            
            existingItems.forEach(item => {
                const id = item.dataset.id;
                const favorite = favorites.find(f => f.id.toString() === id); // Ensure ID comparison is correct
                
                if (favorite) {
                    FavoritesRendering.updateFavoriteElementContent(item, favorite);
                }
            });
        }
    },

    /**
     * Initialize sort buttons and their behavior
     */
    setupSortButtons(): void {
        const sortButtons = document.querySelectorAll<HTMLElement>('.sort-button');
        sortButtons.forEach(button => {
            button.classList.remove('bg-blue-600', 'text-white');
            button.classList.add('text-gray-300', 'bg-gray-800/80');
            if (button.dataset.sort === this.currentSortCriteria) {
                button.classList.add('bg-blue-600', 'text-white');
                button.classList.remove('text-gray-300', 'bg-gray-800/80');
            }
            button.onclick = () => this.handleSortButtonClick(button);
        });
    },

    /**
     * Handle click on a sort button
     * @param {HTMLElement} button
     */
    handleSortButtonClick(button: HTMLElement): void {
        const sortCriteria = button.dataset.sort as SortCriteria;
        if (sortCriteria === this.currentSortCriteria) return;
        
        this.currentSortCriteria = sortCriteria;
        this.setupSortButtons();
        
        try {
            if (!this.favoritesList) return;
            const favorites = this.cachedFavorites || getFavorites();
            const sortedFavorites = favoriteSortFavorites(favorites, this.currentSortCriteria);
            
            const favoriteElements: { [key: string]: HTMLElement } = {};
            const existingCards = this.favoritesList.querySelectorAll<HTMLElement>('.favorite-item');
            
            if (existingCards.length === 0) return;
            
            existingCards.forEach(card => {
                if (card.dataset.id) {
                    favoriteElements[card.dataset.id] = card;
                }
            });
            
            const insertBeforeElement = this.favoritesPlaceholder || null;
            
            sortedFavorites.forEach((favorite) => {
                const element = favoriteElements[favorite.id.toString()];
                if (element && this.favoritesList) { // Check this.favoritesList again
                    this.favoritesList.insertBefore(element, insertBeforeElement);
                }
            });
            
        } catch (error) {
            console.error("Error sorting favorites:", error);
            this.cachedFavorites = null;
            FavoritesRendering.loadFavoritesWithAnimation(false);
        }
    }
};
