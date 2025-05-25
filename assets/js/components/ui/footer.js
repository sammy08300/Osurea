// Création et affichage dynamique du footer
(function dynamicFooter() {
    document.addEventListener('DOMContentLoaded', function() {
        const footer = document.createElement('footer');
        footer.id = "footer";
        footer.className = "site-footer py-4";
        footer.innerHTML = `
            <div class="container footer-content">
                <div class="footer-info">
                    <h3 class="text-base"><span class="text-[#FF66AA]">Osu!</span>rea</h3>
                    <p class="text-xs">Area visualizer</p>
                </div>
                <div class="footer-resources">
                    <h4 class="text-sm" data-i18n="footer.tabletSettings">Tablet Settings</h4>
                    <ul class="text-xs">
                        <li><a href="https://github.com/OpenTabletDriver/OpenTabletDriver" target="_blank"><i class="fab fa-github"></i> Open Tablet Driver</a></li>
                        <li><a href="https://github.com/KaikeGold/OsuAreaCalculator" target="_blank"><i class="fab fa-github"></i> Osu Area Calculator</a></li>
                        <li><a href="https://mixmg.github.io/smoothing/smoothing-calculator.html" target="_blank"><i class="fas fa-calculator"></i> Smoothing Calculator</a></li>
                    </ul>
                </div>
                <div class="footer-social">
                    <h4 class="text-sm" data-i18n="footer.spreadsheets">Spreadsheets</h4>
                    <ul class="text-xs">
                        <li><a href="https://docs.google.com/spreadsheets/d/125LNzGmidy1gagwYUt12tRhrNdrWFHhWon7kxWY7iWU/edit?gid=854129046#gid=854129046" target="_blank"><i class="fas fa-table"></i> Tablet Compatibility Spreadsheet</a></li>
                        <li><a href="https://docs.google.com/spreadsheets/d/1DYVfiSpQqdpa4sWWYUALPmliOIuGyKog7B7LJJdmlhE/edit?gid=2077726645#gid=2077726645" target="_blank"><i class="fas fa-table"></i> Area Calculator Spreadsheet</a></li>
                    </ul>
                </div>
                <div class="footer-projects">
                    <h4 class="text-sm" data-i18n="footer.otherProjects">Other projects</h4>
                    <ul class="text-xs">
                        <li><a href="https://osu-yuzu-skins.vercel.app/" target="_blank"><i class="fas fa-palette"></i> Osu!Yuzu skins</a></li>
                    </ul>
                </div>
                <div class="copyright">
                    <p class="text-xs">© 2025 Osu!rea Area Visualizer. All rights reserved.</p>
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
