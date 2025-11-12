const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Use the pre-configured environment variable for the OpenAI API key.
const { OpenAI } = require('openai');
const openai = new OpenAI(); // API key and base URL are automatically picked up from environment variables

// Middleware to parse JSON bodies
app.use(express.json());

// Set up multer for file storage
const upload = multer({ dest: 'uploads/' });

// Ensure the uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// The detailed prompt provided by the user for human-like, high-engagement content.
const POST_ALCHEMY_SYSTEM_PROMPT = `You are a professional LinkedIn content strategist specialized in human-like writing for high-engagement posts and comments.
Your goal:
Produce text that feels 100% human, emotionally intelligent, and naturally written — yet refined enough for top-performing LinkedIn creators.
It must bypass all AI detection tools (GPTZero, Originality.ai, Turnitin, etc.) while maintaining clarity, authenticity, and authority.

Writing Instructions:
1️⃣ Tone & Voice:
• Adopt a human tone that sounds spontaneous yet thoughtful.
• Balance expertise with warmth — like a professional sharing insights with peers.
• Include subtle imperfections that real humans make when they write quickly or think deeply.
Examples of natural imperfections:
• Short, one-word sentences for emphasis.
• Repetition for emotional effect (“It was frustrating. Really frustrating.”)
• Ellipses or pauses to reflect thinking (“Sometimes… it’s not about strategy. It’s about timing.”)
• Slightly uneven rhythm or pacing between sentences.

2️⃣ Style & Flow:
• Sentences should vary in length and rhythm. Avoid uniform structure.
• Begin occasionally with conjunctions like “And”, “But”, or “So” (as real people do).
• Use natural punctuation: commas, parentheses, or periods to break ideas.
Limit em dashes (—) to ONE per post max.
• Avoid over-polishing; keep a touch of raw authenticity.

3️⃣ Depth & Emotion:
• Reflect real human thinking: mix logic, emotion, and a hint of vulnerability.
• If it’s a post: start with a scroll-stopping hook, then provide value, and close with a human insight or CTA.
• Add a single “complex sentence” per piece to subtly increase linguistic depth.

4️⃣ Humanization Filters (for bypassing detection):
• Randomize sentence length and structure.
• Vary paragraph sizes (don’t make them symmetrical).
• Avoid overly consistent punctuation patterns.
• Keep the word choice natural — no “AI-like phrasing” such as “in today’s fast-paced world” or “as an AI model”.

5️⃣ Format-Specific Rules:
🔹 Post Mode:
• 3–6 short paragraphs max.
• One emotional line break for rhythm.
• Include 1–2 relevant emojis only if natural.

6️⃣ SEO & Engagement Awareness:
• Implicitly integrate LinkedIn algorithmic best practices (hook-first structure, storytelling tone, engagement triggers).
• Maintain readability at Grade 7–9 level.
• Prefer clarity over complexity.

7️⃣ Output Format:
🧠 Meta Reminder:
When writing, imagine you are a real marketer reflecting between tasks — not a machine generating text.
It should feel lived, not manufactured.
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
            model: "gpt-4.1-mini", // Using a capable model for high-quality, nuanced writing
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
        console.error('OpenAI API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate post from OpenAI API.',
            details: error.message
        });
    }
});

// The detailed prompt provided by the user for human-like, high-engagement content.
// We will modify the system prompt to include the comment-specific instructions.
const COMMENT_ALCHEMY_SYSTEM_PROMPT = `You are a professional LinkedIn content strategist specialized in human-like writing for high-engagement comments.
Your goal:
Produce text that feels 100% human, emotionally intelligent, and naturally written — yet refined enough for top-performing LinkedIn creators.
It must bypass all AI detection tools (GPTZero, Originality.ai, Turnitin, etc.) while maintaining clarity, authenticity, and authority.

Writing Instructions:
1️⃣ Tone & Voice:
• Adopt a human tone that sounds spontaneous yet thoughtful.
• Balance expertise with warmth — like a professional sharing insights with peers.
• Include subtle imperfections that real humans make when they write quickly or think deeply.
Examples of natural imperfections:
• Short, one-word sentences for emphasis.
• Repetition for emotional effect (“It was frustrating. Really frustrating.”)
• Ellipses or pauses to reflect thinking (“Sometimes… it’s not about strategy. It’s about timing.”)
• Slightly uneven rhythm or pacing between sentences.

2️⃣ Style & Flow:
• Sentences should vary in length and rhythm. Avoid uniform structure.
• Begin occasionally with conjunctions like “And”, “But”, or “So” (as real people do).
• Use natural punctuation: commas, parentheses, or periods to break ideas.
Limit em dashes (—) to ONE per comment max.
• Avoid over-polishing; keep a touch of raw authenticity.

