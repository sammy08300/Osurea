/**
 * Favorites Storage Module
 * Handles data persistence and retrieval for favorites
 */

import { FavoriteObject } from './types.js';
import { FAVORITES_CONFIG } from './favorites-config.js';
import { logError } from './favorites-utils.js';

interface FavoriteItem {
    id: string | number;
    width: number; // Added
    height: number; // Added
    createdAt?: number;
    lastModified?: number;
    importedAt?: number;
    title?: string; // Optional: for diagnostics
    [key: string]: any; // Allow other properties
}

// Internal cache and utility functions
let _cachedFavorites: FavoriteItem[] | null = null;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
let _cacheTimestamp: number = 0;

const _isCacheValid = (): boolean => {
    return _cachedFavorites !== null && (Date.now() - _cacheTimestamp < CACHE_EXPIRY_MS);
};
const _updateCache = (data: FavoriteItem[]): FavoriteItem[] => {
    _cachedFavorites = data;
    _cacheTimestamp = Date.now();
    return _cachedFavorites;
};
const _saveToStorage = (data: FavoriteItem[]): void => {
    try {
        localStorage.setItem(FAVORITES_CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        logError('StorageManager._saveToStorage', error as Error);
    }
};
const _normalizeId = (id: string | number | undefined | null): string | undefined => id?.toString();

const _validateData = (data: any): data is FavoriteItem[] => {
    // Basic validation, can be expanded
    return Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null && 'id' in item && 'width' in item && 'height' in item);
};

const _repairData = (data: any): FavoriteItem[] => {
    if (!Array.isArray(data)) data = [];
    return data.map((item: any, index: number) => ({
        id: item.id || `repaired_${Date.now()}_${index}`,
        width: item.width || 0, // Added default
        height: item.height || 0, // Added default
        createdAt: item.createdAt || Date.now(),
        lastModified: item.lastModified || Date.now(),
        ...item
    }));
};

