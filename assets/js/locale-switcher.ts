import localeManager from '../locales/index'; // .ts extension will be resolved

// Define types for better code clarity and safety
interface LocaleSwitcherElements {
    selector: HTMLElement | null;
    button: HTMLButtonElement | null;
    dropdown: HTMLElement | null;
    selectedText: HTMLElement | null;
}

interface EventListenersMap {
    buttonClick?: (e: MouseEvent) => void;
    buttonKeydown?: (e: KeyboardEvent) => void;
    dropdownClick?: (e: MouseEvent) => void;
    documentClick?: () => void;
}

// Assuming localeManager has a more specific type if available, else use 'any' for now
interface LocaleManager {
    getCurrentLocale: () => string | null;
    getAvailableLocales: () => string[];
    translate: (key: string) => string;
    setLocale: (locale: string) => Promise<void> | void; // Assuming setLocale might be async
}

class LocaleSwitcher {
    private elements: LocaleSwitcherElements | null = null;
    private eventListeners: EventListenersMap = {};
    private isInitialized: boolean = false;
    private _initAttempts: number = 0;

    constructor() {}
    
    private getElements(): LocaleSwitcherElements {
        if (this.elements) return this.elements;
        
        this.elements = {
            selector: document.getElementById('locale-switcher'),
            button: document.getElementById('locale-button') as HTMLButtonElement | null,
            dropdown: document.getElementById('locale-dropdown'),
            selectedText: document.getElementById('selected-locale-text')
        };
        return this.elements;
    }
    
    init(): void {
        if (this.isInitialized) return;
        
        const elements = this.getElements(); // Ensure elements are fetched
        
        if (!this.validateElements()) {
            console.warn('LocaleSwitcher: Some required DOM elements are missing');
            return;
        }
        
        if (elements.selector) {
            elements.selector.style.visibility = 'hidden';
            elements.selector.style.opacity = '0';
        }
        this.attemptInitialization();
    }
    
    private validateElements(): boolean {
        const elements = this.getElements();
        return Object.values(elements).every(el => el !== null);
    }
    
    private attemptInitialization(): void {
        const MAX_ATTEMPTS = 20;
        this._initAttempts++;
        
        if (this._initAttempts > MAX_ATTEMPTS) {
            console.error('LocaleSwitcher: Unable to initialize after multiple attempts');
            return;
        }
        
        try {
            const currentLocale = (localeManager as LocaleManager).getCurrentLocale();
            if (currentLocale) {
                const { selector } = this.getElements();
                
                this.createDropdown();
                this.setupEventListeners();
                this.updateSelectedLocale();
                
                if (selector) {
                    selector.style.visibility = 'visible';
                    requestAnimationFrame(() => selector.style.opacity = '1');
                }
                this.isInitialized = true;
                this._initAttempts = 0;
            } else {
                setTimeout(() => this.attemptInitialization(), 50);
            }
        } catch (error) {
            console.error('LocaleSwitcher: Error during initialization', error);
            if (this._initAttempts < MAX_ATTEMPTS) {
                setTimeout(() => this.attemptInitialization(), 100);
            }
        }
    }
    
    createDropdown(): void {
        const { dropdown } = this.getElements();
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const currentLocale = (localeManager as LocaleManager).getCurrentLocale();
        const availableLocales = (localeManager as LocaleManager).getAvailableLocales();
        
        if (!availableLocales?.length) {
            console.warn('LocaleSwitcher: No available languages');
            return;
        }
        
        const getLocaleName = (locale: string): string => {
            try {
                return (localeManager as LocaleManager).translate(`language_${locale}`) || locale;
            } catch { return locale; }
        };
        
        availableLocales.forEach(locale => {
            const option = document.createElement('div');
            option.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded text-center';
            option.setAttribute('data-locale', locale);
            option.setAttribute('role', 'menuitem');
            option.setAttribute('tabindex', '0');
            option.textContent = getLocaleName(locale);
            if (locale === currentLocale) option.classList.add('bg-gray-750', 'text-osu-blue');
            fragment.appendChild(option);
        });
        dropdown.appendChild(fragment);
    }
    
