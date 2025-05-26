// Modern dynamic header component
(function dynamicHeader() {
    document.addEventListener('DOMContentLoaded', function() {
        const headerContent = document.querySelector('header .container');
        if (!headerContent) return;
        
        // Replace header content with modern design
        headerContent.innerHTML = `
            <div class="flex justify-between items-center">
                <!-- Logo and title -->
                <div class="flex items-center">
                    <img src="assets/img/favicon.svg" alt="Osu!rea Logo" class="w-8 h-8 mr-2" />
                    <h1 class="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                        <span><span class="text-secondary">Osu!</span><span class="text-primary">rea</span></span>
                        <span class="hidden sm:inline text-gray-400">-</span>
                        <span class="hidden sm:inline text-gray-300 text-lg md:text-2xl font-medium" data-i18n="app.title">Area Visualizer</span>
                        <span class="bg-gradient-to-r from-secondary to-primary text-white text-xs px-2 py-0.5 rounded-md font-semibold ml-1 shadow-sm">v2.x</span>
                    </h1>
                </div>
                
                <!-- Language selector only -->
                <div id="locale-switcher" class="relative" style="visibility:hidden; opacity:0; transition:opacity 0.3s ease-out;">
                    <button id="locale-button" class="flex items-center space-x-1 bg-light-blue hover:bg-accent-blue text-gray-200 px-3 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                        <span id="selected-locale-text"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div id="locale-dropdown" class="absolute right-0 mt-1 bg-light-blue border border-accent-blue rounded-md shadow-lg z-20 w-full overflow-hidden hidden">
                        <!-- Language options will be inserted here by the script -->
                    </div>
                </div>
            </div>
        `;
        
        // Apply style changes to the header
        const header = document.querySelector('header');
        if (header) {
            header.className = "py-4 bg-darker-blue shadow-lg mb-6 border-b border-accent-blue relative z-10";
            
            // Add subtle gradient backdrop
            const headerBackdrop = document.createElement('div');
            headerBackdrop.className = "absolute inset-0 bg-gradient-to-r from-darker-blue via-dark-blue to-darker-blue opacity-70 z-[-1]";
            header.prepend(headerBackdrop);
        }
    });
})(); 