const openai = require('../apiClient');

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

const postAlchemyRoute = async (req, res) => {
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
};

module.exports = postAlchemyRoute;
