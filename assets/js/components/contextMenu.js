/**
 * Context menu component for area alignment options
 */

const ContextMenu = {
    menu: null,
    rectangle: null,
    
    /**
     * Initialize the context menu
     */
    init() {
        this.menu = document.getElementById('context-menu');
        this.rectangle = document.getElementById('rectangle');
        
        if (!this.menu || !this.rectangle) {
            console.error('Context menu or rectangle element not found');
            return;
        }
        
        this.setupEvents();
    },
    
    /**
     * Setup all event listeners
     */
    setupEvents() {
        // Show context menu on right click
        this.rectangle.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Hide context menu on click outside
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        
        // Setup alignment buttons
        document.getElementById('align-left').addEventListener('click', () => this.alignArea('left'));
        document.getElementById('align-right').addEventListener('click', () => this.alignArea('right'));
        document.getElementById('align-center-h').addEventListener('click', () => this.alignArea('center-h'));
        document.getElementById('align-top').addEventListener('click', () => this.alignArea('top'));
        document.getElementById('align-bottom').addEventListener('click', () => this.alignArea('bottom'));
        document.getElementById('align-center-v').addEventListener('click', () => this.alignArea('center-v'));
        document.getElementById('align-center').addEventListener('click', () => this.alignArea('center'));
    },
    
    /**
     * Handle right click to show context menu
     * @param {Event} e - Mouse event
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        const menuWidth = this.menu.offsetWidth;
        const menuHeight = this.menu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Position the menu, ensuring it doesn't go off screen
        let x = e.clientX;
        let y = e.clientY;
        
        if (x + menuWidth > windowWidth) {
            x = windowWidth - menuWidth - 5;
        }
        
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight - 5;
        }
        
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
        this.menu.classList.remove('hidden');
        this.menu.style.display = 'block';
    },
    
    /**
     * Handle document click to hide context menu when clicking outside
     * @param {Event} e - Mouse event
     */
    handleDocumentClick(e) {
        if (!this.menu.contains(e.target) && e.target !== this.rectangle) {
            this.menu.style.display = 'none';
        }
    },
    
    /**
     * Hide the context menu
     */
    hideMenu() {
        if (this.menu) {
            this.menu.style.display = 'none';
        }
    },
    
    /**
     * Align the area based on the specified position
     * @param {string} position - The alignment position (left, right, center-h, top, bottom, center-v, center)
     */
    alignArea(position) {
        const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
        const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
        const areaWidth = parseFloatSafe(document.getElementById('areaWidth').value);
        const areaHeight = parseFloatSafe(document.getElementById('areaHeight').value);
        
        // If any values are invalid, don't allow alignment
        if ([tabletWidth, tabletHeight, areaWidth, areaHeight].some(v => !isValidNumber(v, 0))) {
            Notifications.error('Dimensions invalides pour l\'alignement');
            this.hideMenu();
            return;
        }
        
        const areaOffsetX = document.getElementById('areaOffsetX');
        const areaOffsetY = document.getElementById('areaOffsetY');
        
        let newX = parseFloatSafe(areaOffsetX.value);
        let newY = parseFloatSafe(areaOffsetY.value);
        
        // Cancel edit mode if active
        if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
            appState.cancelEditMode();
        }
        
        switch (position) {
            case 'left':
                newX = areaWidth / 2;
                break;
            case 'right':
                newX = tabletWidth - areaWidth / 2;
                break;
            case 'center-h':
                newX = tabletWidth / 2;
                break;
            case 'top':
                newY = areaHeight / 2;
                break;
            case 'bottom':
                newY = tabletHeight - areaHeight / 2;
                break;
            case 'center-v':
                newY = tabletHeight / 2;
                break;
            case 'center':
                newX = tabletWidth / 2;
                newY = tabletHeight / 2;
                break;
        }
        
        // Update input fields
        areaOffsetX.value = formatNumber(newX, 3);
        areaOffsetY.value = formatNumber(newY, 3);
        
        // Trigger update
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        this.hideMenu();
    }
};
