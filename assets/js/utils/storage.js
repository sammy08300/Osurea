/**
 * Storage utility functions for favorites management
 */

const StorageManager = {
    // Storage key for favorites
    FAVORITES_KEY: 'osuAreaVisualizerFavorites_v2',
    
    /**
     * Gets all favorites from local storage
     * @returns {Array} - Array of favorite objects, or empty array if none
     */
    getFavorites() {
        try {
            const favoritesJson = localStorage.getItem(this.FAVORITES_KEY);
            const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
            return Array.isArray(favorites) ? favorites : [];
        } catch (error) {
            console.error('Error retrieving favorites:', error);
            return [];
        }
    },
    
    /**
     * Saves favorites to local storage
     * @param {Array} favorites - Array of favorite objects
     */
    saveFavorites(favorites) {
        try {
            if (!Array.isArray(favorites)) {
                throw new Error('Favorites must be an array');
            }
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    },
    
    /**
     * Adds a new favorite
     * @param {Object} favorite - Favorite object to add
     * @returns {Object} - The added favorite with ID
     */
    addFavorite(favorite) {
        try {
            const favorites = this.getFavorites();
            const newFavorite = {
                ...favorite,
                id: Date.now() // Use timestamp as ID
            };
            
            favorites.push(newFavorite);
            this.saveFavorites(favorites);
            return newFavorite;
        } catch (error) {
            console.error('Error adding favorite:', error);
            return null;
        }
    },
    
    /**
     * Updates an existing favorite
     * @param {string|number} id - ID of the favorite to update
     * @param {Object} updatedData - Updated data for the favorite
     * @returns {boolean} - True if update was successful
     */
    updateFavorite(id, updatedData) {
        try {
            const favorites = this.getFavorites();
            const index = favorites.findIndex(f => f.id.toString() === id.toString());
            
            if (index === -1) return false;
            
            favorites[index] = {
                ...favorites[index],
                ...updatedData,
                id: favorites[index].id // Ensure ID doesn't change
            };
            
            this.saveFavorites(favorites);
            return true;
        } catch (error) {
            console.error('Error updating favorite:', error);
            return false;
        }
    },
    
    /**
     * Removes a favorite
     * @param {string|number} id - ID of the favorite to remove
     * @returns {boolean} - True if removal was successful
     */
    removeFavorite(id) {
        try {
            const favorites = this.getFavorites();
            const filteredFavorites = favorites.filter(f => f.id.toString() !== id.toString());
            
            if (filteredFavorites.length === favorites.length) return false;
            
            this.saveFavorites(filteredFavorites);
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    },
    
    /**
     * Gets a single favorite by ID
     * @param {string|number} id - ID of the favorite to get
     * @returns {Object|null} - The favorite object or null if not found
     */
    getFavoriteById(id) {
        try {
            const favorites = this.getFavorites();
            return favorites.find(f => f.id.toString() === id.toString()) || null;
        } catch (error) {
            console.error('Error getting favorite:', error);
            return null;
        }
    },
    
    /**
     * Export all favorites as a JSON string
     * @returns {string} - JSON string of all favorites
     */
    exportFavorites() {
        const favorites = this.getFavorites();
        return JSON.stringify(favorites);
    },
    
    /**
     * Import favorites from a JSON string
     * @param {string} jsonString - JSON string of favorites to import
     * @returns {boolean} - True if import was successful
     */
    importFavorites(jsonString) {
        try {
            const importedFavorites = JSON.parse(jsonString);
            if (!Array.isArray(importedFavorites)) {
                throw new Error('Imported data is not an array');
            }
            
            // Add timestamp to ensure unique IDs
            const favoritesWithIds = importedFavorites.map(favorite => ({
                ...favorite,
                id: favorite.id || Date.now() + Math.floor(Math.random() * 1000)
            }));
            
            this.saveFavorites(favoritesWithIds);
            return true;
        } catch (error) {
            console.error('Error importing favorites:', error);
            return false;
        }
    }
};
