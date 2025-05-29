// Initialisation rapide du rectangle et gestion du loading overlay
(function rectangleInit(): void {
    const safeInit = (): void => {
        try {
            if (document.body.hasAttribute('data-initialized')) { return; }
            document.body.setAttribute('data-initialized', 'true');
            document.body.classList.add('loading');
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-normal', '0s');
            
            const rectangle = document.getElementById('rectangle') as HTMLElement | null;
            if (rectangle) {
                rectangle.classList.add('invisible');
                const defaultStyles: Partial<CSSStyleDeclaration> = { 
                    position: 'absolute', 
                    left: '0px', // Ensure units are strings
                    top: '0px', 
                    width: '75px', 
                    height: '75px', 
                    pointerEvents: 'none' 
                };
                Object.assign(rectangle.style, defaultStyles);
            }

            window.addEventListener('load', () => {
                const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement | null;
                if (loadingOverlay) {
                    loadingOverlay.style.opacity = '0';
                    loadingOverlay.style.transition = 'opacity 0.075s cubic-bezier(0.4, 0, 0.2, 1)';
                }
                setTimeout(() => {
                    document.documentElement.style.removeProperty('--transition-fast');
                    document.documentElement.style.removeProperty('--transition-normal');
                    if (loadingOverlay) { loadingOverlay.style.display = 'none'; }
                    document.documentElement.classList.remove('loading');
                    document.body.classList.add('page-loaded');
                    document.body.classList.remove('loading');
                    
                    const cards = document.querySelectorAll<HTMLElement>('.card, .section');
                    cards.forEach((card: HTMLElement, index: number) => { 
                        card.style.animationDelay = `${Math.min(index * 0.01, 0.02)}s`; 
                    });
                }, 20);
            });
        } catch (error) {
            console.error('Error during initialization:', error);
            const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement | null;
            if (loadingOverlay) { loadingOverlay.style.display = 'none'; }
            document.documentElement.classList.remove('loading');
            document.body.classList.remove('loading');
        }
    };

    safeInit();

    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement | null;
        if (loadingOverlay && loadingOverlay.style.display !== 'none') { 
            loadingOverlay.style.display = 'none'; 
        }
        document.documentElement.classList.remove('loading');
        document.body.classList.add('page-loaded');
        document.body.classList.remove('loading');
    }, 400);
})();
