/**
 * Asset Loader Module
 * Optimized resource loading with prioritization and error handling
 */

export class AssetLoader {
  constructor() {
    this.loadedAssets = new Map();
    this.loadingPromises = new Map();
    this.erroredAssets = new Set();
    this.retryCount = new Map();
    this.maxRetries = 3;
  }

  /**
   * Load a script with proper error handling and retries
   * @param {string} src - Script URL
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves when script is loaded
   */
  loadScript(src, options = {}) {
    const {
      async = true,
      defer = false,
      type = 'text/javascript',
      crossOrigin = null,
      priority = 'auto'
    } = options;

    // Return cached promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Return cached result if already loaded
    if (this.loadedAssets.has(src)) {
      return Promise.resolve(this.loadedAssets.get(src));
    }

    // Create and track the loading promise
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = defer;
      script.type = type;
      
      if (crossOrigin) {
        script.crossOrigin = crossOrigin;
      }
      
      // Modern browsers support fetchpriority
      if ('fetchPriority' in HTMLScriptElement.prototype) {
        script.fetchPriority = priority;
      }

      script.onload = () => {
        this.loadedAssets.set(src, script);
        this.loadingPromises.delete(src);
        resolve(script);
      };

      script.onerror = () => {
        const currentRetries = this.retryCount.get(src) || 0;
        
        if (currentRetries < this.maxRetries) {
          console.warn(`Failed to load script ${src}, retrying (${currentRetries + 1}/${this.maxRetries})...`);
          this.retryCount.set(src, currentRetries + 1);
          this.loadingPromises.delete(src);
          
          // Retry with exponential backoff
          setTimeout(() => {
            this.loadScript(src, options)
              .then(resolve)
              .catch(reject);
          }, Math.pow(2, currentRetries) * 1000);
        } else {
          this.erroredAssets.add(src);
          this.loadingPromises.delete(src);
          reject(new Error(`Failed to load script ${src} after ${this.maxRetries} retries`));
        }
      };

      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Load a stylesheet with proper error handling
   * @param {string} href - Stylesheet URL
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves when stylesheet is loaded
   */
  loadStylesheet(href, options = {}) {
    const {
      media = 'all',
      crossOrigin = null,
      priority = 'auto'
    } = options;

    // Return cached promise if already loading
    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href);
    }

    // Return cached result if already loaded
    if (this.loadedAssets.has(href)) {
      return Promise.resolve(this.loadedAssets.get(href));
    }

    // Create and track the loading promise
    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      if (crossOrigin) {
        link.crossOrigin = crossOrigin;
      }
      
      // Modern browsers support fetchpriority
      if ('fetchPriority' in HTMLLinkElement.prototype) {
        link.fetchPriority = priority;
      }

      link.onload = () => {
        this.loadedAssets.set(href, link);
        this.loadingPromises.delete(href);
        resolve(link);
      };

      link.onerror = () => {
        const currentRetries = this.retryCount.get(href) || 0;
        
        if (currentRetries < this.maxRetries) {
          console.warn(`Failed to load stylesheet ${href}, retrying (${currentRetries + 1}/${this.maxRetries})...`);
          this.retryCount.set(href, currentRetries + 1);
          this.loadingPromises.delete(href);
          
          // Retry with exponential backoff
          setTimeout(() => {
            this.loadStylesheet(href, options)
              .then(resolve)
              .catch(reject);
          }, Math.pow(2, currentRetries) * 1000);
        } else {
          this.erroredAssets.add(href);
          this.loadingPromises.delete(href);
          reject(new Error(`Failed to load stylesheet ${href} after ${this.maxRetries} retries`));
        }
      };

      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  /**
   * Preload an image
   * @param {string} src - Image URL
   * @returns {Promise} Promise that resolves when image is loaded
   */
  preloadImage(src) {
    // Return cached promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Return cached result if already loaded
    if (this.loadedAssets.has(src)) {
      return Promise.resolve(this.loadedAssets.get(src));
    }

    // Create and track the loading promise
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedAssets.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        const currentRetries = this.retryCount.get(src) || 0;
        
        if (currentRetries < this.maxRetries) {
          console.warn(`Failed to load image ${src}, retrying (${currentRetries + 1}/${this.maxRetries})...`);
          this.retryCount.set(src, currentRetries + 1);
          this.loadingPromises.delete(src);
          
          // Retry with exponential backoff
          setTimeout(() => {
            this.preloadImage(src)
              .then(resolve)
              .catch(reject);
          }, Math.pow(2, currentRetries) * 1000);
        } else {
          this.erroredAssets.add(src);
          this.loadingPromises.delete(src);
          reject(new Error(`Failed to load image ${src} after ${this.maxRetries} retries`));
        }
      };

      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Load multiple assets in parallel
   * @param {Array} assets - Array of asset objects with type and url
   * @returns {Promise} Promise that resolves when all assets are loaded
   */
  loadAssets(assets) {
    const promises = assets.map(asset => {
      switch (asset.type) {
        case 'script':
          return this.loadScript(asset.url, asset.options);
        case 'stylesheet':
          return this.loadStylesheet(asset.url, asset.options);
        case 'image':
          return this.preloadImage(asset.url);
        default:
          return Promise.reject(new Error(`Unknown asset type: ${asset.type}`));
      }
    });

    return Promise.all(promises);
  }

  /**
   * Preload critical assets
   * @param {Array} criticalAssets - Array of critical asset objects
   */
  preloadCriticalAssets(criticalAssets) {
    // Create link elements for preloading
    criticalAssets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      switch (asset.type) {
        case 'script':
          link.as = 'script';
          break;
        case 'stylesheet':
          link.as = 'style';
          break;
        case 'image':
          link.as = 'image';
          break;
        case 'font':
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          break;
      }
      
      link.href = asset.url;
      
      if (asset.priority) {
        link.setAttribute('fetchpriority', asset.priority);
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    return {
      loaded: this.loadedAssets.size,
      loading: this.loadingPromises.size,
      errored: this.erroredAssets.size,
      total: this.loadedAssets.size + this.loadingPromises.size + this.erroredAssets.size
    };
  }

  /**
   * Clear cache of loaded assets
   */
  clearCache() {
    this.loadedAssets.clear();
    this.erroredAssets.clear();
    this.retryCount.clear();
  }
}

// Create a singleton instance
export const assetLoader = new AssetLoader();

// Export as default
export default assetLoader;