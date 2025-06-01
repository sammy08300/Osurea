/**
 * Osurea test configuration
 */

export const TEST_CONFIG = {
    // Timeouts
    timeouts: {
        default: 5000,      // 5 seconds
        translation: 2000,  // 2 seconds for translations
        storage: 3000       // 3 seconds for storage
    },
    
    // Verbosity levels
    verbosity: {
        SILENT: 0,    // No logs
        ERROR: 1,     // Errors only
        WARN: 2,      // Errors + warnings
        INFO: 3,      // Errors + warnings + info
        DEBUG: 4      // Everything
    },
    
    // Default configuration
    default: {
        verbosity: 3,           // INFO by default
        stopOnFirstError: false, // Continue even if a test fails
        showStackTrace: true,   // Show error stack traces
        colorOutput: true       // Use colors in console
    },
    
    // Tests to skip (if needed)
    skipTests: {
        // Example: 'storage.migration': true
    },
    
    // Test environments
    environments: {
        development: {
            verbosity: 4,
            showStackTrace: true
        },
        production: {
            verbosity: 2,
            showStackTrace: false
        }
    }
};

/**
 * Gets the configuration for the current environment
 */
export function getTestConfig() {
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.protocol === 'file:';
    
    const envConfig = isDev ? 
        TEST_CONFIG.environments.development : 
        TEST_CONFIG.environments.production;
    
    return {
        ...TEST_CONFIG.default,
        ...envConfig
    };
}

/**
 * Configured logger for tests
 */
export class TestLogger {
    constructor(config = null) {
        this.config = config || getTestConfig();
    }
    
    log(level, message, ...args) {
        if (level <= this.config.verbosity) {
            const prefix = this.getPrefix(level);
            console.log(prefix + message, ...args);
        }
    }
    
    debug(message, ...args) {
        this.log(TEST_CONFIG.verbosity.DEBUG, message, ...args);
    }
    
    info(message, ...args) {
        this.log(TEST_CONFIG.verbosity.INFO, message, ...args);
    }
    
    warn(message, ...args) {
        this.log(TEST_CONFIG.verbosity.WARN, message, ...args);
    }
    
    error(message, ...args) {
        this.log(TEST_CONFIG.verbosity.ERROR, message, ...args);
    }
    
    getPrefix(level) {
        if (!this.config.colorOutput) return '';
        
        switch (level) {
            case TEST_CONFIG.verbosity.ERROR: return '❌ ';
            case TEST_CONFIG.verbosity.WARN: return '⚠️ ';
            case TEST_CONFIG.verbosity.INFO: return 'ℹ️ ';
            case TEST_CONFIG.verbosity.DEBUG: return '🔍 ';
            default: return '';
        }
    }
}

/**
 * Test utilities
 */
export const TestUtils = {
    /**
     * Waits for a specified delay
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Waits until a condition is true
     */
    async waitFor(condition, timeout = TEST_CONFIG.timeouts.default) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await this.wait(100);
        }
        throw new Error(`Timeout: condition not met after ${timeout}ms`);
    },
    
    /**
     * Checks if a DOM element exists
     */
    elementExists(selector) {
        return document.querySelector(selector) !== null;
    },
    
    /**
     * Simulates a DOM event
     */
    triggerEvent(element, eventType, options = {}) {
        const event = new Event(eventType, options);
        element.dispatchEvent(event);
    },
    
    /**
     * Captures console errors
     */
    captureConsoleErrors() {
        const errors = [];
        const originalError = console.error;
        
        console.error = (...args) => {
            errors.push(args);
            originalError.apply(console, args);
        };
        
        return {
            getErrors: () => errors,
            restore: () => {
                console.error = originalError;
            }
        };
    }
};

export default TEST_CONFIG; 
