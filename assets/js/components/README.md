# 📁 Components - Organized Structure

This folder contains all the user interface components of Osurea, organized by functional category.

## 🗂️ Structure

### 📱 **ui/** - User Interface Components
Generic interface and user interaction components.

- `notifications.js` - Toast notification system
- `footer.js` - Footer with information and links
- `toggleLockRatio.js` - Ratio lock toggle button

### 🖥️ **tablet/** - Tablet Management
Components related to graphics tablet selection and configuration.

- `tabletSelector.js` - Tablet model selector with search

### 🎯 **area/** - Active Area Management
Components for active area visualization and manipulation.

- `visualizer.js` - 2D active area visualization engine
- `contextMenu.js` - Context menu for positioning
- `areaManager.js` - Area settings manager

### ⭐ **favorites/** - Favorites System
Complete module for managing saved configurations.

- `favoritesModule.js` - Main entry point
- `favorite-actions.js` - CRUD actions on favorites
- `favorite-rendering.js` - Favorite card rendering
- `favorite-popup-details.js` - Details/edit popup
- `favorite-popup-dialogs.js` - Confirmation dialogs
- `favorite-init.js` - System initialization
- `favorite-events.js` - Event handler
- `favorite-storage.js` - Storage interface
- `favorite-sort.js` - Sorting and filtering
- `favorite-popup.js` - Popup management
- `favoritesindex.js` - Feature index

## 🔄 Dependencies

### Imports between components
- `area/visualizer.js` ← used by `area/contextMenu.js`
- `ui/notifications.js` ← used by all components for alerts
- `tablet/tabletSelector.js` ← used by `area/areaManager.js`

### External dependencies
- `../utils/` - Shared utilities
- `../core/` - Core modules
- `../init/` - Initialization scripts

## 📝 Conventions

### File naming
- **PascalCase** for main classes
- **camelCase** for utility modules
- **kebab-case** for sub-modules (favorites)

### Module structure
```javascript
// Recommended structure for a component
const ComponentName = {
    // Configuration
    config: {},
    
    // Internal state
    _state: {},
    
    // Public methods
    init() {},
    destroy() {},
    
    // Private methods
    _privateMethod() {}
};

export default ComponentName;
```

## 🚀 Usage

### Import a component
```javascript
// From project root
import TabletSelector from './assets/js/components/tablet/tabletSelector.js';
import Notifications from './assets/js/components/ui/notifications.js';
```

### Loading in HTML
```html
<!-- UI Components -->
<script src="assets/js/components/ui/notifications.js" defer></script>

<!-- Business Components -->
<script src="assets/js/components/area/visualizer.js" defer></script>
<script type="module" src="assets/js/components/tablet/tabletSelector.js" defer></script>
```

## 🔧 Maintenance

### Adding a new component
1. Determine the appropriate category (`ui/`, `tablet/`, `area/`, `favorites/`)
2. Create the file in the correct folder
3. Update references in:
   - `index.html`
   - `service-worker.js`
   - `assets/js/init/backgroundAndPrefetch.js` (if necessary)
4. Document in this README

### Moving a component
1. Move the file
2. Update all references (see above)
3. Test that all imports work
4. Update documentation 