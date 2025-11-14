document.addEventListener("DOMContentLoaded", function() {
    // --- ELEMENTS ---
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-section');
    const blogForm = document.getElementById('blogGenerateForm');
    const generateBtn = document.getElementById('generateBlogBtn');
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
            'blog-generator': { title: 'Blog Post Generator (Admin Only)', subtitle: 'Generate SEO-optimized blog posts with Llama-4-Scout' },
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

    // --- BLOG POST GENERATOR LOGIC ---
    const keywordInput = document.getElementById('keywordInput');
    const articleOutput = document.getElementById('articleOutput');
    const seoScoreContent = document.getElementById('seoScoreContent');

    if (blogForm) {
        blogForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateBlogPost();
        });
    }

    // Function to convert Markdown to HTML (simple implementation)
    function markdownToHtml(markdown) {
        // Basic replacements for headings, paragraphs, and bold/italic
        let html = markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/(\n\n)/gim, '</p><p>')
            .replace(/(\n)/gim, '<br>');
        
        // Wrap in a paragraph if it doesn't start with a block element
        if (!html.startsWith('<h') && !html.startsWith('<p')) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }

    async function generateBlogPost() {
        const keyword = keywordInput.value.trim();
        if (!keyword) return;

        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="loading-spinner mr-2"></span> Generating with Llama-4-Scout...`;
        processingStatus.classList.remove('hidden');
        resultSection.classList.remove('show');
        articleOutput.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">Generating article...</p>';
        seoScoreContent.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">Analyzing...</p>';

        try {
            const response = await fetch('/api/blog/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyword: keyword })
            });

            const data = await response.json();

            if (response.ok) {
                const generatedPost = data.post;
                
                // 1. Display the article
                articleOutput.innerHTML = markdownToHtml(generatedPost);
                
                // 2. Display SEO Score and Analysis
                const seoAnalysis = data.seoAnalysis;
                const score = seoAnalysis.score || 0;
                let analysisHtml = '';

                if (seoAnalysis.analysis && Array.isArray(seoAnalysis.analysis)) {
                    analysisHtml = seoAnalysis.analysis.map(item => {
                        const iconClass = item.type === 'Good' ? 'fas fa-check-circle text-green-500' : 'fas fa-exclamation-triangle text-red-500';
                        return `<li class="flex items-start"><i class="${iconClass} mr-2 mt-1"></i><span>${item.point}</span></li>`;
                    }).join('');
                } else {
                    analysisHtml = `<li class="flex items-start"><i class="fas fa-exclamation-triangle text-red-500 mr-2 mt-1"></i><span>Could not retrieve detailed analysis. Score: ${score}</span></li>`;
                }

                seoScoreContent.innerHTML = `
                    <div class="text-center">
                        <p class="text-6xl font-extrabold text-viral-blue">${score}</p>
                        <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">SEO Score</p>
                    </div>
                    <ul class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-none p-0">
                        ${analysisHtml}
                    </ul>
                `;

                // 3. Show results
                resultSection.classList.add('show');
                resultSection.scrollIntoView({ behavior: 'smooth' });

            } else {
                articleOutput.innerHTML = `<p class="text-red-500">Error: ${data.error || 'Failed to generate post.'}</p>`;
                seoScoreContent.innerHTML = '<p class="text-center text-red-500">Generation Failed</p>';
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            articleOutput.innerHTML = `<p class="text-red-500">Network Error: Could not connect to the server.</p>`;
            seoScoreContent.innerHTML = '<p class="text-center text-red-500">Connection Error</p>';
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `Generate Blog Post (Llama-4-Scout) <i class="fas fa-arrow-right ml-2"></i>`;
            processingStatus.classList.add('hidden');
        }
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
