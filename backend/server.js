const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const app = express();
const port = 3000;

// The API key is now loaded from the .env file in this directory.
const { OpenAI } = require('openai');
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    // The API key is still picked up from the OPENAI_API_KEY environment variable,
    // which OpenRouter supports for compatibility.
});

// Middleware to parse JSON bodies
app.use(express.json());

// Set up multer for file storage
const upload = multer({ dest: 'uploads/' });

// Ensure the uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// The detailed prompt provided by the user for human-like, high-engagement content.
const POST_ALCHEMY_SYSTEM_PROMPT = `You are a professional LinkedIn content strategist. Your goal: write a post that feels 100% human, engaging, and emotionally intelligent.

Requirements:
1️⃣ Make it natural, like a real professional sharing insights, stories, or lessons from experience.
2️⃣ Include subtle human imperfections: short sentences for emphasis, occasional ellipses, varied sentence lengths, and a conversational tone.
3️⃣ Add **one relevant emoji per paragraph** to make the post visually lively and engaging.
4️⃣ End with a **question that invites audience engagement** and encourages comments.
5️⃣ Do not include any headings, instructions, or extra text—just the LinkedIn post itself.
6️⃣ Keep readability at Grade 7–9 level.
7️⃣ Avoid overly generic phrases or AI-like expressions (e.g., “in today’s fast-paced world”).
8️⃣ Focus on giving value while remaining authentic and relatable.

The post must be generated based on the following inputs:
- **Topic/Keyword**: \${topic}
- **Goal**: \${goal}
- **Tone**: \${tone}

The output must be ONLY the post content, following all the instructions. Do not include any introductory or concluding remarks.
`;

