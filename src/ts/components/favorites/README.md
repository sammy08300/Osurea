# Favorites Module

A complete and modular favorites management system for web applications.

## 🎯 Overview

The **Favorites** module allows users to save, organize and manage their preferred configurations in the Osurea application. It provides an intuitive interface to create, edit, delete and load custom configurations.

## 📁 Detailed File Structure

### 🔧 **Configuration and utility files**

#### `favorites-config.js`
**Centralized module configuration**
- Constants for DOM element IDs
- CSS classes used
- Available sort criteria
- Animation delays and timings
- i18n translation keys

#### `favorites-utils.js`
**Common utility functions**
- Number formatting
- Safe DOM handling
- Notification system
- Favorite object validation
- Error handling with context

#### `types.d.ts`
**TypeScript definitions**
- Interfaces for favorite objects
- Types for autocompletion
- API documentation
- Type validation

### 🚀 **Main files**

#### `favoritesModule.js`
**Browser entry point (auto-initialization)**
- Automatic initialization on load
- Global API exposure
- Cleanup on unload
- CommonJS and ES modules support

#### `favoritesindex.js`
**Unified main interface**
- Centralized API for all functionalities
- Centralized state management
- Module coordination
- Documented public methods

#### `index.js`
**Entry point for modular imports**
- Exports organized by category
- Facilitates selective imports
- Clean interface for developers

### 🔄 **Functional modules**

#### `favorite-init.js`
**Initialization and configuration**
- DOM configuration
- Event preparation
- Initial cache management
- Sort button setup

#### `favorite-storage.js`
**Data persistence layer**
- StorageManager interface
- Data validation
- Robust error handling
- Secure CRUD operations

#### `favorite-sort.js`
**Sorting functionalities**
- Sort by date, name, size, modification
- Optimized algorithms
- Criteria validation
- Custom sort support

#### `favorite-events.js`
**Centralized event management**
- Robust event system
- Automatic listener cleanup
- Custom event handling
- Debugging and monitoring

### 🎨 **Interface modules**

#### `favorite-rendering.js`
**Favorite rendering and display**
- Favorite HTML generation
- Animations and transitions
- Dynamic updates
- Rendering optimization

#### `favorite-actions.js`
**User action management**
- Favorite loading
- Save and modification
- Deletion with confirmation
- Advanced edit mode

#### `favorite-popup.js`
**Main popup management**
- Basic popups
- Dialog coordination
- Focus management
- Open/close animations

#### `favorite-popup-dialogs.js`
**Confirmation and input dialogs**
- Deletion dialogs
- Comment input
- Input validation
- Callback handling

#### `favorite-popup-details.js`
**Detailed favorite views**
- Complete information display
- Inline editing
- Modification history
- Configuration export

```
favorites/
├── 📚 Documentation
│   ├── README.md                    # This documentation
│   └── types.d.ts                   # TypeScript definitions
├── ⚙️ Configuration
│   ├── favorites-config.js          # Centralized configuration
│   ├── favorites-utils.js           # Common utilities
│   └── index.js                     # Modular entry point
├── 🚀 Core
│   ├── favoritesModule.js          # Browser auto-initialization
│   ├── favoritesindex.js           # Main interface
│   ├── favorite-init.js            # Initialization
│   ├── favorite-storage.js         # Data persistence
│   ├── favorite-sort.js            # Sorting functionalities
│   └── favorite-events.js          # Event management
└── 🎨 Interface
    ├── favorite-rendering.js       # Favorite rendering
    ├── favorite-actions.js         # User actions
    ├── favorite-popup.js           # Main popups
    ├── favorite-popup-dialogs.js   # Dialogs
    └── favorite-popup-details.js   # Detailed views
```

## 🚀 Quick Start

### Automatic Initialization (Recommended)

Simply import the module and it will initialize automatically:

```javascript
import './assets/js/components/favorites/favoritesModule.js';
```

### Manual Initialization

```javascript
import { FavoritesUI } from './assets/js/components/favorites/favoritesindex.js';

// Initialize when ready
await FavoritesUI.init();

// Use the API
FavoritesUI.loadFavorite('favorite-id');
FavoritesUI.saveFavorite();
```

## 📚 API Reference

### Core Methods

#### Initialization
- `FavoritesUI.init()` - Initialize the favorites system
- `FavoritesUI.destroy()` - Clean up and destroy the system
- `FavoritesUI.isReady()` - Check if the system is ready

#### Favorite Management
- `FavoritesUI.loadFavorite(id)` - Load a favorite configuration
- `FavoritesUI.saveFavorite()` - Save current configuration as favorite
- `FavoritesUI.editFavorite(id)` - Start editing a favorite
- `FavoritesUI.deleteFavorite(id)` - Delete a favorite
- `FavoritesUI.cancelEditMode()` - Cancel edit mode

