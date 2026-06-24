const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    try {
        console.log("Connecting to Gemini Live API with gemini-2.5-flash-native-audio-latest...");
        const session = await ai.live.connect({
            model: "gemini-2.5-flash-native-audio-latest",
            callbacks: {
                onmessage: (msg) => {
                    console.log("Received message:", JSON.stringify(msg));
                },
                onclose: (e) => {
                    console.log("Connection closed", e.code, e.reason);
                },
                onerror: (e) => {
                    console.error("Connection error", e);
                }
            }
        });
        
        console.log("Connection successful! Sending message...");
        await session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: "Hello, are you there?" }] }],
            turnComplete: true
        });
        console.log("Sent test message.");
        
        setTimeout(() => {
            console.log("Closing session...");
            process.exit(0);
        }, 5000);
        
    } catch (err) {
        console.error("Failed to connect or error occurred:", err);
    }
}
run();
