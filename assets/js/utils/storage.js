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
                // Log pour déboguer
                console.log('Adding new favorite:', favorite);
                
                if (!favorite || typeof favorite !== 'object') {
                    throw new Error('Invalid favorite data');
                }
                
                // Assurer que nous obtenons une liste fraîche (pas de cache)
                _cache = null;
                _cacheTimestamp = 0;
                const favorites = this.getFavorites();
                
                console.log(`Current favorites count before adding: ${favorites.length}`);
                
                // S'assurer que l'ID est unique
                const uniqueId = Date.now();
                const newFavorite = {
                    ...favorite,
                    id: uniqueId,
                    createdAt: Date.now()
                };
                
                favorites.push(newFavorite);
                
                // Utiliser une sauvegarde synchrone d'abord, puis asynchrone
                localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
                this.saveFavorites(favorites);
                
                // Vérifier que le favori a bien été ajouté
                const verification = localStorage.getItem(STORAGE_KEY);
                const parsedVerification = JSON.parse(verification);
                
                const itemExists = parsedVerification.some(f => _normalizeId(f.id) === _normalizeId(uniqueId));
                if (!itemExists) {
                    console.error(`ERROR: Newly added favorite ${uniqueId} not found after adding!`);
                    
                    // Utiliser forceReset pour réparer les données
                    console.log("Using forceReset to resolve addition issues");
                    const resetFavorites = this.forceReset();
                    
                    // Vérifier si le favori a été ajouté après réinitialisation
                    if (resetFavorites.some(f => _normalizeId(f.id) === _normalizeId(uniqueId))) {
                        console.log(`Favorite ${uniqueId} found after reset`);
                        return newFavorite;
                    }
                    
                    // Si le favori n'existe toujours pas, tenter une dernière fois de l'ajouter
                    console.log(`Attempting final addition of favorite ${uniqueId}`);
                    resetFavorites.push(newFavorite);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetFavorites));
                    _updateCache(resetFavorites);
                } else {
                    console.log(`Favorite ${uniqueId} successfully added`);
                }
                
                return newFavorite;
            } catch (error) {
                console.error('Failed to add favorite:', error);
                
                // En cas d'erreur, essayer une réinitialisation complète
                try {
                    console.log("Attempting recovery after addition error");
                    this.forceReset();
                } catch (e) {
                    console.error("Recovery failed:", e);
                }
                
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
                // Log pour déboguer
                console.log(`Attempting to remove favorite with ID: ${id}`);
                
                const normalizedId = _normalizeId(id);
                const favorites = this.getFavorites();
                
                // Log pour déboguer
                console.log(`Current favorites count before removal: ${favorites.length}`);
                console.log(`Favorite to remove: ${normalizedId}`);
                
                const newFavorites = favorites.filter(f => _normalizeId(f.id) !== normalizedId);
                
                if (newFavorites.length === favorites.length) {
                    console.log(`No favorite found with ID: ${normalizedId}`);
                    return false;
                }
                
                // Log pour déboguer
                console.log(`Favorites count after filtering: ${newFavorites.length}`);
                
                // Force clear cache
                _cache = null;
                _cacheTimestamp = 0;
                
                // Force immediate synchronous save to ensure data is persisted
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
                
                // Double check the data was properly saved
                const verification = localStorage.getItem(STORAGE_KEY);
                const parsedVerification = JSON.parse(verification);
                
                // Vérifier que le favori a bien été supprimé
                const itemStillExists = parsedVerification.some(f => _normalizeId(f.id) === normalizedId);
                if (itemStillExists) {
                    console.error(`ERROR: Favorite ${normalizedId} still exists after removal!`);
                    
                    // Au lieu de faire une seconde tentative simple, utiliser la méthode forceReset
                    console.log(`Using forceReset to resolve removal issues for ID: ${normalizedId}`);
                    const resetFavorites = this.forceReset();
                    
                    // Vérifier si le favori existe encore après la réinitialisation complète
                    const stillExistsAfterReset = resetFavorites.some(f => _normalizeId(f.id) === normalizedId);
                    if (stillExistsAfterReset) {
                        console.error(`CRITICAL: Favorite ${normalizedId} could not be removed even after reset!`);
                        
                        // Dernière tentative: créer une nouvelle liste sans le favori problématique
                        const finalAttempt = resetFavorites.filter(f => _normalizeId(f.id) !== normalizedId);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalAttempt));
                        _updateCache(finalAttempt);
                    } else {
                        console.log(`Favorite ${normalizedId} successfully removed after reset`);
                    }
                } else {
                    console.log(`Favorite ${normalizedId} successfully removed`);
                }
                
                // Ensure the async background save is also triggered
                _saveToStorage(newFavorites);
                
                return true;
            } catch (error) {
                console.error('Failed to remove favorite:', error);
                
                // En cas d'erreur, essayer une réinitialisation complète
                try {
                    console.log("Attempting recovery after removal error");
                    this.forceReset();
                } catch (e) {
                    console.error("Recovery failed:", e);
                }
                
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
                        
                        // List all favorites in storage
                        console.log("Favorites in storage:", fromStorage.map(f => ({
                            id: f.id,
                            title: f.title,
                            createdAt: new Date(f.createdAt).toLocaleString()
                        })));
                    } catch (e) {
                        console.error("Failed to parse storage data:", e);
                    }
                } else {
                    console.log("No favorites in localStorage");
                }
                
                // Check preferences for any favorite references
                if (typeof PreferencesManager !== 'undefined') {
                    const prefs = PreferencesManager.loadPreferences();
                    if (prefs && prefs.lastLoadedFavoriteId) {
                        console.log(`Preferences refers to favorite ID: ${prefs.lastLoadedFavoriteId}`);
                        
                        // Check if that favorite exists
                        const favExists = this.getFavoriteById(prefs.lastLoadedFavoriteId);
                        if (favExists) {
                            console.log(`Referenced favorite exists: ${favExists.title}`);
                        } else {
                            console.error(`Referenced favorite does not exist! This may cause issues.`);
                        }
                    } else {
                        console.log("No favorite reference in preferences");
                    }
                }
                
                console.log("---- END DIAGNOSTICS ----");
            } catch (error) {
                console.error("Diagnostics error:", error);
            }
        },
        
        /**
         * Perform a full reset of the storage system
         * Useful when cache and storage might be out of sync
         */
        forceReset() {
            try {
                console.log("Performing full storage reset");
                
                // Clear cache
                _cache = null;
                _cacheTimestamp = 0;
                
                // Get current data
                const stored = localStorage.getItem(STORAGE_KEY);
                let currentFavorites = [];
                
                try {
                    if (stored) {
                        currentFavorites = JSON.parse(stored);
                        console.log(`Loaded ${currentFavorites.length} favorites from storage`);
                    }
                } catch (e) {
                    console.error("Error parsing storage, resetting to empty array", e);
                    currentFavorites = [];
                }
                
                // Ensure all IDs are normalized and unique
                const uniqueIdsMap = new Map();
                const cleanedFavorites = [];
                
                for (const favorite of currentFavorites) {
                    if (!favorite || !favorite.id) continue;
                    
                    const normalizedId = _normalizeId(favorite.id);
                    
                    // Skip duplicates
                    if (uniqueIdsMap.has(normalizedId)) {
                        console.warn(`Removing duplicate favorite with ID ${normalizedId}`);
                        continue;
                    }
                    
                    uniqueIdsMap.set(normalizedId, true);
                    cleanedFavorites.push({
                        ...favorite,
                        id: normalizedId
                    });
                }
                
                console.log(`After cleaning, ${cleanedFavorites.length} favorites remain`);
                
                // Forced synchronous save
                const json = JSON.stringify(cleanedFavorites);
                localStorage.setItem(STORAGE_KEY, json);
                
                // Verify save worked correctly
                const verification = localStorage.getItem(STORAGE_KEY);
                if (verification !== json) {
                    console.error("Storage verification failed! This may indicate browser storage issues.");
                    
                    // Last resort attempt
                    setTimeout(() => {
                        localStorage.setItem(STORAGE_KEY, json);
                        console.log("Attempted emergency re-save");
                    }, 100);
                } else {
                    console.log("Storage reset successful");
                }
                
                // Update cache with the cleaned data
                _updateCache(cleanedFavorites);
                
                return cleanedFavorites;
            } catch (error) {
                console.error("Fatal error during storage reset:", error);
                return [];
            }
        }
    };
})();
