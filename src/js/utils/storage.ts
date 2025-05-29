/**
 * StorageManager - Utility module for managing favorites in localStorage
 */

interface FavoriteItem {
    id: string | number;
    createdAt?: number;
    lastModified?: number;
    importedAt?: number;
    title?: string; // Optional: for diagnostics
    [key: string]: any; // Allow other properties
}

export const StorageManager = (() => {
    const STORAGE_KEY = 'Osu!reaFavorites_v2';
    const CACHE_EXPIRY = 3000; // ms
    
    let _cache: FavoriteItem[] | null = null;
    let _cacheTimestamp: number = 0;
    
    const _isCacheValid = (): boolean => {
        return _cache !== null && (Date.now() - _cacheTimestamp) < CACHE_EXPIRY;
    };
    
    const _updateCache = (data: FavoriteItem[]): FavoriteItem[] => {
        _cache = Array.isArray(data) ? [...data] : []; // Ensure it's always an array
        _cacheTimestamp = Date.now();
        return _cache;
    };
    
    const _saveToStorage = (data: FavoriteItem[]): void => {
        const json = JSON.stringify(data);
        
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => localStorage.setItem(STORAGE_KEY, json));
        } else {
            setTimeout(() => localStorage.setItem(STORAGE_KEY, json), 0);
        }
    };
    
    const _normalizeId = (id: string | number | undefined | null): string | undefined => id?.toString();
    
    const _validateData = (data: any): data is FavoriteItem[] => {
        return Array.isArray(data) && data.every(item => 
            item && typeof item.id !== 'undefined'
        );
    };
    
    const _repairData = (data: any): FavoriteItem[] => {
        if (!Array.isArray(data)) return [];
        
        return data
            .filter(item => item && typeof item.id !== 'undefined') // Keep items with an ID
            .map((item, index) => ({
                ...item,
                id: item.id || (Date.now() + index).toString() // Ensure ID is string
            }));
    };
    
    return {
        getFavorites(): FavoriteItem[] {
            try {
                if (_isCacheValid() && _cache) { // Added null check for _cache
                    return [..._cache];
                }
                
                const stored = localStorage.getItem(STORAGE_KEY);
                const parsed = stored ? JSON.parse(stored) : [];
                
                const validData = _validateData(parsed) ? parsed : _repairData(parsed);
                return _updateCache(validData);
            } catch (error: any) {
                console.error('Failed to retrieve favorites:', error.message);
                return [];
            }
        },
        
        saveFavorites(favorites: FavoriteItem[]): boolean {
            try {
                if (!Array.isArray(favorites)) {
                    throw new Error('Favorites must be an array');
                }
                
                const validData = _validateData(favorites) ? favorites : _repairData(favorites);
                
                _updateCache(validData);
                _saveToStorage(validData);
                return true;
            } catch (error: any) {
                console.error('Failed to save favorites:', error.message);
                return false;
            }
        },
        
        addFavorite(favorite: Omit<FavoriteItem, 'id' | 'createdAt'>): FavoriteItem | null {
            try {
                if (!favorite || typeof favorite !== 'object') {
                    throw new Error('Invalid favorite data');
                }
                
                const favorites = this.getFavorites();
                const uniqueId = Date.now().toString(); 
                const newFavorite: FavoriteItem = {
                    ...favorite,
                    id: uniqueId,
                    createdAt: Date.now()
                };
                
                favorites.push(newFavorite);
                
                if (this.saveFavorites(favorites)) {
                    return newFavorite;
                }
                throw new Error('Failed to save new favorite after adding');
            } catch (error: any) {
                console.error('Failed to add favorite:', error.message);
                return null;
            }
        },
        
        updateFavorite(id: string | number, updates: Partial<FavoriteItem>): boolean {
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
            } catch (error: any) {
                console.error('Failed to update favorite:', error.message);
                return false;
            }
        },
        
        removeFavorite(id: string | number): boolean {
            try {
                const normalizedId = _normalizeId(id);
                const favorites = this.getFavorites();
                const newFavorites = favorites.filter(f => _normalizeId(f.id) !== normalizedId);
                
                if (newFavorites.length === favorites.length) return false;
                
                return this.saveFavorites(newFavorites);
            } catch (error: any) {
                console.error('Failed to remove favorite:', error.message);
                return false;
            }
        },
        
        getFavoriteById(id: string | number): FavoriteItem | null {
            try {
                const normalizedId = _normalizeId(id);
                
                if (_isCacheValid() && _cache) {
                    return _cache.find(f => _normalizeId(f.id) === normalizedId) || null;
                }
                
                const favorites = this.getFavorites();
                return favorites.find(f => _normalizeId(f.id) === normalizedId) || null;
            } catch (error: any) {
                console.error('Failed to get favorite by ID:', error.message);
                return null;
            }
        },
        
        exportFavorites(): string {
            try {
                const favorites = this.getFavorites();
                return JSON.stringify(favorites, null, 2); // Pretty print JSON
            } catch (error: any) {
                console.error('Failed to export favorites:', error.message);
                return '[]';
            }
        },
        
        importFavorites(jsonString: string): boolean {
            try {
                if (!jsonString || typeof jsonString !== 'string') {
                    throw new Error('Invalid import data: must be a non-empty string');
                }
                
                const parsed = JSON.parse(jsonString);
                if (!_validateData(parsed)) { // Use _validateData for initial check
                    throw new Error('Imported data does not conform to FavoriteItem structure or is not an array');
                }
                
                const now = Date.now();
                const processed: FavoriteItem[] = parsed.map((item: FavoriteItem, index: number) => ({
                    ...item,
                    id: item.id || `${now}-${index}`, // Ensure unique ID and string type
                    importedAt: now
                }));
                
                return this.saveFavorites(processed);
            } catch (error: any) {
                console.error('Failed to import favorites:', error.message);
                return false;
            }
        },
        
        clearCache(): void {
            _cache = null;
            _cacheTimestamp = 0;
        },
        
        diagnoseFavorites(): void {
            try {
                console.log("---- STORAGE DIAGNOSTICS ----");
                console.log(`Cache status: ${_cache ? 'EXISTS' : 'NULL'}, Timestamp: ${_cacheTimestamp || 'NONE'}`);
                if (_cache) console.log(`Cache contains ${_cache.length} favorites`);
                
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    try {
                        const fromStorage = JSON.parse(stored) as FavoriteItem[];
                        console.log(`LocalStorage contains ${fromStorage.length} favorites`);
                        const isValid = _validateData(fromStorage);
                        console.log(`Data integrity: ${isValid ? 'VALID' : 'CORRUPTED'}`);
                        
                        if (!isValid) {
                            const repaired = _repairData(fromStorage);
                            console.log(`Repaired data would contain ${repaired.length} favorites`);
                        }
                        
                        console.log("Favorites in storage (sample):", fromStorage.slice(0, 5).map(f => ({
                            id: f.id, title: f.title, 
                            createdAt: f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Unknown'
                        })));
                    } catch (e: any) {
                        console.error("Failed to parse storage data:", e.message);
                    }
                } else {
                    console.log("No favorites in localStorage");
                }
                console.log("---- END DIAGNOSTICS ----");
            } catch (error: any) {
                console.error("Diagnostics error:", error.message);
            }
        },
        
        migrateData(): boolean {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) return false;
                
                const data = JSON.parse(stored);
                if (_validateData(data)) return false; 
                
                console.log("Migrating corrupted data...");
                const repairedData = _repairData(data);
                
                localStorage.setItem(STORAGE_KEY, JSON.stringify(repairedData));
                _updateCache(repairedData);
                
                console.log(`Migration complete: ${repairedData.length} favorites recovered`);
                return true;
            } catch (error: any) {
                console.error("Migration failed:", error.message);
                return false;
            }
        }
    };
})();
