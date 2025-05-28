/**
 * RecapManager module for handling the collapsible recap menu
 */
import { DOMUtils } from '../utils/dom-utils';

interface RecapElements {
    card: HTMLElement | null;
    toggle: HTMLElement | null;
    content: HTMLElement | null;
    arrow: HTMLElement | null;
}

interface RecapManagerModule {
    elements: RecapElements;
    isExpanded: boolean;
    init(): void;
    updateRecapState(): void;
    setupEventListeners(): void;
}

export const RecapManager: RecapManagerModule = {
    elements: {
        card: null,
        toggle: null,
        content: null,
        arrow: null
    },
    isExpanded: false,
    
    init(): void {
        this.elements.card = document.getElementById('recap-card');
        this.elements.toggle = document.getElementById('recap-toggle');
        this.elements.content = document.getElementById('recap-content');
        this.elements.arrow = document.getElementById('recap-arrow');
        
        if (!this.elements.card || !this.elements.toggle || 
            !this.elements.content || !this.elements.arrow) {
            console.warn('RecapManager: One or more essential elements not found. Skipping initialization.');
            return;
        }
        
        this.isExpanded = false;
        this.elements.content.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
        this.updateRecapState();
        this.setupEventListeners();
    },
    
    updateRecapState(): void {
        if (!this.elements.content || !this.elements.arrow || !this.elements.card || !this.elements.toggle) return;
        
        if (this.isExpanded) {
            const contentHeight = this.elements.content.scrollHeight;
            this.elements.content.style.maxHeight = `${contentHeight}px`;
            this.elements.content.style.opacity = '1';
            this.elements.content.classList.add('border-t', 'border-gray-800', 'mt-2', 'pt-2');
            this.elements.arrow.style.transform = 'rotate(0deg)';
            this.elements.card.classList.add('bg-gray-850');
            this.elements.card.classList.remove('bg-gray-900');
            this.elements.card.classList.remove('cursor-pointer');
            this.elements.toggle.classList.remove('py-1');
            this.elements.toggle.classList.add('py-2');
            
            setTimeout(() => {
                if (this.elements.content) { // Check again due to async nature
                    this.elements.content.style.maxHeight = `${this.elements.content.scrollHeight}px`;
                }
            }, 50);
        } else {
            this.elements.content.style.maxHeight = '0';
            this.elements.content.style.opacity = '0';
            this.elements.content.classList.remove('border-t', 'border-gray-800', 'mt-2', 'pt-2');
            this.elements.arrow.style.transform = 'rotate(180deg)';
            this.elements.card.classList.remove('bg-gray-850');
            this.elements.card.classList.add('bg-gray-900');
            this.elements.card.classList.add('cursor-pointer');
            this.elements.toggle.classList.remove('py-2');
            this.elements.toggle.classList.add('py-1');
        }
    },
    
    setupEventListeners(): void {
        if (!this.elements.toggle || !this.elements.card) return;

        this.elements.toggle.addEventListener('click', (event: MouseEvent) => {
            event.stopPropagation();
            this.isExpanded = !this.isExpanded;
            this.updateRecapState();
            if (this.elements.toggle) { // Check element exists before passing
                 DOMUtils.addRippleEffect(this.elements.toggle, event);
            }
        });
        
        this.elements.card.addEventListener('click', (event: MouseEvent) => {
            if (!this.isExpanded && this.elements.toggle && !this.elements.toggle.contains(event.target as Node)) {
                this.isExpanded = true;
                this.updateRecapState();
            }
        });
    }
};
