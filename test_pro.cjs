const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
    const list = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: "Say 'hello'"
    });
    console.log("gemini-1.5-pro works! " + list.text);
}
main().catch(console.error);
