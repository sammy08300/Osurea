// AreaManager: Handles drag and position logic for a movable area inside a container
// Dependencies (to be injected): formatNumber, updateDisplay

const AreaManager = {
    container: null,
    area: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    scale: 1,
    containerWidth: 0,
    containerHeight: 0,
    mmPerPixel: 1,
    formatNumber: (n) => n, // Default no-op, should be injected
    updateDisplay: null, // Optional, should be injected
    _onMouseMove: null,
    _onMouseUp: null,
    _offsetXInput: null, // Cache DOM element
    _offsetYInput: null, // Cache DOM element
    _rafId: null, // For requestAnimationFrame

    // Initialize the area manager
    init({ container, area, formatNumber, updateDisplay }) {
        this.container = container;
        this.area = area;
        if (formatNumber) this.formatNumber = formatNumber;
        if (updateDisplay) this.updateDisplay = updateDisplay;
        
        // Cache DOM elements
        this._offsetXInput = document.getElementById('areaOffsetX');
        this._offsetYInput = document.getElementById('areaOffsetY');
        
        this._setupEventHandlers();

        // Initialize the container dimensions
        const { width, height } = container.getBoundingClientRect();
        this.containerWidth = width;
        this.containerHeight = height;
    },

    _setupEventHandlers() {
        // Bind event handlers so they can be removed if needed
        this._onMouseDown = this._startDrag.bind(this);
        this._onTouchStart = (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                e.stopPropagation();
                this._startDrag(e.touches[0]);
            }
        };
        
        this._onMouseMove = (e) => {
            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this._queueDragUpdate(e);
            }
        };
        
        this._onTouchMove = (e) => {
            if (this.isDragging && e.touches.length === 1) {
                e.preventDefault();
                e.stopPropagation();
                this._queueDragUpdate(e.touches[0]);
            }
        };
        
        this._onMouseUp = this._stopDrag.bind(this);
        this._onTouchEnd = this._stopDrag.bind(this);

        // Add mouse event listeners
        this.area.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mousemove', this._onMouseMove, { passive: false });
        document.addEventListener('mouseup', this._onMouseUp);
        
        // Add touch event listeners
        this.area.addEventListener('touchstart', this._onTouchStart, { passive: false });
        document.addEventListener('touchmove', this._onTouchMove, { passive: false });
        document.addEventListener('touchend', this._onTouchEnd);
        document.addEventListener('touchcancel', this._onTouchEnd);
    },

    destroy() {
        // Cancel any pending animation frame
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        // Remove event listeners
        if (this.area) {
            this.area.removeEventListener('mousedown', this._onMouseDown);
            this.area.removeEventListener('touchstart', this._onTouchStart);
        }
        
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('touchmove', this._onTouchMove);
        document.removeEventListener('touchend', this._onTouchEnd);
        document.removeEventListener('touchcancel', this._onTouchEnd);
    },

    _startDrag(event) {
        this.isDragging = true;
        const areaRect = this.area.getBoundingClientRect();
        this.dragStartX = event.clientX - areaRect.left;
        this.dragStartY = event.clientY - areaRect.top;
    },

    _queueDragUpdate(event) {
        // Cancel any existing animation frame
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        
        // Queue the update on the next animation frame for better performance
        this._rafId = requestAnimationFrame(() => {
            this._handleAreaDrag(event);
            this._rafId = null;
        });
    },

    _handleAreaDrag(event) {
        const containerRect = this.container.getBoundingClientRect();
        let x = (event.clientX - containerRect.left - this.dragStartX) / this.scale;
        let y = (event.clientY - containerRect.top - this.dragStartY) / this.scale;
        
        // Optional: add bounds checking to prevent dragging outside container
        // x = Math.max(0, Math.min(x, this.containerWidth - this.area.offsetWidth)); 
        // y = Math.max(0, Math.min(y, this.containerHeight - this.area.offsetHeight));
        
        this.area.style.left = `${x}px`;
        this.area.style.top = `${y}px`;

        // Calculate the offsets in millimeters
        const offsetX = (x - this.containerWidth / 2) * this.mmPerPixel;
        const offsetY = (y - this.containerHeight / 2) * this.mmPerPixel;

        // Update the inputs if they exist
        if (this._offsetXInput) this._offsetXInput.value = this.formatNumber(offsetX, 3);
        if (this._offsetYInput) this._offsetYInput.value = this.formatNumber(offsetY, 3);

        // Update the display if provided
        if (typeof this.updateDisplay === 'function') {
            this.updateDisplay();
        }
    },

    _stopDrag() {
        this.isDragging = false;
    },

    updateScale(scale) {
        this.scale = scale;
    },

    updateContainerDimensions(width, height) {
        this.containerWidth = width;
        this.containerHeight = height;
    },

    updateMmPerPixel(value) {
        this.mmPerPixel = value;
    },
    
    // New method to set position programmatically
    setPosition(x, y, inMillimeters = false) {
        if (inMillimeters) {
            // Convert from mm to pixels
            x = (x / this.mmPerPixel) + (this.containerWidth / 2);
            y = (y / this.mmPerPixel) + (this.containerHeight / 2);
        }
        
        this.area.style.left = `${x}px`;
        this.area.style.top = `${y}px`;
        
        if (typeof this.updateDisplay === 'function') {
            this.updateDisplay();
        }
    }
}; 