/**
 * Cache Manager Module
 * Provides advanced caching capabilities for application data
 */

export class CacheManager {
  constructor(options = {}) {
    this.options = {
      prefix: 'osurea-cache-',
      defaultTTL: 3600000, // 1 hour in milliseconds
      storage: localStorage,
      ...options
    };
    
    this.memoryCache = new Map();
  }

  /**
   * Generate a cache key with prefix
   * @param {string} key - Original key
   * @returns {string} Prefixed key
   * @private
   */
  _getCacheKey(key) {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Safely parse JSON with error handling
   * @param {string} data - JSON string to parse
   * @returns {any} Parsed data or null on error
   * @private
   */
  _safeJSONParse(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
      return null;
    }
  }

  /**
   * Safely stringify JSON with error handling
   * @param {any} data - Data to stringify
   * @returns {string} JSON string or null on error
   * @private
   */
  _safeJSONStringify(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('Failed to stringify data for caching:', error);
      return null;
    }
  }

  /**
   * Set an item in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} Success status
   */
  set(key, value, ttl = this.options.defaultTTL) {
    try {
      const cacheKey = this._getCacheKey(key);
      const expires = Date.now() + ttl;
      const cacheObject = {
        value,
        expires
      };
      
      // Store in memory cache
      this.memoryCache.set(key, cacheObject);
      
      // Store in persistent storage
      const cacheString = this._safeJSONStringify(cacheObject);
      if (cacheString) {
        this.options.storage.setItem(cacheKey, cacheString);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Failed to set cache item:', error);
      return false;
    }
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found or expired
   */
  get(key) {
    try {
      // Try memory cache first
      if (this.memoryCache.has(key)) {
        const cacheObject = this.memoryCache.get(key);
        
        // Check if expired
        if (cacheObject.expires > Date.now()) {
          return cacheObject.value;
        }
        
        // Remove expired item from memory cache
        this.memoryCache.delete(key);
      }
      
      // Try persistent storage
      const cacheKey = this._getCacheKey(key);
      const cacheString = this.options.storage.getItem(cacheKey);
      
      if (!cacheString) {
        return null;
      }
      
      const cacheObject = this._safeJSONParse(cacheString);
      
      if (!cacheObject) {
        return null;
      }
      
      // Check if expired
      if (cacheObject.expires > Date.now()) {
        // Update memory cache
        this.memoryCache.set(key, cacheObject);
        return cacheObject.value;
      }
      
      // Remove expired item
      this.options.storage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.warn('Failed to get cache item:', error);
      return null;
    }
  }

  /**
   * Remove an item from the cache
   * @param {string} key - Cache key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      
      // Remove from persistent storage
      const cacheKey = this._getCacheKey(key);
      this.options.storage.removeItem(cacheKey);
      
      return true;
    } catch (error) {
      console.warn('Failed to remove cache item:', error);
      return false;
    }
  }

  /**
   * Check if an item exists in the cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if item exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache items with the configured prefix
   * @returns {boolean} Success status
   */
  clear() {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear persistent storage (only items with our prefix)
      const { storage, prefix } = this.options;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        
        if (key && key.startsWith(prefix)) {
          storage.removeItem(key);
        }
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get all cache keys
   * @returns {Array} Array of cache keys
   */
  keys() {
    try {
      const { storage, prefix } = this.options;
      const keys = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        
        if (key && key.startsWith(prefix)) {
          keys.push(key.substring(prefix.length));
        }
      }
      
      return keys;
    } catch (error) {
      console.warn('Failed to get cache keys:', error);
      return [];
    }
  }

  /**
   * Get cache size in bytes
   * @returns {number} Cache size in bytes
   */
  size() {
    try {
      const { storage, prefix } = this.options;
      let size = 0;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        
        if (key && key.startsWith(prefix)) {
          size += key.length + (storage.getItem(key)?.length || 0);
        }
      }
      
      return size;
    } catch (error) {
      console.warn('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Clean expired items from the cache
   * @returns {number} Number of items removed
   */
  cleanExpired() {
    try {
      const { storage, prefix } = this.options;
      let removed = 0;
      
      // Clean memory cache
      for (const [key, cacheObject] of this.memoryCache.entries()) {
        if (cacheObject.expires <= Date.now()) {
          this.memoryCache.delete(key);
          removed++;
        }
      }
      
      // Clean persistent storage
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        
        if (key && key.startsWith(prefix)) {
          const cacheString = storage.getItem(key);
          
          if (cacheString) {
            const cacheObject = this._safeJSONParse(cacheString);
            
            if (cacheObject && cacheObject.expires <= Date.now()) {
              storage.removeItem(key);
              removed++;
            }
          }
        }
      }
      
      return removed;
    } catch (error) {
      console.warn('Failed to clean expired cache items:', error);
      return 0;
    }
  }
}

// Create a singleton instance
export const cacheManager = new CacheManager();

// Export as default
export default cacheManager;