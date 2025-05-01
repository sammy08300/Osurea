/**
 * Module de gestion des préférences utilisateur
 * Sauvegarde automatiquement l'état de l'application avec LocalStorage
 */

const PreferencesManager = {
    // Clé utilisée pour sauvegarder toutes les préférences
    PREFERENCES_KEY: 'Osu!reaPreferences_v2',
    
    // État actuel des préférences
    _preferences: null,
    
    // Callback pour la confirmation de réinitialisation
    _resetConfirmCallback: null,
    
    /**
     * Initialise le gestionnaire de préférences
     */
    init() {
        // Charger les préférences existantes
        this._preferences = this.loadPreferences();
        
        // Créer le dialogue de confirmation
        this.createResetDialog();
        
        // Appliquer les préférences au chargement initial
        this.applyPreferences();
        
        // Configurer les écouteurs d'événements pour sauvegarder automatiquement
        this.setupEventListeners();
        
        console.log('Gestionnaire de préférences initialisé');
    },
    
    /**
     * Crée le dialogue de confirmation de réinitialisation
     */
    createResetDialog() {
        // Vérifier si le dialogue existe déjà
        if (document.getElementById('reset-prefs-dialog')) {
            return;
        }
        
        // Créer le dialogue
        const resetDialog = document.createElement('div');
        resetDialog.id = 'reset-prefs-dialog';
        resetDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden';
        resetDialog.innerHTML = `
            <div class="bg-gray-900 rounded-lg p-6 shadow-xl max-w-md w-full border border-gray-700">
                <h3 class="text-lg font-medium text-white mb-4">Confirmation de réinitialisation</h3>
                <p class="text-gray-300 text-sm mb-4">Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ? Cette action est irréversible et la page sera rechargée.</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-reset-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">Annuler</button>
                    <button id="confirm-reset-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">Réinitialiser</button>
                </div>
            </div>
        `;
        
        // Ajouter le dialogue au document
        document.body.appendChild(resetDialog);
        
        // Configurer les écouteurs d'événements
        const cancelResetBtn = document.getElementById('cancel-reset-btn');
        const confirmResetBtn = document.getElementById('confirm-reset-btn');
        
        cancelResetBtn.addEventListener('click', () => {
            resetDialog.classList.add('hidden');
            if (this._resetConfirmCallback) {
                this._resetConfirmCallback(false);
                this._resetConfirmCallback = null;
            }
        });
        
        confirmResetBtn.addEventListener('click', () => {
            resetDialog.classList.add('hidden');
            if (this._resetConfirmCallback) {
                this._resetConfirmCallback(true);
                this._resetConfirmCallback = null;
            }
        });
    },
    
    /**
     * Affiche le dialogue de confirmation de réinitialisation
     * @param {Function} callback - Fonction à appeler avec le résultat (true/false)
     */
    showResetConfirmation(callback) {
        const resetDialog = document.getElementById('reset-prefs-dialog');
        
        if (!resetDialog) {
            console.error("Reset dialog element not found");
            // Fallback à la confirmation native
            if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos préférences ? Cette action est irréversible.')) {
                callback(true);
            }
            return;
        }
        
        // Stocker le callback
        this._resetConfirmCallback = callback;
        
        // Afficher le dialogue
        resetDialog.classList.remove('hidden');
    },
    
    /**
     * Configure les écouteurs d'événements pour sauvegarder automatiquement
     */
    setupEventListeners() {
        // Surveiller les changements sur les dimensions de la tablette
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        
        if (tabletWidthInput && tabletHeightInput) {
            tabletWidthInput.addEventListener('change', () => this.saveCurrentState());
            tabletHeightInput.addEventListener('change', () => this.saveCurrentState());
        }
        
        // Surveiller les changements sur la zone active
        const areaWidthInput = document.getElementById('areaWidth');
        const areaHeightInput = document.getElementById('areaHeight');
        const areaOffsetXInput = document.getElementById('areaOffsetX');
        const areaOffsetYInput = document.getElementById('areaOffsetY');
        const customRatioInput = document.getElementById('customRatio');
        const lockRatioCheckbox = document.getElementById('lockRatio');
        
        if (areaWidthInput) areaWidthInput.addEventListener('change', () => this.saveCurrentState());
        if (areaHeightInput) areaHeightInput.addEventListener('change', () => this.saveCurrentState());
        if (areaOffsetXInput) areaOffsetXInput.addEventListener('change', () => this.saveCurrentState());
        if (areaOffsetYInput) areaOffsetYInput.addEventListener('change', () => this.saveCurrentState());
        if (customRatioInput) customRatioInput.addEventListener('change', () => this.saveCurrentState());
        if (lockRatioCheckbox) lockRatioCheckbox.addEventListener('change', () => this.saveCurrentState());
        
        // Écouter l'événement de sélection de tablette
        document.addEventListener('tablet:selected', (e) => {
            if (e.detail && e.detail.tablet) {
                // Sauvegarder l'état après la sélection d'une tablette
                setTimeout(() => this.saveCurrentState(), 100);
            }
        });
        
        document.addEventListener('tablet:custom', () => {
            // Sauvegarder l'état après passage en mode personnalisé
            setTimeout(() => this.saveCurrentState(), 100);
        });
        
        // Sauvegarder périodiquement (toutes les 10 secondes)
        setInterval(() => this.saveCurrentState(), 10000);
        
        // Sauvegarder juste avant que l'utilisateur quitte la page
        window.addEventListener('beforeunload', () => this.saveCurrentState());
    },
    
    /**
     * Charge les préférences depuis localStorage
     * @returns {Object} Les préférences chargées ou l'objet par défaut
     */
    loadPreferences() {
        try {
            const storedPrefs = localStorage.getItem(this.PREFERENCES_KEY);
            
            if (storedPrefs) {
                return JSON.parse(storedPrefs);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des préférences:', error);
        }
        
        // Retourner un objet vide par défaut
        return {};
    },
    
    /**
     * Sauvegarde les préférences dans localStorage
     * @param {Object} preferences - Les préférences à sauvegarder
     */
    savePreferences(preferences) {
        try {
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
            this._preferences = preferences;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
            // Afficher une notification à l'utilisateur
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Impossible de sauvegarder vos préférences');
            }
        }
    },
    
    /**
     * Sauvegarde l'état actuel de l'application
     */
    saveCurrentState() {
        // Récupérer les valeurs actuelles
        const preferences = {
            // Tablette
            tablet: {
                width: parseFloatSafe(document.getElementById('tabletWidth')?.value),
                height: parseFloatSafe(document.getElementById('tabletHeight')?.value),
                model: document.getElementById('tabletSelectorText')?.textContent || 'Sélectionner un modèle',
                isCustom: document.getElementById('tablet-dimensions-container')?.classList.contains('hidden') === false
            },
            
            // Zone active
            area: {
                width: parseFloatSafe(document.getElementById('areaWidth')?.value),
                height: parseFloatSafe(document.getElementById('areaHeight')?.value),
                offsetX: parseFloatSafe(document.getElementById('areaOffsetX')?.value),
                offsetY: parseFloatSafe(document.getElementById('areaOffsetY')?.value),
                ratio: parseFloatSafe(document.getElementById('customRatio')?.value),
                lockRatio: document.getElementById('lockRatio')?.checked || false
            },
            
            // Timestamp
            timestamp: Date.now()
        };
        
        // Sauvegarder les préférences
        this.savePreferences(preferences);
    },
    
    /**
     * Applique les préférences sauvegardées
     */
    applyPreferences() {
        if (!this._preferences || Object.keys(this._preferences).length === 0) {
            return; // Pas de préférences à appliquer
        }
        
        try {
            // Appliquer les préférences de la tablette
            if (this._preferences.tablet) {
                const tablet = this._preferences.tablet;
                
                // Définir les dimensions de la tablette
                if (isValidNumber(tablet.width) && isValidNumber(tablet.height)) {
                    document.getElementById('tabletWidth').value = formatNumber(tablet.width);
                    document.getElementById('tabletHeight').value = formatNumber(tablet.height);
                }
                
                // Afficher ou masquer le conteneur de dimensions
                const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
                if (tabletDimensionsContainer) {
                    if (tablet.isCustom) {
                        tabletDimensionsContainer.classList.remove('hidden');
                    } else {
                        tabletDimensionsContainer.classList.add('hidden');
                    }
                }
                
                // Mettre à jour le sélecteur de tablette
                const selectorText = document.getElementById('tabletSelectorText');
                if (selectorText && tablet.model) {
                    selectorText.textContent = tablet.model;
                    selectorText.title = tablet.model;
                }
            }
            
            // Appliquer les préférences de la zone active
            if (this._preferences.area) {
                const area = this._preferences.area;
                
                // Définir les dimensions et offsets
                if (isValidNumber(area.width)) document.getElementById('areaWidth').value = formatNumber(area.width);
                if (isValidNumber(area.height)) document.getElementById('areaHeight').value = formatNumber(area.height);
                if (isValidNumber(area.offsetX)) document.getElementById('areaOffsetX').value = formatNumber(area.offsetX, 3);
                if (isValidNumber(area.offsetY)) document.getElementById('areaOffsetY').value = formatNumber(area.offsetY, 3);
                if (isValidNumber(area.ratio)) document.getElementById('customRatio').value = formatNumber(area.ratio, 3);
                
                // Régler le verrou de ratio
                const lockRatioCheckbox = document.getElementById('lockRatio');
                if (lockRatioCheckbox) {
                    lockRatioCheckbox.checked = area.lockRatio;
                }
            }
            
            // Mettre à jour l'affichage
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
            
            // Afficher une notification si le système de notifications est disponible
            // Attendre que l'interface soit complètement chargée
            setTimeout(() => {
                if (typeof Notifications !== 'undefined') {
                    const timestamp = this._preferences.timestamp;
                    let message = 'Configuration restaurée';
                    
                    if (timestamp) {
                        const date = new Date(timestamp);
                        // Formater la date pour qu'elle soit plus lisible
                        const formattedDate = date.toLocaleDateString();
                        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        message = `Configuration du ${formattedDate} à ${formattedTime} restaurée`;
                    }
                    
                    Notifications.info(message);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Erreur lors de l\'application des préférences:', error);
        }
    },
    
    /**
     * Réinitialise toutes les préférences
     */
    resetPreferences() {
        try {
            localStorage.removeItem(this.PREFERENCES_KEY);
            this._preferences = {};
            
            // Afficher une notification à l'utilisateur
            if (typeof Notifications !== 'undefined') {
                Notifications.success('Préférences réinitialisées');
            }
            
            // Recharger la page pour appliquer les valeurs par défaut
            window.location.reload();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation des préférences:', error);
        }
    }
}; 