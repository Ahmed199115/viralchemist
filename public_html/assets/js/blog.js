document.addEventListener("DOMContentLoaded", function() {
    const articlesContainer = document.getElementById("articles-container");
    const featuredArticleSection = document.getElementById("featured-article-section");
    const loadingMessage = document.getElementById("loading-message");

    async function fetchAndDisplayArticles() {
        try {
            const response = await fetch("/api/blog");
            const data = await response.json();

            if (response.ok && data.posts && data.posts.length > 0) {
                loadingMessage.style.display = "none";
                const articles = data.posts;

                // Display Featured Article (the latest one)
                displayFeaturedArticle(articles[0]);

                // Display Latest Articles (the rest)
                articles.slice(1).forEach(article => {
                    const articleCard = createArticleCard(article);
                    articlesContainer.appendChild(articleCard);
                });

            } else {
                loadingMessage.textContent = data.message || "No articles found.";
            }
        } catch (error) {
            console.error("Error fetching articles:", error);
            loadingMessage.textContent = "Failed to load articles. Please try again later.";
        }
    }

    function displayFeaturedArticle(article) {
        if (!article) return;

        featuredArticleSection.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Featured Insight</h2>
            <a class="block card-hover group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden lg:flex" href="#">
                <div class="lg:w-1/2">
                    <img alt="${article.title}" class="w-full h-64 lg:h-full object-cover" loading="lazy" src="assets/images/ai_alchemy.jpg"/>
                </div>
                <div class="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <span class="text-xs font-semibold uppercase tracking-wider text-viral-purple mb-2">Featured | ${article.author}</span>
                    <h3 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-viral-blue">${article.title}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">${article.excerpt}</p>
                    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <i class="fas fa-calendar-alt mr-2"></i>
                        <span>${article.date}</span>
                        <span class="mx-2">|</span>
                        <span class="font-semibold">Read Article</span>
                    </div>
                </div>
            </a>
        `;
    }

    function createArticleCard(article) {
        const card = document.createElement("a");
        card.className = "block card-hover group";
        card.href = "#"; // Link to the full article page in the future

        card.innerHTML = `
            <article class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
                <img alt="${article.title}" class="w-full h-48 object-cover" loading="lazy" src="assets/images/comment_growth.jpg"/>
                <div class="p-6 flex flex-col flex-grow">
                    <span class="text-xs font-semibold uppercase text-viral-blue mb-2">${article.author}</span>
                    <h4 class="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-viral-blue">${article.title}</h4>
                    <p class="text-gray-600 dark:text-gray-400 mb-4 flex-grow">${article.excerpt}</p>
                    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
                        <i class="fas fa-calendar-alt mr-2"></i>
                        <span>${article.date}</span>
                    </div>
                </div>
            </article>
        `;
        return card;
    }

    fetchAndDisplayArticles();
});
