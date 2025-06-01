/**
 * App Initializer Module
 * Centralized application initialization with dependency management
 */

import { assetLoader } from '../utils/asset-loader.js';
import { cacheManager } from '../utils/cache-manager.js';
import { PerformanceUtils } from '../utils/performance-utils.js';

// Critical assets to preload
const CRITICAL_ASSETS = [
  { type: 'stylesheet', url: 'assets/css/styles.css', priority: 'high' },
  { type: 'script', url: 'assets/js/app.js', priority: 'high' },
  { type: 'image', url: 'assets/img/favicon.svg', priority: 'high' }
];

// Modules to initialize
const MODULES = [
  { name: 'i18n', path: './assets/js/i18n-init.js' },
  { name: 'tabletSelector', path: './assets/js/components/tablet/tabletSelector.js' },
  { name: 'visualizer', path: './assets/js/components/area/visualizer.js' },
  { name: 'favorites', path: './assets/js/components/favorites/favoritesModule.js' },
  { name: 'notifications', path: './assets/js/components/ui/notifications.js' }
];

class AppInitializer {
  constructor() {
    this.initialized = false;
    this.modules = new Map();
    this.initPromises = new Map();
    this.startTime = performance.now();
    this.loadingSteps = [];
  }

  /**
   * Initialize the application
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async init() {
    if (this.initialized) {
      console.warn('App already initialized');
      return Promise.resolve();
    }

    try {
      this._logStep('Starting application initialization');
      
      // Preload critical assets
      this._logStep('Preloading critical assets');
      assetLoader.preloadCriticalAssets(CRITICAL_ASSETS);
      
      // Initialize cache manager
      this._logStep('Initializing cache manager');
      cacheManager.cleanExpired();
      
      // Load and initialize modules
      this._logStep('Loading application modules');
      await this._initializeModules();
      
      // Mark as initialized
      this.initialized = true;
      
      // Log initialization time
      const initTime = performance.now() - this.startTime;
      this._logStep(`Application initialized in ${initTime.toFixed(2)}ms`);
      
      return Promise.resolve();
    } catch (error) {
      this._logStep(`Initialization failed: ${error.message}`, 'error');
      return Promise.reject(error);
    }
  }

  /**
   * Initialize application modules
   * @private
   */
  async _initializeModules() {
    const modulePromises = MODULES.map(module => this._initializeModule(module));
    await Promise.all(modulePromises);
  }

  /**
   * Initialize a single module
   * @param {Object} module - Module configuration
   * @private
   */
  async _initializeModule(module) {
    try {
      // Skip if already initialized
      if (this.modules.has(module.name)) {
        return;
      }
      
      // Skip if already initializing
      if (this.initPromises.has(module.name)) {
        return this.initPromises.get(module.name);
      }
      
      this._logStep(`Initializing module: ${module.name}`);
      
      // Create and track the initialization promise
      const initPromise = (async () => {
        // Import the module
        const importedModule = await import(module.path);
        
        // Get the module object (default export or named export)
        const moduleObject = importedModule.default || importedModule[module.name] || importedModule;
        
        // Initialize the module if it has an init method
        if (typeof moduleObject.init === 'function') {
          await moduleObject.init();
        }
        
        // Store the initialized module
        this.modules.set(module.name, moduleObject);
        this.initPromises.delete(module.name);
        
        this._logStep(`Module initialized: ${module.name}`);
        
        return moduleObject;
      })();
      
      this.initPromises.set(module.name, initPromise);
      return initPromise;
    } catch (error) {
      this._logStep(`Failed to initialize module ${module.name}: ${error.message}`, 'error');
      this.initPromises.delete(module.name);
      throw error;
    }
  }

  /**
   * Get an initialized module
   * @param {string} name - Module name
   * @returns {Object} Module instance
   */
  getModule(name) {
    if (!this.modules.has(name)) {
      throw new Error(`Module ${name} not initialized`);
    }
    
    return this.modules.get(name);
  }

  /**
   * Log an initialization step
   * @param {string} message - Step message
   * @param {string} level - Log level
   * @private
   */
  _logStep(message, level = 'info') {
    const timestamp = performance.now() - this.startTime;
    const formattedTime = timestamp.toFixed(2);
    const step = { time: formattedTime, message, level };
    
    this.loadingSteps.push(step);
    
    switch (level) {
      case 'error':
        console.error(`[${formattedTime}ms] ${message}`);
        break;
      case 'warn':
        console.warn(`[${formattedTime}ms] ${message}`);
        break;
      default:
        console.log(`[${formattedTime}ms] ${message}`);
    }
  }

  /**
   * Get initialization log
   * @returns {Array} Initialization steps
   */
  getInitLog() {
    return [...this.loadingSteps];
  }

  /**
   * Get initialization statistics
   * @returns {Object} Initialization statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      initTime: performance.now() - this.startTime,
      modules: Array.from(this.modules.keys()),
      steps: this.loadingSteps.length,
      errors: this.loadingSteps.filter(step => step.level === 'error').length
    };
  }
}

// Create a singleton instance
export const appInitializer = new AppInitializer();

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  appInitializer.init().catch(error => {
    console.error('Failed to initialize application:', error);
  });
});

// Export as default
export default appInitializer;