#### Display & UI
- `FavoritesUI.refreshAllFavorites()` - Refresh the favorites display
- `FavoritesUI.forceRefreshFavorites()` - Force a complete refresh
- `FavoritesUI.highlightFavorite(id, withScroll)` - Highlight a specific favorite

#### Popups & Dialogs
- `FavoritesUI.showFavoriteDetails(favorite)` - Show favorite details popup
- `FavoritesUI.showCommentDialog(callback)` - Show comment input dialog
- `FavoritesUI.showDeleteDialog(callback)` - Show delete confirmation dialog

#### Localization
- `FavoritesUI.handleLocaleChange(event)` - Handle locale changes
- `FavoritesUI.manualLanguageUpdate(language)` - Update language manually

#### Utility
- `FavoritesUI.getState()` - Get current state
- `FavoritesUI.getFavoritesCount()` - Get number of favorites

## ⚙️ Configuration

The module uses a centralized configuration system. Key settings can be found in `favorites-config.js`:

```javascript
import { FAVORITES_CONFIG } from './favorites-config.js';

// Access configuration
const elementIds = FAVORITES_CONFIG.ELEMENTS;
const sortCriteria = FAVORITES_CONFIG.SORT_CRITERIA;
const timings = FAVORITES_CONFIG.TIMINGS;
```

### Available Sort Criteria
- `DATE` - Sort by creation date (newest first)
- `NAME` - Sort alphabetically by name/title
- `SIZE` - Sort by area size (largest first)
- `MODIFIED` - Sort by last modified date (most recent first)

## 🛠️ Utilities

The module provides several utility functions for common tasks:

```javascript
import { 
    formatNumber, 
    getElement, 
    showNotification,
    validateFavorite 
} from './favorites-utils.js';

// Format numbers with proper decimals
const formatted = formatNumber(3.14159, 2); // "3.14"

// Get DOM elements safely
const element = getElement('my-element', true); // throws if not found

// Show notifications
showNotification('success', 'i18n.key', 'Fallback message');

// Validate favorite objects
const isValid = validateFavorite(favoriteObject);
```

## 🎯 Event System

The module includes a robust event management system:

```javascript
import { FavoritesEvents } from './favorite-events.js';

// Check if events are ready
if (FavoritesEvents.isReady()) {
    // Events are initialized
}

// Get active listeners count
const count = FavoritesEvents.getActiveListenersCount();
```

## 💾 Storage

Data persistence is handled through a clean storage interface:

```javascript
import { 
    getFavorites, 
    getFavoriteById, 
    addFavorite, 
    updateFavorite, 
    removeFavorite 
} from './favorite-storage.js';

// All storage functions include error handling and validation
const favorites = getFavorites(); // Always returns an array
const favorite = getFavoriteById('id'); // Returns null if not found
const success = addFavorite(favoriteObject); // Returns boolean
```

## 🔧 Error Handling

The module includes comprehensive error handling:

- All public methods return boolean success indicators
- Errors are logged with context using `logError()`
- Graceful degradation when dependencies are missing
- Validation of inputs and data structures

## 🎨 Styling & CSS Classes

The module uses consistent CSS classes defined in the configuration:

```javascript
// CSS classes used by the module
FAVORITES_CONFIG.CLASSES = {
    LOADING_FAVORITES: 'loading-favorites',
    FAVORITES_TRANSITION_OUT: 'favorites-transition-out',
    FAVORITES_LOADING: 'favorites-loading',
    HIDDEN: 'hidden',
    FLEX: 'flex'
};
```

## 🔄 Migration from Old Structure

If you're migrating from the old structure:

1. **Replace direct module imports** with the unified interface:
   ```javascript
   // Old
   import { FavoritesActions } from './favorite-actions.js';
   FavoritesActions.loadFavorite(id);
   
   // New
   import { FavoritesUI } from './favoritesindex.js';
   FavoritesUI.loadFavorite(id);
   ```

2. **Update state access**:
   ```javascript
   // Old
   const editingId = FavoritesUI.editingFavoriteId;
   
   // New
   const editingId = FavoritesUI.state.editingFavoriteId;
   ```

3. **Use the new configuration system**:
   ```javascript
   // Old
   const criteria = 'date';
   
   // New
   import { FAVORITES_CONFIG } from './favorites-config.js';
   const criteria = FAVORITES_CONFIG.SORT_CRITERIA.DATE;
   ```

## 🐛 Debugging

Enable debug logging by checking the browser console. The module provides detailed error messages with context.

## 📄 License

This module is part of the Osurea project. 