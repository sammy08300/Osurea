/**
 * Main application module - Refactored with centralized dependency management
 */

// Import core modules
import { dependencyManager } from './core/dependency-manager.js';
import { displayManager } from './core/display-manager.js';
import { notificationManager } from './core/notification-manager.js';
import { initLegacyCompatibility } from './core/legacy-compatibility.js';
import { Utils, DOM, Numbers, Performance } from './utils/index.js'; // Ensure Utils is imported
import { StorageManager } from './utils/storage.js';
import { PreferencesManager } from './utils/preferences.js';

// Import performance optimization modules
import { LazyComponent } from './utils/lazy-component-loader.js';
import { bundleOptimizer } from './core/bundle-optimizer.js';
import { setupEnhancedLazyLoading } from './utils/lazyLoadImages.js';

// Import existing modules
import { FavoritesUI, FavoritesInit } from './components/favorites/favoritesindex.js';
import TabletSelector, { Tablet } from './components/tablet/tabletSelector.js';
import { translateWithFallback } from './i18n-init.js'; // Keep this named import
import initializeI18n from './i18n-init.js'; // Add default import
import { UIManager } from './ui/ui-manager.js';
import { FormManager } from './ui/form-manager.js';
import { RecapManager } from './ui/recap-manager.js';
import { FavoriteObject } from './components/favorites/types.js';
// import { AreaDrawer } from './components/area/area-drawer'; // Commented out as file not found

// Define types for global objects if they are expected to be on the window or global scope
// These are illustrative; actual types depend on how these managers are structured.
declare global {
    interface Window {
        StorageManager_unused?: { 
            diagnoseFavorites: () => void;
            clearCache: () => void;
            getFavorites: () => FavoriteObject[];
        };
        PreferencesManager_unused?: {
            init: () => void;
            _cleanupFavoriteReferences: () => void;
            saveCurrentState: () => void;
        };
        // Add other global utilities or managers if necessary
    }
}


interface TabletData {
    // Define structure based on tablets.json
    [key: string]: any; // Replace 'any' with a more specific type if known
}

class AppState {
    tabletData: Tablet[];
    editingFavoriteId: string | number | null;
    originalValues: Partial<FavoriteObject> | null; // Use Partial from imported FavoriteObject
    currentRatio: number;
    debouncedUpdateRatio: (() => void) | null;
    isInitialized: boolean;

    constructor() {
        this.tabletData = [];
        this.editingFavoriteId = null;
        this.originalValues = null;
        this.currentRatio = 1.0;
        this.debouncedUpdateRatio = null;
        this.isInitialized = false;
    }

    async loadTabletData(): Promise<void> {
        try {
            const response = await fetch('data/tablets.json');
            if (!response.ok) throw new Error('Failed to load tablet data');
            this.tabletData = await response.json();
            console.log('Fetched tablet data:', this.tabletData);
            TabletSelector.init(this.tabletData); // TabletSelector should have its types defined
        } catch (error) {
            console.error('Error loading tablet data:', error);
            notificationManager.error(
                translateWithFallback('notifications.tabletDataError', 'Error loading tablet data')
            );
        }
    }
    
    startEditFavorite(id: string | number): void {
        this.editingFavoriteId = id;
        if (dependencyManager.has('UIManager')) {
            const uiManager = dependencyManager.get('UIManager') as typeof UIManager; // Cast if necessary
            uiManager.updateEditModeUI(true);
        }
    }
    
    cancelEditMode(): void {
        if (this.editingFavoriteId && this.originalValues) {
            if (dependencyManager.has('FormManager')) {
                const formManager = dependencyManager.get('FormManager') as typeof FormManager;
                formManager.restoreOriginalValues(this.originalValues as OriginalValues); // Cast if originalValues structure is more specific
            }
            this.editingFavoriteId = null;
            this.originalValues = null;
            if (dependencyManager.has('UIManager')) {
                const uiManager = dependencyManager.get('UIManager') as typeof UIManager;
                uiManager.updateEditModeUI(false);
            }
            notificationManager.info(
                translateWithFallback('notifications.editModeCanceled', 'Changes cancelled')
            );
        }
    }

    private _initializeStorageDiagnostics(): void {
        if (StorageManager) {
            if (typeof StorageManager.diagnoseFavorites === 'function') {
                StorageManager.diagnoseFavorites(); // Direct call if it exists
            }
        }
        if (PreferencesManager?._cleanupFavoriteReferences) {
            PreferencesManager._cleanupFavoriteReferences();
        }
        // The problematic line was here, let's adjust the logic slightly
        // If StorageManager and diagnoseFavorites exist, call it after a delay.
        if (StorageManager && typeof StorageManager.diagnoseFavorites === 'function') {
            setTimeout(() => StorageManager!.diagnoseFavorites!(), 500);
        }
    }