// Public API for StorageManager
const StorageManager = {
    getFavorites(): FavoriteItem[] {
        if (_isCacheValid() && _cachedFavorites) {
            return _cachedFavorites;
        }
        try {
            const rawData = localStorage.getItem(FAVORITES_CONFIG.STORAGE_KEY);
            let favoritesData = rawData ? JSON.parse(rawData) : [];
            if (!_validateData(favoritesData)) {
                favoritesData = _repairData(favoritesData);
                _saveToStorage(favoritesData);
            }
            return _updateCache(favoritesData);
        } catch (error) {
            logError('StorageManager.getFavorites', error as Error);
            const repaired = _repairData([]);
            return _updateCache(repaired);
        }
    },
    saveFavorites(favorites: FavoriteItem[]): boolean {
        try {
            _saveToStorage(favorites);
            _updateCache(favorites);
            return true;
        } catch (error) {
            logError('StorageManager.saveFavorites', error as Error);
            return false;
        }
    },
    addFavorite(favorite: Omit<FavoriteItem, 'id' | 'createdAt'>): FavoriteItem | null {
        try {
            const favorites = this.getFavorites();
            const newFavorite: FavoriteItem = {
                width: favorite.width,
                height: favorite.height,
                ...favorite,
                id: FAVORITES_CONFIG.generateId(),
                createdAt: Date.now(),
                lastModified: Date.now(),
            };
            favorites.push(newFavorite);
            this.saveFavorites(favorites);
            return newFavorite;
        } catch (error) {
            logError('StorageManager.addFavorite', error as Error);
            return null;
        }
    },
    updateFavorite(id: string | number, updates: Partial<FavoriteItem>): boolean {
        try {
            const normId = _normalizeId(id);
            if (!normId) return false;
            let favorites = this.getFavorites();
            const index = favorites.findIndex(fav => _normalizeId(fav.id) === normId);
            if (index === -1) return false;
            favorites[index] = { ...favorites[index], ...updates, lastModified: Date.now() };
            this.saveFavorites(favorites);
            return true;
        } catch (error) {
            logError('StorageManager.updateFavorite', error as Error);
            return false;
        }
    },
    removeFavorite(id: string | number): boolean {
        try {
            const normId = _normalizeId(id);
            if (!normId) return false;
            let favorites = this.getFavorites();
            favorites = favorites.filter(fav => _normalizeId(fav.id) !== normId);
            this.saveFavorites(favorites);
            return true;
        } catch (error) {
            logError('StorageManager.removeFavorite', error as Error);
            return false;
        }
    },
    getFavoriteById(id: string | number): FavoriteItem | null {
        try {
            const normId = _normalizeId(id);
            if (!normId) return null;
            return this.getFavorites().find(fav => _normalizeId(fav.id) === normId) || null;
        } catch (error) {
            logError('StorageManager.getFavoriteById', error as Error);
            return null;
        }
    },
    exportFavorites(): string {
        try {
            return JSON.stringify(this.getFavorites(), null, 2);
        } catch (error) {
            logError('StorageManager.exportFavorites', error as Error);
            return '[]';
        }
    },
    importFavorites(jsonString: string): boolean {
        try {
            let importedData = JSON.parse(jsonString);
            if (!_validateData(importedData)) {
                importedData = _repairData(importedData);
            }
            // Add/update imported favorites, ensuring unique IDs and timestamps
            const existingFavorites = this.getFavorites();
            const updatedFavorites = [...existingFavorites];
            importedData.forEach((item: FavoriteItem) => {
                const existingIndex = updatedFavorites.findIndex(f => _normalizeId(f.id) === _normalizeId(item.id));
                const newItem = {
                    ...item,
                    id: item.id || FAVORITES_CONFIG.generateId(),
                    importedAt: Date.now(),
                    lastModified: item.lastModified || Date.now(),
                    createdAt: item.createdAt || Date.now(),
                };
                if (existingIndex !== -1) {
                    updatedFavorites[existingIndex] = { ...updatedFavorites[existingIndex], ...newItem };
                } else {
                    updatedFavorites.push(newItem);
                }
            });
            this.saveFavorites(updatedFavorites);
            return true;
        } catch (error) {
            logError('StorageManager.importFavorites', error as Error);
            return false;
        }
    },
    clearCache(): void {
        _cachedFavorites = null;
        _cacheTimestamp = 0;
    },
    diagnoseFavorites(): void {
        try {
            const rawData = localStorage.getItem(FAVORITES_CONFIG.STORAGE_KEY);
            console.log('[StorageDiag] Raw Data:', rawData ? rawData.substring(0, 200) + '...' : 'null');
            if (!rawData) {
                console.log('[StorageDiag] No data in localStorage.');
                return;
            }
            let data;
            try {
                data = JSON.parse(rawData);
            } catch (e) {
                console.error('[StorageDiag] Failed to parse JSON data:', e);
                return;
            }
            console.log('[StorageDiag] Parsed Data (sample):', data.slice(0, 3));
            if (!Array.isArray(data)) {
                console.error('[StorageDiag] Data is not an array.');
                return;
            }
            data.forEach((item: any, index: number) => {
                if (!item || typeof item.id === 'undefined') {
                    console.warn(`[StorageDiag] Item at index ${index} is invalid (missing id):`, item);
                }
                // Add more checks as needed, e.g., for width/height if they become mandatory
            });
            console.log(`[StorageDiag] Total items: ${data.length}`);
            console.log(`[StorageDiag] Cache valid: ${_isCacheValid()}, Cache size: ${_cachedFavorites?.length ?? 0}`);
        } catch (error) {
            logError('StorageManager.diagnoseFavorites', error as Error);
        }
    },
    migrateData(): boolean {
        // Placeholder for future data migration logic
        console.log('Attempting data migration if necessary...');
        // Example: Check for an old storage key and move data
        // const oldData = localStorage.getItem('OLD_STORAGE_KEY');
        // if (oldData) { try { ... } catch ... }
        return false; // Return true if migration occurred
    },
    clearAllFavorites(confirmed: boolean = false): boolean { // Added method
        if (!confirmed) {
            logError('StorageManager.clearAllFavorites', 'Confirmation required.');
            return false;
        }
        try {
            _saveToStorage([]);
            _updateCache([]);
            return true;
        } catch (error) {
            logError('StorageManager.clearAllFavorites', error as Error);
            return false;
        }
    }
};

// Global export for StorageManager
(window as any).StorageManager = StorageManager;

// Global export for StorageManager related functions
export function getFavorites(): FavoriteObject[] {
    return StorageManager.getFavorites() as FavoriteObject[]; // Cast to FavoriteObject[]
}

export function getFavoriteById(id: string | number): FavoriteObject | null {
    const result = StorageManager.getFavoriteById(id);
    return result as FavoriteObject | null; // Cast to FavoriteObject | null
}

export function addFavorite(favorite: Omit<FavoriteObject, 'id' | 'createdAt'>): FavoriteObject | null {
    // Ensure width and height are present, compatible with FavoriteItem for StorageManager.addFavorite
    const favoriteForItem: Omit<FavoriteItem, 'id' | 'createdAt'> = {
        ...favorite,
        width: favorite.width ?? 0,
        height: favorite.height ?? 0,
    };
    const result = StorageManager.addFavorite(favoriteForItem);
    return result as FavoriteObject | null; // Cast to FavoriteObject | null
}

export function updateFavorite(id: string | number, data: Partial<FavoriteObject>): boolean {
    return StorageManager.updateFavorite(id, data);
}

export function removeFavorite(id: string | number): boolean {
    return StorageManager.removeFavorite(id);
}

export function favoriteExists(id: string | number): boolean {
    return !!StorageManager.getFavoriteById(id);
}

export function getFavoritesCount(): number {
    return StorageManager.getFavorites().length;
}

// Keep this export consistent with how it's used elsewhere
export function clearAllFavorites(confirmed: boolean = false): boolean {
    return StorageManager.clearAllFavorites(confirmed);
}
