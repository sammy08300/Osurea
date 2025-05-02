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

    // Initialize the area manager
    init(container, area) {
        this.container = container;
        this.area = area;
        this.setupDragHandlers();
        
        // Initialize the container dimensions
        const rect = container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
    },

    setupDragHandlers() {
        // Drag start handler
        this.area.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Only left click 
                e.preventDefault();
                e.stopPropagation();
                this.startDrag(e);
            }
        });

        // Drag movement handler
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this.handleAreaDrag(e);
            }
        });

        // Drag end handler
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.stopDrag();
            }
        });
    },

    startDrag(event) {
        this.isDragging = true;
        
        const rect = this.container.getBoundingClientRect();
        const areaRect = this.area.getBoundingClientRect();
        
        // Calculate the starting point relative to the area
        this.dragStartX = event.clientX - areaRect.left;
        this.dragStartY = event.clientY - areaRect.top;
    },

    handleAreaDrag(event) {
        const rect = this.container.getBoundingClientRect();
        
        // Calculate the new position
        let x = (event.clientX - rect.left - this.dragStartX) / this.scale;
        let y = (event.clientY - rect.top - this.dragStartY) / this.scale;
        
        // Update the area position
        this.area.style.left = `${x}px`;
        this.area.style.top = `${y}px`;
        
        // Calculate the offsets in millimeters
        const offsetX = (x - this.containerWidth / 2) * this.mmPerPixel;
        const offsetY = (y - this.containerHeight / 2) * this.mmPerPixel;
        
        // Update the inputs
        document.getElementById('areaOffsetX').value = formatNumber(offsetX, 3);
        document.getElementById('areaOffsetY').value = formatNumber(offsetY, 3);
        
        // Update the display
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    },

    stopDrag() {
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
    }
}; 