    async init(): Promise<void> {
        try {
            console.log('Initializing application...');
            notificationManager.init();
            console.log('Notification manager initialized');
            
            initLegacyCompatibility(); // Assuming this handles its own globals or is self-contained
            console.log('Legacy compatibility initialized');
            
            dependencyManager.register('NotificationManager', notificationManager, true);
            dependencyManager.register('DisplayManager', displayManager, true);
            dependencyManager.register('Utils', Utils, true); // Ensure Utils is registered
            console.log('Core dependencies registered');
            
            this._initializeStorageDiagnostics();
            console.log('Storage diagnostics initialized');
            
            if (typeof FavoritesUI !== 'undefined' && !FavoritesUI.isReady()) {
                await FavoritesUI.init(); // Assuming init can be async or returns a Promise
                console.log('FavoritesUI initialized');
            }
            
            PreferencesManager?.init();
            console.log('Preferences manager initialized');
            
            await this.loadTabletData();
            console.log('Tablet data loaded');
            
            FormManager.init(this as any); // Cast to any to resolve type mismatch temporarily
            console.log('Form manager initialized');
            
            UIManager.init(this as any); // Cast to any to resolve type mismatch temporarily
            console.log('UI manager initialized');
            
            RecapManager.init(); // Assuming RecapManager takes no args or is self-contained
            console.log('Recap manager initialized');
            
            dependencyManager.register('FormManager', FormManager, true);
            dependencyManager.register('UIManager', UIManager, true);
            dependencyManager.register('RecapManager', RecapManager, true);
            console.log('UI dependencies registered');
            
            displayManager.init({
                FormManager: FormManager,
                PreferencesManager: PreferencesManager || null
            });
            console.log('Display manager initialized');
            
            this.debouncedUpdateRatio = Utils.DOM.debounce(() => {
                const formManager = dependencyManager.get('FormManager') as typeof FormManager;
                const elements = formManager.getFormElements();
                if(!elements.areaWidth || !elements.areaHeight || !elements.customRatio) return;

                const width = Utils.Numbers.parseFloatSafe(elements.areaWidth.value);
                const height = Utils.Numbers.parseFloatSafe(elements.areaHeight.value);
                
                if (height > 0 && width > 0) {
                    const calculatedRatio = Utils.Numbers.calculateRatioMemoized ? Utils.Numbers.calculateRatioMemoized(width, height) : width / height;
                    if (!elements.customRatio.dataset.editing && !elements.customRatio.matches(':focus')) {
                        elements.customRatio.value = Utils.Numbers.formatNumber(calculatedRatio, 3);
                        this.currentRatio = calculatedRatio;
                    }
                }
            }, 250);
            console.log('Debounced ratio update initialized');
            
            this.isInitialized = true;
            this._initializePerformanceOptimizations();
            displayManager.update();
            console.log('Application initialization completed successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            notificationManager.error('Error initializing application');
        }
    }

    private _initializePerformanceOptimizations(): void {
        try {
            setupEnhancedLazyLoading();
            bundleOptimizer.preloadCriticalChunks();
            dependencyManager.register('LazyComponent', LazyComponent, true);
            dependencyManager.register('BundleOptimizer', bundleOptimizer, true);
            console.log('Performance optimizations initialized');
        } catch (error) {
            console.warn('Failed to initialize some performance optimizations:', error);
        }
    }

    private _setupRefreshHandlers(): void {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                if (StorageManager) {
                    if (typeof StorageManager.clearCache === 'function') {
                        StorageManager.clearCache();
                    }
                    if (typeof StorageManager.getFavorites === 'function') {
                        StorageManager.getFavorites();
                    }
                }
                if (typeof FavoritesInit !== 'undefined') { // FavoritesInit might not be global
                    FavoritesInit.cachedFavorites = null;
                    if (typeof FavoritesInit.updateFavoriteCache === 'function') {
                        FavoritesInit.updateFavoriteCache(true);
                    }
                }
                if (PreferencesManager) {
                    if (typeof PreferencesManager._cleanupFavoriteReferences === 'function') {
                        PreferencesManager._cleanupFavoriteReferences();
                    }
                    if (typeof PreferencesManager.saveCurrentState === 'function') {
                        PreferencesManager.saveCurrentState();
                    }
                }
            }
        });
    }
}
// Define OriginalValues type for appState, can be moved to a types file
interface OriginalValues extends Partial<FavoriteObject> {
    presetInfo?: string | null | undefined; // Explicitly allow null here
}


export const appState = new AppState();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM content loaded, initializing application...');
        await appState.init();
        (appState as any)._setupRefreshHandlers(); // Access private method for setup
        
        document.addEventListener('contextmenu', (e: MouseEvent) => {
            const rectangle = document.getElementById('rectangle');
            if (rectangle && e.target instanceof Node && (e.target === rectangle || rectangle.contains(e.target))) {
                return true;
            }
            e.preventDefault();
            return false;
        });
        console.log('Application fully initialized and event handlers setup');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Error loading application. Please reload the page.');
    }
});
