/**
 * Dependency Manager - Centralized dependency injection system
 * Replaces global window dependencies with a proper DI container
 */

class DependencyManager {
    constructor() {
        this.dependencies = new Map();
        this.singletons = new Map();
    }

    /**
     * Register a dependency
     * @param {string} name - Dependency name
     * @param {Function|Object} factory - Factory function or object
     * @param {boolean} singleton - Whether to create as singleton
     */
    register(name, factory, singleton = false) {
        this.dependencies.set(name, { factory, singleton });
    }

    /**
     * Get a dependency instance
     * @param {string} name - Dependency name
     * @returns {*} The dependency instance
     */
    get(name) {
        const dependency = this.dependencies.get(name);
        if (!dependency) {
            throw new Error(`Dependency '${name}' not found`);
        }

        if (dependency.singleton) {
            if (!this.singletons.has(name)) {
                const instance = typeof dependency.factory === 'function' 
                    ? dependency.factory() 
                    : dependency.factory;
                this.singletons.set(name, instance);
            }
            return this.singletons.get(name);
        }

        return typeof dependency.factory === 'function' 
            ? dependency.factory() 
            : dependency.factory;
    }

    /**
     * Check if a dependency exists
     * @param {string} name - Dependency name
     * @returns {boolean}
     */
    has(name) {
        return this.dependencies.has(name);
    }

    /**
     * Inject dependencies into a function or class
     * @param {Function} target - Target function or class
     * @param {string[]} deps - Array of dependency names
     * @returns {Function} Function with injected dependencies
     */
    inject(target, deps) {
        return (...args) => {
            const injectedDeps = deps.map(dep => this.get(dep));
            return target(...injectedDeps, ...args);
        };
    }

    /**
     * Clear all dependencies (useful for testing)
     */
    clear() {
        this.dependencies.clear();
        this.singletons.clear();
    }
}

// Create global instance
export const dependencyManager = new DependencyManager();

// Export class for testing
export { DependencyManager }; 