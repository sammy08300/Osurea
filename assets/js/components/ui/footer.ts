// Création et affichage dynamique du footer (Style OsuYuzu compact)

// Define a global function type if it's expected to be available
declare function updateAllTranslations(): void;

(function dynamicFooter(): void {
    document.addEventListener('DOMContentLoaded', function(): void {
        const footer = document.createElement('footer');
        footer.id = "footer";
        footer.className = "site-footer";
        footer.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <!-- Logo Section -->
                    <div class="footer-brand">
                        <h3><span class="osu">Osu!</span><span class="yuzu">rea</span></h3>
                        <p class="subtitle">Area visualizer</p>
                    </div>
                    
                    <!-- Resources Section -->
                    <div class="footer-section">
                        <h4 data-i18n="footer.tabletSettings">Paramètres Tablette</h4>
                        <ul>
                            <li><a href="https://github.com/OpenTabletDriver/OpenTabletDriver" target="_blank"><i class="fab fa-github"></i> Open Tablet Driver</a></li>
                            <li><a href="https://github.com/KaikeGold/OsuAreaCalculator" target="_blank"><i class="fab fa-github"></i> Osu Area Calculator</a></li>
                            <li><a href="https://mixmg.github.io/smoothing/smoothing-calculator.html" target="_blank"><i class="fas fa-calculator"></i> Smoothing Calculator</a></li>
                        </ul>
                    </div>
                    
                    <!-- Spreadsheets Section -->
                    <div class="footer-section">
                        <h4 data-i18n="footer.spreadsheets">Feuilles de calcul</h4>
                        <ul>
                            <li><a href="https://docs.google.com/spreadsheets/d/125LNzGmidy1gagwYUt12tRhrNdrWFHhWon7kxWY7iWU/edit?gid=854129046#gid=854129046" target="_blank"><i class="fas fa-table"></i> Tablet Compatibility Spreadsheet</a></li>
                            <li><a href="https://docs.google.com/spreadsheets/d/1DYVfiSpQqdpa4sWWYUALPmliOIuGyKog7B7LJJdmlhE/edit?gid=2077726645#gid=2077726645" target="_blank"><i class="fas fa-table"></i> Area Calculator Spreadsheet</a></li>
                        </ul>
                    </div>
                    
                    <!-- Other Projects Section -->
                    <div class="footer-section">
                        <h4 data-i18n="footer.otherProjects">Autres projets</h4>
                        <ul>
                            <li><a href="https://osu-yuzu-skins.vercel.app/" target="_blank"><i class="fas fa-palette"></i> Osu!Yuzu skins</a></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Copyright -->
                <div class="footer-copyright">
                    <p>© 2025 Osu!rea Area Visualizer. All rights reserved.</p>
                </div>
            </div>
        `;
        const footerContainer = document.getElementById('footer-container') as HTMLElement | null;
        window.addEventListener('load', function(): void {
            setTimeout(function(): void {
                if (footerContainer) {
                    footerContainer.appendChild(footer);
                    setTimeout(function(): void {
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
