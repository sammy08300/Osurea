import localeManager from '../locales/index.js';

/**
 * LocaleSwitcher - Module responsable de l'interface de changement de langue
 */
class LocaleSwitcher {
    constructor() {
        // Cache des éléments DOM
        this.elements = null;
        
        // Référence aux écouteurs d'événements pour nettoyage
        this.eventListeners = {
            documentClick: null,
            buttonClick: null,
            buttonKeydown: null,
            dropdownClick: null
        };
        
        // État du composant
        this.isInitialized = false;
    }
    
    /**
     * Récupère et met en cache les éléments DOM nécessaires
     * @returns {Object} Les éléments DOM
     */
    getElements() {
        if (this.elements) return this.elements;
        
        this.elements = {
            selector: document.getElementById('locale-switcher'),
            button: document.getElementById('locale-button'),
            dropdown: document.getElementById('locale-dropdown'),
            selectedText: document.getElementById('selected-locale-text')
        };
        
        return this.elements;
    }
    
    /**
     * Initialise le sélecteur de langue
     */
    init() {
        if (this.isInitialized) return;
        
        const { selector } = this.getElements();
        
        // Vérifier si les éléments nécessaires existent
        if (!this.validateElements()) {
            console.warn('LocaleSwitcher: Certains éléments DOM requis sont manquants');
            return;
        }
        
        // Cacher le sélecteur initialement
        if (selector) {
            selector.style.visibility = 'hidden';
            selector.style.opacity = '0';
        }
        
        // Démarrer l'initialisation avec mécanisme de retry
        this.attemptInitialization();
    }
    
    /**
     * Vérifie que tous les éléments DOM nécessaires sont présents
     * @returns {boolean} True si tous les éléments sont présents
     */
    validateElements() {
        const { selector, button, dropdown, selectedText } = this.getElements();
        return selector && button && dropdown && selectedText;
    }
    
    /**
     * Tente d'initialiser le sélecteur, avec retry si le localeManager n'est pas prêt
     */
    attemptInitialization() {
        // Limiter le nombre de tentatives pour éviter les boucles infinies
        if (!this._initAttempts) this._initAttempts = 0;
        this._initAttempts++;
        
        // Abandonner après 20 tentatives (1 seconde)
        if (this._initAttempts > 20) {
            console.error('LocaleSwitcher: Impossible d\'initialiser après plusieurs tentatives');
            return;
        }
        
        try {
            if (localeManager.getCurrentLocale()) {
                const { selector } = this.getElements();
                
                // Initialiser tous les composants
                this.createDropdown();
                this.setupEventListeners();
                this.updateSelectedLocale();
                
                // Afficher le sélecteur avec animation de fondu
                if (selector) {
                    selector.style.visibility = 'visible';
                    requestAnimationFrame(() => selector.style.opacity = '1');
                }
                
                this.isInitialized = true;
                this._initAttempts = 0; // Réinitialiser pour une utilisation future
            } else {
                // Réessayer après un court délai
                setTimeout(() => this.attemptInitialization(), 50);
            }
        } catch (error) {
            console.error('LocaleSwitcher: Erreur lors de l\'initialisation', error);
            // Réessayer une dernière fois après un délai plus long
            if (this._initAttempts < 20) {
                setTimeout(() => this.attemptInitialization(), 100);
            }
        }
    }
    
    /**
     * Crée le menu déroulant avec toutes les langues disponibles
     */
    createDropdown() {
        const { dropdown } = this.getElements();
        
        if (!dropdown) return;
        
        // Vider les options existantes
        dropdown.innerHTML = '';
        
        // Créer les options avec un fragment pour de meilleures performances
        const fragment = document.createDocumentFragment();
        const currentLocale = localeManager.getCurrentLocale();
        const availableLocales = localeManager.getAvailableLocales();
        
        if (!availableLocales || availableLocales.length === 0) {
            console.warn('LocaleSwitcher: Aucune langue disponible');
            return;
        }
        
        // Mémoriser les traductions pour éviter des appels répétés
        const translations = {};
        availableLocales.forEach(locale => {
            try {
                translations[locale] = localeManager.translate(`language_${locale}`) || locale;
            } catch (error) {
                translations[locale] = locale;
            }
        });
        
        // Créer les options pour chaque langue
        availableLocales.forEach(locale => {
            const option = document.createElement('div');
            option.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded text-center';
            option.setAttribute('data-locale', locale);
            option.setAttribute('role', 'menuitem');
            option.setAttribute('tabindex', '0');
            
            // Utiliser la traduction mémorisée
            option.textContent = translations[locale];
            
            // Mettre en évidence la langue actuelle
            if (locale === currentLocale) {
                option.classList.add('bg-gray-750', 'text-osu-blue');
            }
            
            fragment.appendChild(option);
        });
        
        // Ajouter toutes les options au DOM en une seule opération
        dropdown.appendChild(fragment);
    }
    
