/**
 * Favorites Sorting Module
 * Handles sorting functionality for favorites
 */

import { FAVORITES_CONFIG } from './favorites-config.js';
import { FavoriteObject, SortCriteria } from './types.js'; // Import types

/**
 * Sort favorites based on specified criteria
 * @param {FavoriteObject[]} favorites - Array of favorite objects to sort
 * @param {SortCriteria} criteria - Sort criteria (date, name, size, modified)
 * @returns {FavoriteObject[]} Sorted array of favorites
 */
export function sortFavorites(favorites: FavoriteObject[], criteria: SortCriteria = FAVORITES_CONFIG.SORT_CRITERIA.DATE as SortCriteria): FavoriteObject[] {
    if (!Array.isArray(favorites)) {
        console.warn('sortFavorites: Invalid favorites array provided');
        return [];
    }

    const sortedFavorites = [...favorites];

    return sortedFavorites.sort((a, b) => {
        switch (criteria) {
            case FAVORITES_CONFIG.SORT_CRITERIA.NAME as SortCriteria:
                return sortByName(a, b);
            
            case FAVORITES_CONFIG.SORT_CRITERIA.SIZE as SortCriteria:
                return sortBySize(a, b);
            
            case FAVORITES_CONFIG.SORT_CRITERIA.MODIFIED as SortCriteria:
                return sortByModified(a, b);
            
            case FAVORITES_CONFIG.SORT_CRITERIA.DATE as SortCriteria:
            default:
                return sortByDate(a, b);
        }
    });
}

/**
 * Sort by name (title or comment)
 * @param {FavoriteObject} a - First favorite
 * @param {FavoriteObject} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortByName(a: FavoriteObject, b: FavoriteObject): number {
    const titleA = (a.title || a.comment || '').toLowerCase();
    const titleB = (b.title || b.comment || '').toLowerCase();
    return titleA.localeCompare(titleB);
}

/**
 * Sort by size (area = width * height)
 * @param {FavoriteObject} a - First favorite
 * @param {FavoriteObject} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortBySize(a: FavoriteObject, b: FavoriteObject): number {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA; // Descending order (largest first)
}

/**
 * Sort by last modified date
 * @param {FavoriteObject} a - First favorite
 * @param {FavoriteObject} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortByModified(a: FavoriteObject, b: FavoriteObject): number {
    const modifiedA = a.lastModified || (typeof a.id === 'number' ? a.id : 0) || 0;
    const modifiedB = b.lastModified || (typeof b.id === 'number' ? b.id : 0) || 0;
    return modifiedB - modifiedA; // Descending order (most recent first)
}

/**
 * Sort by creation date (using ID as proxy)
 * @param {FavoriteObject} a - First favorite
 * @param {FavoriteObject} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortByDate(a: FavoriteObject, b: FavoriteObject): number {
    const idA = typeof a.id === 'number' ? a.id : parseInt(a.id as string) || 0;
    const idB = typeof b.id === 'number' ? b.id : parseInt(b.id as string) || 0;
    return idB - idA; // Descending order (newest first)
}

/**
 * Get available sort criteria
 * @returns {SortCriteria[]} Array of available sort criteria
 */
export function getAvailableSortCriteria(): SortCriteria[] {
    return Object.values(FAVORITES_CONFIG.SORT_CRITERIA) as SortCriteria[];
}

/**
 * Validate sort criteria
 * @param {string} criteria - Sort criteria to validate
 * @returns {criteria is SortCriteria} True if criteria is valid
 */
export function isValidSortCriteria(criteria: string): criteria is SortCriteria {
    return getAvailableSortCriteria().includes(criteria as SortCriteria);
}

// Legacy export for backward compatibility
export const favoriteSortFavorites = sortFavorites;
