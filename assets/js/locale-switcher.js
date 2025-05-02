import localeManager from '../locales/index.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeLocaleSwitcher();
});

function initializeLocaleSwitcher() {
    // Create the language selector
    const localeSelector = document.getElementById('locale-switcher');
    
    if (!localeSelector) {
        console.error("Language selector element not found");
        return;
    }
    
    // Get the available languages  
    const availableLocales = localeManager.getAvailableLocales();
    
    // Create the options for each language
    availableLocales.forEach(locale => {
        const option = document.createElement('div');
        option.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded text-center';
        option.setAttribute('data-locale', locale);
        
        // Get the full language name (ex: French, English)
        const localeName = localeManager.translate(`language_${locale}`);
        
        // Highlight the current language
        if (locale === localeManager.getCurrentLocale()) {
            option.classList.add('bg-gray-750', 'text-osu-blue');
        }
        
        option.textContent = localeName;
        
        // Add the click event to change the language
        option.addEventListener('click', () => {
            localeManager.setLocale(locale);
            
            // Update the language selector display
            updateSelectedLocale();
            
            // Close the dropdown menu
            const dropdown = document.getElementById('locale-dropdown');
            if (dropdown) {
                dropdown.classList.add('hidden');
            }
        });
        
        // Add the option to the dropdown menu
        const dropdown = document.getElementById('locale-dropdown');
        if (dropdown) {
            dropdown.appendChild(option);
        }
    });
    
    // Initial update
    updateSelectedLocale();
    
    // Handle the click on the selector to show/hide the options
    const localeButton = document.getElementById('locale-button');
    if (localeButton) {
        localeButton.addEventListener('click', (e) => {
            const dropdown = document.getElementById('locale-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('hidden');
                e.stopPropagation();
            }
        });
    }
    
    // Clicking elsewhere on the page closes the dropdown menu
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('locale-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    });
}

// Update the selected language display
function updateSelectedLocale() {
    const currentLocale = localeManager.getCurrentLocale();
    const localeName = localeManager.translate(`language_${currentLocale}`);
    
    const localeText = document.getElementById('selected-locale-text');
    if (localeText) {
        localeText.textContent = localeName;
    }
    
    // Update the classes for the selected language
    const localeOptions = document.querySelectorAll('.locale-option');
    localeOptions.forEach(option => {
        const locale = option.getAttribute('data-locale');
        
        if (locale === currentLocale) {
            option.classList.add('bg-gray-750', 'text-osu-blue');
        } else {
            option.classList.remove('bg-gray-750', 'text-osu-blue');
        }
    });
}

// Export for use in other files
export { initializeLocaleSwitcher }; 