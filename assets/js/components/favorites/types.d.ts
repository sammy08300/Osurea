/**
 * TypeScript definitions for the Favorites Module
 */

export interface FavoriteObject {
    id: string | number;
    width: number;
    height: number;
    x?: number;
    y?: number;
    offsetX?: number;
    offsetY?: number;
    ratio?: number;
    radius?: number;
    tabletW?: number;
    tabletH?: number;
    presetInfo?: string | null | undefined;
    title?: string;
    description?: string;
    comment?: string;
    lastModified?: number;
    createdAt?: number;
}

export interface FavoritesState {
    editingFavoriteId: string | number | null;
    currentDetailedFavoriteId: string | number | null;
    favoritesList: HTMLElement | null;
    favoritesPlaceholder: HTMLElement | null;
    cachedFavorites: FavoriteObject[] | null;
    isInitialized: boolean;
    autoSaveTimer: number | null;
    originalValues: Partial<FavoriteObject> | null;
    currentSortCriteria: string;
}

export type SortCriteria = 'date' | 'name' | 'size' | 'modified';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface FavoritesConfig {
    ELEMENTS: {
        [key: string]: string;
    };
    CLASSES: {
        [key: string]: string;
    };
    SORT_CRITERIA: {
        [key: string]: SortCriteria;
    };
    TIMINGS: {
        [key: string]: number;
    };
    FORMATTING: {
        DEFAULT_DECIMALS: number;
        COORDINATE_DECIMALS: number;
    };
    I18N_KEYS: {
        [key: string]: string;
    };
    STORAGE_KEY: string;
    generateId: () => string;
}

export interface CommentData {
    title: string;
    description: string;
}

export interface FavoritesUIInterface {
    state: FavoritesState;
    
    // Core methods
    init(): Promise<boolean>;
    destroy(): void;
    isReady(): boolean;
    getState(): FavoritesState;
    getFavoritesCount(): number;
    
    // Favorite management
    loadFavorite(id: string | number): boolean;
    saveFavorite(): boolean;
    editFavorite(id: string | number): boolean;
    updateFavorite(id: string | number, data: Partial<FavoriteObject>): boolean;
    deleteFavorite(id: string | number): boolean;
    cancelEditMode(skipNotification?: boolean): boolean;
    
    // Display methods
    refreshAllFavorites(): void;
    forceRefreshFavorites(): void;
    highlightFavorite(id: string | number, withScroll?: boolean): void;
    
    // Popup methods
    showFavoriteDetails(favorite: FavoriteObject): void;
    showCommentDialog(callback: (data: CommentData) => void): void;
    showDeleteDialog(callback: (confirmed: boolean) => void): void;
    
    // Localization methods
    handleLocaleChange(event: Event): void;
    manualLanguageUpdate(language: string): void;
}

export interface FavoritesEventsInterface {
    eventListeners: Map<string, any>;
    isInitialized: boolean;
    
    init(): void;
    setupDOMEventListeners(): void;
    setupCustomEventListeners(): void;
    cleanup(): void;
    addEventListener(target: EventTarget, event: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
    removeEventListener(target: EventTarget, event: string, handler: EventListenerOrEventListenerObject): void;
    dispatchEvent(eventName: string, detail?: any, target?: EventTarget): void;
    getActiveListenersCount(): number;
    isReady(): boolean;

    handleFavoritesListClick(event: Event): void;
    handleLocaleChange(event: CustomEvent): void;
    handleLanguageChange(event: CustomEvent): void;
}

// Storage functions
export declare function getFavorites(): FavoriteObject[];
export declare function getFavoriteById(id: string | number): FavoriteObject | null;
export declare function addFavorite(favorite: FavoriteObject): boolean;
export declare function updateFavorite(id: string | number, data: Partial<FavoriteObject>): boolean;
export declare function removeFavorite(id: string | number): boolean;
export declare function favoriteExists(id: string | number): boolean;
export declare function getFavoritesCount(): number;

// Utility functions
export declare function formatNumber(value: number, decimals?: number): string;
export declare function getElement(elementId: string, required?: boolean): HTMLElement | null;
export declare function showNotification(type: NotificationType, messageKey: string, fallbackMessage: string): void;
export declare function validateFavorite(favorite: any): favorite is FavoriteObject;
export declare function logError(context: string, error: Error | string, additionalData?: any): void;

// Sort functions
export declare function sortFavorites(favorites: FavoriteObject[], criteria?: SortCriteria): FavoriteObject[];
export declare function getAvailableSortCriteria(): SortCriteria[];
export declare function isValidSortCriteria(criteria: string): criteria is SortCriteria;

// Main exports
export declare const FavoritesUI: FavoritesUIInterface;
export declare const FAVORITES_CONFIG: FavoritesConfig;
export declare const FavoritesEvents: FavoritesEventsInterface; 