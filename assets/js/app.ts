/**
 * Main application module - Refactored with centralized dependency management
 */

// Import core modules
import { dependencyManager } from './core/dependency-manager';
import { displayManager } from './core/display-manager';
import { notificationManager } from './core/notification-manager';
import { initLegacyCompatibility } from './core/legacy-compatibility';
import { Utils, DOMUtils, NumberUtils } from './utils/index'; // Assuming DOMUtils, NumberUtils are exported from utils/index

// Import performance optimization modules
import { LazyComponent } from './utils/lazy-component-loader';
import { bundleOptimizer } from './core/bundle-optimizer';
import { setupEnhancedLazyLoading } from './utils/lazyLoadImages';

// Import existing modules
import { FavoritesUI, FavoritesInit } from './components/favorites/favoritesindex'; // Assuming .ts
import TabletSelector from './components/tablet/tabletSelector'; // Assuming .ts
import { translateWithFallback } from './i18n-init'; // Assuming .ts
import { UIManager } from './ui/ui-manager'; // Assuming .ts
import { FormManager } from './ui/form-manager'; // Assuming .ts
import { RecapManager } from './ui/recap-manager'; // Assuming .ts
import { FavoriteObject } from './components/favorites/types'; // Import FavoriteObject type

// Define types for global objects if they are expected to be on the window or global scope
// These are illustrative; actual types depend on how these managers are structured.
declare global {
    interface Window {
        StorageManager?: { // Assuming StorageManager might exist on window
            forceReset: () => FavoriteObject[];
            diagnoseFavorites: () => void;
            clearCache: () => void;
            getFavorites: () => FavoriteObject[];
        };
        PreferencesManager?: {
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
    tabletData: TabletData[];
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
        if (window.StorageManager) {
            if (typeof window.StorageManager.forceReset === 'function') {
                window.StorageManager.forceReset();
            } else if (typeof window.StorageManager.diagnoseFavorites === 'function') {
                window.StorageManager.diagnoseFavorites();
            }
        }
        if (window.PreferencesManager?._cleanupFavoriteReferences) {
            window.PreferencesManager._cleanupFavoriteReferences();
        }
        if (window.StorageManager?.diagnoseFavorites) {
            setTimeout(() => window.StorageManager!.diagnoseFavorites(), 500);
        }
    }

    async init(): Promise<void> {
        try {
            notificationManager.init();
            initLegacyCompatibility(); // Assuming this handles its own globals or is self-contained
            
            dependencyManager.register('NotificationManager', notificationManager, true);
            dependencyManager.register('DisplayManager', displayManager, true);
            dependencyManager.register('Utils', Utils, true);
            
            this._initializeStorageDiagnostics();
            
            if (typeof FavoritesUI !== 'undefined' && !FavoritesUI.isReady()) {
                await FavoritesUI.init(); // Assuming init can be async or returns a Promise
            }
            
            window.PreferencesManager?.init();
            
            await this.loadTabletData();
            
            FormManager.init(this);
            UIManager.init(this);
            RecapManager.init(); // Assuming RecapManager takes no args or is self-contained
            
            dependencyManager.register('FormManager', FormManager, true);
            dependencyManager.register('UIManager', UIManager, true);
            dependencyManager.register('RecapManager', RecapManager, true);
            
            displayManager.init({
                FormManager: FormManager,
                PreferencesManager: window.PreferencesManager || null
            });
            
            this.debouncedUpdateRatio = DOMUtils.debounce(() => { // Use DOMUtils from imported Utils
                const formManager = dependencyManager.get('FormManager') as typeof FormManager;
                const elements = formManager.getFormElements();
                if(!elements.areaWidth || !elements.areaHeight || !elements.customRatio) return;

                const width = NumberUtils.parseFloatSafe(elements.areaWidth.value); // Use NumberUtils
                const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
                
                if (height > 0 && width > 0) {
                    const calculatedRatio = NumberUtils.calculateRatioMemoized(width, height); // Use NumberUtils
                    if (!elements.customRatio.dataset.editing && !elements.customRatio.matches(':focus')) {
                        elements.customRatio.value = NumberUtils.formatNumber(calculatedRatio, 3); // Use NumberUtils
                        this.currentRatio = calculatedRatio;
                    }
                }
            }, 300);
            
            this.isInitialized = true;
            this._initializePerformanceOptimizations();
            displayManager.update();
            
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
                if (window.StorageManager) {
                    if (typeof window.StorageManager.clearCache === 'function') {
                        window.StorageManager.clearCache();
                    }
                    if (typeof window.StorageManager.getFavorites === 'function') {
                        window.StorageManager.getFavorites();
                    }
                }
                if (typeof FavoritesInit !== 'undefined') { // FavoritesInit might not be global
                    FavoritesInit.cachedFavorites = null;
                    if (typeof FavoritesInit.updateFavoriteCache === 'function') {
                        FavoritesInit.updateFavoriteCache(true);
                    }
                }
                if (window.PreferencesManager) {
                    if (typeof window.PreferencesManager._cleanupFavoriteReferences === 'function') {
                        window.PreferencesManager._cleanupFavoriteReferences();
                    }
                    if (typeof window.PreferencesManager.saveCurrentState === 'function') {
                        window.PreferencesManager.saveCurrentState();
                    }
                }
            }
        });
    }
}
// Define OriginalValues type for appState, can be moved to a types file
interface OriginalValues extends Partial<FavoriteObject> {}


export const appState = new AppState();

document.addEventListener('DOMContentLoaded', async () => {
    try {
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
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Error loading application. Please reload the page.');
    }
});