// Route for the "Post Alchemy" service
app.post('/api/post-alchemy', async (req, res) => {
    console.log('Post Alchemy request received:', req.body);
    
    const { topic, goal, tone } = req.body;

    if (!topic || !goal || !tone) {
        return res.status(400).json({ error: 'Missing required fields: topic, goal, and tone.' });
    }

    const userPrompt = `Generate a LinkedIn post based on the following inputs:
- **Topic/Keyword**: ${topic}
- **Goal**: ${goal}
- **Tone**: ${tone}

The output must be ONLY the post content, following all the instructions in the system prompt. Do not include any introductory or concluding remarks.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Using the specified free model from OpenRouter.ai
            messages: [
                { role: "system", content: POST_ALCHEMY_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.8, // Higher temperature for more human-like, less predictable output
        });

        const generatedPost = completion.choices[0].message.content.trim();

        // The user requested the output to be returned in the 'output' section of the page.
        // We'll return it in the JSON response under a 'post' key.
        res.json({ 
            message: 'Post generated successfully.', 
            post: generatedPost 
        });

    } catch (error) {
        console.error('OpenRouter API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate post from OpenRouter API.',
            details: error.message
        });
    }
});

// The detailed prompt provided by the user for human-like, high-engagement content.
// We will modify the system prompt to include the comment-specific instructions.
const COMMENT_ALCHEMY_SYSTEM_PROMPT = `You are a professional LinkedIn engagement strategist. Your job is to write a deeply thoughtful, value-adding comment on a LinkedIn post.

Your goal:
Write a comment that sounds 100% human—insightful, conversational, and genuinely engaging.

Before writing the comment, analyze the user's provided LinkedIn post carefully:
- Understand the tone (motivational, technical, personal, reflective, etc.).
- Identify the main message, the emotional core, and the intent of the post.
- Detect opportunities to add value: a perspective, an insight, a personal reflection, or a reinforcing point.

Comment Requirements:
1️⃣ Write a natural, human-like comment that aligns with the tone and message of the original post.
2️⃣ Add meaningful value: include one insight, reflection, or perspective that deepens the conversation.
3️⃣ Keep the tone warm, supportive, and professional.
4️⃣ Use **one relevant emoji only** (not more).
5️⃣ Vary the sentence lengths and structure for natural flow; include subtle human imperfections like short sentences for emphasis.
6️⃣ Keep the comment concise (2–4 natural sentences).
7️⃣ Avoid clichés, generic lines, and AI-style expressions (e.g., “great post!”, “thanks for sharing”, “in today’s fast-paced world”).
8️⃣ Do NOT output headings or meta-instructions—only the final comment.
`;

// Route for the "Comment Alchemy" service
app.post('/api/comment-alchemy', upload.single('image'), async (req, res) => {
    console.log('Comment Alchemy request received:', req.body);
    
    const { post_text, goal, tone } = req.body;
    const imageFile = req.file;

    if (!post_text && !imageFile) {
        return res.status(400).json({ error: 'Missing required fields: either post_text or an image must be provided.' });
    }
    if (!goal || !tone) {
        return res.status(400).json({ error: 'Missing required fields: goal and tone.' });
    }

    let postContent = post_text || '';
    let imagePath = null;

    // 1. Handle Image Upload and OCR
    if (imageFile) {
        imagePath = path.join(__dirname, 'uploads', imageFile.filename);
        try {
            // Use Tesseract.js to extract text from the image
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(imagePath);
            await worker.terminate();

            // Append the extracted text to postContent
            postContent = (postContent ? postContent + '\n\n' : '') + `[Extracted Text from Image]:\n${text.trim()}`;

            // Clean up the uploaded file
            fs.unlinkSync(imagePath);
        } catch (error) {
            console.error('OCR or File processing error:', error);
            // Clean up the file even if OCR fails
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
            return res.status(500).json({ error: 'Failed to process the uploaded image for text extraction (OCR).' });
        }
    }

    // If no text was provided and no text was extracted from the image, return error
    if (!postContent) {
        return res.status(400).json({ error: 'Missing required fields: post_text or a readable image must be provided.' });
    }

    // 2. Construct the prompt for the AI
    const messages = [
        { role: "system", content: COMMENT_ALCHEMY_SYSTEM_PROMPT }
    ];

    const userPromptText = `Input: ${postContent}

Goal: ${goal}
Tone: ${tone}

Output: The final, polished LinkedIn comment only.`;

    const userMessageContent = [
        {
            type: "text",
            text: userPromptText
        }
    ];

    messages.push({ role: "user", content: userMessageContent });

    // 3. Call the OpenAI API
    try {
        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Using the specified free model from OpenRouter.ai
            messages: messages,
            temperature: 0.8,
        });

        const generatedComment = completion.choices[0].message.content.trim();

        res.json({ 
            message: 'Comment generated successfully.', 
            comment: generatedComment 
        });

    } catch (error) {
        console.error('OpenRouter API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate comment from OpenRouter API.',
            details: error.message
        });
    }
});

// System prompt for the Hashtags Generate service
const HASHTAG_SYSTEM_PROMPT = `You are a professional social media hashtag strategist for LinkedIn. Your task is to analyze the provided topic/text and generate a list of highly relevant, categorized hashtags.

The output MUST be a JSON object with the following structure:
{
  "Broad": ["#tag1", "#tag2", ...],
  "Niche": ["#tagA", "#tagB", ...],
  "Trending": ["#tagX", "#tagY", ...]
}

- 'Broad' hashtags should be general and high-volume.
- 'Niche' hashtags should be specific to the sub-topic and low-volume.
- 'Trending' hashtags should be current and widely used.
- Generate 5-10 hashtags for each category.
- Ensure all hashtags are professional and relevant to the topic.
- Do not include any text or explanation outside the JSON object.`;

// Route for the "Hashtags Generate" service
app.post('/api/hashtags-generate', async (req, res) => {
    console.log('Hashtags Generate request received:', req.body);
    
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Missing required field: topic.' });
    }

    const userPrompt = `Generate categorized hashtags for the following topic/text: "${topic}"`;

    try {
        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Use a free model for structured output
            messages: [
                { role: "system", content: HASHTAG_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.5, // Lower temperature for more predictable, structured output
            // response_format: { type: "json_object" } // Removed as it's not supported by the free model
        });

        const jsonString = completion.choices[0].message.content.trim();
        const hashtags = JSON.parse(jsonString);

        res.json({ 
            message: 'Hashtags generated successfully.', 
            hashtags: hashtags 
        });

    } catch (error) {
        console.error('OpenAI API Error or JSON Parse Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate structured hashtags from OpenAI API.',
            details: error.message
        });
    }
});

// Placeholder route for user login
app.post('/api/login', (req, res) => {
    // Logic for user login will be added later
    console.log('Login request received:', req.body);
    res.json({ message: 'Login functionality is under development.', success: false });
});

// Placeholder route for user signup
app.post('/api/signup', (req, res) => {
    // Logic for user signup will be added later
    console.log('Signup request received:', req.body);
    res.json({ message: 'Signup functionality is under development.', success: false });
});

// Route for publishing a new blog post (from dashboard)
app.post('/api/blog/publish', async (req, res) => {
    console.log('Blog post publish request received:', req.body);
    
    const { title, content, seoAnalysis } = req.body;

    if (!title || !content || !seoAnalysis) {
        return res.status(400).json({ error: 'Missing required fields: title, content, and seoAnalysis.' });
    }

    const article = {
        id: Date.now(), // Simple unique ID
        title: title,
        content: content, // HTML content from TinyMCE
        seoAnalysis: seoAnalysis,
        date: new Date().toISOString().split('T')[0],
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
        excerpt: content.replace(/<[^>]*>/g, '').substring(0, 200) + '...', // Simple excerpt from HTML
        author: 'Admin' // Assuming Admin for now
    };

    const articlesFilePath = path.join(__dirname, 'articles.json');

    try {
        // 1. Read existing articles
        let articles = [];
        if (fs.existsSync(articlesFilePath)) {
            const data = await fs.promises.readFile(articlesFilePath, 'utf8');
            articles = JSON.parse(data);
        }

        // 2. Add new article
        articles.unshift(article); // Add to the beginning

        // 3. Write back to file
        await fs.promises.writeFile(articlesFilePath, JSON.stringify(articles, null, 2), 'utf8');

        res.json({ 
            message: 'Article published successfully.', 
            article: article 
        });

    } catch (error) {
        console.error('File operation error during publish:', error);
        res.status(500).json({ 
            error: 'Failed to publish article due to server error.',
            details: error.message
        });
    }
});

// Placeholder route for creating a new blog post (from dashboard)
app.post('/api/blog/create', (req, res) => {
    // This is now redundant but kept for structure. The publish route is the main one.
    console.log('Blog post creation request received:', req.body);
    res.json({ message: 'Blog creation functionality is under development.', success: false });
});

// Route for fetching blog posts
app.get('/api/blog', async (req, res) => {
    const articlesFilePath = path.join(__dirname, 'articles.json');

    try {
        // 1. Read existing articles
        let articles = [];
        if (fs.existsSync(articlesFilePath)) {
            const data = await fs.promises.readFile(articlesFilePath, 'utf8');
            articles = JSON.parse(data);
        }

        res.json({ 
            message: 'Articles fetched successfully.', 
            posts: articles 
        });

    } catch (error) {
        console.error('File operation error during fetch:', error);
        res.status(500).json({ 
            error: 'Failed to fetch articles due to server error.',
            details: error.message
        });
    }
});

// Simple health check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', service: 'viralchemist-backend' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// --- Blog Post Generation Service (Dashboard Feature) ---

// System prompt for the SEO Analysis service
const SEO_ANALYSIS_SYSTEM_PROMPT = \`You are an expert SEO content analyst. Your task is to analyze a provided blog post against a target keyword and return a structured JSON object containing an SEO score and a list of key analysis points.

The analysis must be based on the following criteria:
1.  **SEO Score (0-100):** A single integer representing the overall quality and SEO-friendliness of the post.
2.  **Analysis Points:** A list of 3-5 critical observations about the post, categorized as 'Good' (positive) or 'Improvement' (needs work).

The output MUST be a JSON object with the following structure:
{
  "score": 85, // Integer between 0 and 100
  "analysis": [
    { "type": "Good", "point": "Strong, keyword-rich title and first paragraph." },
    { "type": "Improvement", "point": "The article is slightly short; aim for 1000+ words for competitive keywords." },
    { "type": "Good", "point": "Excellent use of H2 and H3 headings for structure." }
  ]
}

Do not include any text or explanation outside the JSON object.
\`;

// System prompt for the Blog Post Generation service
const BLOG_POST_SYSTEM_PROMPT = `You are a professional SEO and content strategist for a high-authority blog. Your task is to write a comprehensive, engaging, and well-structured blog post based on a single keyword.

Requirements:
1.  **Structure:** The post must be structured using Markdown headings (H2, H3) for readability.
2.  **Length:** The content should be substantial, aiming for a minimum of 800 words (though the model will determine the final length).
3.  **SEO Focus:** Naturally integrate the provided keyword throughout the article, especially in the title and first paragraph.
4.  **Tone:** Professional, authoritative, and engaging.
5.  **Content:** Provide deep insights, actionable advice, and clear explanations.
6.  **Output Format:** The output MUST be ONLY the blog post content in Markdown format, starting with a main title (H1) and followed by the body. Do not include any introductory or concluding remarks outside the article itself.
`;

// Route for the "Blog Post Generation" service
app.post('/api/blog/generate', async (req, res) => {
    console.log('Blog Post Generation request received:', req.body);
    
    const { keyword } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Missing required field: keyword.' });
    }

    const userPrompt = \`Generate a comprehensive blog post based on the following keyword: "${keyword}"\`;

    try {
        // 1. Generate the Blog Post
        const generationCompletion = await openai.chat.completions.create({
            model: "meta-llama/llama-4-scout:free", // As requested by the user
            messages: [
                { role: "system", content: BLOG_POST_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7, // Balanced temperature for creative but factual content
        });

        const generatedPost = generationCompletion.choices[0].message.content.trim();

        // 2. Analyze the Generated Post for SEO Score
        const analysisPrompt = \`Analyze the following blog post against the target keyword: "${keyword}"

Blog Post Content:
---
${generatedPost}
---\`;

        const analysisCompletion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Using a free model for structured analysis
            messages: [
                { role: "system", content: SEO_ANALYSIS_SYSTEM_PROMPT },
                { role: "user", content: analysisPrompt }
            ],
            temperature: 0.5, // Lower temperature for more predictable, structured output
        });

        const analysisJsonString = analysisCompletion.choices[0].message.content.trim();
        let analysisData;
        try {
            analysisData = JSON.parse(analysisJsonString);
        } catch (e) {
            console.error("Failed to parse SEO analysis JSON:", analysisJsonString);
            analysisData = {
                score: 0,
                analysis: [{ type: "Improvement", point: "Failed to get structured SEO analysis from AI." }]
            };
        }

        // 3. Return both the post and the analysis
        res.json({ 
            message: 'Blog post generated and analyzed successfully.', 
            post: generatedPost,
            seoAnalysis: analysisData
        });

    } catch (error) {
        console.error('OpenRouter API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate blog post from OpenRouter API.',
            details: error.message
        });
    }
});

// --- AI Rewrite Service for Editor ---

// System prompt for the AI Rewrite service
const AI_REWRITE_SYSTEM_PROMPT = \`You are a professional content editor and SEO specialist. Your task is to rewrite a provided text snippet to improve its quality, clarity, and SEO value.

Requirements:
1.  **Goal:** Rewrite the text to be more engaging, authoritative, and clear.
2.  **Tone:** Maintain a professional and authoritative tone suitable for a high-authority blog.
3.  **Output:** The output MUST be ONLY the rewritten text. Do not include any introductory or concluding remarks.
\`;

// Route for the "AI Rewrite" service
app.post('/api/rewrite', async (req, res) => {
    console.log('AI Rewrite request received:', req.body);
    
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Missing required field: text to rewrite.' });
    }

    const userPrompt = \`Rewrite the following text snippet to improve its quality and clarity:
---
${text}
---\`;

    try {
        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Using a free model for quick rewrite
            messages: [
                { role: "system", content: AI_REWRITE_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7, // Allow for some creativity in rewriting
        });

        const rewrittenText = completion.choices[0].message.content.trim();

        res.json({ 
            message: 'Text rewritten successfully.', 
            rewrittenText: rewrittenText 
        });

    } catch (error) {
        console.error('OpenRouter API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to rewrite text from OpenRouter API.',
            details: error.message
        });
    }
});
