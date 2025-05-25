# 🎯 Area Components

Components for tablet active area management and visualization.

## Files

- **`visualizer.js`** - Main 2D visualization engine:
  - Canvas rendering of tablet and active area
  - Interaction handling (drag & drop, resizing)
  - Smooth animations and transitions
  - Support for different screen ratios

- **`contextMenu.js`** - Positioning context menu:
  - 9 predefined positions (corners and centers)
  - Intuitive interface with icons
  - Smart automatic positioning
  - Appearance/disappearance animations

- **`areaManager.js`** - Area settings manager:
  - Constraint calculations and validations
  - User interface synchronization
  - Modification event handling
  - Automatic preference saving

## Interactions

These components work together to provide a smooth experience:
- The visualizer displays changes in real-time
- The contextMenu allows quick positioning
- The areaManager ensures data consistency 