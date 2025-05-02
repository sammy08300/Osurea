/**
 * Menu contextuel pour l'alignement de la zone active
 */

const ContextMenu = {
    menu: null,
    rectangle: null,
    tabletBoundary: null,
    isVisible: false,

    /**
     * Initialise le menu contextuel
     */
    init() {
        console.log('Initialisation du menu contextuel...');
        
        // Récupérer les éléments existants
        this.rectangle = document.getElementById('rectangle');
        this.tabletBoundary = document.getElementById('tablet-boundary');
        this.menu = document.getElementById('context-menu');
        
        if (!this.rectangle || !this.tabletBoundary || !this.menu) {
            console.error('Menu contextuel: éléments introuvables', {
                rectangle: !!this.rectangle,
                tabletBoundary: !!this.tabletBoundary,
                menu: !!this.menu
            });
            return;
        }
        
        this.setupEventListeners();
        console.log('Menu contextuel initialisé avec succès');
    },
    
    /**
     * Crée le menu contextuel
     */
    createMenu() {
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 hidden';
        
        // Créer une grille 3x3 de boutons de positionnement
        this.menu.innerHTML = `
            <div class="text-center text-sm text-gray-300 mb-2">Position du rectangle</div>
            <div class="grid grid-cols-3 gap-2">
                <!-- Première ligne: Haut-gauche, Haut, Haut-droite -->
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Haut-gauche" data-position="top-left">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="5" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Haut" data-position="top">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="5" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Haut-droite" data-position="top-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="15" cy="5" r="3" fill="currentColor" />
                    </svg>
                </button>
                
                <!-- Deuxième ligne: Gauche, Centre, Droite -->
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Gauche" data-position="left">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="10" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Centre" data-position="center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Droite" data-position="right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="15" cy="10" r="3" fill="currentColor" />
                    </svg>
                </button>
                
                <!-- Troisième ligne: Bas-gauche, Bas, Bas-droite -->
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Bas-gauche" data-position="bottom-left">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="15" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Bas" data-position="bottom">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="15" r="3" fill="currentColor" />
                    </svg>
                </button>
                <button class="align-btn bg-gray-800 hover:bg-gray-700 p-2 rounded-md" title="Bas-droite" data-position="bottom-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="15" cy="15" r="3" fill="currentColor" />
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(this.menu);
    },
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Gestionnaire pour le clic droit sur le rectangle
        this.rectangle.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.show(e.clientX, e.clientY);
        });
        
        // Gestionnaire pour les clics sur les boutons d'alignement avec ID
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
        
        alignmentButtons.forEach(({ id, position }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    this.alignArea(position);
                    this.hide();
                });
            }
        });
        
        // Conserver également l'ancien gestionnaire pour compatibilité
        this.menu.addEventListener('click', (e) => {
            const alignBtn = e.target.closest('.align-btn');
            if (alignBtn && alignBtn.dataset.position) {
                const position = alignBtn.dataset.position;
                this.alignArea(position);
                this.hide();
            }
        });
        
        // Cacher le menu au clic en dehors
        document.addEventListener('click', (e) => {
            if (this.isVisible && !this.menu.contains(e.target)) {
                this.hide();
            }
        });
        
        // Cacher le menu lors du défilement ou du redimensionnement
        window.addEventListener('scroll', () => this.hide());
        window.addEventListener('resize', () => this.hide());
    },
    
    /**
     * Affiche le menu contextuel à la position spécifiée
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     */
    show(x, y) {
        if (!this.menu) return;
        
        // Rendre le menu visible pour calculer ses dimensions
        this.menu.style.display = 'block';
        this.menu.classList.remove('hidden');
        
        // Calculer les dimensions
        const menuRect = this.menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Ajuster la position pour éviter les débordements
        if (x + menuRect.width > windowWidth) {
            x = windowWidth - menuRect.width - 5;
        }
        
        if (y + menuRect.height > windowHeight) {
            y = windowHeight - menuRect.height - 5;
        }
        
        // Positionner le menu
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
        this.isVisible = true;
    },
    
    /**
     * Masque le menu contextuel
     */
    hide() {
        if (this.menu) {
            this.menu.style.display = 'none';
            this.menu.classList.add('hidden');
            this.isVisible = false;
        }
    },
    
    /**
     * Aligne la zone active selon la position spécifiée
     * @param {string} position - Position d'alignement
     */
    alignArea(position) {
        console.log("Alignement à la position:", position);
        
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
        
        // Demi-dimensions pour le calcul des bords
        const halfWidth = areaWidth / 2;
        const halfHeight = areaHeight / 2;
        
        let newX, newY;
        
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
                
            default:
                console.error('Position inconnue:', position);
                return;
        }
        
        // Mettre à jour les champs de saisie
        areaOffsetX.value = formatNumber(newX, 3);
        areaOffsetY.value = formatNumber(newY, 3);
        
        // Mettre à jour l'affichage
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        } else if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
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
