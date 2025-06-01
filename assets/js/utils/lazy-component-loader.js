/**
 * Lazy Component Loader - Performance optimization
 * Implements dynamic component loading to reduce initial bundle size
 */

class LazyComponentLoader {
    constructor() {
        this.loadedComponents = new Map();
        this.loadingPromises = new Map();
        this.componentCache = new Map();
    }

    /**
     * Load a component dynamically
     * @param {string} componentName - Name of the component to load
     * @param {string} componentPath - Path to the component (optional, auto-generated if not provided)
     * @returns {Promise} Promise that resolves to the component module
     */
    async load(componentName, componentPath = null) {
        // Check if component is already loaded
        if (this.loadedComponents.has(componentName)) {
            return this.loadedComponents.get(componentName);
        }

        // Check if component is currently being loaded
        if (this.loadingPromises.has(componentName)) {
            return this.loadingPromises.get(componentName);
        }

        // Generate component path if not provided
        if (!componentPath) {
            componentPath = this._generateComponentPath(componentName);
        }

        // Create loading promise
        const loadingPromise = this._loadComponent(componentName, componentPath);
        this.loadingPromises.set(componentName, loadingPromise);

        try {
            const component = await loadingPromise;
            this.loadedComponents.set(componentName, component);
            this.loadingPromises.delete(componentName);
            return component;
        } catch (error) {
            this.loadingPromises.delete(componentName);
            throw error;
        }
    }

    /**
     * Preload components for better performance
     * @param {Array<string>} componentNames - Array of component names to preload
     */
    async preload(componentNames) {
        const preloadPromises = componentNames.map(name => 
            this.load(name).catch(error => {
                console.warn(`Failed to preload component ${name}:`, error);
                return null;
            })
        );

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Load component with retry mechanism
     * @private
     */
    async _loadComponent(componentName, componentPath) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Loading component ${componentName} (attempt ${attempt})`);
                
                const module = await import(componentPath);
                
                // Handle different export patterns
                const component = module.default || module[componentName] || module;
                
                if (!component) {
                    throw new Error(`Component ${componentName} not found in module`);
                }

                console.log(`Successfully loaded component ${componentName}`);
                return component;
                
            } catch (error) {
                lastError = error;
                console.warn(`Failed to load component ${componentName} (attempt ${attempt}):`, error);
                
                if (attempt < maxRetries) {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                }
            }
        }

        throw new Error(`Failed to load component ${componentName} after ${maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Generate component path based on naming convention
     * @private
     */
    _generateComponentPath(componentName) {
        // Convert PascalCase to kebab-case for file paths
        const fileName = componentName
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '');

        // Try different possible paths
        const possiblePaths = [
            `./components/${fileName}/${fileName}.js`,
            `./components/${fileName}/index.js`,
            `./components/${componentName}.js`,
            `./ui/${fileName}.js`,
            `./core/${fileName}.js`
        ];

        // Return the first path (we'll handle errors in the loading process)
        return possiblePaths[0];
    }

    /**
     * Clear component cache
     */
    clearCache() {
        this.componentCache.clear();
        console.log('Component cache cleared');
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            loadedComponents: this.loadedComponents.size,
            currentlyLoading: this.loadingPromises.size,
            cacheSize: this.componentCache.size
        };
    }
}

// Create singleton instance
export const LazyComponent = new LazyComponentLoader();

// Export class for testing
export { LazyComponentLoader };

// Legacy compatibility
if (typeof window !== 'undefined') {
    window.LazyComponent = LazyComponent;
} 