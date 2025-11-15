const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const openai = require('../apiClient');

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

const commentAlchemyRoute = async (req, res) => {
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
        imagePath = path.join(__dirname, '..', 'uploads', imageFile.filename);
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
};

module.exports = commentAlchemyRoute;
