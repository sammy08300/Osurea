/**
 * Dependency Manager - Centralized dependency injection system
 * Replaces global window dependencies with a proper DI container
 */

interface DependencyEntry {
    factory: Function | object;
    singleton: boolean;
    instance?: any; // For singleton instances
}

class DependencyManager {
    private dependencies: Map<string, DependencyEntry>;
    private singletons: Map<string, any>; // Stores actual singleton instances

    constructor() {
        this.dependencies = new Map<string, DependencyEntry>();
        this.singletons = new Map<string, any>();
    }

    /**
     * Register a dependency
     * @param {string} name - Dependency name
     * @param {Function|Object} factory - Factory function or object
     * @param {boolean} singleton - Whether to create as singleton
     */
    register(name: string, factory: Function | object, singleton: boolean = false): void {
        this.dependencies.set(name, { factory, singleton });
    }

    /**
     * Get a dependency instance
     * @param {string} name - Dependency name
     * @returns {*} The dependency instance
     */
    get(name: string): any {
        const dependency = this.dependencies.get(name);
        if (!dependency) {
            throw new Error(`Dependency '${name}' not found`);
        }

        if (dependency.singleton) {
            if (!this.singletons.has(name)) {
                const instance = typeof dependency.factory === 'function' 
                    ? (dependency.factory as Function)()
                    : dependency.factory;
                this.singletons.set(name, instance);
            }
            return this.singletons.get(name);
        }

        // For non-singletons, create a new instance each time if factory is a function
        return typeof dependency.factory === 'function' 
            ? (dependency.factory as Function)()
            : dependency.factory;
    }

    /**
     * Check if a dependency exists
     * @param {string} name - Dependency name
     * @returns {boolean}
     */
    has(name: string): boolean {
        return this.dependencies.has(name);
    }

    /**
     * Inject dependencies into a function or class
     * @param {Function} target - Target function or class
     * @param {string[]} deps - Array of dependency names
     * @returns {Function} Function with injected dependencies
     */
    inject(target: Function, deps: string[]): Function {
        return (...args: any[]) => {
            const injectedDeps = deps.map((dep: string) => this.get(dep));
            return target(...injectedDeps, ...args);
        };
    }

    /**
     * Clear all dependencies (useful for testing)
     */
    clear(): void {
        this.dependencies.clear();
        this.singletons.clear();
    }
}

// Create global instance
export const dependencyManager = new DependencyManager();

// Export class for testing
// export { DependencyManager }; // Class is already exported
