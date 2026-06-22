const { GoogleGenAI } = require("@google/genai");

require('dotenv').config({ path: '.env' });

async function main() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
        }
      }
    });

    console.log("Connected to Aoede");
    session.close();
  } catch (err) {
    console.error("CATCH ERRROR", err.message);
  }
}
main();
