// Lazy loading des images
export function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('img.lazy-image:not(.loaded)');
    lazyImages.forEach(img => {
        if (isInViewport(img)) {
            img.classList.add('loaded');
        }
    });
}

function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
        rect.bottom >= 0 &&
        rect.right >= 0
    );
}

export function setupLazyLoadListeners() {
    lazyLoadImages();
    window.addEventListener('scroll', lazyLoadImages);
    window.addEventListener('resize', lazyLoadImages);
    window.addEventListener('orientationchange', lazyLoadImages);
} 