    /**
     * Configure tous les écouteurs d'événements pour le sélecteur de langue
     */
    setupEventListeners() {
        const { button, dropdown } = this.getElements();
        
        if (!button || !dropdown) return;
        
        // Nettoyer les écouteurs existants si nécessaire
        this.removeEventListeners();
        
        // Améliorer l'accessibilité
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('role', 'menu');
        
        // Basculer la visibilité du menu déroulant
        this.eventListeners.buttonClick = (e) => {
            const isExpanded = dropdown.classList.toggle('hidden');
            button.setAttribute('aria-expanded', !isExpanded);
            e.stopPropagation();
        };
        button.addEventListener('click', this.eventListeners.buttonClick);
        
        // Support clavier pour l'accessibilité
        this.eventListeners.buttonKeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                dropdown.classList.remove('hidden');
                button.setAttribute('aria-expanded', 'true');
                
                // Focus sur la première option
                const firstOption = dropdown.querySelector('.locale-option');
                if (firstOption) firstOption.focus();
            }
        };
        button.addEventListener('keydown', this.eventListeners.buttonKeydown);
        
        // Utiliser la délégation d'événements pour les options de langue
        this.eventListeners.dropdownClick = (e) => {
            const option = e.target.closest('.locale-option');
            if (!option) return;
            
            const locale = option.getAttribute('data-locale');
            if (locale) {
                try {
                    localeManager.setLocale(locale);
                    this.updateSelectedLocale();
                    dropdown.classList.add('hidden');
                    button.setAttribute('aria-expanded', 'false');
                    button.focus(); // Retourner le focus au bouton
                } catch (error) {
                    console.error(`LocaleSwitcher: Erreur lors du changement de langue vers ${locale}`, error);
                }
            }
        };
        dropdown.addEventListener('click', this.eventListeners.dropdownClick);
        
        // Fermer le menu déroulant en cliquant ailleurs
        this.eventListeners.documentClick = () => {
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                button.setAttribute('aria-expanded', 'false');
            }
        };
        document.addEventListener('click', this.eventListeners.documentClick);
    }
    
    /**
     * Supprime les écouteurs d'événements pour éviter les fuites de mémoire
     */
    removeEventListeners() {
        const { button, dropdown } = this.getElements();
        
        if (this.eventListeners.buttonClick && button) {
            button.removeEventListener('click', this.eventListeners.buttonClick);
        }
        
        if (this.eventListeners.buttonKeydown && button) {
            button.removeEventListener('keydown', this.eventListeners.buttonKeydown);
        }
        
        if (this.eventListeners.dropdownClick && dropdown) {
            dropdown.removeEventListener('click', this.eventListeners.dropdownClick);
        }
        
        if (this.eventListeners.documentClick) {
            document.removeEventListener('click', this.eventListeners.documentClick);
        }
    }
    
    /**
     * Met à jour l'affichage de la langue sélectionnée et met en évidence la locale actuelle
     */
    updateSelectedLocale() {
        const { selectedText } = this.getElements();
        const currentLocale = localeManager.getCurrentLocale();
        
        if (!currentLocale) {
            console.warn('LocaleSwitcher: Aucune langue actuelle définie');
            return;
        }
        
        if (selectedText) {
            try {
                selectedText.textContent = localeManager.translate(`language_${currentLocale}`) || currentLocale;
            } catch (error) {
                console.warn(`LocaleSwitcher: Impossible de traduire la langue ${currentLocale}`, error);
                selectedText.textContent = currentLocale;
            }
        }
        
        // Mettre à jour les classes pour toutes les options de langue
        document.querySelectorAll('.locale-option').forEach(option => {
            const locale = option.getAttribute('data-locale');
            const isSelected = locale === currentLocale;
            
            option.classList.toggle('bg-gray-750', isSelected);
            option.classList.toggle('text-osu-blue', isSelected);
        });
    }
    
    /**
     * Réinitialise complètement le sélecteur de langue
     * Utile après des changements dynamiques dans l'application
     */
    reset() {
        this.destroy();
        this.init();
    }
    
    /**
     * Nettoie les ressources lors de la destruction du composant
     */
    destroy() {
        this.removeEventListeners();
        this.elements = null;
        this.isInitialized = false;
    }
}

// Créer une instance unique du sélecteur de langue
const localeSwitcher = new LocaleSwitcher();

// Initialiser lorsque le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    localeSwitcher.init();
});

/**
 * Fonction publique pour créer le sélecteur de langue
 * Maintenue pour compatibilité avec le code existant
 */
function createLocaleSwitcher() {
    localeSwitcher.createDropdown();
}

/**
 * Fonction publique pour mettre à jour le sélecteur de langue
 * Maintenue pour compatibilité avec le code existant
 */
function updateLocaleSwitcher() {
    localeSwitcher.updateSelectedLocale();
}

// Exporter les fonctions publiques et l'instance
export { createLocaleSwitcher, updateLocaleSwitcher };
export default localeSwitcher;