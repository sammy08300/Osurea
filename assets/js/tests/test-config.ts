/**
 * Osurea test configuration
 */

interface TestConfigOptions {
    verbosity: number;
    stopOnFirstError: boolean;
    showStackTrace: boolean;
    colorOutput: boolean;
}

interface TestEnvironmentConfig {
    verbosity: number;
    showStackTrace: boolean;
}

interface TestConfig {
    timeouts: {
        default: number;
        translation: number;
        storage: number;
    };
    verbosity: {
        SILENT: 0;
        ERROR: 1;
        WARN: 2;
        INFO: 3;
        DEBUG: 4;
        [key: string]: number; // Index signature for string access
    };
    default: TestConfigOptions;
    skipTests: {
        [key: string]: boolean;
    };
    environments: {
        development: TestEnvironmentConfig;
        production: TestEnvironmentConfig;
    };
}

export const TEST_CONFIG: TestConfig = {
    timeouts: {
        default: 5000,
        translation: 2000,
        storage: 3000
    },
    verbosity: {
        SILENT: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4
    },
    default: {
        verbosity: 3,
        stopOnFirstError: false,
        showStackTrace: true,
        colorOutput: true
    },
    skipTests: {},
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
export function getTestConfig(): TestConfigOptions {
    const isDev = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:'
    );
    
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
    private config: TestConfigOptions;

    constructor(config: TestConfigOptions | null = null) {
        this.config = config || getTestConfig();
    }
    
    log(level: number, message: string, ...args: any[]): void {
        if (level <= this.config.verbosity) {
            const prefix = this.getPrefix(level);
            console.log(prefix + message, ...args);
        }
    }
    
    debug(message: string, ...args: any[]): void {
        this.log(TEST_CONFIG.verbosity.DEBUG, message, ...args);
    }
    
    info(message: string, ...args: any[]): void {
        this.log(TEST_CONFIG.verbosity.INFO, message, ...args);
    }
    
    warn(message: string, ...args: any[]): void {
        this.log(TEST_CONFIG.verbosity.WARN, message, ...args);
    }
    
    error(message: string, ...args: any[]): void {
        this.log(TEST_CONFIG.verbosity.ERROR, message, ...args);
    }
    
    getPrefix(level: number): string {
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

interface ConsoleErrorCapture {
    getErrors: () => any[][];
    restore: () => void;
}

/**
 * Test utilities
 */
export const TestUtils = {
    wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    async waitFor(condition: () => boolean | Promise<boolean>, timeout: number = TEST_CONFIG.timeouts.default): Promise<boolean> {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await this.wait(100);
        }
        throw new Error(`Timeout: condition not met after ${timeout}ms`);
    },
    
    elementExists(selector: string): boolean {
        return document.querySelector(selector) !== null;
    },
    
    triggerEvent(element: Element, eventType: string, options: EventInit = {}): void {
        const event = new Event(eventType, options);
        element.dispatchEvent(event);
    },
    
    captureConsoleErrors(): ConsoleErrorCapture {
        const errors: any[][] = [];
        const originalError = console.error;
        
        console.error = (...args: any[]): void => {
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
