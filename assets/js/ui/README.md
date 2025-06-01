# UI Module

The **UI** module contains the user interface managers and interaction components of the Osurea application.

## 📁 File Structure

### 🎛️ `ui-manager.js`
**Main user interface manager**

- **Role**: Controls and coordinates all aspects of the user interface
- **Features**:
  - Global UI state management
  - Coordination between different components
  - Theme and style management
  - Responsiveness control
  - Modal and overlay management
  - Navigation system

```javascript
// Usage example
import { UIManager } from './ui-manager.js';
UIManager.init();
UIManager.setTheme('dark');
UIManager.showModal('settings');
```

**Detailed features:**
- 🎨 **Themes**: Light/dark and custom theme management
- 📱 **Responsive**: Automatic adaptation to different screen sizes
- 🔄 **UI States**: Centralized state management (loading, error, success)
- 🎯 **Focus management**: Intelligent keyboard focus handling
- ♿ **Accessibility**: Screen reader support and keyboard navigation

### 📊 `recap-manager.js`
**Summary and recap manager**

- **Role**: Manages configuration summary and recap display
- **Features**:
  - Automatic recap generation
  - Current settings display
  - Modification history
  - Configuration export
  - Configuration comparison

```javascript
// Usage example
import { RecapManager } from './recap-manager.js';
RecapManager.generateRecap();
RecapManager.showCurrentConfig();
RecapManager.exportConfig('json');
```

**Detailed features:**
- 📋 **Summaries**: Clear overview of current settings
- 📈 **Statistics**: Metrics and data display
- 💾 **Export**: Save in different formats (JSON, CSV, PDF)
- 🔍 **Comparison**: Compare different configurations
- 📅 **History**: Track changes over time

### 📝 `form-manager.js`
**Form and validation manager**

- **Role**: Manages all forms, their validation and submission
- **Features**:
  - Real-time field validation
  - Form error handling
  - Data auto-save
  - Automatic input formatting
  - Asynchronous submission
  - Multi-step form management

```javascript
// Usage example
import { FormManager } from './form-manager.js';
FormManager.initForm('settings-form');
FormManager.validateField('email');
FormManager.enableAutoSave();
```

**Detailed features:**
- ✅ **Validation**: Real-time validation with error messages
- 💾 **Auto-save**: Automatic change saving
- 🔄 **Synchronization**: Sync between forms and global state
- 📱 **Mobile-friendly**: Optimized for touch devices
- 🎯 **Optimized UX**: Visual feedback and smooth interactions

## 🔗 Interconnections

UI modules work together to create a cohesive experience:

```
┌─────────────────┐
│   UI Manager    │ ← Main manager
└─────────┬───────┘
          │
    ┌─────▼─────┐         ┌─────────────┐
    │   Form    │◄────────┤    Recap    │
    │  Manager  │         │   Manager   │
    └───────────┘         └─────────────┘
          │                       │
          ▼                       ▼
    ┌─────────────────────────────────┐
    │        Shared UI State          │
    └─────────────────────────────────┘
```

## 🚀 Usage

### Complete initialization
```javascript
import { UIManager, FormManager, RecapManager } from './ui/index.js';

async function initializeUI() {
    // 1. Initialize main manager
    await UIManager.init();
    
    // 2. Configure forms
    FormManager.init({
        autoSave: true,
        validateOnBlur: true
    });
    
    // 3. Prepare summaries
    RecapManager.init();
    
    console.log('User interface ready');
}

initializeUI();
```

### Modular usage
```javascript
// Individual module usage
import { FormManager } from './ui/form-manager.js';

// Initialize a specific form
FormManager.initForm('user-settings', {
    validation: {
        email: 'required|email',
        name: 'required|min:2'
    },
    autoSave: true
});
```

## 🎯 Usage Patterns

### Reactive state management
```javascript
// Observe state changes
UIManager.onStateChange('theme', (newTheme) => {
    document.body.className = `theme-${newTheme}`;
});

// Update state
UIManager.setState('loading', true);
```

### Advanced form validation
```javascript
// Custom validation
FormManager.addValidator('tabletSize', (value) => {
    const [width, height] = value.split('x').map(Number);
    return width > 0 && height > 0 && width <= 10000 && height <= 10000;
});

// Conditional validation
FormManager.addConditionalValidation('customRatio', {
    condition: () => document.getElementById('useCustomRatio').checked,
    rules: 'required|numeric|min:0.1|max:10'
});
```

### Dynamic summaries
```javascript
// Generate custom summary
RecapManager.createCustomRecap('tablet-config', {
    title: 'Tablet Configuration',
    fields: ['width', 'height', 'ratio', 'offset'],
    format: 'detailed'
});

// Export with options
RecapManager.export({
    format: 'pdf',
    includeCharts: true,
    template: 'professional'
});
```

## 🎨 Customization

### Themes
```javascript
// Define custom theme
UIManager.defineTheme('custom', {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#f8fafc',
    text: '#1e293b'
});

// Apply theme
UIManager.setTheme('custom');
```

### Components
```javascript
// Register custom component
UIManager.registerComponent('custom-slider', {
    template: '<div class="custom-slider">...</div>',
    behavior: CustomSliderBehavior
});
```

## 📊 Metrics and Analytics

The UI module collects metrics on:
- 📈 **Interactions**: Clicks, form submissions, errors
- ⏱️ **Performance**: Rendering time, responsiveness
- 🎯 **UX**: User journey, friction points
- 📱 **Devices**: Device types and resolutions

## 🔧 Configuration

### Global configuration
```javascript
const UI_CONFIG = {
    theme: {
        default: 'auto', // 'light', 'dark', 'auto'
        allowUserChange: true
    },
    forms: {
        autoSave: true,
        autoSaveDelay: 1000,
        validateOnChange: false,
        validateOnBlur: true
    },
    recap: {
        autoUpdate: true,
        showTimestamps: true,
        defaultFormat: 'detailed'
    }
};

UIManager.configure(UI_CONFIG);
```

### Responsive breakpoints
```javascript
const BREAKPOINTS = {
    mobile: '(max-width: 768px)',
    tablet: '(min-width: 769px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)'
};

UIManager.setBreakpoints(BREAKPOINTS);
```

## 🐛 Debugging

### Debug mode
```javascript
// Enable debug mode
UIManager.setDebugMode(true);

// Log interactions
UIManager.onInteraction((event) => {
    console.log('UI Interaction:', event);
});

// Monitor performance
UIManager.enablePerformanceMonitoring();
```

### Development tools
```javascript
// Inspect current state
console.log('UI State:', UIManager.getState());

// Test validations
FormManager.testValidation('email', 'test@example.com');

// Preview summaries
RecapManager.preview('current-config');
```

## ♿ Accessibility

The UI module integrates accessibility best practices:
- **ARIA labels**: Proper element labeling
- **Keyboard navigation**: Full keyboard support
- **Contrast**: WCAG contrast ratio compliance
- **Screen readers**: Assistive technology compatibility
- **Visible focus**: Clear focus indicators

## 🔄 Updates

To keep the UI up to date:
```javascript
// Check component updates
UIManager.checkComponentUpdates();

// Migrate to new version
UIManager.migrate('2.0.0');
``` 