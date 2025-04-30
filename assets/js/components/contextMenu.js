/**
 * Menu contextuel pour l'alignement de la zone active
 */

const ContextMenu = {
    menu: null,
    rectangle: null,
    tabletBoundary: null,

    /**
     * Initialise le menu contextuel
     */
    init() {
        console.log('Initialisation du menu contextuel...');
        
        this.menu = document.getElementById('context-menu');
        this.rectangle = document.getElementById('rectangle');
        this.tabletBoundary = document.getElementById('tablet-boundary');
        
        if (!this.menu || !this.rectangle || !this.tabletBoundary) {
            console.error('Menu contextuel: éléments introuvables', {
                menu: !!this.menu,
                rectangle: !!this.rectangle,
                tabletBoundary: !!this.tabletBoundary
            });
            return;
        }
        
        this.addEventListeners();
        
        console.log('Menu contextuel initialisé avec succès');
    },
    
    /**
     * Ajoute tous les écouteurs d'événements nécessaires
     */
    addEventListeners() {
        // Ajouter les écouteurs pour les boutons d'alignement (9 positions)
        const alignButtons = {
            'align-top-left': 'top-left',
            'align-top': 'top',
            'align-top-right': 'top-right',
            'align-left': 'left',
            'align-center': 'center',
            'align-right': 'right',
            'align-bottom-left': 'bottom-left',
            'align-bottom': 'bottom',
            'align-bottom-right': 'bottom-right'
        };
        
        // Attacher les gestionnaires d'événements pour chaque bouton
        Object.entries(alignButtons).forEach(([id, position]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    this.alignArea(position);
                    this.hideMenu();
                });
            } else {
                console.error(`Bouton ${id} introuvable`);
            }
        });
        
        // Désactiver le clic droit par défaut sur toute la zone de visualisation
        const visualContainer = document.getElementById('visual-container');
        if (visualContainer) {
            visualContainer.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        
        // Gestionnaire de clic droit sur le rectangle
        this.rectangle.addEventListener('mousedown', (e) => {
            // Seulement réagir au clic droit (bouton 2)
            if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                this.showMenu(e.clientX, e.clientY);
                return false;
            }
        });
        
        // Méthode explicite pour le clic droit
        this.rectangle.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showMenu(e.clientX, e.clientY);
            return false;
        });
        
        // Masquer le menu lors d'un clic en-dehors
        document.addEventListener('click', (e) => {
            if (this.menu && !this.menu.contains(e.target)) {
                this.hideMenu();
            }
        });
        
        // Masquer le menu lors d'un défilement
        document.addEventListener('scroll', () => {
            this.hideMenu();
        });
        
        // Masquer le menu lors d'un redimensionnement de fenêtre
        window.addEventListener('resize', () => {
            this.hideMenu();
        });
    },
    
    /**
     * Affiche le menu contextuel à la position spécifiée
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     */
    showMenu(x, y) {
        console.log('Affichage du menu contextuel à', x, y);
        
        if (!this.menu) return;
        
        // Rendre visible avant de calculer les dimensions
        this.menu.style.display = 'block';
        
        // Calculer les dimensions du menu
        const menuWidth = this.menu.offsetWidth;
        const menuHeight = this.menu.offsetHeight;
        
        // Dimensions de la fenêtre
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Ajuster la position pour éviter de sortir de l'écran
        if (x + menuWidth > windowWidth) {
            x = windowWidth - menuWidth - 10;
        }
        
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight - 10;
        }
        
        // Définir la position
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
    },
    
    /**
     * Masque le menu contextuel
     */
    hideMenu() {
        if (this.menu) {
            this.menu.style.display = 'none';
        }
    },
    
    /**
     * Aligne la zone active selon la position spécifiée
     * @param {string} position - Position d'alignement
     */
    alignArea(position) {
        const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
        const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
        const areaWidth = parseFloatSafe(document.getElementById('areaWidth').value);
        const areaHeight = parseFloatSafe(document.getElementById('areaHeight').value);
        
        // Vérifier la validité des dimensions
        if ([tabletWidth, tabletHeight, areaWidth, areaHeight].some(v => !isValidNumber(v, 0))) {
            Notifications.error('Dimensions invalides pour l\'alignement');
            return;
        }
        
        const areaOffsetX = document.getElementById('areaOffsetX');
        const areaOffsetY = document.getElementById('areaOffsetY');
        
        let newX = parseFloatSafe(areaOffsetX.value);
        let newY = parseFloatSafe(areaOffsetY.value);
        
        // Annuler le mode édition si actif
        if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
            appState.cancelEditMode();
        }
        
        // Demi-dimensions pour le calcul des bords
        const halfWidth = areaWidth / 2;
        const halfHeight = areaHeight / 2;
        
        // Calculer la nouvelle position selon l'alignement demandé
        switch (position) {
            // Coins
            case 'top-left':
                newX = halfWidth;
                newY = halfHeight;
                break;
            case 'top-right':
                newX = tabletWidth - halfWidth;
                newY = halfHeight;
                break;
            case 'bottom-left':
                newX = halfWidth;
                newY = tabletHeight - halfHeight;
                break;
            case 'bottom-right':
                newX = tabletWidth - halfWidth;
                newY = tabletHeight - halfHeight;
                break;
            
            // Bords
            case 'top':
                newX = tabletWidth / 2; // Centre horizontal
                newY = halfHeight;
                break;
            case 'right':
                newX = tabletWidth - halfWidth;
                newY = tabletHeight / 2; // Centre vertical
                break;
            case 'bottom':
                newX = tabletWidth / 2; // Centre horizontal
                newY = tabletHeight - halfHeight;
                break;
            case 'left':
                newX = halfWidth;
                newY = tabletHeight / 2; // Centre vertical
                break;
            
            // Centre
            case 'center':
                newX = tabletWidth / 2;
                newY = tabletHeight / 2;
                break;
        }
        
        // Mettre à jour les champs de saisie
        areaOffsetX.value = formatNumber(newX, 3);
        areaOffsetY.value = formatNumber(newY, 3);
        
        // Mettre à jour l'affichage
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
        
        // Notification de confirmation
        const positionNames = {
            'left': 'à gauche',
            'right': 'à droite',
            'top': 'en haut',
            'bottom': 'en bas',
            'center': 'au centre',
            'top-left': 'en haut à gauche',
            'top-right': 'en haut à droite', 
            'bottom-left': 'en bas à gauche',
            'bottom-right': 'en bas à droite'
        };
        
        Notifications.success(`Zone active positionnée ${positionNames[position]}`);
    }
};
