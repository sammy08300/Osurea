/**
 * Bundle Optimizer - Code splitting and performance optimization
 * Manages dynamic imports and bundle optimization strategies
 */

class BundleOptimizer {
    constructor() {
        this.loadedChunks = new Set();
        this.preloadedChunks = new Set();
        this.criticalChunks = new Set(['core', 'utils', 'ui']);
        this.chunkRegistry = new Map();
        this.performanceMetrics = {
            loadTimes: new Map(),
            chunkSizes: new Map(),
            errors: []
        };
    }

    /**
     * Register a chunk for lazy loading
     * @param {string} chunkName - Name of the chunk
     * @param {string} chunkPath - Path to the chunk
     * @param {Array<string>} dependencies - Dependencies for this chunk
     * @param {boolean} critical - Whether this chunk is critical for initial load
     */
    registerChunk(chunkName, chunkPath, dependencies = [], critical = false) {
        this.chunkRegistry.set(chunkName, {
            path: chunkPath,
            dependencies,
            critical,
            loaded: false,
            loading: false
        });

        if (critical) {
            this.criticalChunks.add(chunkName);
        }
    }

    /**
     * Load a chunk dynamically with dependency resolution
     * @param {string} chunkName - Name of the chunk to load
     * @returns {Promise} Promise that resolves to the loaded module
     */
    async loadChunk(chunkName) {
        if (this.loadedChunks.has(chunkName)) {
            return this.getLoadedChunk(chunkName);
        }

        const chunkInfo = this.chunkRegistry.get(chunkName);
        if (!chunkInfo) {
            throw new Error(`Chunk ${chunkName} not registered`);
        }

        if (chunkInfo.loading) {
            // Wait for existing loading promise
            return this.waitForChunk(chunkName);
        }

        chunkInfo.loading = true;
        const startTime = performance.now();

        try {
            // Load dependencies first
            await this.loadDependencies(chunkInfo.dependencies);

            // Load the actual chunk
            console.log(`Loading chunk: ${chunkName}`);
            const module = await import(chunkInfo.path);

            // Record performance metrics
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTimes.set(chunkName, loadTime);

            // Mark as loaded
            chunkInfo.loaded = true;
            chunkInfo.loading = false;
            this.loadedChunks.add(chunkName);

            console.log(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
            return module;

        } catch (error) {
            chunkInfo.loading = false;
            this.performanceMetrics.errors.push({
                chunk: chunkName,
                error: error.message,
                timestamp: Date.now()
            });
            
            console.error(`Failed to load chunk ${chunkName}:`, error);
            throw error;
        }
    }

    /**
     * Load chunk dependencies
     * @private
     */
    async loadDependencies(dependencies) {
        if (dependencies.length === 0) return;

        const dependencyPromises = dependencies.map(dep => this.loadChunk(dep));
        await Promise.all(dependencyPromises);
    }

    /**
     * Wait for a chunk that's currently loading
     * @private
     */
    async waitForChunk(chunkName) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const chunkInfo = this.chunkRegistry.get(chunkName);
                
                if (chunkInfo.loaded) {
                    clearInterval(checkInterval);
                    resolve(this.getLoadedChunk(chunkName));
                } else if (!chunkInfo.loading) {
                    clearInterval(checkInterval);
                    reject(new Error(`Chunk ${chunkName} failed to load`));
                }
            }, 10);
        });
    }

    /**
     * Get a loaded chunk from cache
     * @private
     */
    getLoadedChunk(chunkName) {
        // This would need to be implemented based on how modules are cached
        // For now, we'll re-import (which should be cached by the browser)
        const chunkInfo = this.chunkRegistry.get(chunkName);
        return import(chunkInfo.path);
    }

    /**
     * Preload chunks for better performance
     * @param {Array<string>} chunkNames - Array of chunk names to preload
     */
    async preloadChunks(chunkNames) {
        const preloadPromises = chunkNames
            .filter(name => !this.preloadedChunks.has(name))
            .map(async name => {
                try {
                    await this.loadChunk(name);
                    this.preloadedChunks.add(name);
                } catch (error) {
                    console.warn(`Failed to preload chunk ${name}:`, error);
                }
            });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Preload critical chunks during idle time
     */
    preloadCriticalChunks() {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                this.preloadChunks(Array.from(this.criticalChunks));
            });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                this.preloadChunks(Array.from(this.criticalChunks));
            }, 100);
        }
    }

    /**
     * Initialize chunk registry with common chunks
     */
    initializeCommonChunks() {
        // Register common chunks
        this.registerChunk('favorites', './components/favorites/favoritesindex.js', ['utils'], false);
        this.registerChunk('tablet-selector', './components/tablet/tabletSelector.js', ['utils'], false);
        this.registerChunk('ui-manager', './ui/ui-manager.js', ['utils'], true);
        this.registerChunk('form-manager', './ui/form-manager.js', ['utils'], true);
        this.registerChunk('display-manager', './core/display-manager.js', ['utils'], true);
        this.registerChunk('notification-manager', './core/notification-manager.js', [], true);
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const totalLoadTime = Array.from(this.performanceMetrics.loadTimes.values())
            .reduce((sum, time) => sum + time, 0);

        return {
            loadedChunks: this.loadedChunks.size,
            preloadedChunks: this.preloadedChunks.size,
            totalChunks: this.chunkRegistry.size,
            totalLoadTime: totalLoadTime.toFixed(2),
            averageLoadTime: (totalLoadTime / this.loadedChunks.size || 0).toFixed(2),
            errors: this.performanceMetrics.errors.length,
            loadTimes: Object.fromEntries(this.performanceMetrics.loadTimes),
            recentErrors: this.performanceMetrics.errors.slice(-5)
        };
    }

    /**
     * Clear performance metrics
     */
    clearMetrics() {
        this.performanceMetrics.loadTimes.clear();
        this.performanceMetrics.chunkSizes.clear();
        this.performanceMetrics.errors = [];
    }

    /**
     * Get chunk loading statistics
     */
    getStats() {
        return {
            registered: this.chunkRegistry.size,
            loaded: this.loadedChunks.size,
            preloaded: this.preloadedChunks.size,
            critical: this.criticalChunks.size,
            loadingProgress: (this.loadedChunks.size / this.chunkRegistry.size * 100).toFixed(1)
        };
    }
}

// Create singleton instance
export const bundleOptimizer = new BundleOptimizer();

// Initialize common chunks
bundleOptimizer.initializeCommonChunks();

// Export class for testing
export { BundleOptimizer };

// Global exports for debugging
if (typeof window !== 'undefined') {
    window.bundleOptimizer = bundleOptimizer;
} 