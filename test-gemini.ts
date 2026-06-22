import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({});
  const session = await ai.live.connect({ model: "gemini-3.1-flash-live-preview" });
  try {
    session.sendRealtimeInput({ mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: "abcd" }] } as any);
    console.log("mediaChunks works");
  } catch(e:any) { console.log("mediaChunks failed", e.message); }
  
  try {
    session.sendRealtimeInput({ media: [{ mimeType: "audio/pcm;rate=16000", data: "abcd" }] } as any);
    console.log("media array works");
  } catch(e:any) { console.log("media array failed", e.message); }

  try {
    session.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: "abcd" } });
    console.log("media dict works");
  } catch(e:any) { console.log("media dict failed", e.message); }

  try {
    session.sendRealtimeInput({ audio: { mimeType: "audio/pcm;rate=16000", data: "abcd" } });
    console.log("audio dict works");
  } catch(e:any) { console.log("audio dict failed", e.message); }
  
  session.close();
}
test().catch(console.error);
