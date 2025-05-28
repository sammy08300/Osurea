/**
 * Bundle Optimizer - Code splitting and performance optimization
 * Manages dynamic imports and bundle optimization strategies
 */

interface ChunkInfo {
    path: string;
    dependencies: string[];
    critical: boolean;
    loaded: boolean;
    loading: boolean;
    module?: any; // Optional: to store the loaded module itself
}

interface ErrorEntry {
    chunk: string;
    error: string;
    timestamp: number;
}

interface PerformanceMetrics {
    loadTimes: Map<string, number>;
    chunkSizes: Map<string, number>; // Assuming chunk sizes might be tracked later
    errors: ErrorEntry[];
}

class BundleOptimizer {
    private loadedChunks: Set<string>;
    private preloadedChunks: Set<string>;
    private criticalChunks: Set<string>;
    private chunkRegistry: Map<string, ChunkInfo>;
    private performanceMetrics: PerformanceMetrics;

    constructor() {
        this.loadedChunks = new Set<string>();
        this.preloadedChunks = new Set<string>();
        this.criticalChunks = new Set<string>(['core', 'utils', 'ui']);
        this.chunkRegistry = new Map<string, ChunkInfo>();
        this.performanceMetrics = {
            loadTimes: new Map<string, number>(),
            chunkSizes: new Map<string, number>(),
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
    registerChunk(chunkName: string, chunkPath: string, dependencies: string[] = [], critical: boolean = false): void {
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
    async loadChunk(chunkName: string): Promise<any> {
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
            if (chunkInfo.dependencies) {
                await this.loadDependencies(chunkInfo.dependencies);
            }

            // Load the actual chunk
            console.log(`Loading chunk: ${chunkName}`);
            const module = await import(chunkInfo.path);
            chunkInfo.module = module; // Store the loaded module if needed

            // Record performance metrics
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTimes.set(chunkName, loadTime);

            // Mark as loaded
            chunkInfo.loaded = true;
            chunkInfo.loading = false;
            this.loadedChunks.add(chunkName);

            console.log(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
            return module;

        } catch (error: any) { // Use 'any' or 'Error' for caught errors
            chunkInfo.loading = false;
            this.performanceMetrics.errors.push({
                chunk: chunkName,
                error: error.message, // Access message property safely
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
    private async loadDependencies(dependencies: string[]): Promise<void> {
        if (!dependencies || dependencies.length === 0) return;

        const dependencyPromises = dependencies.map((dep: string) => this.loadChunk(dep));
        await Promise.all(dependencyPromises);
    }

    /**
     * Wait for a chunk that's currently loading
     * @private
     */
    private async waitForChunk(chunkName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const chunkInfo = this.chunkRegistry.get(chunkName);
                
                if (chunkInfo && chunkInfo.loaded) {
                    clearInterval(checkInterval);
                    resolve(this.getLoadedChunk(chunkName));
                } else if (chunkInfo && !chunkInfo.loading) { // Check if chunkInfo exists
                    clearInterval(checkInterval);
                    reject(new Error(`Chunk ${chunkName} failed to load or was not found after waiting.`));
                } else if (!chunkInfo) { // If chunkInfo becomes undefined
                    clearInterval(checkInterval);
                    reject(new Error(`Chunk ${chunkName} info disappeared while waiting.`));
                }
            }, 10);
        });
    }

    /**
     * Get a loaded chunk from cache
     * @private
     */
    private getLoadedChunk(chunkName: string): Promise<any> {
        const chunkInfo = this.chunkRegistry.get(chunkName);
        if (chunkInfo && chunkInfo.module) {
            return Promise.resolve(chunkInfo.module);
        } else if (chunkInfo) {
            // Fallback to re-import if module isn't cached in chunkInfo
            return import(chunkInfo.path);
        }
        return Promise.reject(new Error(`Chunk ${chunkName} not found in registry for getLoadedChunk.`));
    }

    /**
     * Preload chunks for better performance
     * @param {Array<string>} chunkNames - Array of chunk names to preload
     */
    async preloadChunks(chunkNames: string[]): Promise<void> {
        const preloadPromises = chunkNames
            .filter((name: string) => !this.preloadedChunks.has(name))
            .map(async (name: string) => {
                try {
                    await this.loadChunk(name);
                    this.preloadedChunks.add(name);
                } catch (error) { // error is 'unknown' by default, can type as 'any' or 'Error'
                    console.warn(`Failed to preload chunk ${name}:`, error instanceof Error ? error.message : error);
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
    getPerformanceMetrics(): object {
        const totalLoadTime = Array.from(this.performanceMetrics.loadTimes.values())
            .reduce((sum: number, time: number) => sum + time, 0);

        return {
            loadedChunks: this.loadedChunks.size,
            preloadedChunks: this.preloadedChunks.size,
            totalChunks: this.chunkRegistry.size,
            totalLoadTime: totalLoadTime.toFixed(2),
            averageLoadTime: (this.loadedChunks.size > 0 ? (totalLoadTime / this.loadedChunks.size) : 0).toFixed(2),
            errors: this.performanceMetrics.errors.length,
            loadTimes: Object.fromEntries(this.performanceMetrics.loadTimes),
            recentErrors: this.performanceMetrics.errors.slice(-5)
        };
    }

    /**
     * Clear performance metrics
     */
    clearMetrics(): void {
        this.performanceMetrics.loadTimes.clear();
        this.performanceMetrics.chunkSizes.clear();
        this.performanceMetrics.errors = [];
    }

    /**
     * Get chunk loading statistics
     */
    getStats(): object {
        const totalRegistered = this.chunkRegistry.size;
        return {
            registered: totalRegistered,
            loaded: this.loadedChunks.size,
            preloaded: this.preloadedChunks.size,
            critical: this.criticalChunks.size,
            loadingProgress: (totalRegistered > 0 ? (this.loadedChunks.size / totalRegistered * 100) : 0).toFixed(1)
        };
    }
}

// Create singleton instance
export const bundleOptimizer = new BundleOptimizer();

// Initialize common chunks
bundleOptimizer.initializeCommonChunks();

// Export class for testing
// export { BundleOptimizer }; // Already exported by class BundleOptimizer {}

// Global exports for debugging
if (typeof window !== 'undefined') {
    (window as any).bundleOptimizer = bundleOptimizer;
}