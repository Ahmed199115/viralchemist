document.addEventListener("DOMContentLoaded", function() {
    // --- ELEMENTS ---
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-section');
    const articleForm = document.getElementById('articleGeneratorForm');
    const generateBtn = document.getElementById('generateBtn');
    const processingStatus = document.getElementById('processingStatus');
    const resultSection = document.getElementById('resultSection');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const sidebar = document.getElementById('sidebar');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const mainContentOverlay = document.getElementById('main-content-overlay');

    // --- SIDEBAR TOGGLE FOR MOBILE ---
    function toggleSidebar() {
        sidebar.classList.toggle('-translate-x-full');
        mainContentOverlay.classList.toggle('hidden');
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', toggleSidebar);
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', toggleSidebar);
    }
    if (mainContentOverlay) {
        mainContentOverlay.addEventListener('click', toggleSidebar);
    }

    // --- PAGE SWITCHING ---
    function switchPage(pageId) {
        pages.forEach(page => page.classList.add('hidden'));
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });

        const titles = {
            'overview': { title: 'Overview', subtitle: 'Welcome back to your dashboard' },
            'article-generator': { title: 'Article Generator', subtitle: 'Create SEO-optimized articles with AI' },
            'history': { title: 'Article History', subtitle: 'View your previous articles' },
            'analytics': { title: 'Analytics', subtitle: 'Track your article performance' },
            'settings': { title: 'Settings', subtitle: 'Manage your account and API keys' }
        };
        if (pageTitle && pageSubtitle && titles[pageId]) {
            pageTitle.textContent = titles[pageId].title;
            pageSubtitle.textContent = titles[pageId].subtitle;
        }
        
        // Close sidebar on navigation in mobile
        if (window.innerWidth < 1024 && !sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            switchPage(pageId);
        });
    });

    const initialPage = window.location.hash.substring(1) || 'overview';
    switchPage(initialPage);

    // --- ARTICLE GENERATOR LOGIC (Simulation) ---
    if (articleForm) {
        articleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            simulateArticleGeneration();
        });
    }

    async function simulateArticleGeneration() {
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="loading-spinner mr-2"></span> Generating...`;
        processingStatus.classList.remove('hidden');
        resultSection.classList.remove('show');

        const steps = ['step-search', 'step-analyze', 'step-generate', 'step-images'];
        for (const stepId of steps) {
            const stepElement = document.getElementById(stepId);
            if (stepElement) {
                const iconContainer = stepElement.querySelector('div');
                const icon = iconContainer.querySelector('i');
                iconContainer.classList.remove('bg-gray-300', 'dark:bg-gray-600');
                iconContainer.classList.add('bg-blue-500');
                icon.classList.add('fa-spin');
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                icon.classList.remove('fa-spin');
                icon.className = 'fas fa-check';
                iconContainer.classList.remove('bg-blue-500');
                iconContainer.classList.add('bg-green-500');
            }
        }

        resultSection.classList.add('show');
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
        generateBtn.disabled = false;
        generateBtn.innerHTML = `Generate Article <i class="fas fa-arrow-right ml-2"></i>`;
    }

    // --- TABS LOGIC ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => {
                content.style.display = content.getAttribute('data-tab-content') === tabId ? 'block' : 'none';
            });
        });
    });

    // --- LOGOUT ---
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = 'login.html';
            }
        });
    });
});
