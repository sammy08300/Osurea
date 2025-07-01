/**
 * Legacy Compatibility Layer
 * Maintains backward compatibility with existing global functions
 * while transitioning to the new modular system
 */

import { Utils } from '../utils/index.js';
import { displayManager } from './display-manager.js';
import { notificationManager } from './notification-manager.js';
import { dependencyManager } from './dependency-manager.js';

/**
 * Register all legacy global functions for backward compatibility
 */
export function registerLegacyGlobals() {
    // Utils functions
    window.formatNumber = Utils.formatNumber;
    window.parseFloatSafe = Utils.parseFloatSafe;
    window.isValidNumber = Utils.isValidNumber;
    window.clamp = Utils.clamp;
    window.calculateRatio = Utils.calculateRatio;
    window.mmToPx = Utils.mmToPx;
    window.pxToMm = Utils.pxToMm;
    window.debounce = Utils.debounce;
    window.throttle = Utils.throttle;
    window.DECIMAL_PRECISION_POSITION = Utils.DECIMAL_PRECISION_POSITION;
    window.DECIMAL_PRECISION_DIMENSIONS = Utils.DECIMAL_PRECISION_DIMENSIONS;
    window.DECIMAL_PRECISION_RATIO = Utils.DECIMAL_PRECISION_RATIO;
    window.Utils = Utils;

    // Display functions - only create if they don't already exist
    if (typeof window.updateDisplay !== 'function') {
        window.updateDisplay = () => {
            if (displayManager.isInitialized) {
                displayManager.update();
            } else {
                console.warn('DisplayManager not initialized');
            }
        };
    }

    if (typeof window.updateDisplayWithoutRatio !== 'function') {
        window.updateDisplayWithoutRatio = () => {
            if (displayManager.isInitialized) {
                displayManager.updateWithoutRatio();
            } else {
                console.warn('DisplayManager not initialized');
            }
        };
    }

    // Notification functions
    window.Notifications = {
        init: () => notificationManager.init(),
        show: (message, type, duration) => notificationManager.show(message, type, duration),
        success: (message, duration) => notificationManager.success(message, duration),
        error: (message, duration) => notificationManager.error(message, duration),
        info: (message, duration) => notificationManager.info(message, duration),
        warning: (message, duration) => notificationManager.warning(message, duration)
    };

    // Constraint helpers (from constraintHelpers.js)
    window.constrainAreaOffset = Utils.Numbers.constrainAreaOffset;

    // Legacy functions registered
}

/**
 * Migrate existing global dependencies to the new system
 */
export function migrateLegacyDependencies() {
    // Register existing global objects as dependencies if they exist
    if (typeof StorageManager !== 'undefined') {
        dependencyManager.register('StorageManager', StorageManager, true);
    }

    if (typeof PreferencesManager !== 'undefined') {
        dependencyManager.register('PreferencesManager', PreferencesManager, true);
    }

    if (typeof FavoritesUI !== 'undefined') {
        dependencyManager.register('FavoritesUI', FavoritesUI, true);
    }

    if (typeof TabletSelector !== 'undefined') {
        dependencyManager.register('TabletSelector', TabletSelector, true);
    }

    if (typeof ContextMenu !== 'undefined') {
        dependencyManager.register('ContextMenu', ContextMenu, true);
    }

    // Dependencies migrated
}

/**
 * Check for potential conflicts and warn about deprecated usage
 */
export function checkLegacyConflicts() {
    // Désactiver les warnings en production pour éviter le spam de console
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.search.includes('debug=true');
    
    if (!isDevelopment) {
        return; // Pas de warnings en production
    }

    const potentialConflicts = [
        'updateDisplay',
        'updateDisplayWithoutRatio',
        'Notifications',
        'formatNumber',
        'parseFloatSafe',
        'debounce',
        'throttle'
    ];

    const conflicts = potentialConflicts.filter(name => 
        window.hasOwnProperty(name) && typeof window[name] !== 'undefined'
    );

    // Legacy functions detected silently
}

/**
 * Initialize the legacy compatibility layer
 */
export function initLegacyCompatibility() {
    try {
        // Check for conflicts first
        checkLegacyConflicts();
        
        // Register legacy globals
        registerLegacyGlobals();
        
        // Migrate existing dependencies
        migrateLegacyDependencies();
        
        // Legacy compatibility initialized
        return true;
    } catch (error) {
        console.error('Error initializing legacy compatibility layer:', error);
        return false;
    }
}

// Auto-initialize if this module is loaded
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLegacyCompatibility);
    } else {
        initLegacyCompatibility();
    }
} 
