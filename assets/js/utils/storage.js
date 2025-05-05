/**
 * StorageManager - Utility module for managing favorites in localStorage
 * 
 * Features:
 * - Caching mechanism to reduce localStorage reads
 * - Asynchronous writes to avoid blocking UI
 * - Error handling and data validation
 * - Import/export functionality
 */

export const StorageManager = (() => {
    // Constants
    const STORAGE_KEY = 'Osu!reaFavorites_v2';
    const CACHE_EXPIRY = 3000; // ms
    
    // Private state
    let _cache = null;
    let _cacheTimestamp = 0;
    
    // Private utility functions
    const _isCacheValid = () => {
        return _cache !== null && (Date.now() - _cacheTimestamp) < CACHE_EXPIRY;
    };
    
    const _updateCache = (data) => {
        _cache = Array.isArray(data) ? [...data] : [];
        _cacheTimestamp = Date.now();
        return _cache;
    };
    
    const _saveToStorage = (data) => {
        const json = JSON.stringify(data);
        
        if (window.requestIdleCallback) {
            requestIdleCallback(() => localStorage.setItem(STORAGE_KEY, json));
        } else {
            setTimeout(() => localStorage.setItem(STORAGE_KEY, json), 0);
        }
    };
    
    const _normalizeId = (id) => id?.toString();
    
    // Public API
    return {
        /**
         * Get all favorites from storage
         * @returns {Array} Array of favorite objects
         */
        getFavorites() {
            try {
                // Return from cache if valid
                if (_isCacheValid()) {
                    return [..._cache];
                }
                
                // Read from localStorage and update cache
                const stored = localStorage.getItem(STORAGE_KEY);
                const parsed = stored ? JSON.parse(stored) : [];
                return _updateCache(parsed);
            } catch (error) {
                console.error('Failed to retrieve favorites:', error);
                return [];
            }
        },
        
        /**
         * Save favorites to storage
         * @param {Array} favorites - Array of favorite objects
         * @returns {boolean} Success status
         */
        saveFavorites(favorites) {
            try {
                if (!Array.isArray(favorites)) {
                    throw new Error('Favorites must be an array');
                }
                
                _updateCache(favorites);
                _saveToStorage(favorites);
                return true;
            } catch (error) {
                console.error('Failed to save favorites:', error);
                return false;
            }
        },
        
        /**
         * Add a new favorite
         * @param {Object} favorite - Favorite data to add
         * @returns {Object|null} The added favorite with ID or null if failed
         */
        addFavorite(favorite) {
            try {
                if (!favorite || typeof favorite !== 'object') {
                    throw new Error('Invalid favorite data');
                }
                
                const favorites = this.getFavorites();
                const newFavorite = {
                    ...favorite,
                    id: Date.now(),
                    createdAt: Date.now()
                };
                
                favorites.push(newFavorite);
                this.saveFavorites(favorites);
                return newFavorite;
            } catch (error) {
                console.error('Failed to add favorite:', error);
                return null;
            }
        },
        
        /**
         * Update an existing favorite
         * @param {string|number} id - ID of favorite to update
         * @param {Object} updates - New data to apply
         * @returns {boolean} Success status
         */
        updateFavorite(id, updates) {
            try {
                if (!id || !updates || typeof updates !== 'object') {
                    return false;
                }
                
                const normalizedId = _normalizeId(id);
                const favorites = this.getFavorites();
                const index = favorites.findIndex(f => _normalizeId(f.id) === normalizedId);
                
                if (index === -1) return false;
                
                favorites[index] = {
                    ...favorites[index],
                    ...updates,
                    id: favorites[index].id, // Preserve original ID
                    lastModified: Date.now()
                };
                
                this.saveFavorites(favorites);
                return true;
            } catch (error) {
                console.error('Failed to update favorite:', error);
                return false;
            }
        },
        
        /**
         * Remove a favorite by ID
         * @param {string|number} id - ID of favorite to remove
         * @returns {boolean} Success status
         */
        removeFavorite(id) {
            try {
                const normalizedId = _normalizeId(id);
                const favorites = this.getFavorites();
                const newFavorites = favorites.filter(f => _normalizeId(f.id) !== normalizedId);
                
                if (newFavorites.length === favorites.length) return false;
                
                // Clear cache and save filtered favorites
                _cache = null;
                _cacheTimestamp = 0;
                _saveToStorage(newFavorites);
                return true;
            } catch (error) {
                console.error('Failed to remove favorite:', error);
                return false;
            }
        },
        
        /**
         * Get a single favorite by ID
         * @param {string|number} id - ID of favorite to retrieve
         * @returns {Object|null} Favorite object or null if not found
         */
        getFavoriteById(id) {
            try {
                const normalizedId = _normalizeId(id);
                
                // Check cache first if valid
                if (_isCacheValid()) {
                    return _cache.find(f => _normalizeId(f.id) === normalizedId) || null;
                }
                
                const favorites = this.getFavorites();
                return favorites.find(f => _normalizeId(f.id) === normalizedId) || null;
            } catch (error) {
                console.error('Failed to get favorite by ID:', error);
                return null;
            }
        },
        
        /**
         * Export favorites as JSON string
         * @returns {string} JSON string of all favorites
         */
        exportFavorites() {
            try {
                const favorites = this.getFavorites();
                return JSON.stringify(favorites);
            } catch (error) {
                console.error('Failed to export favorites:', error);
                return '[]';
            }
        },
        
        /**
         * Import favorites from JSON string
         * @param {string} jsonString - JSON string to import
         * @returns {boolean} Success status
         */
        importFavorites(jsonString) {
            try {
                if (!jsonString || typeof jsonString !== 'string') {
                    throw new Error('Invalid import data');
                }
                
                const parsed = JSON.parse(jsonString);
                if (!Array.isArray(parsed)) {
                    throw new Error('Imported data is not an array');
                }
                
                // Ensure each item has a unique ID
                const now = Date.now();
                const processed = parsed.map((item, index) => ({
                    ...item,
                    id: item.id || (now + index),
                    importedAt: now
                }));
                
                this.saveFavorites(processed);
                return true;
            } catch (error) {
                console.error('Failed to import favorites:', error);
                return false;
            }
        },
        
        /**
         * Clear the cache (forces refresh from localStorage on next read)
         */
        clearCache() {
            _cache = null;
            _cacheTimestamp = 0;
        }
    };
})();
