/**
 * RecapManager module for handling the collapsible recap menu
 */
import { DOMUtils } from '../utils/dom-utils.js';

export const RecapManager = {
    /**
     * Elements for the recap UI
     */
    elements: {
        card: null,
        toggle: null,
        content: null,
        arrow: null
    },
    
    /**
     * Current state of the recap panel
     */
    isExpanded: false,
    
    /**
     * Initialize the recap manager
     */
    init() {
        // Get UI elements
        this.elements.card = document.getElementById('recap-card');
        this.elements.toggle = document.getElementById('recap-toggle');
        this.elements.content = document.getElementById('recap-content');
        this.elements.arrow = document.getElementById('recap-arrow');
        
        if (!this.elements.card || !this.elements.toggle || 
            !this.elements.content || !this.elements.arrow) {
            return;
        }
        
        // Set up initial state
        this.isExpanded = false;
        
        // Set up transition
        this.elements.content.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
        
        // Update the visual state
        this.updateRecapState();
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    /**
     * Update the visual state of the recap panel
     */
    updateRecapState() {
        if (!this.elements.content) return;
        
        if (this.isExpanded) {
            // Expand the content
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
            
            // Update the height after a short delay to handle content changes
            setTimeout(() => {
                if (this.elements.content) {
                    this.elements.content.style.maxHeight = `${this.elements.content.scrollHeight}px`;
                }
            }, 50);
        } else {
            // Collapse the content
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
    
    /**
     * Set up event listeners for the recap panel
     */
    setupEventListeners() {
        // Handle the click on the title
        this.elements.toggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent propagation to the parent
            
            // Toggle the state
            this.isExpanded = !this.isExpanded;
            this.updateRecapState();
            
            // Add ripple effect
            DOMUtils.addRippleEffect(this.elements.toggle, event);
        });
        
        // Handle the click on the card when the menu is collapsed
        this.elements.card.addEventListener('click', (event) => {
            // Only process if the menu is collapsed and the click is not on the toggle
            if (!this.isExpanded && !this.elements.toggle.contains(event.target)) {
                this.isExpanded = true;
                this.updateRecapState();
            }
        });
    }
}; 
