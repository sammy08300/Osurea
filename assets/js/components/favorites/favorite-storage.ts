/**
 * Favorites Storage Module
 * Handles data persistence and retrieval for favorites
 */

import { StorageManager } from '../../utils/storage'; // Assuming StorageManager is typed or 'any'
import { validateFavorite, logError } from './favorites-utils';
import { FavoriteObject } from './types'; // Import FavoriteObject type

/**
 * Get all favorites from storage
 * @returns {FavoriteObject[]} Array of favorite objects
 */
export function getFavorites(): FavoriteObject[] {
    try {
        const favorites = StorageManager.getFavorites();
        // Ensure the return is always an array, even if StorageManager returns null/undefined
        return Array.isArray(favorites) ? favorites.filter(validateFavorite) : [];
    } catch (error) {
        logError('getFavorites', error as Error);
        return [];
    }
}

/**
 * Get a specific favorite by ID
 * @param {string|number} id - The favorite ID
 * @returns {FavoriteObject|null} The favorite object or null if not found
 */
export function getFavoriteById(id: string | number): FavoriteObject | null {
    try {
        if (!id && id !== 0) { // Allow 0 as a valid ID if applicable
            console.warn('getFavoriteById: No ID provided');
            return null;
        }
        
        const favorite = StorageManager.getFavoriteById(id);
        return favorite && validateFavorite(favorite) ? favorite : null;
    } catch (error) {
        logError('getFavoriteById', error as Error, { id });
        return null;
    }
}

/**
 * Add a new favorite to storage
 * @param {FavoriteObject} favorite - The favorite object to add
 * @returns {FavoriteObject | null} The added favorite object or null if failed
 */
export function addFavorite(favorite: FavoriteObject): FavoriteObject | null {
    try {
        if (!validateFavorite(favorite)) {
            console.warn('addFavorite: Invalid favorite object provided', favorite);
            return null; // Return null instead of boolean for consistency with StorageManager
        }
        
        // Assuming StorageManager.addFavorite returns the added item or null/undefined
        const result = StorageManager.addFavorite(favorite);
        return result || null; // Ensure null is returned if result is undefined
    } catch (error) {
        logError('addFavorite', error as Error, { favorite });
        return null;
    }
}

/**
 * Update an existing favorite in storage
 * @param {string|number} id - The favorite ID
 * @param {Partial<FavoriteObject>} data - The data to update
 * @returns {FavoriteObject | null} The updated favorite object or null if failed
 */
export function updateFavorite(id: string | number, data: Partial<FavoriteObject>): FavoriteObject | null {
    try {
        if (!id && id !== 0) {
            console.warn('updateFavorite: No ID provided');
            return null;
        }
        
        if (!data || typeof data !== 'object') {
            console.warn('updateFavorite: Invalid data provided', data);
            return null;
        }
        
        // Assuming StorageManager.updateFavorite returns the updated item or null/undefined
        const result = StorageManager.updateFavorite(id, data);
        return result || null; // Ensure null is returned if result is undefined
    } catch (error) {
        logError('updateFavorite', error as Error, { id, data });
        return null;
    }
}

/**
 * Remove a favorite from storage
 * @param {string|number} id - The favorite ID
 * @returns {boolean} True if successfully removed, false otherwise
 */
export function removeFavorite(id: string | number): boolean {
    try {
        if (!id && id !== 0) {
            console.warn('removeFavorite: No ID provided');
            return false;
        }
        
        // Assuming StorageManager.removeFavorite returns a boolean or similar
        const result = StorageManager.removeFavorite(id);
        return !!result; // Coerce to boolean
    } catch (error) {
        logError('removeFavorite', error as Error, { id });
        return false;
    }
}

/**
 * Check if a favorite exists in storage
 * @param {string|number} id - The favorite ID
 * @returns {boolean} True if favorite exists, false otherwise
 */
export function favoriteExists(id: string | number): boolean {
    try {
        return getFavoriteById(id) !== null;
    } catch (error) {
        logError('favoriteExists', error as Error, { id });
        return false;
    }
}

/**
 * Get the count of favorites in storage
 * @returns {number} Number of favorites
 */
export function getFavoritesCount(): number {
    try {
        const favorites = getFavorites();
        return favorites.length;
    } catch (error) {
        logError('getFavoritesCount', error as Error);
        return 0;
    }
}

/**
 * Clear all favorites from storage (with confirmation)
 * @param {boolean} confirmed - Whether the action is confirmed
 * @returns {boolean} True if successfully cleared, false otherwise
 */
export function clearAllFavorites(confirmed: boolean = false): boolean {
    if (!confirmed) {
        console.warn('clearAllFavorites: Action not confirmed');
        return false;
    }
    
    try {
        if (typeof StorageManager.clearAllFavorites === 'function') {
            return StorageManager.clearAllFavorites();
        } else {
            console.warn('clearAllFavorites: Method not available in StorageManager');
            return false;
        }
    } catch (error) {
        logError('clearAllFavorites', error as Error);
        return false;
    }
}
