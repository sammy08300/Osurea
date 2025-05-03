// JavaScript translation examples

// Import the translation function
import initializeI18n from './i18n-init.js';
import localeManager from '../locales/index.js';

// Translation function for this file
const translate = (key, defaultValue) => {
    return window.__(key, defaultValue);
};

// Example 1: Translate a simple text
function showSimpleTranslationExample() {
    // Use the translate function
    const translatedText = translate('favorites');
    console.log('Texte traduit:', translatedText);
    
    // Or use the global __ function
    const anotherTranslatedText = window.__('area_width');
    console.log('Other translated text:', anotherTranslatedText);
}

// Example 2: Translate with a default value
function showDefaultValueExample() {
    // If the key does not exist, use a default value
    const translatedText = translate('unknown_key', 'Default text');
    console.log('Text with default value:', translatedText);
}

// Example 3: Update a dynamic DOM element
function updateDynamicElement() {
    const element = document.createElement('div');
    element.textContent = translate('drag_area');
    document.body.appendChild(element);
    
    // Or add the data-i18n attribute for automatic update
    const button = document.createElement('button');
    button.setAttribute('data-i18n', 'save');
    document.body.appendChild(button);
    
    // The updatePageTranslations function will update the element automatically
    localeManager.updatePageTranslations();
}

// Example 4: React to language changes
function setupLanguageChangeListener() {
    document.addEventListener('localeChanged', (event) => {
        console.log('The language has changed to:', event.detail.locale);
        
        // Do something when the language changes
        // For example, update a graph or reformat dates
    });
}

// Example 5: Create dynamically translated content with templates
function createTranslatedContent() {
    const favorites = [
        { name: 'Favori 1', width: 80, height: 45 },
        { name: 'Favori 2', width: 100, height: 60 }
    ];
    
    const container = document.createElement('div');
    
    favorites.forEach(favorite => {
        const item = document.createElement('div');
        
        // Create a template with translations
        item.innerHTML = `
            <h3>${favorite.name}</h3>
            <p>${translate('area_width')}: ${favorite.width} mm</p>
            <p>${translate('area_height')}: ${favorite.height} mm</p>
            <button class="edit-btn" data-i18n="edit"></button>
            <button class="delete-btn" data-i18n="delete"></button>
        `;
        
        container.appendChild(item);
    });
    
    // The updatePageTranslations function will update the data-i18n elements
    localeManager.updatePageTranslations();
    
    return container;
}

// Export the examples
export {
    showSimpleTranslationExample,
    showDefaultValueExample,
    updateDynamicElement,
    setupLanguageChangeListener,
    createTranslatedContent
}; 