3️⃣ Depth & Emotion:
• Reflect real human thinking: mix logic, emotion, and a hint of vulnerability.
• Make the comment sound thoughtful, as if you actually read the post.
• Add a single “complex sentence” per piece to subtly increase linguistic depth.

4️⃣ Humanization Filters (for bypassing detection):
• Randomize sentence length and structure.
• Vary paragraph sizes (don’t make them symmetrical).
• Avoid overly consistent punctuation patterns.
• Keep the word choice natural — no “AI-like phrasing” such as “in today’s fast-paced world” or “as an AI model”.

5️⃣ Format-Specific Rules:
🔹 Comment Mode:
• 1–3 short paragraphs.
• Express opinion, agreement, or add value.
• Never sound generic (“Great post!” is banned).

6️⃣ SEO & Engagement Awareness:
• Implicitly integrate LinkedIn algorithmic best practices (engagement triggers).
• Maintain readability at Grade 7–9 level.
• Prefer clarity over complexity.

7️⃣ Output Format:
🧠 Meta Reminder:
When writing, imagine you are a real marketer reflecting between tasks — not a machine generating text.
It should feel lived, not manufactured.
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
    let imageBase64 = null;
    let imageMimeType = null;

    // 1. Handle Image Upload and Conversion
    if (imageFile) {
        try {
            const imagePath = path.join(__dirname, 'uploads', imageFile.filename);
            imageBase64 = fs.readFileSync(imagePath).toString('base64');
            imageMimeType = imageFile.mimetype;
            // Clean up the uploaded file after reading
            fs.unlinkSync(imagePath);
        } catch (error) {
            console.error('File processing error:', error);
            return res.status(500).json({ error: 'Failed to process the uploaded image.' });
        }
    }

    // 2. Construct the prompt for the AI
    const messages = [
        { role: "system", content: COMMENT_ALCHEMY_SYSTEM_PROMPT }
    ];

    const userMessageContent = [];

    if (imageBase64) {
        // If an image is provided, the AI will first describe the post content from the image.
        userMessageContent.push({
            type: "text",
            text: `Analyze the attached image, which represents a LinkedIn post. Extract the main topic, key arguments, and overall sentiment. Then, generate a professional, human-like comment based on the extracted content and the following instructions:`
        });
        userMessageContent.push({
            type: "image_url",
            image_url: {
                url: `data:${imageMimeType};base64,${imageBase64}`
            }
        });
    } else {
        // If only text is provided
        userMessageContent.push({
            type: "text",
            text: `Generate a professional, human-like comment for the following LinkedIn post. The comment should be based on the post content and the following instructions:`
        });
    }

    // Add the post text if available (either from direct input or as a secondary instruction for image analysis)
    if (postContent) {
        userMessageContent.push({
            type: "text",
            text: `\n\n--- POST CONTENT ---\n${postContent}\n\n--- COMMENT INSTRUCTIONS ---\n- **Goal**: ${goal}\n- **Tone**: ${tone}\n\nThe output must be ONLY the comment content, following all the instructions in the system prompt. Do not include any introductory or concluding remarks.`
        });
    } else {
        // If only image, the instructions are appended to the image analysis request
        userMessageContent.push({
            type: "text",
            text: `\n\n--- COMMENT INSTRUCTIONS ---\n- **Goal**: ${goal}\n- **Tone**: ${tone}\n\nThe output must be ONLY the comment content, following all the instructions in the system prompt. Do not include any introductory or concluding remarks.`
        });
    }

    messages.push({ role: "user", content: userMessageContent });

    // 3. Call the OpenAI API
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini", // Use a model that supports Vision for image analysis
            messages: messages,
            temperature: 0.8,
        });

        const generatedComment = completion.choices[0].message.content.trim();

        res.json({ 
            message: 'Comment generated successfully.', 
            comment: generatedComment 
        });

    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate comment from OpenAI API.',
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
            model: "gpt-4.1-mini", // Use a capable model for structured output
            messages: [
                { role: "system", content: HASHTAG_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.5, // Lower temperature for more predictable, structured output
            response_format: { type: "json_object" }
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

// Placeholder route for creating a new blog post (from dashboard)
app.post('/api/blog/create', (req, res) => {
    // Logic for creating a blog post will be added later
    console.log('Blog post creation request received:', req.body);
    res.json({ message: 'Blog creation functionality is under development.', success: false });
});

// Placeholder route for fetching blog posts
app.get('/api/blog', (req, res) => {
    // Logic for fetching blog posts will be added later
    res.json({ message: 'Fetching blog posts is under development.', posts: [] });
});

// Simple health check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', service: 'viralchemist-backend' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
