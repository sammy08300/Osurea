/**
 * Module de sélection de tablette avec popup
 */

const TabletSelector = {
    selectorButton: null,
    selectorText: null,
    selectorPopup: null,
    brandsList: null,
    modelsList: null,
    customButton: null,
    searchInput: null,
    searchInputMobile: null,
    tabletData: [],
    selectedBrand: null,
    filteredModels: [],
    
    /**
     * Initialise le sélecteur de tablette
     * @param {Array} tabletData - Données des tablettes issues du fichier tablets.json
     */
    init(tabletData) {
        console.log('Initialisation du sélecteur de tablette...');
        
        // Récupération des éléments DOM
        this.selectorButton = document.getElementById('tabletSelectorButton');
        this.selectorText = document.getElementById('tabletSelectorText');
        this.selectorPopup = document.getElementById('tabletSelectorPopup');
        this.brandsList = document.getElementById('tabletBrandsList');
        this.modelsList = document.getElementById('tabletModelsList');
        this.customButton = document.getElementById('customTabletButton');
        this.searchInput = document.getElementById('tabletSearch');
        this.searchInputMobile = document.getElementById('tabletSearchMobile');
        
        // Vérification des éléments essentiels
        if (!this.selectorButton || !this.selectorText || !this.selectorPopup || 
            !this.brandsList || !this.modelsList || !this.customButton) {
            console.error('Sélecteur de tablette: éléments essentiels introuvables');
            return;
        }
        
        // Ajouter un attribut title au texte du sélecteur pour l'info-bulle
        this.selectorText.title = this.selectorText.textContent;
        
        // Stockage des données
        this.tabletData = tabletData;
        
        // Création des listes de marques
        this.populateBrandsList();
        
        // Ajout des écouteurs d'événements
        this.addEventListeners();
        
        console.log('Sélecteur de tablette initialisé avec succès');
    },
    
    /**
     * Ajoute les écouteurs d'événements
     */
    addEventListeners() {
        // Ouvrir/fermer le popup au clic sur le bouton
        this.selectorButton.addEventListener('click', () => {
            this.togglePopup();
        });
        
        // Dimensions personnalisées
        this.customButton.addEventListener('click', () => {
            this.selectCustomTablet();
            this.hidePopup();
        });
        
        // Recherche
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (this.searchInputMobile) {
            this.searchInputMobile.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Fermeture du popup au clic extérieur
        document.addEventListener('click', (e) => {
            if (this.selectorPopup.classList.contains('hidden')) return;
            
            // Si on clique en dehors du popup et du bouton
            if (!this.selectorPopup.contains(e.target) && !this.selectorButton.contains(e.target)) {
                this.hidePopup();
            }
        });
        
        // Fermeture du popup lors d'un défilement ou redimensionnement
        document.addEventListener('scroll', () => this.hidePopup());
        window.addEventListener('resize', () => this.hidePopup());
    },
    
    /**
     * Gère la recherche dans les tablettes
     * @param {string} query - Termes de recherche
     */
    handleSearch(query) {
        query = query.toLowerCase().trim();
        
        // Si la recherche est vide, réinitialiser l'affichage
        if (!query) {
            // Réinitialiser les listes
            this.populateBrandsList();
            if (this.selectedBrand) {
                this.selectBrand(this.selectedBrand);
            }
            return;
        }
        
        // Synchroniser les champs de recherche si nécessaire
        if (this.searchInput && this.searchInput.value !== query) {
            this.searchInput.value = query;
        }
        if (this.searchInputMobile && this.searchInputMobile.value !== query) {
            this.searchInputMobile.value = query;
        }
        
        // Filtrer les tablettes correspondant à la recherche
        this.filteredModels = this.tabletData.filter(tablet => {
            return tablet.brand.toLowerCase().includes(query) || 
                   tablet.model.toLowerCase().includes(query) ||
                   `${tablet.width}x${tablet.height}`.includes(query);
        });
        
        // Afficher les résultats de recherche
        this.displaySearchResults();
    },
    
    /**
     * Affiche les résultats de recherche
     */
    displaySearchResults() {
        // Vider les deux listes
        this.brandsList.innerHTML = '';
        this.modelsList.innerHTML = '';
        
        // S'il y a des résultats
        if (this.filteredModels.length > 0) {
            // Obtenir les marques uniques des résultats
            const brands = [...new Set(this.filteredModels.map(t => t.brand))].sort();
            
            // Afficher les marques filtrées
            brands.forEach(brand => {
                const brandItem = document.createElement('div');
                brandItem.className = 'brand-item';
                if (brand === this.selectedBrand) {
                    brandItem.classList.add('active');
                }
                
                brandItem.textContent = brand;
                brandItem.dataset.brand = brand;
                
                brandItem.addEventListener('click', () => {
                    this.selectBrand(brand, true);
                });
                
                this.brandsList.appendChild(brandItem);
            });
            
            // Par défaut, montrer tous les modèles ou ceux de la marque sélectionnée
            let modelsToShow = this.filteredModels;
            if (this.selectedBrand && brands.includes(this.selectedBrand)) {
                modelsToShow = this.filteredModels.filter(t => t.brand === this.selectedBrand);
            } else if (brands.length > 0) {
                // Si la marque sélectionnée n'est pas dans les résultats, en sélectionner une nouvelle
                this.selectedBrand = brands[0];
                modelsToShow = this.filteredModels.filter(t => t.brand === this.selectedBrand);
                
                // Mettre à jour l'affichage visuel des marques
                const brandItems = this.brandsList.querySelectorAll('.brand-item');
                brandItems.forEach(item => {
                    if (item.dataset.brand === this.selectedBrand) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            // Afficher les modèles correspondants
            this.displayModels(modelsToShow);
        } else {
            // Aucun résultat
            const noResults = document.createElement('div');
            noResults.className = 'p-4 text-gray-400 text-center italic';
            noResults.textContent = 'Aucun résultat trouvé';
            this.modelsList.appendChild(noResults);
        }
    },
    
    /**
     * Remplit la liste des marques
     */
    populateBrandsList() {
        // Vider la liste actuelle
        this.brandsList.innerHTML = '';
        
        // Si aucune donnée, afficher un message
        if (!this.tabletData || this.tabletData.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'p-4 text-gray-400 text-center italic';
            noData.textContent = 'Aucune donnée de tablette disponible';
            this.brandsList.appendChild(noData);
            return;
        }
        
        // Obtenir les marques uniques
        const brands = [...new Set(this.tabletData.map(tablet => tablet.brand))].sort();
        
        // Créer un élément pour chaque marque
        brands.forEach(brand => {
            const brandItem = document.createElement('div');
            brandItem.className = 'brand-item';
            if (brand === this.selectedBrand) {
                brandItem.classList.add('active');
            }
            
            brandItem.textContent = brand;
            brandItem.dataset.brand = brand;
            
            // Ajouter un écouteur d'événement
            brandItem.addEventListener('click', () => {
                this.selectBrand(brand);
            });
            
            this.brandsList.appendChild(brandItem);
        });
        
        // Par défaut, afficher la première marque si aucune n'est sélectionnée
        if (!this.selectedBrand && brands.length > 0) {
            this.selectBrand(brands[0]);
        } else if (this.selectedBrand) {
            // Réafficher les modèles pour la marque déjà sélectionnée
            this.selectBrand(this.selectedBrand);
        }
    },
    
    /**
     * Sélectionne une marque et affiche ses modèles
     * @param {string} brand - Nom de la marque
     * @param {boolean} filterSearch - Indique si on filtre par les résultats de recherche
     */
    selectBrand(brand, filterSearch = false) {
        // Mise à jour de la marque sélectionnée
        this.selectedBrand = brand;
        
        // Mise à jour visuelle des éléments sélectionnés
        const brandItems = this.brandsList.querySelectorAll('.brand-item');
        brandItems.forEach(item => {
            if (item.dataset.brand === brand) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Filtrer les modèles de cette marque
        let models;
        if (filterSearch && this.filteredModels.length > 0) {
            models = this.filteredModels.filter(tablet => tablet.brand === brand);
        } else {
            models = this.tabletData.filter(tablet => tablet.brand === brand);
        }
        
        // Afficher les modèles
        this.displayModels(models);
    },
    
    /**
     * Affiche les modèles dans la liste
     * @param {Array} models - Liste des modèles à afficher
     */
    displayModels(models) {
        // Vider la liste des modèles
        this.modelsList.innerHTML = '';
        
        if (models.length === 0) {
            const noModels = document.createElement('div');
            noModels.className = 'p-4 text-gray-400 text-center italic';
            noModels.textContent = 'Aucun modèle disponible';
            this.modelsList.appendChild(noModels);
            return;
        }
        
        // Créer un élément pour chaque modèle
        models.forEach(tablet => {
            const modelItem = document.createElement('div');
            modelItem.className = 'model-item';
            
            // Création du contenu avec nom et dimensions
            const modelName = document.createElement('div');
            modelName.className = 'text-gray-100';
            modelName.textContent = tablet.model;
            
            const modelDimensions = document.createElement('div');
            modelDimensions.className = 'text-sm text-gray-400';
            modelDimensions.textContent = `${tablet.width} × ${tablet.height} mm`;
            
            modelItem.appendChild(modelName);
            modelItem.appendChild(modelDimensions);
            
            // Stockage des données du modèle
            modelItem.dataset.brand = tablet.brand;
            modelItem.dataset.model = tablet.model;
            modelItem.dataset.width = tablet.width;
            modelItem.dataset.height = tablet.height;
            
            // Événement au clic sur un modèle
            modelItem.addEventListener('click', () => {
                // Ajouter une classe active temporairement
                modelItem.classList.add('active');
                setTimeout(() => {
                    this.selectModel(tablet);
                    this.hidePopup();
                }, 150);
            });
            
            this.modelsList.appendChild(modelItem);
        });
    },
    
    /**
     * Sélectionne un modèle de tablette
     * @param {Object} tablet - Objet tablette avec brand, model, width, height
     */
    selectModel(tablet) {
        // Mise à jour du texte du bouton avec une animation
        this.selectorButton.classList.add('updating');
        const displayText = `${tablet.brand} ${tablet.model}`;
        this.selectorText.textContent = displayText;
        this.selectorText.title = displayText; // Ajouter un title pour l'info-bulle
        setTimeout(() => {
            this.selectorButton.classList.remove('updating');
        }, 300);
        
        // Mise à jour des champs de dimensions
        const tabletWidthInput = document.getElementById('tabletWidth');
        const tabletHeightInput = document.getElementById('tabletHeight');
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        
        if (tabletWidthInput && tabletHeightInput) {
            tabletWidthInput.value = formatNumber(tablet.width);
            tabletHeightInput.value = formatNumber(tablet.height);
            
            // Cacher les champs manuels
            if (tabletDimensionsContainer) {
                tabletDimensionsContainer.classList.add('hidden');
            }
            
            // Cancel edit mode if needed
            if (typeof appState !== 'undefined' && appState.cancelEditMode) {
                appState.cancelEditMode();
            }
            
            // Update display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }
        
        // Déclencher un événement personnalisé pour informer d'autres composants
        const event = new CustomEvent('tablet:selected', { 
            detail: { tablet } 
        });
        document.dispatchEvent(event);
    },
    
    /**
     * Sélectionne l'option "Dimensions personnalisées"
     */
    selectCustomTablet() {
        // Mise à jour du texte du bouton avec une animation
        this.selectorButton.classList.add('updating');
        this.selectorText.textContent = 'Dimensions personnalisées';
        this.selectorText.title = 'Dimensions personnalisées'; // Ajouter un titre pour l'info-bulle
        setTimeout(() => {
            this.selectorButton.classList.remove('updating');
        }, 300);
        
        // Afficher les champs manuels avec animation
        const tabletDimensionsContainer = document.getElementById('tablet-dimensions-container');
        
        if (tabletDimensionsContainer) {
            tabletDimensionsContainer.classList.remove('hidden');
            tabletDimensionsContainer.style.opacity = '0';
            requestAnimationFrame(() => {
                tabletDimensionsContainer.style.transition = 'opacity 0.2s ease';
                tabletDimensionsContainer.style.opacity = '1';
            });
        }
        
        // Cancel edit mode if needed
        if (typeof appState !== 'undefined' && appState.cancelEditMode) {
            appState.cancelEditMode();
        }
        
        // Déclencher un événement personnalisé
        const event = new CustomEvent('tablet:custom');
        document.dispatchEvent(event);
    },
    
    /**
     * Affiche ou masque le popup
     */
    togglePopup() {
        if (this.selectorPopup.classList.contains('hidden')) {
            this.showPopup();
        } else {
            this.hidePopup();
        }
    },
    
    /**
     * Affiche le popup
     */
    showPopup() {
        this.selectorPopup.classList.remove('hidden');
        
        // Réinitialiser la recherche
        if (this.searchInput) this.searchInput.value = '';
        if (this.searchInputMobile) this.searchInputMobile.value = '';
        
        // Rafraîchir l'affichage des modèles
        if (this.selectedBrand) {
            this.selectBrand(this.selectedBrand);
        }
    },
    
    /**
     * Masque le popup
     */
    hidePopup() {
        this.selectorPopup.classList.add('hidden');
    }
}; 