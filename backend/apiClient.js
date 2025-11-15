const { OpenAI } = require('openai');

// Initialize the OpenAI client to work with OpenRouter.ai
// The API key is automatically picked up from the OPENAI_API_KEY environment variable
// which is compatible with OpenRouter.ai
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
});

module.exports = openai;
