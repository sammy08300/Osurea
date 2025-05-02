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

    init(container, area) {
        this.container = container;
        this.area = area;
        this.setupDragHandlers();
        
        // Initialiser les dimensions
        const rect = container.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;
    },

    setupDragHandlers() {
        // Gestionnaire pour le début du drag
        this.area.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Seulement le clic gauche
                e.preventDefault();
                e.stopPropagation();
                this.startDrag(e);
            }
        });

        // Gestionnaire pour le mouvement
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this.handleAreaDrag(e);
            }
        });

        // Gestionnaire pour la fin du drag
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
        
        // Calculer le point de départ relatif à la zone
        this.dragStartX = event.clientX - areaRect.left;
        this.dragStartY = event.clientY - areaRect.top;
    },

    handleAreaDrag(event) {
        const rect = this.container.getBoundingClientRect();
        
        // Calculer la nouvelle position
        let x = (event.clientX - rect.left - this.dragStartX) / this.scale;
        let y = (event.clientY - rect.top - this.dragStartY) / this.scale;
        
        // Mettre à jour la position de la zone
        this.area.style.left = `${x}px`;
        this.area.style.top = `${y}px`;
        
        // Calculer les offsets en millimètres
        const offsetX = (x - this.containerWidth / 2) * this.mmPerPixel;
        const offsetY = (y - this.containerHeight / 2) * this.mmPerPixel;
        
        // Mettre à jour les inputs
        document.getElementById('areaOffsetX').value = formatNumber(offsetX, 3);
        document.getElementById('areaOffsetY').value = formatNumber(offsetY, 3);
        
        // Mettre à jour l'affichage
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