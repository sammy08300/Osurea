/**
 * Lazy Component Loader - Performance optimization
 * Implements dynamic component loading to reduce initial bundle size
 */

class LazyComponentLoader {
    private loadedComponents: Map<string, any>;
    private loadingPromises: Map<string, Promise<any>>;
    private componentCache: Map<string, any>; // Consider a more specific type if possible

    constructor() {
        this.loadedComponents = new Map<string, any>();
        this.loadingPromises = new Map<string, Promise<any>>();
        this.componentCache = new Map<string, any>();
    }

    /**
     * Load a component dynamically
     * @param {string} componentName - Name of the component to load
     * @param {string} componentPath - Path to the component (optional, auto-generated if not provided)
     * @returns {Promise} Promise that resolves to the component module
     */
    async load(componentName: string, componentPath: string | null = null): Promise<any> {
        // Check if component is already loaded
        if (this.loadedComponents.has(componentName)) {
            return this.loadedComponents.get(componentName);
        }

        // Check if component is currently being loaded
        if (this.loadingPromises.has(componentName)) {
            return this.loadingPromises.get(componentName);
        }

        // Generate component path if not provided
        let finalComponentPath: string;
        if (!componentPath) {
            finalComponentPath = this._generateComponentPath(componentName);
        } else {
            finalComponentPath = componentPath;
        }
        

        // Create loading promise
        const loadingPromise = this._loadComponent(componentName, finalComponentPath);
        this.loadingPromises.set(componentName, loadingPromise);

        try {
            const component = await loadingPromise;
            this.loadedComponents.set(componentName, component);
            this.loadingPromises.delete(componentName);
            return component;
        } catch (error) {
            this.loadingPromises.delete(componentName);
            throw error; // Re-throw the error to be caught by the caller
        }
    }

    /**
     * Preload components for better performance
     * @param {Array<string>} componentNames - Array of component names to preload
     */
    async preload(componentNames: string[]): Promise<void> {
        const preloadPromises = componentNames.map((name: string) => 
            this.load(name).catch(error => {
                console.warn(`Failed to preload component ${name}:`, error instanceof Error ? error.message : error);
                return null; // Return null or some indicator for failed preloads
            })
        );

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Load component with retry mechanism
     * @private
     */
    private async _loadComponent(componentName: string, componentPath: string): Promise<any> {
        const maxRetries = 3;
        let lastError: Error = new Error('Unknown error during component load.'); // Initialize with a default Error

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Loading component ${componentName} (attempt ${attempt}) from ${componentPath}`);
                
                const module = await import(componentPath); // Ensure path is correct
                
                // Handle different export patterns
                const component = module.default || module[componentName] || module;
                
                if (!component) {
                    throw new Error(`Component ${componentName} not found in module at ${componentPath}`);
                }

                console.log(`Successfully loaded component ${componentName}`);
                this.componentCache.set(componentName, component); // Cache successful load
                return component;
                
            } catch (error: any) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`Failed to load component ${componentName} from ${componentPath} (attempt ${attempt}):`, lastError.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                }
            }
        }
        // Ensure lastError is always an Error object before accessing .message
        const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
        throw new Error(`Failed to load component ${componentName} after ${maxRetries} attempts: ${errorMessage}`);
    }

    /**
     * Generate component path based on naming convention
     * @private
     */
    private _generateComponentPath(componentName: string): string {
        const fileName = componentName
            .replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`) // Improved Pascal to kebab
            .replace(/^-/, ''); // Remove leading dash if first letter was uppercase

        // Prioritize specific component directories if they exist or according to project structure
        // This example assumes a flat structure within 'components' or specific subdirectories
        // Adjust these paths based on your actual project structure.
        const possiblePaths = [
            `./components/${fileName}/${fileName}.js`, // e.g., ./components/my-component/my-component.js
            `./components/${fileName}/index.js`,      // e.g., ./components/my-component/index.js
            `./components/${fileName}.js`,            // e.g., ./components/my-component.js
            `../ui/${fileName}.js`,                   // Example for UI components if in a parallel dir
            `../core/${fileName}.js`                  // Example for core components
        ];
        
        // For now, returning the first generated path.
        // In a real scenario, you might check for file existence or have a more robust mapping.
        return possiblePaths[0]; 
    }


    /**
     * Clear component cache
     */
    clearCache(): void {
        this.componentCache.clear();
        console.log('Component cache cleared');
    }

    /**
     * Get loading statistics
     */
    getStats(): object {
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
    (window as any).LazyComponent = LazyComponent;
}