/**
 * Main application module - Refactored with centralized dependency management
 */

// Import core modules
import { dependencyManager } from './core/dependency-manager.js';
import { displayManager, registerLegacyGlobals as registerDisplayGlobals } from './core/display-manager.js';
import { notificationManager, registerLegacyGlobals as registerNotificationGlobals } from './core/notification-manager.js';
import { initLegacyCompatibility } from './core/legacy-compatibility.js';
import { Utils } from './utils/index.js';

// Import performance optimization modules
import { LazyComponent } from './utils/lazy-component-loader.js';
import { bundleOptimizer } from './core/bundle-optimizer.js';
import { setupEnhancedLazyLoading } from './utils/lazyLoadImages.js';
import { PerformanceUtils } from './utils/performance-utils.js';
import { assetLoader } from './utils/asset-loader.js';
import { cacheManager } from './utils/cache-manager.js';

// Import existing modules
import { FavoritesUI } from './components/favorites/favoritesindex.js';
import TabletSelector from './components/tablet/tabletSelector.js';
import { translateWithFallback } from './i18n-init.js';
import { UIManager } from './ui/ui-manager.js';
import { FormManager } from './ui/form-manager.js';
import { RecapManager } from './ui/recap-manager.js';

/**
 * Application state manager - Refactored with dependency injection
 */
class AppState {
    constructor() {
        this.tabletData = [];
        this.editingFavoriteId = null;
        this.originalValues = null;
        this.currentRatio = 1.0;
        this.debouncedUpdateRatio = null;
        this.isInitialized = false;
        this.performanceMetrics = {
            startTime: performance.now(),
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0,
            memoryUsage: []
        };
    }

    /**
     * Load tablet data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadTabletData() {
        try {
            // Use cache manager for tablet data
            const cachedData = cacheManager.get('tabletData');
            if (cachedData) {
                this.tabletData = cachedData;
                // Initialize the tablet selector with cached data
                TabletSelector.init(this.tabletData);
                return;
            }
            
            // Loading tablet data
            const response = await fetch('data/tablets.json');
            if (!response.ok) {
                throw new Error('Failed to load tablet data');
            }
            this.tabletData = await response.json();
            
            // Cache the tablet data for future use
            cacheManager.set('tabletData', this.tabletData, 86400000); // 24 hours
            
            // Initialize the tablet selector
            TabletSelector.init(this.tabletData);
        } catch (error) {
            console.error('Error loading tablet data:', error);
            notificationManager.error(
                translateWithFallback('notifications.tabletDataError') || 
                'Error loading tablet data'
            );
        }
    }
    
    /**
     * Start editing a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    startEditFavorite(id) {
        this.editingFavoriteId = id;
        if (dependencyManager.has('UIManager')) {
            const uiManager = dependencyManager.get('UIManager');
            uiManager.updateEditModeUI(true);
        }
    }
    
    /**
     * Cancel edit mode
     */
    cancelEditMode() {
        if (this.editingFavoriteId && this.originalValues) {
            if (dependencyManager.has('FormManager')) {
                const formManager = dependencyManager.get('FormManager');
                formManager.restoreOriginalValues(this.originalValues);
            }
            
            // Reset the edit mode
            this.editingFavoriteId = null;
            this.originalValues = null;
            
            if (dependencyManager.has('UIManager')) {
                const uiManager = dependencyManager.get('UIManager');
                uiManager.updateEditModeUI(false);
            }
            
            notificationManager.info(
                translateWithFallback('notifications.editModeCanceled') || 
                'Changes cancelled'
            );
        }
    }

