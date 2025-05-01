/**
 * Main application module
 */

// Global application state
const appState = {
    tabletData: [],
    editingFavoriteId: null,
    originalValues: null,
    currentRatio: 1.0,
    debouncedUpdateRatio: null,
    
    /**
     * Load tablet data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadTabletData() {
        try {
            const response = await fetch('data/tablets.json');
            if (!response.ok) {
                throw new Error('Failed to load tablet data');
            }
            this.tabletData = await response.json();
            
            // Initialiser le nouveau sélecteur de tablettes
            if (typeof TabletSelector !== 'undefined') {
                TabletSelector.init(this.tabletData);
            } else {
                // Fallback vers l'ancienne méthode si nécessaire
                this.populateTabletPresets();
            }
        } catch (error) {
            console.error('Error loading tablet data:', error);
            Notifications.error('Erreur de chargement des données tablettes');
        }
    },
    
    /**
     * Populate tablet preset dropdown
     */
    populateTabletPresets() {
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        
        if (!tabletPresetSelect || !this.tabletData.length) {
            return;
        }
        
        console.warn('Utilisation de la méthode populateTabletPresets obsolète. Utilisez TabletSelector si possible.');
        
        // Group tablets by brand
        const tabletsByBrand = this.tabletData.reduce((groups, tablet) => {
            if (!groups[tablet.brand]) {
                groups[tablet.brand] = [];
            }
            groups[tablet.brand].push(tablet);
            return groups;
        }, {});
        
        // Clear existing options except the first two
        while (tabletPresetSelect.options.length > 2) {
            tabletPresetSelect.remove(2);
        }
        
        // Add option groups by brand
        Object.keys(tabletsByBrand).sort().forEach(brand => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = brand;
            
            // Add options for each tablet model
            tabletsByBrand[brand].forEach(tablet => {
                const option = document.createElement('option');
                option.value = `${brand}_${tablet.model}`.replace(/\s+/g, '_');
                option.textContent = tablet.model;
                option.dataset.width = tablet.width;
                option.dataset.height = tablet.height;
                option.dataset.brand = tablet.brand;
                optgroup.appendChild(option);
            });
            
            tabletPresetSelect.appendChild(optgroup);
        });
    },
    
    /**
     * Setup all input listeners
     */
    setupInputListeners() {
        // Tablet presets - ancienne méthode - gardée pour compatibilité
        const tabletPresetSelect = document.getElementById('tabletPresetSelect');
        if (tabletPresetSelect) {
            tabletPresetSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                const selectedOption = e.target.selectedOptions[0];
                
                if (selectedValue === 'custom') {
                    const tabletWidthGroup = document.getElementById('tablet-width-group');
                    const tabletHeightGroup = document.getElementById('tablet-height-group');
                    const tabletManualHr = document.getElementById('tablet-manual-hr');
                    
                    if (tabletWidthGroup && tabletHeightGroup && tabletManualHr) {
                        tabletWidthGroup.classList.remove('hidden');
                        tabletHeightGroup.classList.remove('hidden');
                        tabletManualHr.classList.remove('hidden');
                    }
                    
                    this.cancelEditMode();
                    return;
                }
                
                if (selectedValue && selectedOption.dataset.width) {
                    const width = parseFloat(selectedOption.dataset.width);
                    const height = parseFloat(selectedOption.dataset.height);
                    const tabletWidthInput = document.getElementById('tabletWidth');
                    const tabletHeightInput = document.getElementById('tabletHeight');
                    const tabletWidthGroup = document.getElementById('tablet-width-group');
                    const tabletHeightGroup = document.getElementById('tablet-height-group');
                    const tabletManualHr = document.getElementById('tablet-manual-hr');
                    
                    if (!isNaN(width) && !isNaN(height) && tabletWidthInput && tabletHeightInput) {
                        tabletWidthInput.value = formatNumber(width);
                        tabletHeightInput.value = formatNumber(height);
                        
                        if (tabletWidthGroup && tabletHeightGroup && tabletManualHr) {
                            tabletWidthGroup.classList.add('hidden');
                            tabletHeightGroup.classList.add('hidden');
                            tabletManualHr.classList.add('hidden');
                        }
                        
                        this.cancelEditMode();
                        updateDisplay();
                    }
                } else {
                    const tabletWidthGroup = document.getElementById('tablet-width-group');
                    const tabletHeightGroup = document.getElementById('tablet-height-group');
                    const tabletManualHr = document.getElementById('tablet-manual-hr');
                    
                    if (tabletWidthGroup && tabletHeightGroup && tabletManualHr) {
                        tabletWidthGroup.classList.add('hidden');
                        tabletHeightGroup.classList.add('hidden');
                        tabletManualHr.classList.add('hidden');
                    }
                }
            });
        }
        
        // Tablet dimensions
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        
        if (tabletWidthInput) {
            tabletWidthInput.addEventListener('input', () => {
                // Si l'ancien sélecteur existe, mettre à jour sa valeur
                if (tabletPresetSelect) {
                    tabletPresetSelect.value = 'custom';
                }
                
                // Mettre à jour le texte du nouveau sélecteur
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText) {
                    selectorText.textContent = 'Dimensions personnalisées';
                    selectorText.title = 'Dimensions personnalisées';
                }
                
                // S'assurer que le conteneur de dimensions est visible
                const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
                if (tabletDimensionsContainer) {
                    tabletDimensionsContainer.classList.remove('hidden');
                }
                
                this.cancelEditMode();
                updateDisplay();
            });
        }
        
        if (tabletHeightInput) {
            tabletHeightInput.addEventListener('input', () => {
                // Si l'ancien sélecteur existe, mettre à jour sa valeur
                if (tabletPresetSelect) {
                    tabletPresetSelect.value = 'custom';
                }
                
                // Mettre à jour le texte du nouveau sélecteur
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText) {
                    selectorText.textContent = 'Dimensions personnalisées';
                    selectorText.title = 'Dimensions personnalisées';
                }
                
                // S'assurer que le conteneur de dimensions est visible
                const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
                if (tabletDimensionsContainer) {
                    tabletDimensionsContainer.classList.remove('hidden');
                }
                
                this.cancelEditMode();
                updateDisplay();
            });
        }
        
        // Area dimensions
        const areaWidthInput = document.getElementById('areaWidth');
        const areaHeightInput = document.getElementById('areaHeight');
        const customRatioInput = document.getElementById('customRatio');
        const lockRatioButton = document.getElementById('lockRatio');
        
        // Fonction pour mettre à jour l'état du champ ratio en fonction de l'état du verrou
        const updateRatioFieldState = () => {
            const isLocked = lockRatioButton.getAttribute('aria-pressed') === 'true';
            customRatioInput.readOnly = !isLocked;
            
            // Appliquer les styles appropriés en fonction de l'état
            if (isLocked) {
                // Si verrouillé, l'input est modifiable et garde la même apparence que les autres inputs
                customRatioInput.classList.remove('ratio-editable');
                customRatioInput.classList.add('ratio-locked');
                // Réinitialiser les styles inline
                customRatioInput.style.backgroundColor = "";
                customRatioInput.style.color = "";
                customRatioInput.style.pointerEvents = ""; // Permettre l'interaction
                customRatioInput.title = "Ratio personnalisé (modifiable)";
            } else {
                // Si déverrouillé, l'input n'est pas modifiable et a une apparence plus sombre
                customRatioInput.classList.remove('ratio-locked');
                customRatioInput.classList.add('ratio-editable');
                customRatioInput.style.backgroundColor = "#111827"; // bg-gray-900 - plus foncé
                customRatioInput.style.color = "#9CA3AF"; // text-gray-400 - plus clair
                customRatioInput.style.pointerEvents = "none"; // Empêcher l'interaction
                customRatioInput.title = "Ratio calculé automatiquement (non modifiable)";
            }
        };
        
        // Rendre la fonction accessible globalement
        window.updateRatioFieldState = updateRatioFieldState;
        
        // Initialiser l'état du champ ratio
        updateRatioFieldState();
        
        // Appliquer le style initial si déverrouillé
        if (lockRatioButton.getAttribute('aria-pressed') !== 'true') {
            customRatioInput.style.backgroundColor = "#111827"; // bg-gray-900 - plus foncé
            customRatioInput.style.color = "#9CA3AF"; // text-gray-400 - plus clair
            customRatioInput.style.pointerEvents = "none"; // Empêcher l'interaction
        }
        
        // Ajouter un écouteur d'événement au bouton de verrouillage pour mettre à jour l'état du champ
        lockRatioButton.addEventListener('click', () => {
            // L'état du bouton va changer après l'exécution de cet événement
            const willBeLocked = lockRatioButton.getAttribute('aria-pressed') !== 'true';
            
            if (willBeLocked) {
                // Si on va verrouiller, on prend le ratio actuel des dimensions
                const width = parseFloatSafe(areaWidthInput.value);
                const height = parseFloatSafe(areaHeightInput.value);
                
                if (height > 0 && width > 0) {
                    this.currentRatio = width / height;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
            } else {
                // Si on va déverrouiller, on recalcule le ratio à partir des dimensions
                // (même si c'est le même, c'est pour la cohérence)
                this.debouncedUpdateRatio();
            }
            
            // Mettre à jour l'état du champ après le changement d'état du bouton
            setTimeout(() => {
                updateRatioFieldState();
            }, 0);
        });
        
        areaWidthInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            
            // Uniquement mettre à jour la hauteur si le ratio est verrouillé
            if (lockRatioButton.getAttribute('aria-pressed') === 'true' && this.currentRatio > 0 && !isNaN(this.currentRatio)) {
                const newHeight = parseFloatSafe(areaWidthInput.value) / this.currentRatio;
                if (!isNaN(newHeight) && newHeight >= 0) {
                    areaHeightInput.value = formatNumber(newHeight);
                }
            } else {
                this.debouncedUpdateRatio();
            }
            
            updateDisplayWithoutRatio();
        });
        
        areaHeightInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            
            // Uniquement mettre à jour la largeur si le ratio est verrouillé
            if (lockRatioButton.getAttribute('aria-pressed') === 'true' && this.currentRatio > 0 && !isNaN(this.currentRatio)) {
                const newWidth = parseFloatSafe(areaHeightInput.value) * this.currentRatio;
                if (!isNaN(newWidth) && newWidth >= 0) {
                    areaWidthInput.value = formatNumber(newWidth);
                }
            } else {
                this.debouncedUpdateRatio();
            }
            
            updateDisplayWithoutRatio();
        });
        
        customRatioInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            
            // Si le champ est en lecture seule, ignorer la saisie
            if (customRatioInput.readOnly) {
                return;
            }
            
            const newRatio = parseFloatSafe(customRatioInput.value);
            if (!isNaN(newRatio) && newRatio > 0) {
                this.currentRatio = newRatio;
                
                if (lockRatioButton.getAttribute('aria-pressed') === 'true') {
                    const currentWidth = parseFloatSafe(areaWidthInput.value);
                    const newHeight = currentWidth / this.currentRatio;
                    
                    if (!isNaN(newHeight) && newHeight >= 0) {
                        areaHeightInput.value = formatNumber(newHeight);
                    }
                }
            } else {
                this.currentRatio = NaN;
            }
            
            updateDisplay();
        });
        
        // Ajouter un événement focus pour empêcher les mises à jour pendant l'édition directe
        customRatioInput.addEventListener('focus', () => {
            // Ne permettre l'édition que si le ratio est verrouillé
            if (!customRatioInput.readOnly) {
                customRatioInput.dataset.editing = 'true';
            }
        });
        
        customRatioInput.addEventListener('blur', () => {
            delete customRatioInput.dataset.editing;
            // Recalculer le ratio en fonction des dimensions actuelles si nécessaire
            if (lockRatioButton.getAttribute('aria-pressed') !== 'true') {
                this.debouncedUpdateRatio();
            }
        });
        
        // Area position
        const areaOffsetXInput = document.getElementById('areaOffsetX');
        const areaOffsetYInput = document.getElementById('areaOffsetY');
        
        areaOffsetXInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            updateDisplay();
        });
        
        areaOffsetYInput.addEventListener('input', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            updateDisplay();
        });
        
        // Action buttons
        const swapButton = document.getElementById('swap-btn');
        const centerButton = document.getElementById('center-btn');
        const copyButton = document.getElementById('copy-btn');
        const saveButton = document.getElementById('save-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        swapButton.addEventListener('click', () => {
            this.cancelEditMode();
            
            const width = areaWidthInput.value;
            areaWidthInput.value = areaHeightInput.value;
            areaHeightInput.value = width;
            
            // Si le verrou est activé, mettre à jour immédiatement le ratio
            if (lockRatioButton.getAttribute('aria-pressed') === 'true') {
                const newWidth = parseFloatSafe(areaWidthInput.value);
                const newHeight = parseFloatSafe(areaHeightInput.value);
                
                if (newHeight > 0 && newWidth > 0) {
                    this.currentRatio = newWidth / newHeight;
                    customRatioInput.value = formatNumber(this.currentRatio, 3);
                }
                updateDisplay();
            } else {
                // Sinon utiliser la fonction debounced et mettre à jour l'affichage sans le ratio
                this.debouncedUpdateRatio();
                updateDisplayWithoutRatio();
            }
        });
        
        centerButton.addEventListener('click', () => {
            if (!appState.editingFavoriteId) {
                this.cancelEditMode();
            }
            centerArea();
        });
        
        copyButton.addEventListener('click', () => {
            const width = parseFloatSafe(areaWidthInput.value);
            const height = parseFloatSafe(areaHeightInput.value);
            const offsetX = parseFloatSafe(areaOffsetXInput.value);
            const offsetY = parseFloatSafe(areaOffsetYInput.value);
            const ratio = (height > 0) ? (width / height).toFixed(3) : 'N/A';
            
            const info = `-- Zone Active Réelle --
Largeur: ${formatNumber(width)} mm
Hauteur: ${formatNumber(height)} mm
Ratio: ${ratio}
Centre X: ${formatNumber(offsetX, 3)} mm
Centre Y: ${formatNumber(offsetY, 3)} mm`;
            
            navigator.clipboard.writeText(info)
                .then(() => {
                    Notifications.success('Informations copiées !');
                })
                .catch(() => {
                    Notifications.error('Erreur lors de la copie');
                    console.error('Failed to copy text: ', info);
                });
        });
        
        saveButton.addEventListener('click', () => {
            Favorites.saveFavorite();
        });
        
        cancelEditBtn.addEventListener('click', () => {
            this.cancelEditMode();
        });
        
        // Bouton de réinitialisation des préférences
        const resetPrefsBtn = document.getElementById('reset-prefs-btn');
        if (resetPrefsBtn && typeof PreferencesManager !== 'undefined') {
            resetPrefsBtn.addEventListener('click', () => {
                PreferencesManager.showResetConfirmation((confirmed) => {
                    if (confirmed) {
                        PreferencesManager.resetPreferences();
                    }
                });
            });
        }
    },
    
    /**
     * Start editing a favorite
     * @param {string|number} id - ID of the favorite to edit
     */
    startEditFavorite(id) {
        this.editingFavoriteId = id;
        
        const saveBtn = document.getElementById('save-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        
        // Update button styling
        saveBtn.textContent = "Mettre à Jour";
        saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
        saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
        cancelEditBtn.classList.remove('hidden');
    },
    
    /**
     * Cancel edit mode
     */
    cancelEditMode() {
        if (this.editingFavoriteId && this.originalValues) {
            // Restaurer les valeurs originales
            document.getElementById('areaWidth').value = formatNumber(this.originalValues.width);
            document.getElementById('areaHeight').value = formatNumber(this.originalValues.height);
            document.getElementById('areaOffsetX').value = formatNumber(this.originalValues.x, 3);
            document.getElementById('areaOffsetY').value = formatNumber(this.originalValues.y, 3);
            
            if (this.originalValues.ratio) {
                document.getElementById('customRatio').value = formatNumber(this.originalValues.ratio, 3);
            }
            
            if (this.originalValues.tabletW && this.originalValues.tabletH) {
                document.getElementById('tabletWidth').value = formatNumber(this.originalValues.tabletW);
                document.getElementById('tabletHeight').value = formatNumber(this.originalValues.tabletH);
            }
            
            if (this.originalValues.presetInfo) {
                const tabletSelector = document.getElementById('tabletSelectorButton');
                if (tabletSelector) {
                    tabletSelector.querySelector('#tabletSelectorText').textContent = this.originalValues.presetInfo;
                }
            }
            
            // Mettre à jour l'affichage
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
            
            // Cacher le bouton d'annulation
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) {
                cancelBtn.classList.add('hidden');
            }
            
            // Réinitialiser l'état
            this.editingFavoriteId = null;
            this.originalValues = null;
            
            Notifications.info('Modifications annulées');
        }
    },
    
    /**
     * Initialize app components and load data
     */
    async init() {
        // Initialize notification system
        Notifications.init();
        
        // Précharger les favoris pendant le chargement des autres données
        if (typeof Favorites !== 'undefined') {
            // Initialiser Favorites le plus tôt possible pour éviter le flash
            Favorites.init();
        }
        
        // Initialiser le gestionnaire de préférences s'il existe
        if (typeof PreferencesManager !== 'undefined') {
            PreferencesManager.init();
        }
        
        // Load tablet data
        await this.loadTabletData();
        
        // Setup input event listeners
        this.setupInputListeners();
        
        // Appliquer l'état initial du champ de ratio
        const lockRatioButton = document.getElementById('lockRatio');
        const customRatioInput = document.getElementById('customRatio');
        if (lockRatioButton && customRatioInput && typeof window.updateRatioFieldState === 'function') {
            window.updateRatioFieldState();
        }
        
        // Création d'une fonction debounce pour mettre à jour le ratio
        this.debouncedUpdateRatio = debounce(() => {
            const areaWidthInput = document.getElementById('areaWidth');
            const areaHeightInput = document.getElementById('areaHeight');
            const customRatioInput = document.getElementById('customRatio');
            const lockRatioButton = document.getElementById('lockRatio');
            
            const width = parseFloatSafe(areaWidthInput.value);
            const height = parseFloatSafe(areaHeightInput.value);
            
            if (height > 0 && width > 0) {
                const calculatedRatio = width / height;
                // Toujours mettre à jour le ratio, sauf si l'utilisateur édite directement le champ
                if (!customRatioInput.dataset.editing && !customRatioInput.matches(':focus')) {
                    customRatioInput.value = formatNumber(calculatedRatio, 3);
                    this.currentRatio = calculatedRatio;
                }
            }
        }, 300); // 300ms delay
        
        // Start with default values
        updateDisplay();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    appState.init();
    
    // Empêcher le menu contextuel du navigateur sur toute la page
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // S'assurer que le menu contextuel est initialisé après le visualiseur
    setTimeout(() => {
        ContextMenu.init();
        console.log('Menu contextuel initialisé depuis le chargement du DOM');
    }, 500);

    // Gestion du menu dépliant du récapitulatif
    const recapCard = document.getElementById('recap-card');
    const recapToggle = document.getElementById('recap-toggle');
    const recapContent = document.getElementById('recap-content');
    const recapArrow = document.getElementById('recap-arrow');
    
    // État initial : plié
    let isRecapExpanded = false;
    
    // Fonction pour mettre à jour l'état visuel
    const updateRecapState = () => {
        if (isRecapExpanded) {
            // Déplier le contenu
            const contentHeight = recapContent.scrollHeight;
            recapContent.style.maxHeight = `${contentHeight}px`;
            recapContent.style.opacity = '1';
            recapContent.classList.add('border-t', 'border-gray-800', 'mt-3', 'pt-3');
            recapArrow.style.transform = 'rotate(0deg)';
            recapCard.classList.add('bg-gray-850');
            recapCard.classList.remove('bg-gray-900');
            recapCard.classList.remove('cursor-pointer');
            
            // Mettre à jour la hauteur après un court délai pour gérer les changements de contenu
            setTimeout(() => {
                recapContent.style.maxHeight = `${recapContent.scrollHeight}px`;
            }, 50);
        } else {
            // Replier le contenu
            recapContent.style.maxHeight = '0';
            recapContent.style.opacity = '0';
            recapContent.classList.remove('border-t', 'border-gray-800', 'mt-3', 'pt-3');
            recapArrow.style.transform = 'rotate(180deg)';
            recapCard.classList.remove('bg-gray-850');
            recapCard.classList.add('bg-gray-900');
            recapCard.classList.add('cursor-pointer');
        }
    };
    
    // Initialiser l'état
    recapContent.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
    updateRecapState();
    
    // Gérer le clic sur le titre
    recapToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Empêcher la propagation au parent
        
        // Basculer l'état
        isRecapExpanded = !isRecapExpanded;
        updateRecapState();
        
        // Effet visuel sur le clic
        const ripple = document.createElement('div');
        ripple.className = 'bg-gray-700/30 absolute rounded-full pointer-events-none';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.left = (e.offsetX - 10) + 'px';
        ripple.style.top = (e.offsetY - 10) + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.6s, opacity 0.6s';
        
        recapToggle.style.position = 'relative';
        recapToggle.style.overflow = 'hidden';
        recapToggle.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(40)';
            ripple.style.opacity = '0';
            
            setTimeout(() => {
                recapToggle.removeChild(ripple);
            }, 600);
        }, 10);
    });
    
    // Gérer le clic sur la carte quand le menu est replié
    recapCard.addEventListener('click', (e) => {
        // Ne traiter que si le menu est replié et qu'on n'a pas cliqué sur le toggle
        if (!isRecapExpanded && !recapToggle.contains(e.target)) {
            isRecapExpanded = true;
            updateRecapState();
        }
    });
});