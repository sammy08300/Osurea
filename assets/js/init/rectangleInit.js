/**
 * Rectangle Initialization Module
 * Optimized initialization of the rectangle component with improved performance
 */

(function rectangleInit() {
    // Configuration
    const CONFIG = {
        animationDelay: 20,
        loadingOverlayFadeTime: 75,
        initialRectangleStyles: {
            position: 'absolute',
            left: '0',
            top: '0',
            width: '75px',
            height: '75px',
            pointerEvents: 'none',
            visibility: 'hidden',
            opacity: '0',
            transform: 'translateZ(0)',
            willChange: 'transform, left, top, width, height, border-radius'
        }
    };
    
    // Initialize rectangle with optimized performance
    const safeInit = () => {
        try {
            // Prevent multiple initializations
            if (document.body.hasAttribute('data-initialized')) {
                return;
            }
            
            // Mark as initialized
            document.body.setAttribute('data-initialized', 'true');
            document.body.classList.add('loading');
            
            // Disable transitions during initialization
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-normal', '0s');
            
            // Initialize rectangle with hardware acceleration
            const rectangle = document.getElementById('rectangle');
            if (rectangle) {
                rectangle.classList.add('invisible');
                
                // Apply optimized styles
                Object.assign(rectangle.style, CONFIG.initialRectangleStyles);
                
                // Force hardware acceleration
                rectangle.style.transform = 'translateZ(0)';
                rectangle.style.backfaceVisibility = 'hidden';
                rectangle.style.perspective = '1000px';
            }
            
            // Set up load event handler
            window.addEventListener('load', () => {
                // Fade out loading overlay
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.style.opacity = '0';
                    loadingOverlay.style.transition = `opacity ${CONFIG.loadingOverlayFadeTime}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                }
                
                // Use requestAnimationFrame for smoother transitions
                requestAnimationFrame(() => {
                    // Re-enable transitions
                    document.documentElement.style.removeProperty('--transition-fast');
                    document.documentElement.style.removeProperty('--transition-normal');
                    
                    // Hide loading overlay
                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                    }
                    
                    // Update document classes
                    document.documentElement.classList.remove('loading');
                    document.body.classList.add('page-loaded');
                    document.body.classList.remove('loading');
                    
                    // Animate cards with staggered delay
                    const cards = document.querySelectorAll('.card, .section');
                    cards.forEach((card, index) => {
                        card.style.animationDelay = `${Math.min(index * 0.01, 0.02)}s`;
                    });
                });
            });
        } catch (error) {
            console.error('Error during initialization:', error);
            
            // Fallback error handling
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            document.documentElement.classList.remove('loading');
            document.body.classList.remove('loading');
        }
    };
    
    // Execute initialization
    safeInit();
    
    // Fallback timeout to ensure loading state is removed
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay && loadingOverlay.style.display !== 'none') {
            loadingOverlay.style.display = 'none';
        }
        
        document.documentElement.classList.remove('loading');
        document.body.classList.add('page-loaded');
        document.body.classList.remove('loading');
        
        // Ensure rectangle is properly initialized
        const rectangle = document.getElementById('rectangle');
        if (rectangle && rectangle.classList.contains('invisible')) {
            rectangle.classList.remove('invisible');
            rectangle.style.visibility = 'visible';
            rectangle.style.opacity = '1';
            rectangle.style.pointerEvents = 'auto';
        }
    }, 400);
})();