    /**
     * Initialize storage diagnostics
     * @private
     */
    _initializeStorageDiagnostics() {
        // Run initial storage diagnostic
        if (typeof StorageManager !== 'undefined') {
            // Reset storage to resolve potential issues
            if (typeof StorageManager.forceReset === 'function') {
                StorageManager.forceReset();
            } else if (typeof StorageManager.diagnoseFavorites === 'function') {
                StorageManager.diagnoseFavorites();
            }
        }

        // Clean up favorite references in preferences
        if (typeof PreferencesManager !== 'undefined' && 
            typeof PreferencesManager._cleanupFavoriteReferences === 'function') {
            PreferencesManager._cleanupFavoriteReferences();
        }

        // Run post-init diagnostic
        if (typeof StorageManager !== 'undefined' && typeof StorageManager.diagnoseFavorites === 'function') {
            setTimeout(() => StorageManager.diagnoseFavorites(), 500);
        }
    }

    /**
     * Initialize app components and load data
     */
    async init() {
        try {
            const startTime = performance.now();
            
            // Initialize notification system
            notificationManager.init();
            
            // Initialize legacy compatibility layer
            initLegacyCompatibility();
            
            // Register core dependencies
            dependencyManager.register('NotificationManager', notificationManager, true);
            dependencyManager.register('DisplayManager', displayManager, true);
            dependencyManager.register('Utils', Utils, true);
            dependencyManager.register('PerformanceUtils', PerformanceUtils, true);
            dependencyManager.register('AssetLoader', assetLoader, true);
            dependencyManager.register('CacheManager', cacheManager, true);
            
            // Initialize storage diagnostics
            this._initializeStorageDiagnostics();
            
            // Initialize favorites UI only if not already initialized
            if (typeof FavoritesUI !== 'undefined' && !FavoritesUI.isReady()) {
                FavoritesUI.init();
            }
            
            // Initialize preferences manager
            if (typeof PreferencesManager !== 'undefined') {
                PreferencesManager.init();
            }
            
            // Load tablet data
            await this.loadTabletData();
            
            // Setup UI managers with dependency injection
            FormManager.init(this);
            UIManager.init(this);
            RecapManager.init();
            
            // Register managers as dependencies
            dependencyManager.register('FormManager', FormManager, true);
            dependencyManager.register('UIManager', UIManager, true);
            dependencyManager.register('RecapManager', RecapManager, true);
            
            // Initialize display manager with dependencies
            displayManager.init({
                FormManager: FormManager,
                PreferencesManager: typeof PreferencesManager !== 'undefined' ? PreferencesManager : null
            });
            
            // Create debounced ratio update function with memoized calculation
            this.debouncedUpdateRatio = Utils.DOM.debounce(() => {
                const formManager = dependencyManager.get('FormManager');
                const elements = formManager.getFormElements();
                const width = Utils.parseFloatSafe(elements.areaWidth.value);
                const height = Utils.parseFloatSafe(elements.areaHeight.value);
                
                if (height > 0 && width > 0) {
                    // Use memoized calculation for better performance
                    const calculatedRatio = Utils.calculateRatioMemoized(width, height);
                    // Always update the ratio, unless the user is directly editing the field
                    if (!elements.customRatio.dataset.editing && !elements.customRatio.matches(':focus')) {
                        elements.customRatio.value = Utils.formatNumber(calculatedRatio, 3);
                        this.currentRatio = calculatedRatio;
                    }
                }
            }, 300); // 300ms delay
            
            this.isInitialized = true;
            
            // Initialize performance optimizations
            this._initializePerformanceOptimizations();
            
            // Start with default values using the new display manager
            displayManager.update();
            
            // Record initialization time
            this.performanceMetrics.loadTime = performance.now() - startTime;
            
            // Start monitoring memory usage
            this._startPerformanceMonitoring();
            
        } catch (error) {
            console.error('Error initializing application:', error);
            notificationManager.error('Error initializing application');
        }
    }

    /**
     * Initialize performance optimizations
     * @private
     */
    _initializePerformanceOptimizations() {
        try {
            // Setup enhanced lazy loading for images
            setupEnhancedLazyLoading();
            
            // Preload critical chunks during idle time
            bundleOptimizer.preloadCriticalChunks();
            
            // Register performance optimization dependencies
            dependencyManager.register('LazyComponent', LazyComponent, true);
            dependencyManager.register('BundleOptimizer', bundleOptimizer, true);
            
            // Use requestIdleCallback for non-critical tasks
            PerformanceUtils.requestIdleCallback(() => {
                // Preload additional resources during idle time
                assetLoader.preloadImage('assets/img/favicon.svg');
            });
            
        } catch (error) {
            console.warn('Failed to initialize some performance optimizations:', error);
        }
    }

