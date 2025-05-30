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
    
    /**
     * Validate data structure integrity
     * @param {any[]} data - Data to validate
     * @returns {boolean} True if data is valid
     */
    const _validateData = (data) => {
        return Array.isArray(data) && data.every(item => 
            item && typeof item.id !== 'undefined'
        );
    };
    
    /**
     * Repair corrupted data by filtering and fixing items
     * @param {any[]} data - Data to repair
     * @returns {any[]} Repaired data
     */
    const _repairData = (data) => {
        if (!Array.isArray(data)) return [];
        
        return data.filter(item => item && item.id)
                   .map((item, index) => ({
                     ...item,
                     id: item.id || Date.now() + index
                   }));
    };
    
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
                
                // Validate and repair data if necessary
                const validData = _validateData(parsed) ? parsed : _repairData(parsed);
                
                return _updateCache(validData);
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
                
                // Validate and repair data before saving
                const validData = _validateData(favorites) ? favorites : _repairData(favorites);
                
                _updateCache(validData);
                _saveToStorage(validData);
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
                const uniqueId = Date.now();
                const newFavorite = {
                    ...favorite,
                    id: uniqueId,
                    createdAt: Date.now()
                };
                
                favorites.push(newFavorite);
                
                if (this.saveFavorites(favorites)) {
                    return newFavorite;
                }
                
                throw new Error('Failed to save favorite');
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
                
                return this.saveFavorites(favorites);
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
                
                if (newFavorites.length === favorites.length) {
                    return false; // No favorite found with this ID
                }
                
                return this.saveFavorites(newFavorites);
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
                
                return this.saveFavorites(processed);
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
        },
        
        /**
         * Diagnostic check of storage status
         * Logs information about the storage state to help debug issues
         */
        diagnoseFavorites() {
            try {
                console.log("---- STORAGE DIAGNOSTICS ----");
                
                // Check cache status
                console.log(`Cache status: ${_cache ? 'EXISTS' : 'NULL'}, Timestamp: ${_cacheTimestamp || 'NONE'}`);
                if (_cache) {
                    console.log(`Cache contains ${_cache.length} favorites`);
                }
                
                // Check localStorage directly
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    try {
                        const fromStorage = JSON.parse(stored);
                        console.log(`LocalStorage contains ${fromStorage.length} favorites`);
                        
                        // Validate data integrity
                        const isValid = _validateData(fromStorage);
                        console.log(`Data integrity: ${isValid ? 'VALID' : 'CORRUPTED'}`);
                        
                        if (!isValid) {
                            const repaired = _repairData(fromStorage);
                            console.log(`Repaired data would contain ${repaired.length} favorites`);
                        }
                        
                        // List all favorites in storage
                        console.log("Favorites in storage:", fromStorage.map(f => ({
                            id: f.id,
                            title: f.title,
                            createdAt: f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Unknown'
                        })));
                    } catch (e) {
                        console.error("Failed to parse storage data:", e);
                    }
                } else {
                    console.log("No favorites in localStorage");
                }
                
                console.log("---- END DIAGNOSTICS ----");
            } catch (error) {
                console.error("Diagnostics error:", error);
            }
        },
        
        /**
         * Perform data migration if needed
         * @returns {boolean} True if migration was performed
         */
        migrateData() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) return false;
                
                const data = JSON.parse(stored);
                if (_validateData(data)) return false; // No migration needed
                
                console.log("Migrating corrupted data...");
                const repairedData = _repairData(data);
                
                localStorage.setItem(STORAGE_KEY, JSON.stringify(repairedData));
                _updateCache(repairedData);
                
                console.log(`Migration complete: ${repairedData.length} favorites recovered`);
                return true;
            } catch (error) {
                console.error("Migration failed:", error);
                return false;
            }
        }
    };
})();

