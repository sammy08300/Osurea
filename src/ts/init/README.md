# Init Module

The **Init** module contains the initialization and startup scripts for the Osurea application.

## 📁 File Structure

### 🎨 `backgroundAndPrefetch.js`
**Background and resource prefetching manager**

- **Role**: Optimizes user experience by prefetching resources and managing background
- **Features**:
  - Intelligent image and resource prefetching
  - Dynamic background management
  - Browser cache optimization
  - Progressive asset loading
  - Critical vs non-critical resource management

```javascript
// Usage example
import { BackgroundAndPrefetch } from './backgroundAndPrefetch.js';
BackgroundAndPrefetch.init();
BackgroundAndPrefetch.prefetchCriticalResources();
```

**Detailed features:**
- 🖼️ **Image prefetching**: Loads important images in background
- 🎯 **Prioritization**: Distinguishes critical from optional resources
- 📱 **Mobile adaptation**: Adjusts prefetching based on connection
- 🔄 **Smart cache**: Avoids unnecessary reloads

### 🔧 `serviceWorkerRegister.js`
**Service Worker registration and management**

- **Role**: Configures and registers the Service Worker for offline functionality
- **Features**:
  - Automatic Service Worker registration
  - SW update management
  - Offline cache configuration
  - Update available notifications
  - Registration error handling

```javascript
// Usage example
import { ServiceWorkerRegister } from './serviceWorkerRegister.js';
ServiceWorkerRegister.register();
ServiceWorkerRegister.checkForUpdates();
```

**Detailed features:**
- 📱 **Offline mode**: Enables usage without internet connection
- 🔄 **Automatic updates**: Detects and applies new versions
- 💾 **Strategic cache**: Optimizes resource storage
- 🚨 **Error handling**: Graceful fallback in case of issues

### 📐 `rectangleInit.js`
**Rectangle/zone system initialization**

- **Role**: Configures and initializes the rectangular zone management system
- **Features**:
  - Drawing canvas initialization
  - Selection tool configuration
  - Interactive zone setup
  - Mouse/touch event handling
  - Coordinate calibration

```javascript
// Usage example
import { RectangleInit } from './rectangleInit.js';
RectangleInit.initializeCanvas();
RectangleInit.setupDrawingTools();
```

**Detailed features:**
- 🖱️ **Mouse interaction**: Click and drag handling
- 📱 **Touch support**: Compatible with touch screens
- 📏 **Precision**: Accurate coordinate calculations
- 🎨 **Optimized rendering**: Smooth zone display

## 🔄 Initialization Order

The loading order of initialization modules is important:

```
1. serviceWorkerRegister.js    ← Service Worker first
         ↓
2. backgroundAndPrefetch.js    ← Resource prefetching
         ↓
3. rectangleInit.js           ← User interface
```

## 🚀 Complete Usage

### Automatic initialization
```javascript
// In your main file (app.js or index.js)
import './assets/js/init/serviceWorkerRegister.js';
import './assets/js/init/backgroundAndPrefetch.js';
import './assets/js/init/rectangleInit.js';

// Initialization happens automatically
```

### Manual initialization
```javascript
import { ServiceWorkerRegister } from './init/serviceWorkerRegister.js';
import { BackgroundAndPrefetch } from './init/backgroundAndPrefetch.js';
import { RectangleInit } from './init/rectangleInit.js';

async function initializeApp() {
    try {
        // 1. Service Worker
        await ServiceWorkerRegister.register();
        
        // 2. Prefetching
        await BackgroundAndPrefetch.init();
        
        // 3. Rectangle interface
        await RectangleInit.initialize();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

initializeApp();
```

## 🎯 Init Module Objectives

1. **Fast startup** - Optimize initial loading time
2. **Smooth experience** - Prefetch important resources
3. **Offline functionality** - Configure cache and Service Worker
4. **Responsive interface** - Initialize interaction tools
5. **Robustness** - Handle startup errors

## 📊 Performance Metrics

The Init module monitors:
- ⏱️ **Loading time**: Duration of each module initialization
- 📈 **Success rate**: Percentage of successful initializations
- 💾 **Cache usage**: Prefetching efficiency
- 🔄 **SW updates**: Service Worker update frequency

## 🔧 Configuration

### Environment variables
```javascript
// Prefetching configuration
const PREFETCH_CONFIG = {
    enableImagePrefetch: true,
    maxConcurrentRequests: 3,
    priorityResources: ['logo.svg', 'main.css']
};

// Service Worker configuration
const SW_CONFIG = {
    scope: '/',
    updateViaCache: 'imports',
    skipWaiting: true
};
```

### Customization
Each module can be configured according to your application's specific needs. Check the comments in each file for available options.

## 🐛 Debugging

To debug initialization modules:

```javascript
// Enable detailed logs
localStorage.setItem('debug-init', 'true');

// Check Service Worker status
navigator.serviceWorker.getRegistrations().then(console.log);

// Monitor prefetching
window.addEventListener('prefetch-complete', (e) => {
    console.log('Prefetching completed:', e.detail);
});
``` 