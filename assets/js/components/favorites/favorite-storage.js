/**
 * Favorites Storage Module
 * Handles data persistence and retrieval for favorites
 */

import { StorageManager } from '../../utils/storage.js';
import { validateFavorite, logError } from './favorites-utils.js';

/**
 * Get all favorites from storage
 * @returns {Array} Array of favorite objects
 */
export function getFavorites() {
    try {
        const favorites = StorageManager.getFavorites();
        return Array.isArray(favorites) ? favorites : [];
    } catch (error) {
        logError('getFavorites', error);
        return [];
    }
}

/**
 * Get a specific favorite by ID
 * @param {string|number} id - The favorite ID
 * @returns {Object|null} The favorite object or null if not found
 */
export function getFavoriteById(id) {
    try {
        if (!id) {
            console.warn('getFavoriteById: No ID provided');
            return null;
        }
        
        const favorite = StorageManager.getFavoriteById(id);
        return favorite && validateFavorite(favorite) ? favorite : null;
    } catch (error) {
        logError('getFavoriteById', error, { id });
        return null;
    }
}

/**
 * Add a new favorite to storage
 * @param {Object} favorite - The favorite object to add
 * @returns {boolean} True if successfully added, false otherwise
 */
export function addFavorite(favorite) {
    try {
        if (!validateFavorite(favorite)) {
            console.warn('addFavorite: Invalid favorite object provided', favorite);
            return false;
        }
        
        const result = StorageManager.addFavorite(favorite);
        return result !== null && result !== undefined;
    } catch (error) {
        logError('addFavorite', error, { favorite });
        return false;
    }
}

/**
 * Update an existing favorite in storage
 * @param {string|number} id - The favorite ID
 * @param {Object} data - The data to update
 * @returns {boolean} True if successfully updated, false otherwise
 */
export function updateFavorite(id, data) {
    try {
        if (!id) {
            console.warn('updateFavorite: No ID provided');
            return false;
        }
        
        if (!data || typeof data !== 'object') {
            console.warn('updateFavorite: Invalid data provided', data);
            return false;
        }
        
        const result = StorageManager.updateFavorite(id, data);
        return result !== null && result !== undefined;
    } catch (error) {
        logError('updateFavorite', error, { id, data });
        return false;
    }
}

/**
 * Remove a favorite from storage
 * @param {string|number} id - The favorite ID
 * @returns {boolean} True if successfully removed, false otherwise
 */
export function removeFavorite(id) {
    try {
        if (!id) {
            console.warn('removeFavorite: No ID provided');
            return false;
        }
        
        const result = StorageManager.removeFavorite(id);
        return result !== null && result !== undefined;
    } catch (error) {
        logError('removeFavorite', error, { id });
        return false;
    }
}

/**
 * Check if a favorite exists in storage
 * @param {string|number} id - The favorite ID
 * @returns {boolean} True if favorite exists, false otherwise
 */
export function favoriteExists(id) {
    try {
        return getFavoriteById(id) !== null;
    } catch (error) {
        logError('favoriteExists', error, { id });
        return false;
    }
}

/**
 * Get the count of favorites in storage
 * @returns {number} Number of favorites
 */
export function getFavoritesCount() {
    try {
        const favorites = getFavorites();
        return favorites.length;
    } catch (error) {
        logError('getFavoritesCount', error);
        return 0;
    }
}

/**
 * Clear all favorites from storage (with confirmation)
 * @param {boolean} confirmed - Whether the action is confirmed
 * @returns {boolean} True if successfully cleared, false otherwise
 */
export function clearAllFavorites(confirmed = false) {
    if (!confirmed) {
        console.warn('clearAllFavorites: Action not confirmed');
        return false;
    }
    
    try {
        // This would need to be implemented in StorageManager
        if (typeof StorageManager.clearAllFavorites === 'function') {
            return StorageManager.clearAllFavorites();
        } else {
            console.warn('clearAllFavorites: Method not available in StorageManager');
            return false;
        }
    } catch (error) {
        logError('clearAllFavorites', error);
        return false;
    }
} 
