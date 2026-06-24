const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: 'Hello',
        });
        console.log("Success with gemini-1.5-flash:", response.text);
    } catch(e) {
        console.error("Error with gemini-1.5-flash:", e.message);
    }
}
test();
