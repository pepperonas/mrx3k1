document.addEventListener('DOMContentLoaded', function () {
    // Scroll-to-top Button
    const scrollButton = document.createElement('button');
    scrollButton.classList.add('scroll-top');
    scrollButton.innerHTML = '&uarr;';
    document.body.appendChild(scrollButton);

    // Zeige Button erst ab bestimmter Scroll-Position
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    });

    // Scroll nach oben bei Klick
    scrollButton.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Code-Syntax Highlighting aktivieren
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });

    // Mobile Navigation
    const menuToggle = document.createElement('button');
    menuToggle.classList.add('menu-toggle');
    menuToggle.innerHTML = '&#9776;';

    const navContainer = document.querySelector('header nav');
    navContainer.parentNode.insertBefore(menuToggle, navContainer);

    menuToggle.addEventListener('click', function () {
        navContainer.classList.toggle('active');
    });

    // Aktiven Menüpunkt hervorheben
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav ul li a').forEach(link => {
        if (currentPath === link.getAttribute('href') ||
            (link.getAttribute('href') !== '/docs' && currentPath.includes(link.getAttribute('href')))) {
            link.classList.add('active');
        }
    });

    // Ladezeiten für Bilder verbessern
    document.querySelectorAll('img').forEach(img => {
        img.loading = 'lazy';
    });
});