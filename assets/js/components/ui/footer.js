// Footer avec layout horizontal
(function dynamicFooter() {
    document.addEventListener('DOMContentLoaded', function() {
        const footer = document.createElement('footer');
        footer.id = "footer";
        footer.className = "bg-darker-blue py-6 relative";
        
        footer.innerHTML = `
            <div class="container mx-auto px-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                    <!-- Titre principal -->
                    <div>
                        <h3 class="text-xl mb-1"><span class="text-secondary">Osu!</span><span class="text-primary">rea</span></h3>
                        <p class="text-gray-400 text-sm">Area visualizer</p>
                    </div>
                    
                    <!-- Paramètres Tablette -->
                    <div>
                        <h4 class="text-blue-300 font-medium mb-2" data-i18n="footer.tabletSettings">Paramètres Tablette</h4>
                        <ul class="space-y-1">
                            <li>
                                <a href="https://github.com/OpenTabletDriver/OpenTabletDriver" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fab fa-github mr-2 text-secondary"></i> 
                                    <span>Open Tablet Driver</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com/KaikeGold/OsuAreaCalculator" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fab fa-github mr-2 text-secondary"></i> 
                                    <span>Osu Area Calculator</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://mixmg.github.io/smoothing/smoothing-calculator.html" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fas fa-calculator mr-2 text-secondary"></i> 
                                    <span>Smoothing Calculator</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Feuilles de calcul -->
                    <div>
                        <h4 class="text-blue-300 font-medium mb-2" data-i18n="footer.spreadsheets">Feuilles de calcul</h4>
                        <ul class="space-y-1">
                            <li>
                                <a href="https://docs.google.com/spreadsheets/d/125LNzGmidy1gagwYUt12tRhrNdrWFHhWon7kxWY7iWU/edit?gid=854129046#gid=854129046" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fas fa-table mr-2 text-secondary"></i> 
                                    <span>Tablet Compatibility</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://docs.google.com/spreadsheets/d/1DYVfiSpQqdpa4sWWYUALPmliOIuGyKog7B7LJJdmlhE/edit?gid=2077726645#gid=2077726645" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fas fa-table mr-2 text-secondary"></i> 
                                    <span>Area Calculator</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Mes projets -->
                    <div>
                        <h4 class="text-blue-300 font-medium mb-2" data-i18n="footer.otherProjects">Mes projets</h4>
                        <ul class="space-y-1">
                            <li>
                                <a href="https://github.com/sammy08300/Osurea" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fab fa-github mr-2 text-secondary"></i> 
                                    <span>Osurea GitHub</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://osu-yuzu-skins.vercel.app/" target="_blank" 
                                   class="footer-link flex items-center text-gray-400 hover:text-primary transition-all">
                                    <i class="fas fa-palette mr-2 text-secondary"></i> 
                                    <span>OsuYuzu skins</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Copyright -->
                <div class="mt-6 pt-3 border-t border-gray-800 text-center md:text-left">
                    <p class="text-gray-500 text-sm">© 2025 Osu!rea Area Visualizer. All rights reserved.</p>
                </div>
            </div>
        `;
        
        const footerContainer = document.getElementById('footer-container');
        window.addEventListener('load', function() {
            setTimeout(function() {
                if (footerContainer) {
                    footerContainer.appendChild(footer);
                    setTimeout(function() {
                        footerContainer.style.opacity = '1';
                        if (typeof updateAllTranslations === 'function') {
                            updateAllTranslations();
                        }
                    }, 300);
                }
            }, 150);
        });
    });
})(); 
