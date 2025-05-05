// Création et affichage dynamique du footer
(function dynamicFooter() {
    document.addEventListener('DOMContentLoaded', function() {
        const footer = document.createElement('footer');
        footer.className = "bg-gray-900 py-4 mt-8 border-t border-gray-800";
        footer.innerHTML = `
            <div class="container mx-auto text-center text-gray-400 text-sm">
                <p>Osu!rea - Area Visualizer v2.0 - <span data-i18n="footer.credit">Conçu pour la communauté osu! par Yuzuctus</span></p>
                <p class="mt-1" data-i18n="footer.description">Utilisez cet outil pour visualiser et sauvegarder votre zone active de tablette graphique.</p>
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