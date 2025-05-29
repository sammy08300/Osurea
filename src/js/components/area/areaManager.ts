// AreaManager: Handles drag and position logic for a movable area inside a container
// Dependencies (to be injected): formatNumber, updateDisplay

interface AreaManagerInitParams {
    container: HTMLElement;
    area: HTMLElement;
    formatNumber?: (n: number, precision?: number) => string;
    updateDisplay?: () => void;
}

interface Coordinates {
    clientX: number;
    clientY: number;
}

const AreaManager = {
    container: null as HTMLElement | null,
    area: null as HTMLElement | null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    scale: 1,
    containerWidth: 0,
    containerHeight: 0,
    mmPerPixel: 1,
    formatNumber: (n: number, precision: number = 0): string => n.toFixed(precision), // Default no-op, should be injected
    updateDisplay: null as (() => void) | null, // Optional, should be injected
    _onMouseDown: null as ((event: MouseEvent) => void) | null,
    _onTouchStart: null as ((event: TouchEvent) => void) | null,
    _onMouseMove: null as ((event: MouseEvent) => void) | null,
    _onTouchMove: null as ((event: TouchEvent) => void) | null,
    _onMouseUp: null as (() => void) | null,
    _onTouchEnd: null as (() => void) | null,
    _offsetXInput: null as HTMLInputElement | null, // Cache DOM element
    _offsetYInput: null as HTMLInputElement | null, // Cache DOM element
    _rafId: null as number | null, // For requestAnimationFrame
    _lastX: 0,
    _lastY: 0,
    _lastMoveTime: 0,

    // Initialize the area manager
    init({ container, area, formatNumber, updateDisplay }: AreaManagerInitParams): void {
        this.container = container;
        this.area = area;
        if (formatNumber) this.formatNumber = formatNumber;
        if (updateDisplay) this.updateDisplay = updateDisplay;

        // Cache DOM elements
        this._offsetXInput = document.getElementById('areaOffsetX') as HTMLInputElement | null;
        this._offsetYInput = document.getElementById('areaOffsetY') as HTMLInputElement | null;

        this._setupEventHandlers();

        // Initialize the container dimensions
        const { width, height } = container.getBoundingClientRect();
        this.containerWidth = width;
        this.containerHeight = height;
    },

    _setupEventHandlers(): void {
        if (!this.area) return;
        // Bind event handlers so they can be removed if needed
        this._onMouseDown = this._startDrag.bind(this) as (event: MouseEvent) => void;
        this._onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                e.stopPropagation();
                this._startDrag(e.touches[0]);
            }
        };

        this._onMouseMove = (e: MouseEvent) => {
            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this._queueDragUpdate(e);
            }
        };

        this._onTouchMove = (e: TouchEvent) => {
            if (this.isDragging && e.touches.length === 1) {
                e.preventDefault();
                e.stopPropagation();
                this._queueDragUpdate(e.touches[0]);
            }
        };

        this._onMouseUp = this._stopDrag.bind(this);
        this._onTouchEnd = this._stopDrag.bind(this);

        // Add mouse event listeners with capture phase for better responsiveness
        this.area.addEventListener('mousedown', this._onMouseDown!, { passive: false });
        document.addEventListener('mousemove', this._onMouseMove!, { passive: false, capture: true });
        document.addEventListener('mouseup', this._onMouseUp!, { capture: true });

        // Add touch event listeners with capture phase
        this.area.addEventListener('touchstart', this._onTouchStart, { passive: false });
        document.addEventListener('touchmove', this._onTouchMove!, { passive: false, capture: true });
        document.addEventListener('touchend', this._onTouchEnd!, { capture: true });
        document.addEventListener('touchcancel', this._onTouchEnd!, { capture: true });
    },

    destroy(): void {
        // Cancel any pending animation frame
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        // Remove event listeners
        if (this.area) {
            if (this._onMouseDown) this.area.removeEventListener('mousedown', this._onMouseDown);
            if (this._onTouchStart) this.area.removeEventListener('touchstart', this._onTouchStart);
        }

        if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove, { capture: true });
        if (this._onMouseUp) document.removeEventListener('mouseup', this._onMouseUp, { capture: true });
        if (this._onTouchMove) document.removeEventListener('touchmove', this._onTouchMove, { capture: true });
        if (this._onTouchEnd) {
            document.removeEventListener('touchend', this._onTouchEnd, { capture: true });
            document.removeEventListener('touchcancel', this._onTouchEnd, { capture: true });
        }
    },

    _startDrag(event: MouseEvent | Touch): void {
        if (!this.area) return;
        this.isDragging = true;
        const areaRect = this.area.getBoundingClientRect();
        this.dragStartX = event.clientX - areaRect.left;
        this.dragStartY = event.clientY - areaRect.top;

        // Disable any transitions during drag for improved performance
        this.area.style.transition = 'none';

        // Force hardware acceleration to improve performance
        this.area.style.transform = 'translateZ(0)';

        // Add dragging class for CSS optimizations
        this.area.classList.add('dragging');

        // Store current position
        this._lastX = parseFloat(this.area.style.left) || 0;
        this._lastY = parseFloat(this.area.style.top) || 0;
        this._lastMoveTime = performance.now();
    },

    _queueDragUpdate(event: MouseEvent | Touch): void {
        // Store event data to prevent loss between frames
        const clientX = event.clientX;
        const clientY = event.clientY;
        const now = performance.now();

        // Limit updates to every 16ms (~ 60fps) for consistent behavior across browsers
        if (now - this._lastMoveTime < 16) {
            // If we already have an animation frame request, just update the stored position
            if (this._rafId) {
                return;
            }
        }

        // Cancel any existing animation frame
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }

        this._lastMoveTime = now;

        // Queue the update on the next animation frame for better performance
        this._rafId = requestAnimationFrame(() => {
            // Use the stored event coordinates
            this._handleAreaDrag({ clientX, clientY });
            this._rafId = null;
        });
    },

    _handleAreaDrag(event: Coordinates): void {
        if (!this.container || !this.area) return;
        const containerRect = this.container.getBoundingClientRect();
        let x = (event.clientX - containerRect.left - this.dragStartX) / this.scale;
        let y = (event.clientY - containerRect.top - this.dragStartY) / this.scale;

        // Apply using transform for smoother performance in all browsers
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

        // Store current position
        this._lastX = x;
        this._lastY = y;
    },

    _stopDrag(): void {
        if (!this.isDragging || !this.area) return;

        this.isDragging = false;

        // Re-enable transitions after drag ends
        this.area.style.transition = '';

        // Remove dragging class
        this.area.classList.remove('dragging');
    },

    updateScale(scale: number): void {
        this.scale = scale;
    },

    updateContainerDimensions(width: number, height: number): void {
        this.containerWidth = width;
        this.containerHeight = height;
    },

    updateMmPerPixel(value: number): void {
        this.mmPerPixel = value;
    },

    // Set position programmatically
    setPosition(x: number, y: number, inMillimeters: boolean = false): void {
        if (!this.area) return;
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

export default AreaManager;