    /**
     * Start monitoring performance metrics
     * @private
     */
    _startPerformanceMonitoring() {
        // Record memory usage every 30 seconds
        const memoryInterval = setInterval(() => {
            if (performance.memory) {
                this.performanceMetrics.memoryUsage.push({
                    time: performance.now() - this.performanceMetrics.startTime,
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                });
                
                // Keep only the last 10 measurements
                if (this.performanceMetrics.memoryUsage.length > 10) {
                    this.performanceMetrics.memoryUsage.shift();
                }
            }
        }, 30000);
        
        // Clean up interval after 5 minutes
        setTimeout(() => {
            clearInterval(memoryInterval);
        }, 300000);
    }

    /**
     * Setup refresh handlers for data persistence
     * @private
     */
    _setupRefreshHandlers() {
        // Handler for F5 and Ctrl+R to ensure favorites are properly saved
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                // Page refresh detected
                
                // Force cache cleanup before refresh
                if (typeof StorageManager !== 'undefined') {
                    // Cleaning cache
                    if (typeof StorageManager.clearCache === 'function') {
                        StorageManager.clearCache();
                    }
                    
                    // Verify and recover the latest available favorites list
                    if (typeof StorageManager.getFavorites === 'function') {
                        const currentFavorites = StorageManager.getFavorites();
                        // Favorites verified
                    }
                }
                
                // Clean favorites cache in initialization
                if (typeof FavoritesInit !== 'undefined') {
                    // Cleaning favorites cache
                    FavoritesInit.cachedFavorites = null;
                    
                    // Force complete refresh as last resort
                    if (typeof FavoritesInit.updateFavoriteCache === 'function') {
                        FavoritesInit.updateFavoriteCache(true);
                    }
                }
                
                // Ensure preferences are updated
                if (typeof PreferencesManager !== 'undefined') {
                    // Clean references to deleted favorites
                    if (typeof PreferencesManager._cleanupFavoriteReferences === 'function') {
                        PreferencesManager._cleanupFavoriteReferences();
                    }
                    
                    // Save current state
                    if (typeof PreferencesManager.saveCurrentState === 'function') {
                        PreferencesManager.saveCurrentState();
                    }
                }
            }
        });
    }
    
    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
}

// Create and export the global app state instance
export const appState = new AppState();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await appState.init();
        
        // Setup refresh handlers
        appState._setupRefreshHandlers();
        
        // Block context menu globally except on rectangle
        document.addEventListener('contextmenu', (e) => {
            // Allow context menu on rectangle for positioning
            const rectangle = document.getElementById('rectangle');
            if (rectangle && (e.target === rectangle || rectangle.contains(e.target))) {
                return true; // Allow context menu on rectangle
            }
            e.preventDefault();
            return false;
        });
        
        // Record first interaction time
        const recordFirstInteraction = () => {
            if (!appState.performanceMetrics.interactionTime) {
                appState.performanceMetrics.interactionTime = performance.now() - appState.performanceMetrics.startTime;
                
                // Remove event listeners after first interaction
                document.removeEventListener('click', recordFirstInteraction);
                document.removeEventListener('keydown', recordFirstInteraction);
                document.removeEventListener('touchstart', recordFirstInteraction);
            }
        };
        
        // Listen for first user interaction
        document.addEventListener('click', recordFirstInteraction, { once: true, passive: true });
        document.addEventListener('keydown', recordFirstInteraction, { once: true, passive: true });
        document.addEventListener('touchstart', recordFirstInteraction, { once: true, passive: true });
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        // Fallback notification if the notification system fails
        alert('Error loading application. Please reload the page.');
    }
});