    private setupEventListeners(): void {
        const { button, dropdown } = this.getElements();
        if (!button || !dropdown) return;
        
        this.removeEventListeners();
        
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('role', 'menu');
        
        this.eventListeners.buttonClick = (e: MouseEvent) => {
            const isHidden = dropdown.classList.toggle('hidden');
            button.setAttribute('aria-expanded', (!isHidden).toString());
            e.stopPropagation();
        };
        
        this.eventListeners.buttonKeydown = (e: KeyboardEvent) => {
            if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                dropdown.classList.remove('hidden');
                button.setAttribute('aria-expanded', 'true');
                const firstOption = dropdown.querySelector<HTMLElement>('.locale-option');
                firstOption?.focus();
            }
        };
        
        this.eventListeners.dropdownClick = (e: MouseEvent) => {
            const option = (e.target as HTMLElement).closest<HTMLElement>('.locale-option');
            if (!option) return;
            const locale = option.getAttribute('data-locale');
            if (locale) {
                try {
                    (localeManager as LocaleManager).setLocale(locale);
                    this.updateSelectedLocale();
                    dropdown.classList.add('hidden');
                    button.setAttribute('aria-expanded', 'false');
                    button.focus();
                } catch (error) {
                    console.error(`LocaleSwitcher: Error changing language to ${locale}`, error);
                }
            }
        };
        
        this.eventListeners.documentClick = () => {
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                button.setAttribute('aria-expanded', 'false');
            }
        };
        
        button.addEventListener('click', this.eventListeners.buttonClick as EventListener);
        button.addEventListener('keydown', this.eventListeners.buttonKeydown as EventListener);
        dropdown.addEventListener('click', this.eventListeners.dropdownClick as EventListener);
        document.addEventListener('click', this.eventListeners.documentClick as EventListener);
    }
    
    private removeEventListeners(): void {
        const { button, dropdown } = this.getElements();
        
        Object.entries(this.eventListeners).forEach(([key, listener]) => {
            if (!listener) return;
            const eventName = key.replace(/^(button|dropdown|document)/, '').toLowerCase();
            if (key.startsWith('button') && button) button.removeEventListener(eventName, listener);
            else if (key.startsWith('dropdown') && dropdown) dropdown.removeEventListener(eventName, listener);
            else if (key.startsWith('document')) document.removeEventListener(eventName, listener);
        });
        this.eventListeners = {};
    }
    
    updateSelectedLocale(): void {
        const { selectedText } = this.getElements();
        const currentLocale = (localeManager as LocaleManager).getCurrentLocale();
        
        if (!currentLocale) {
            console.warn('LocaleSwitcher: No current language set');
            return;
        }
        if (selectedText) {
            try {
                selectedText.textContent = (localeManager as LocaleManager).translate(`language_${currentLocale}`) || currentLocale;
            } catch { selectedText.textContent = currentLocale; }
        }
        
        document.querySelectorAll<HTMLElement>('.locale-option').forEach(option => {
            const locale = option.getAttribute('data-locale');
            option.classList.toggle('bg-gray-750', locale === currentLocale);
            option.classList.toggle('text-osu-blue', locale === currentLocale);
        });
    }
    
    reset(): void {
        this.destroy();
        this.init();
    }
    
    destroy(): void {
        this.removeEventListeners();
        this.elements = null;
        this.isInitialized = false;
    }
}

const localeSwitcher = new LocaleSwitcher();

document.addEventListener('DOMContentLoaded', () => {
    localeSwitcher.init();
});

export const createLocaleSwitcher = (): void => localeSwitcher.createDropdown();
export const updateLocaleSwitcher = (): void => localeSwitcher.updateSelectedLocale();
export default localeSwitcher;
