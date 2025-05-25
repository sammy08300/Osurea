/**
 * Context menu for rectangle alignment within tablet boundary
 */

const ContextMenu = {
    // State properties
    menu: null,
    rectangle: null,
    tabletBoundary: null,
    isVisible: false,
    eventListeners: [], // Track event listeners for cleanup

    /**
     * Initialize the context menu
     */
    init() {
        console.log('Initializing the context menu...');
        
        // Get existing elements
        this.rectangle = document.getElementById('rectangle');
        this.tabletBoundary = document.getElementById('tablet-boundary');
        this.menu = document.getElementById('context-menu');
        
        if (!this.validateElements()) {
            return;
        }
        
        this.setupEventListeners();
        console.log('Context menu initialized successfully');
    },
    
    /**
     * Validate that all required elements exist
     * @returns {boolean} True if all elements exist
     */
    validateElements() {
        if (!this.rectangle || !this.tabletBoundary || !this.menu) {
            console.error('Context menu: elements not found', {
                rectangle: !!this.rectangle,
                tabletBoundary: !!this.tabletBoundary,
                menu: !!this.menu
            });
            return false;
        }
        return true;
    },
    
    /**
     * Create the context menu if it doesn't exist
     */
    createMenu() {
        if (this.menu) return; // Don't recreate if it exists
        
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 hidden';
        
        this.menu.innerHTML = this.getMenuTemplate();
        document.body.appendChild(this.menu);
    },
    
    /**
     * Get the HTML template for the menu
     * @returns {string} HTML template
     */
    getMenuTemplate() {
        return `
            <div class="text-center text-sm text-gray-300 mb-2">Rectangle Position</div>
            <div class="grid grid-cols-3 gap-2">
                <!-- Top row: Top-left, Top, Top-right -->
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Top-left" data-position="top-left">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="5" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Top" data-position="top">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="5" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Top-right" data-position="top-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="15" cy="5" r="3" fill="currentColor" />
                    </svg>
                </button>
                
                <!-- Middle row: Left, Center, Right -->
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Left" data-position="left">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="10" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Center" data-position="center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Right" data-position="right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="15" cy="10" r="3" fill="currentColor" />
                    </svg>
                </button>
                
                <!-- Bottom row: Bottom-left, Bottom, Bottom-right -->
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Bottom-left" data-position="bottom-left">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="15" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Bottom" data-position="bottom">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="15" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Bottom-right" data-position="bottom-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="15" cy="15" r="3" fill="currentColor" />
                    </svg>
                </button>
            </div>
        `;
    },
    
    /**
     * Add an event listener and track it for later cleanup
     * @param {Element} element - DOM element to attach listener to
     * @param {string} type - Event type
     * @param {Function} handler - Event handler
     */
    addTrackedEventListener(element, type, handler) {
        if (!element) return;
        
        element.addEventListener(type, handler);
        this.eventListeners.push({ element, type, handler });
    },
    
    /**
     * Configure all event listeners
     */
    setupEventListeners() {
        // Right click handler on the rectangle
        this.addTrackedEventListener(this.rectangle, 'contextmenu', this.handleRightClick.bind(this));
        
        // Handle clicks on data-position buttons through event delegation
        this.addTrackedEventListener(this.menu, 'click', this.handleMenuClick.bind(this));
        
        // Set up standalone alignment buttons (outside the context menu)
        this.setupAlignmentButtonHandlers();
        
        // Hide the menu on outside clicks, scrolling or resizing
        this.addTrackedEventListener(document, 'click', this.handleOutsideClick.bind(this));
        this.addTrackedEventListener(window, 'scroll', this.hide.bind(this));
        this.addTrackedEventListener(window, 'resize', this.hide.bind(this));
    },
    
    /**
     * Set up handlers for alignment buttons with IDs using event delegation pattern
     */
    setupAlignmentButtonHandlers() {
        const alignmentButtons = [
            { id: 'align-top-left', position: 'top-left' },
            { id: 'align-top', position: 'top' },
            { id: 'align-top-right', position: 'top-right' },
            { id: 'align-left', position: 'left' },
            { id: 'align-center', position: 'center' },
            { id: 'align-right', position: 'right' },
            { id: 'align-bottom-left', position: 'bottom-left' },
            { id: 'align-bottom', position: 'bottom' },
            { id: 'align-bottom-right', position: 'bottom-right' }
        ];
        
        // Find a common parent for these buttons if possible
        const buttonsContainer = document.querySelector('.alignment-buttons-container') || document.body;
        
        // Using event delegation for better performance
        const delegatedHandler = (e) => {
            const button = e.target.closest('[id^="align-"]');
            if (!button) return;
            
            // Find the matching position from our predefined list
            const config = alignmentButtons.find(item => item.id === button.id);
            if (config) {
                this.alignArea(config.position);
                this.hide();
            }
        };
        
        this.addTrackedEventListener(buttonsContainer, 'click', delegatedHandler);
    },
    
    /**
     * Handle right click on the rectangle
     * @param {MouseEvent} e - The mouse event
     */
    handleRightClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.show(e.clientX, e.clientY);
    },
    
    /**
     * Handle clicks inside the menu
     * @param {MouseEvent} e - The mouse event
     */
    handleMenuClick(e) {
        const alignBtn = e.target.closest('.align-btn');
        if (alignBtn && alignBtn.dataset.position) {
            const position = alignBtn.dataset.position;
            this.alignArea(position);
            this.hide();
        }
    },
    
    /**
     * Handle clicks outside the menu
     * @param {MouseEvent} e - The mouse event
     */
    handleOutsideClick(e) {
        if (this.isVisible && !this.menu.contains(e.target)) {
            this.hide();
        }
    },
    
    /**
     * Show the context menu at the specified position
     * @param {number} x - Position X in pixels
     * @param {number} y - Position Y in pixels
     */
    show(x, y) {
        if (!this.menu) return;
        
        // Make the menu visible to calculate its dimensions
        this.menu.style.display = 'block';
        this.menu.classList.remove('hidden');
        
        // Adjust position to avoid overflowing the window
        const { x: adjustedX, y: adjustedY } = this.calculateMenuPosition(x, y);
        
        // Position the menu
        this.menu.style.left = `${adjustedX}px`;
        this.menu.style.top = `${adjustedY}px`;
        this.isVisible = true;
    },
    
    /**
     * Calculate the ideal menu position to avoid window overflow
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @returns {Object} Adjusted X and Y coordinates
     */
    calculateMenuPosition(x, y) {
        const menuRect = this.menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Adjust position to avoid overflows
        return {
            x: Math.min(x, windowWidth - menuRect.width - 5),
            y: Math.min(y, windowHeight - menuRect.height - 5)
        };
    },
    
    /**
     * Hide the context menu
     */
    hide() {
        if (this.menu) {
            this.menu.style.display = 'none';
            this.menu.classList.add('hidden');
            this.isVisible = false;
        }
    },
    
    /**
     * Clean up all event listeners
     */
    cleanup() {
        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
    },
    
    /**
     * Align the active area according to the specified position
     * @param {string} position - Alignment position
     */
    alignArea(position) {
        console.log("Aligning to position:", position);
        
        // Get dimensions from form inputs
        const dimensions = this.getDimensions();
        if (!dimensions) return;
        
        const { tabletWidth, tabletHeight, areaWidth, areaHeight } = dimensions;
        
        // Calculate new position
        const { x: newX, y: newY } = this.calculatePosition(
            position, 
            tabletWidth, 
            tabletHeight, 
            areaWidth, 
            areaHeight
        );
        
        // Update the form values
        this.updateFormValues(newX, newY);
        
        // Update the display
        this.updateDisplayAndNotify(position, newX, newY, areaWidth, areaHeight);
    },
    
    /**
     * Get dimensions from form inputs
     * @returns {Object|null} The dimensions or null if invalid
     */
    getDimensions() {
        const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth')?.value);
        const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight')?.value);
        const areaWidth = parseFloatSafe(document.getElementById('areaWidth')?.value);
        const areaHeight = parseFloatSafe(document.getElementById('areaHeight')?.value);
        
        // Check validity of dimensions
        if ([tabletWidth, tabletHeight, areaWidth, areaHeight].some(v => !isValidNumber(v, 0))) {
            this.showError('notifications.invalidDimensions');
            return null;
        }
        
        return { tabletWidth, tabletHeight, areaWidth, areaHeight };
    },
    
    /**
     * Show error notification with fallback
     * @param {string} message - Error message or translation key
     */
    showError(message) {
        if (typeof Notifications !== 'undefined' && Notifications?.error) {
            // Try to get the translation if it looks like a key
            if (message.includes('.') && typeof window.translateWithFallback === 'function') {
                const translated = window.translateWithFallback(message);
                Notifications.error(translated || "Dimensions invalides pour l'alignement");
            } else {
                Notifications.error(message);
            }
        } else {
            console.error(message);
        }
    },
    
    /**
     * Show success notification with fallback
     * @param {string} message - Success message
     */
    showSuccess(message) {
        if (typeof Notifications !== 'undefined' && Notifications?.success) {
            Notifications.success(message);
        } else {
            console.log(message);
        }
    },
    
    /**
     * Calculate new position based on the given alignment
     * @param {string} position - Alignment position
     * @param {number} tabletWidth - Width of the tablet
     * @param {number} tabletHeight - Height of the tablet
     * @param {number} areaWidth - Width of the area
     * @param {number} areaHeight - Height of the area
     * @returns {Object} New X and Y coordinates
     */
    calculatePosition(position, tabletWidth, tabletHeight, areaWidth, areaHeight) {
        // Half-dimensions for border calculations
        const halfWidth = areaWidth / 2;
        const halfHeight = areaHeight / 2;
        
        // Precompute common values
        const centerX = tabletWidth / 2;
        const centerY = tabletHeight / 2;
        const rightX = tabletWidth - halfWidth;
        const bottomY = tabletHeight - halfHeight;
        
        // Map of all possible positions
        const positions = {
            // Corners
            'top-left': { x: halfWidth, y: halfHeight },
            'top-right': { x: rightX, y: halfHeight },
            'bottom-left': { x: halfWidth, y: bottomY },
            'bottom-right': { x: rightX, y: bottomY },
            
            // Edges
            'top': { x: centerX, y: halfHeight },
            'right': { x: rightX, y: centerY },
            'bottom': { x: centerX, y: bottomY },
            'left': { x: halfWidth, y: centerY },
            
            // Center
            'center': { x: centerX, y: centerY }
        };
        
        if (!positions[position]) {
            console.error('Unknown position:', position);
            return { x: 0, y: 0 };
        }
        
        return positions[position];
    },
    
    /**
     * Update form values with new coordinates
     * @param {number} x - New X coordinate
     * @param {number} y - New Y coordinate
     */
    updateFormValues(x, y) {
        const areaOffsetX = document.getElementById('areaOffsetX');
        const areaOffsetY = document.getElementById('areaOffsetY');
        
        if (areaOffsetX) areaOffsetX.value = formatNumber(x, 3);
        if (areaOffsetY) areaOffsetY.value = formatNumber(y, 3);
    },
    
    /**
     * Update display and notify of the change
     * @param {string} position - The position name
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Area width
     * @param {number} height - Area height
     */
    updateDisplayAndNotify(position, x, y, width, height) {
        // Update the display
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        } else if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
        
        // Show success notification
        this.showSuccessNotification(position);
        
        // Dispatch event to notify of the change
        this.dispatchAreaPositionedEvent(position, x, y, width, height);
    },
    
    /**
     * Show success notification for the positioning
     * @param {string} position - The position name
     */
    showSuccessNotification(position) {
        // Position mapping to translation keys
        const positionToKey = {
            'left': 'notifications.areaPositionLeft',
            'right': 'notifications.areaPositionRight',
            'top': 'notifications.areaPositionTop',
            'bottom': 'notifications.areaPositionBottom',
            'center': 'notifications.areaPositionCenter',
            'top-left': 'notifications.areaPositionTopLeft',
            'top-right': 'notifications.areaPositionTopRight', 
            'bottom-left': 'notifications.areaPositionBottomLeft',
            'bottom-right': 'notifications.areaPositionBottomRight'
        };
        
        const translationKey = positionToKey[position];
        
        // Try to use the translation system
        if (typeof window.translateWithFallback === 'function' && translationKey) {
            const translatedMessage = window.translateWithFallback(translationKey);
            if (translatedMessage) {
                this.showSuccess(translatedMessage);
                return;
            }
        }
        
        // Fallback in case of missing translation
        const fallbackMessages = {
            'left': 'Zone active positionnée à gauche',
            'right': 'Zone active positionnée à droite',
            'top': 'Zone active positionnée en haut',
            'bottom': 'Zone active positionnée en bas',
            'center': 'Zone active positionnée au centre',
            'top-left': 'Zone active positionnée en haut à gauche',
            'top-right': 'Zone active positionnée en haut à droite', 
            'bottom-left': 'Zone active positionnée en bas à gauche',
            'bottom-right': 'Zone active positionnée en bas à droite'
        };
        
        this.showSuccess(fallbackMessages[position] || `Zone active positionnée (${position})`);
    },
    
    /**
     * Dispatch event to notify of the change in active area position
     * @param {string} position - The position name
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Area width
     * @param {number} height - Area height
     */
    dispatchAreaPositionedEvent(position, x, y, width, height) {
        document.dispatchEvent(new CustomEvent('activearea:positioned', {
            detail: {
                position: position,
                offsetX: x,
                offsetY: y,
                width: width,
                height: height
            }
        }));
    }
};

