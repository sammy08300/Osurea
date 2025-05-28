/**
 * Legacy Compatibility Layer
 * Maintains backward compatibility with existing global functions
 * while transitioning to the new modular system
 */

import { Utils as ImportedUtils } from '../utils/index.js';
import { displayManager } from './display-manager.js'; // Assuming DisplayManager has isInitialized property
import { notificationManager } from './notification-manager.js';
import { dependencyManager } from './dependency-manager.js';

// Assume Utils is an external library for now, or has a .d.ts file elsewhere.
const Utils: any = ImportedUtils;

// Declare expected global variables to inform TypeScript they exist
declare var StorageManager: any;
declare var PreferencesManager: any;
declare var FavoritesUI: any;
declare var TabletSelector: any;
declare var ContextMenu: any;


/**
 * Register all legacy global functions for backward compatibility
 */
export function registerLegacyGlobals(): void {
    const win = window as any;

    // Utils functions
    if (Utils.formatNumber) win.formatNumber = Utils.formatNumber;
    if (Utils.parseFloatSafe) win.parseFloatSafe = Utils.parseFloatSafe;
    if (Utils.isValidNumber) win.isValidNumber = Utils.isValidNumber;
    if (Utils.clamp) win.clamp = Utils.clamp;
    if (Utils.calculateRatio) win.calculateRatio = Utils.calculateRatio;
    if (Utils.mmToPx) win.mmToPx = Utils.mmToPx;
    if (Utils.pxToMm) win.pxToMm = Utils.pxToMm;
    if (Utils.debounce) win.debounce = Utils.debounce;
    if (Utils.throttle) win.throttle = Utils.throttle;
    if (Utils.DECIMAL_PRECISION_POSITION) win.DECIMAL_PRECISION_POSITION = Utils.DECIMAL_PRECISION_POSITION;
    win.Utils = Utils;

    // Display functions - only create if they don't already exist
    if (typeof win.updateDisplay !== 'function') {
        win.updateDisplay = () => {
            // Assuming displayManager has an isInitialized property
            if ((displayManager as any).isInitialized) {
                displayManager.update();
            } else {
                console.warn('DisplayManager not initialized');
            }
        };
    }

    if (typeof win.updateDisplayWithoutRatio !== 'function') {
        win.updateDisplayWithoutRatio = () => {
            // Assuming displayManager has an isInitialized property
            if ((displayManager as any).isInitialized) {
                displayManager.updateWithoutRatio();
            } else {
                console.warn('DisplayManager not initialized');
            }
        };
    }

    // Notification functions
    win.Notifications = {
        init: () => notificationManager.init(),
        show: (message: string, type?: string, duration?: number) => notificationManager.show(message, type, duration),
        success: (message: string, duration?: number) => notificationManager.success(message, duration),
        error: (message: string, duration?: number) => notificationManager.error(message, duration),
        info: (message: string, duration?: number) => notificationManager.info(message, duration),
        warning: (message: string, duration?: number) => notificationManager.warning(message, duration)
    };

    // Constraint helpers (from constraintHelpers.js)
    if (Utils.Numbers && Utils.Numbers.constrainAreaOffset) {
        win.constrainAreaOffset = Utils.Numbers.constrainAreaOffset;
    }

    // Legacy functions registered
    console.log("Legacy global functions registered.");
}

/**
 * Migrate existing global dependencies to the new system
 */
export function migrateLegacyDependencies(): void {
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

    // It's possible ContextMenu is a standard DOM property, so check carefully.
    // If it's a custom global, the declare var above is fine.
    if (typeof ContextMenu !== 'undefined') { 
        dependencyManager.register('ContextMenu', ContextMenu, true);
    }

    // Dependencies migrated
    console.log("Legacy dependencies migrated.");
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

    const potentialConflicts: string[] = [
        'updateDisplay',
        'updateDisplayWithoutRatio',
        'Notifications',
        'formatNumber',
        'parseFloatSafe',
        'debounce',
        'throttle'
    ];

    const conflicts = potentialConflicts.filter((name: string) => 
        (window as any).hasOwnProperty(name) && typeof (window as any)[name] !== 'undefined'
    );

    if (conflicts.length > 0) {
        console.warn("Potential legacy conflicts detected:", conflicts);
    }
    // Legacy functions detected silently
    console.log("Legacy conflict check complete.");
}

/**
 * Initialize the legacy compatibility layer
 */
export function initLegacyCompatibility(): boolean {
    try {
        // Check for conflicts first
        checkLegacyConflicts();
        
        // Register legacy globals
        registerLegacyGlobals();
        
        // Migrate existing dependencies
        migrateLegacyDependencies();
        
        console.log("Legacy compatibility layer initialized successfully.");
        return true;
    } catch (error: any) {
        console.error('Error initializing legacy compatibility layer:', error.message);
        return false;
    }
}

// Auto-initialize if this module is loaded
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLegacyCompatibility);
    } else {
        // DOM is already loaded
        initLegacyCompatibility();
    }
}
