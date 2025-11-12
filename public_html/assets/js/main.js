document.addEventListener("DOMContentLoaded", function() {
    // Function to fetch and insert HTML content
    const loadComponent = (componentPath, targetElementId) => {
        fetch(componentPath)
            .then(response => response.ok ? response.text() : Promise.reject('Component not found'))
            .then(data => {
                document.getElementById(targetElementId).innerHTML = data;
                // After loading header, initialize its scripts
                if (targetElementId === 'header-placeholder') {
                    initializeHeaderScripts();
                }
            })
            .catch(error => console.error(`Error loading ${componentPath}:`, error));
    };

    // Load header and footer
    loadComponent('header_template.html', 'header-placeholder');
    loadComponent('footer_template.html', 'footer-placeholder');

    // --- Theme Toggle Logic ---
    const updateThemeIcon = () => {
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            const isDark = document.documentElement.classList.contains('dark');
            themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        }
    };

    const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        updateThemeIcon();
    };

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        applyTheme();
    };
    
    // --- Menu Toggle Logic ---
    const toggleMenu = () => {
        const sideMenu = document.getElementById('side-menu');
        if (sideMenu) {
            sideMenu.classList.toggle('-translate-x-full');
        }
    };

    // This function will be called after the header is loaded
    const initializeHeaderScripts = () => {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const menuToggleBtn = document.getElementById('menu-toggle');
        const closeMenuBtn = document.getElementById('close-menu');

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }
        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', toggleMenu);
        }
        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', toggleMenu);
        }
    };

    // Apply theme on initial load
    applyTheme();
});
