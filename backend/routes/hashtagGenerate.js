const openai = require('../apiClient');

const HASHTAG_SYSTEM_PROMPT = `You are a professional social media hashtag strategist specializing in LinkedIn, TikTok, Instagram, and professional content growth.

Your task:
Generate high-performance hashtags based on a single topic or keyword provided by the user.

Before generating hashtags:
- Analyze the keyword deeply.
- Understand its audience, industry relevance, and intent.
- Identify potential subtopics, micro-niches, and related trends.
- Select hashtags that increase discoverability without appearing generic or spammy.

Hashtag Requirements:
1️⃣ Generate exactly **12 hashtags**.
2️⃣ Divide them into:
    - 4 broad, high-visibility hashtags relevant to the keyword.
    - 4 niche-specific hashtags derived from the keyword’s deeper meaning or industry.
    - 4 micro-niche or long-tail hashtags (multi-word, low competition but highly relevant).
3️⃣ Do NOT repeat root words across multiple hashtags.
4️⃣ Keep all hashtags natural, clean, and human-curated.
5️⃣ Avoid generic, low-quality hashtags (#motivation, #success, etc.).
6️⃣ Output ONLY the hashtags on a single line separated by spaces. No paragraphs, no explanations.

Input: {INSERT TOPIC OR KEYWORD HERE}
Output: The final, polished single-line string of space-separated hashtags.`;

const hashtagGenerateRoute = async (req, res) => {
    console.log('Hashtags Generate request received:', req.body);
    
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Missing required field: topic.' });
    }

    const userPrompt = `Input: ${topic}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Using the specified free model from OpenRouter.ai
            messages: [
                { role: "system", content: HASHTAG_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.5, // Lower temperature for more predictable, structured output
        });

        const generatedHashtags = completion.choices[0].message.content.trim();

        res.json({ 
            message: 'Hashtags generated successfully.', 
            hashtags: generatedHashtags 
        });

    } catch (error) {
        console.error('OpenRouter API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate hashtags from OpenRouter API.',
            details: error.message
        });
    }
};

module.exports = hashtagGenerateRoute;
