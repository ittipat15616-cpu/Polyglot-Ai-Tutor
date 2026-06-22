const { GoogleGenAI } = require("@google/genai");

require('dotenv').config({ path: '.env' });

async function main() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      callbacks: {
        onerror: (err) => {
          console.error("ONERROR CALLED");
          console.error(err);
        },
        onmessage: (msg) => {
          console.log("ONMESSAGE CALLED");
        },
        onclose: (e) => {
          console.log("CLOSED", e);
        }
      },
      config: {
        maxOutputTokens: 8192,
        responseModalities: ["AUDIO"],
        systemInstruction: "You are a test agent"
      }
    });

    session.send({ text: "Hello", clientContent: { turns: [], turnComplete: true } });
    setTimeout(() => {
       console.log("Closing session");
       session.close();
    }, 2000);
  } catch (err) {
    console.error("CATCH ERRROR", err);
  }
}
main();
