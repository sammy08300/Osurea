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
        option.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded';
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
    
    // Add a separator
    const dropdown = document.getElementById('locale-dropdown');
    if (dropdown) {
        const separator = document.createElement('div');
        separator.className = 'border-t border-gray-700 my-1';
        dropdown.appendChild(separator);
        
        // Add the "Auto-detect language" option
        const autoDetectOption = document.createElement('div');
        autoDetectOption.className = 'locale-option cursor-pointer hover:bg-gray-750 p-2 rounded flex items-center';
        autoDetectOption.setAttribute('data-locale', 'auto');
        
        // Detection icon
        const icon = document.createElement('svg');
        icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        icon.setAttribute('class', 'h-4 w-4 mr-2');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('stroke', 'currentColor');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />';
        
        autoDetectOption.appendChild(icon);
        
        // Text
        const text = document.createElement('span');
        text.textContent = localeManager.translate('auto_detect_language') || 'Auto-detect language';
        autoDetectOption.appendChild(text);
        
        // Add the click event to reset the language detection
        autoDetectOption.addEventListener('click', () => {
            // Reset the language preference and force the language detection
            localeManager.resetLocale();
            
            // Update the language selector display
            updateSelectedLocale();
            
            // Close the dropdown menu
            if (dropdown) {
                dropdown.classList.add('hidden');
            }
        });
        
        dropdown.appendChild(autoDetectOption);
    }
    
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