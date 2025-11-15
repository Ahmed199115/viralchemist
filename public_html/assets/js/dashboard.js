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
    const articleEditor = document.getElementById('articleEditor');
    const publishBtn = document.getElementById('publishBtn');
    let tinyMCEEditor; // Variable to hold the TinyMCE instance
    const seoScoreContent = document.getElementById('seoScoreContent');

    if (blogForm) {
        blogForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateBlogPost();
        });
    }

    // --- TINYMCE INITIALIZATION ---
    tinymce.init({
        selector: '#articleEditor',
        plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
        toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image | aiRewriteButton',
        menubar: 'file edit view insert format tools table help',
        setup: function (editor) {
            editor.ui.registry.addButton('aiRewriteButton', {
                text: 'AI Rewrite',
                icon: 'magic',
                onAction: function () {
                    aiRewriteSelectedText(editor);
                }
            });
            editor.on('init', function (e) {
                tinyMCEEditor = editor;
            });
        }
    });

    // Function to convert Markdown to HTML (simple implementation for initial load)
    function markdownToHtml(markdown) {
        // This is a simple conversion. TinyMCE will handle the final HTML.
        let html = markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/(\n\n)/gim, '</p><p>')
            .replace(/(\n)/gim, '<br>');
        
        return html;
    }

    // --- AI REWRITE LOGIC ---
    async function aiRewriteSelectedText(editor) {
        const selectedText = editor.selection.getContent({ format: 'text' }).trim();
        if (!selectedText) {
            alert('Please select the text you want the AI to rewrite.');
            return;
        }

        editor.windowManager.open({
            title: 'AI Rewrite Options',
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'label',
                        label: 'Selected Text:',
                        items: [{ type: 'html', html: `<p style="max-height: 100px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;">${selectedText.substring(0, 200)}...</p>` }]
                    },
                    {
                        type: 'selectbox',
                        name: 'rewriteGoal',
                        label: 'Rewrite Goal',
                        items: [
                            { text: 'Improve Clarity and Flow', value: 'Improve Clarity and Flow' },
                            { text: 'Expand and Add Detail', value: 'Expand and Add Detail' },
                            { text: 'Simplify and Shorten', value: 'Simplify and Shorten' },
                            { text: 'Improve SEO and Keyword Density', value: 'Improve SEO and Keyword Density' }
                        ],
                        initialValue: 'Improve Clarity and Flow'
                    }
                ]
            },
            buttons: [
                {
                    type: 'custom',
                    name: 'rewrite',
                    text: 'Rewrite',
                    buttonType: 'primary',
                    onAction: async function (api) {
                        const data = api.getData();
                        api.close();
                        
                        editor.setProgressState(true);
                        
                        try {
                            const response = await fetch('/api/rewrite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: selectedText, goal: data.rewriteGoal })
                            });

                            const result = await response.json();

                            if (response.ok) {
                                editor.selection.setContent(result.rewrittenText);
                                editor.notificationManager.open({ text: 'AI Rewrite successful!', type: 'success' });
                            } else {
                                editor.notificationManager.open({ text: result.error || 'AI Rewrite failed.', type: 'error' });
                            }
                        } catch (error) {
                            editor.notificationManager.open({ text: 'Network error during AI Rewrite.', type: 'error' });
                        } finally {
                            editor.setProgressState(false);
                        }
                    }
                },
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                }
            ]
        });
    }

    // --- PUBLISH LOGIC ---
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            if (!tinyMCEEditor) {
                alert('Editor is not ready.');
                return;
            }

            const articleContent = tinyMCEEditor.getContent();
            const articleTitle = tinyMCEEditor.dom.select('h1')[0] ? tinyMCEEditor.dom.select('h1')[0].textContent : 'Untitled Article';

            if (articleContent.length < 100) {
                alert('Article content is too short to publish.');
                return;
            }

            // In a real application, this would send the final HTML to a database
            // and update the blog.html page. For now, we'll simulate success.
            alert(\`Article "\${articleTitle}" is ready to be published! (Simulated)\n\nContent Length: \${articleContent.length} characters.\`);
        });
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
                
                // 1. Display the article in TinyMCE
                if (tinyMCEEditor) {
                    tinyMCEEditor.setContent(markdownToHtml(generatedPost));
                } else {
                    // Fallback if TinyMCE is not yet ready
                    articleEditor.value = generatedPost;
                }
                
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
