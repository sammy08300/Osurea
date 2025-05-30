# Core Module

The **Core** module contains the central functionalities and system managers of the Osurea application.

## 📁 File Structure

### 🔧 `bundle-optimizer.js`
**Bundle optimizer and performance manager**

- **Role**: Optimizes resource loading and improves performance
- **Features**:
  - Module loading optimization
  - Resource cache management
  - Dynamic compression and minification
  - Loading performance analysis
  - Intelligent resource prefetching

```javascript
// Usage example
import { BundleOptimizer } from './bundle-optimizer.js';
BundleOptimizer.optimizeLoading();
```

### 🔄 `legacy-compatibility.js`
**Legacy version compatibility manager**

- **Role**: Ensures compatibility with old browsers and previous versions
- **Features**:
  - Polyfills for modern features
  - Adapters for legacy APIs
  - Automatic data migration
  - Browser capability detection
  - Fallbacks for unsupported features

```javascript
// Usage example
import { LegacyCompatibility } from './legacy-compatibility.js';
LegacyCompatibility.ensureCompatibility();
```

### 📢 `notification-manager.js`
**Centralized notification system**

- **Role**: Manages user notification display and logic
- **Features**:
  - Toast notifications (success, error, info, warning)
  - Notification queue management
  - Style and animation customization
  - Persistent and temporary notifications
  - Internationalization integration

```javascript
// Usage example
import { NotificationManager } from './notification-manager.js';
NotificationManager.success('Configuration saved');
NotificationManager.error('Connection error');
```

### 🖥️ `display-manager.js`
**Display and rendering manager**

- **Role**: Controls element display and view management
- **Features**:
  - View transition management
  - DOM rendering optimization
  - Responsiveness management
  - Element visibility control
  - Animations and visual effects

```javascript
// Usage example
import { DisplayManager } from './display-manager.js';
DisplayManager.showView('settings');
DisplayManager.hideElement('loading-spinner');
```

### 📦 `dependency-manager.js`
**Dependency and module manager**

- **Role**: Manages module loading and dependencies
- **Features**:
  - Automatic dependency resolution
  - Dynamic module loading
  - Module version management
  - Dependency conflict detection
  - Dependency injection

```javascript
// Usage example
import { DependencyManager } from './dependency-manager.js';
DependencyManager.loadModule('favorites');
DependencyManager.resolveDependencies();
```

## 🔗 Interconnections

The **Core** modules work together to provide a solid foundation:

```
┌─────────────────┐    ┌──────────────────┐
│ Bundle Optimizer│────│ Dependency Mgr   │
└─────────────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Display Manager │────│ Notification Mgr │
└─────────────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│        Legacy Compatibility            │
└─────────────────────────────────────────┘
```

## 🚀 Usage

### Complete initialization
```javascript
import { 
    BundleOptimizer, 
    LegacyCompatibility, 
    NotificationManager,
    DisplayManager,
    DependencyManager 
} from './core/index.js';

// Initialization in recommended order
await LegacyCompatibility.init();
await DependencyManager.init();
await BundleOptimizer.init();
await DisplayManager.init();
await NotificationManager.init();
```

### Individual usage
```javascript
// Each module can be used independently
import { NotificationManager } from './core/notification-manager.js';
NotificationManager.info('Module loaded successfully');
```

## 🎯 Core Module Objectives

1. **Performance** - Optimize loading and execution times
2. **Compatibility** - Ensure functionality across all browsers
3. **Robustness** - Provide a stable foundation for the application
4. **Modularity** - Enable independent component usage
5. **Maintainability** - Centralize common functionalities

## 📊 Metrics and Monitoring

The Core module includes monitoring tools for:
- Module loading times
- Rendering performance
- Notification error rates
- Memory usage
- Browser compatibility

## 🔧 Configuration

Each module can be configured via configuration files or initialization parameters. Consult each module's documentation for specific options. 