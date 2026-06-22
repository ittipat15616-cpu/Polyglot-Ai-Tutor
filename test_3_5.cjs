const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
    const list = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: "Say 'hello'"
    });
    console.log("gemini-3.5-flash works! " + list.text);
}
main().catch(console.error);
