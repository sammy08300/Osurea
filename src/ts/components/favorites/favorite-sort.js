/**
 * Favorites Sorting Module
 * Handles sorting functionality for favorites
 */

import { FAVORITES_CONFIG } from './favorites-config.js';

/**
 * Sort favorites based on specified criteria
 * @param {Array} favorites - Array of favorite objects to sort
 * @param {string} criteria - Sort criteria (date, name, size, modified)
 * @returns {Array} Sorted array of favorites
 */
export function sortFavorites(favorites, criteria = FAVORITES_CONFIG.SORT_CRITERIA.DATE) {
    if (!Array.isArray(favorites)) {
        console.warn('sortFavorites: Invalid favorites array provided');
        return [];
    }

    // Create a copy to avoid mutating the original array
    const sortedFavorites = [...favorites];

    return sortedFavorites.sort((a, b) => {
        switch (criteria) {
            case FAVORITES_CONFIG.SORT_CRITERIA.NAME:
                return sortByName(a, b);
            
            case FAVORITES_CONFIG.SORT_CRITERIA.SIZE:
                return sortBySize(a, b);
            
            case FAVORITES_CONFIG.SORT_CRITERIA.MODIFIED:
                return sortByModified(a, b);
            
            case FAVORITES_CONFIG.SORT_CRITERIA.DATE:
            default:
                return sortByDate(a, b);
        }
    });
}

/**
 * Sort by name (title or comment)
 * @param {Object} a - First favorite
 * @param {Object} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortByName(a, b) {
    const titleA = (a.title || a.comment || '').toLowerCase();
    const titleB = (b.title || b.comment || '').toLowerCase();
    return titleA.localeCompare(titleB);
}

/**
 * Sort by size (area = width * height)
 * @param {Object} a - First favorite
 * @param {Object} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortBySize(a, b) {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA; // Descending order (largest first)
}

/**
 * Sort by last modified date
 * @param {Object} a - First favorite
 * @param {Object} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortByModified(a, b) {
    // Prioritize lastModified if available, otherwise use ID
    // Ensure recently modified items appear first
    const modifiedA = a.lastModified || a.id || 0;
    const modifiedB = b.lastModified || b.id || 0;
    return modifiedB - modifiedA; // Descending order (most recent first)
}

/**
 * Sort by creation date (using ID as proxy)
 * @param {Object} a - First favorite
 * @param {Object} b - Second favorite
 * @returns {number} Sort comparison result
 */
function sortByDate(a, b) {
    return (b.id || 0) - (a.id || 0); // Descending order (newest first)
}

/**
 * Get available sort criteria
 * @returns {Array} Array of available sort criteria
 */
export function getAvailableSortCriteria() {
    return Object.values(FAVORITES_CONFIG.SORT_CRITERIA);
}

/**
 * Validate sort criteria
 * @param {string} criteria - Sort criteria to validate
 * @returns {boolean} True if criteria is valid
 */
export function isValidSortCriteria(criteria) {
    return getAvailableSortCriteria().includes(criteria);
}

// Legacy export for backward compatibility
export const favoriteSortFavorites = sortFavorites; 
