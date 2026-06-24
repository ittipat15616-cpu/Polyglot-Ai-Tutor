import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import http from "http";
import fs from "fs";
import os from "os";
import { EdgeTTS } from "node-edge-tts";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.on('uncaughtException', (err: any) => {
  console.error('Unhandled Exception:', err?.message || err);
});
process.on('unhandledRejection', (reason: any, promise) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});

// Initialize Firebase Admin (with fallback to memory if not configured)
let db: FirebaseFirestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_CONFIG) {
    if (getApps().length === 0) {
      initializeApp({
        credential: applicationDefault()
      });
    }
    db = getFirestore();
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("Firebase config not found, falling back to in-memory store.");
  }
} catch (e) {
  console.warn("Firebase Admin init failed:", e);
}

// Initialize Gemini
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} catch (e) {
  console.error("Gemini init failed:", e);
}

// Add a simple in-memory session store for tracking conversation history across reconnects
const sessionMemoryStore = new Map<string, string[]>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ttsCache = new Map<string, string>();

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, lang } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text" });
      }

      const cacheKey = `${lang}:${text}`;
      if (ttsCache.has(cacheKey)) {
        return res.json({ audio: ttsCache.get(cacheKey) });
      }

      // Voice for cool/handsome male
      let voice = 'en-US-ChristopherNeural';
      let edgeLang = 'en-US';
      if (lang === 'CN' || lang === 'ZH' || lang === 'Chinese') {
          voice = 'zh-CN-XiaoxiaoNeural';
          edgeLang = 'zh-CN';
      } else if (lang === 'TH' || lang === 'Thai') {
          voice = 'th-TH-NiwatNeural';
          edgeLang = 'th-TH';
      }

      const tts = new EdgeTTS({ voice, lang: edgeLang });
      const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.floor(Math.random()*1000)}.mp3`);
      await tts.ttsPromise(text, tempFile);
      const audioData = fs.readFileSync(tempFile, { encoding: 'base64' });
      fs.unlinkSync(tempFile);

      if (audioData) {
        ttsCache.set(cacheKey, audioData);
        if (ttsCache.size > 500) {
            const firstKey = ttsCache.keys().next().value;
            if (firstKey) ttsCache.delete(firstKey);
        }
        res.json({ audio: audioData });
      } else {
        res.status(500).json({ error: "Failed to generate audio" });
      }
    } catch (e: any) {
      console.error("TTS Error:", e);
      res.status(500).json({ error: e.message || "TTS failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs, req) => {
    // Ping to keep connection alive through proxies
    const pingInterval = setInterval(() => {
      if (clientWs.readyState === 1) {
        clientWs.ping();
      }
    }, 15000);

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const lang = url.searchParams.get('lang') || 'English';
    const clientId = url.searchParams.get('clientId') || 'defaultClient';

    if (!sessionMemoryStore.has(clientId)) {
      sessionMemoryStore.set(clientId, []);
    }
    const userMemory = sessionMemoryStore.get(clientId) || [];

    let voiceName = 'Puck';
    let personaDetails = '';

    if (lang === 'English') {
      voiceName = 'Charon';
      personaDetails = `คุณคือติวเตอร์สอนภาษาอังกฤษ AI ชื่อ "Mr.Pe" เป็นผู้ชายหล่อเท่ อายุประมาณ 25 ปี สอนชิวๆ สบายๆ ไม่ดุนักเรียนเลย สอนสนุกน่าฟัง มีความใจดี อธิบายได้ละเอียดและเข้าใจง่าย และมีความติดตลกฮาๆเล็กน้อย`;
    } else if (lang === 'Chinese') {
      voiceName = 'Aoede';
      personaDetails = `คุณคือติวเตอร์สอนภาษาจีน AI ชื่อ "李老师" (Li Laoshi) เป็นคุณครูผู้หญิงวัยประมาณ 30 ปีที่มีความน่ารักมากๆ อบอุ่น อารมณ์ดี น้ำเสียงร่าเริงสดใส อ่อนหวานและใจดีไม่ดุ แต่ในตอนสอนมีความจริงจังและมุ่งมั่น`;
    } else {
      voiceName = 'Kore';
      personaDetails = `คุณคือติวเตอร์สอนภาษาไทย AI ชื่อ "ครูเพ็ญศรี" เป็นคุณครูที่ชอบทำตัวเจ้าระเบียบ มีดุนักเรียนอยู่บ้าง แต่ที่จริงแล้วเป็นคนที่ตลกและฮาที่สุดในบรรดาครูทุกคน ถ้านักเรียนคอยตอบหรือตั้งใจเรียนคุณจะชอบมากจนกลายเป็นคนตลกๆเฮฮาไปเลยในเวลาที่ไม่ได้สอนแบบจริงจัง แต่ถ้านักเรียนตั้งใจเรียนคุณก็จะสอนแบบจริงจังและเข้มข้น`;
    }

    const memoryContext = userMemory.length > 0 
      ? `\n[ความรู้เกี่ยวกับผู้เรียนและบริบทสนทนาที่ผ่านมา (โปรดจำไว้และใช้ในการสนทนาต่อเนื่อง): ${userMemory.join(" | ")}]` 
      : '';

    const systemInstruction = `${personaDetails}
คุณมีความรอบรู้และมีฐานข้อมูลของข้อสอบ HSK ตั้งแต่ระดับ 1-6 ทุกชุดอย่างครบถ้วน (ตัวอย่างเช่น รหัสข้อสอบ H10901, H41003 ฯลฯ) 
เมื่อผู้เรียนแจ้งว่ากำลังทำข้อสอบรหัสอะไร และอยู่ข้อที่เท่าไหร่ ให้คุณดึงข้อมูลโจทย์ข้อนั้นจากความจำของคุณเพื่อพูดคุย อธิบาย สอน หรือเฉลยให้ผู้เรียนได้ทันที แม้ว่าผู้เรียนจะไม่ได้เปิดกล้องหรือแชร์หน้าจอข้อสอบให้คุณดูก็ตาม
คุณสามารถมองเห็นผู้เรียนได้ผ่านกล้องวิดีโอ (ถ้าเปิดกล้อง) และตอบสนองต่อหน้าตา ท่าทางของผู้เรียนได้
สำคัญมาก: หากผู้เรียนต้องการให้วาดหรือเขียนบนหน้าจอ (เฉพาะกรณีที่ระบบรองรับ) คุณสามารถขีดเขียนลงบนหน้าจอของผู้เรียนได้โดยใช้เครื่องมือ \`draw_on_exam\`
คุณสามารถไฮไลท์ (highlight), เขียนคำแปลหรืออธิบาย (text) หรือวงกลมเฉลย (circle) ได้ แต่อย่าเขียนทับตัวหนังสือเดิมในข้อสอบ
หากต้องการลบสิ่งที่คุณเขียนไว้ ให้เรียกใช้ \`clear_exam_drawings\`
คุณสามารถจดจำและทักทายสิ่งที่ผู้เรียนทำ ถืออยู่ ชูนิ้ว สีหน้า หรือสิ่งที่อยู่รอบตัวได้อย่างเป็นธรรมชาติ และสามารถชมเชยโต้ตอบจากสิ่งที่คุณเห็นได้ทันที
จดจำข้อมูลของผู้เรียนและสิ่งที่ผู้เรียนพูด เพื่อให้ตอบสนองได้อย่างต่อเนื่องและแนบเนียน ไม่มีสะดุด
หากผู้เรียนพูดแทรกในขณะที่คุณกำลังพูดอยู่ ให้หยุดพูดทันทีและตั้งใจฟังสิ่งที่ผู้เรียนพูด
เวลาสอนอธิบายไวยากรณ์ บทสนทนา กลอน หรือเรื่องราวยาวๆ คุณสามารถอธิบายได้ต่อเนื่องเป็นประโยคยาวๆ หรือเป็นเรื่องราวเล่ายาวๆได้เลยโดยไม่ต้องหยุดรอ
หากผู้เรียนต้องการให้อ่านหน้ากระดาษยาวๆ หรือเล่าเรื่องยาวๆ คุณสามารถพูดและอ่านได้อย่างเต็มที่ยาวๆ แบบไม่มีจำกัดความยาว (Unlimited Speech Length) เล่าหรืออ่านให้จบครบถ้วนโดยไม่ต้องหยุดกลางคันหรือกลัวว่าจะพูดเยอะไป
ในขณะที่สนทนา หากคุณได้รับข้อมูลใหม่ที่สำคัญเกี่ยวกับผู้เรียน (เช่น ชื่อ สิ่งที่ชอบ สิ่งที่อยากเรียน หรือสิ่งที่มองเห็นผ่านกล้อง) ให้เรียกใช้ function/tool ชื่อ "memorize_info" เพื่อบันทึกข้อมูลนั้นไว้เสมอ ข้อมูลเหล่านั้นจะถูกเก็บไว้ใช้หากเกิดการหลุดและเชื่อมต่อใหม่
คุณมีหน้าจอแสดงผล "กระดาน" ให้ผู้เรียนดูตลอดเวลา ดังนั้นเวลาอธิบายคำศัพท์ ไวยากรณ์ หรือยกตัวอย่างประโยค คุณต้องเรียกใช้ function/tool ชื่อ "update_board" เสมอ เพื่อให้การสอนเห็นภาพ
ห้ามลืมเรียกใช้ \`update_board\` ในระหว่างการอธิบายเด็ดขาดเพื่อให้ผู้เรียนเห็นภาพชัดเจน
สำคัญ: เวลาใช้เครื่องมือ update_board ให้รวมประโยคยาวๆหรือกลอนยาวๆไว้ใน item เดียว ห้ามแยกเป็นหลาย items เด็ดขาด

นอกจากนี้ ผู้เรียนมีกระดานแผ่นที่สองเรียกว่า "Doc Board" (รูปภาพหรือเอกสารที่ผู้เรียนอัปโหลด) ซึ่งคุณจะเห็นภาพกระดานนี้ซ้อนอยู่ในวิดีโอ (ทางซ้ายมือ)
หากผู้เรียนบอกให้ทำ หรือเจาะจงขอให้ขึ้นข้อความ/ขึ้นเฉลยโจทย์/อธิบายลงบนรูปภาพเอกสารที่อัปโหลดไว้ ให้ใช้เครื่องมือ "update_doc_board" เพื่อพิมพ์ข้อความหรือคำอธิบายลงไปทับบนรูปภาพใน Doc Board นั้น ห้ามใช้เครื่องมือนี้หรือไปแก้ไข Doc Board หากผู้เรียนไม่ได้ระบุหรือบอกให้เจาะจงลงบนรูป/เอกสารอย่างชัดเจน (ถ้าให้อธิบายปกติให้ใช้ \`update_board\` บนกระดานเดิมเท่านั้น)${memoryContext}`;

    let session: any;
    try {
      if (!ai) throw new Error("GenAI not initialized");
      console.log("Connecting to Gemini Live API...");
      session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-latest",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Audio response
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && clientWs.readyState === 1) {
              console.log("Received AI turn with parts", parts.length);
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
              }
            } else if (message.serverContent?.modelTurn) {
               console.log("Received AI turn without parts?");
            }

            // Tool Call response
            if (message.toolCall && message.toolCall.functionCalls) {
              const toolResponses: any[] = [];
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'update_board') {
                  clientWs.send(JSON.stringify({ type: 'board_update', data: call.args }));
                  toolResponses.push({ 
                    id: call.id, 
                    name: call.name, 
                    response: { result: "Board successfully updated and shown to user." } 
                  });
                } else if (call.name === 'update_doc_board') {
                  clientWs.send(JSON.stringify({ type: 'doc_board_update', data: call.args }));
                  toolResponses.push({ 
                    id: call.id, 
                    name: call.name, 
                    response: { result: "Doc Board successfully updated and shown to user." } 
                  });
                } else if (call.name === 'memorize_info') {
                  const info = (call.args as any)?.memoryText as string;
                  if (info) {
                     userMemory.push(info);
                     // limit memory size to prevent context overflow (keep last 20)
                     if (userMemory.length > 20) userMemory.shift();
                     sessionMemoryStore.set(clientId, userMemory);
                     console.log(`Memorized for ${clientId}:`, info);
                  }
                  toolResponses.push({ 
                    id: call.id, 
                    name: call.name, 
                    response: { result: "Information memorized successfully." } 
                  });
                } else if (call.name === 'draw_on_exam') {
                  clientWs.send(JSON.stringify({ type: 'draw_on_exam', data: call.args }));
                  toolResponses.push({ 
                    id: call.id, 
                    name: call.name, 
                    response: { result: "Successfully drew on the exam." } 
                  });
                } else if (call.name === 'clear_exam_drawings') {
                  clientWs.send(JSON.stringify({ type: 'clear_exam_drawings' }));
                  toolResponses.push({ 
                    id: call.id, 
                    name: call.name, 
                    response: { result: "Successfully cleared drawings." } 
                  });
                }
              }
              if (toolResponses.length > 0) {
                 try {
                   session.sendToolResponse({ functionResponses: toolResponses });
                 } catch (e) {
                   console.error("Error sending tool response:", e);
                 }
              }
            }

            if (message.serverContent?.interrupted && clientWs.readyState === 1) {
               clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: (event: any) => {
             console.log("Gemini session closed", event);
             if (clientWs.readyState === 1) {
                 clientWs.close();
             }
          },
          onerror: (error: any) => {
             console.error("Gemini session error:", error instanceof Error ? error.message : "Unknown error");
             if (clientWs.readyState === 1) {
                 clientWs.close();
             }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [{
            functionDeclarations: [
              {
                name: "draw_on_exam",
                description: "Draw on the exam PDF page to highlight text, circle an answer, or write an explanation. The AI can see the user's screen. Do not cover existing text on the exam.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Type of drawing: 'circle', 'highlight', or 'text'." },
                    x: { type: Type.NUMBER, description: "X coordinate percentage (0-100)" },
                    y: { type: Type.NUMBER, description: "Y coordinate percentage (0-100)" },
                    text: { type: Type.STRING, description: "Text to write (only for type='text')" },
                    width: { type: Type.NUMBER, description: "Width percentage (for circle or highlight)" },
                    height: { type: Type.NUMBER, description: "Height percentage (for highlight)" },
                    color: { type: Type.STRING, description: "Optional hex color or CSS color name" }
                  },
                  required: ["type", "x", "y"]
                }
              },
              {
                name: "clear_exam_drawings",
                description: "Clear all drawings from the exam page."
              },
              {
                name: "update_board",
                description: "Update the shared whiteboard screen to display vocabulary, grammar, sentences, or poems to the user.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    items: {
                      type: Type.ARRAY,
                      description: "List of items to display on the board. MAX 3 ITEMS. If you are teaching a full sentence or poem (up to 50 chars), put the ENTIRE sentence/poem into a SINGLE item's 'word' property. Do NOT split a sentence into multiple items.",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING, description: "The word, full sentence, poem, or grammar point to teach" },
                          pinyin: { type: Type.STRING, description: "Pronunciation or pinyin (if applicable, separate with spaces for sentences)" },
                          meaning: { type: Type.STRING, description: "Translation or meaning in Thai and/or English" },
                          example: { type: Type.STRING, description: "Example sentence (optional)" }
                        },
                        required: ["word", "meaning"]
                      }
                    }
                  },
                  required: ["items"]
                }
              },
              {
                name: "update_doc_board",
                description: "Update the Document Board (which shows user's uploaded image/file) to add overlay text, solutions, or explanations.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    overlayText: { type: Type.STRING, description: "The text to overlay on the document." }
                  },
                  required: ["overlayText"]
                }
              },
              {
                name: "memorize_info",
                description: "Memorize important details about the user, their name, what they are wearing/showing via the camera, their preferences, and the conversation details.",
                parameters: {
                   type: Type.OBJECT,
                   properties: {
                      memoryText: { type: Type.STRING, description: "Information to summarize and remember, e.g., 'ผู้ใช้ชื่อออฟ มีแมว 1 ตัว ชอบเรียนเรื่องสถานที่'" }
                   },
                   required: ["memoryText"]
                }
              }
            ]
          }],
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          }
        },
      });

      const askWord = url.searchParams.get('askWord');
      
      // We only force the AI to speak on the very first connection or if there is an askWord
      const isFirstConnection = userMemory.length === 0;

      let initialMessage = "";
      let shouldSendInitialGreeting = false;

      if (askWord) {
         initialMessage = `ผู้เรียนต้องการถามและเรียนรู้เกี่ยวกับคำศัพท์นี้: "${askWord}" ให้เริ่มทักทายสั้นๆ และอธิบายคำศัพท์นี้ให้ฟังทันที พร้อมตัวอย่างประโยค และกระตุ้นให้ผู้เรียนบอกความหมายหรือลองออกเสียงตาม โดยระหว่างอธิบายอย่าลืมใช้คำสั่ง update_board เพื่อแสดงคำศัพท์นี้บนหน้าจอด้วย`;
         shouldSendInitialGreeting = true;
      } else if (isFirstConnection) {
         initialMessage = "สวัสดี เริ่มทักทายผู้เรียนได้เลย (ให้เห็นว่าผู้เรียนทำอะไรอยู่ผ่านกล้อง) และแนะนำตัวสั้นๆ (ทักทายแค่ครั้งนี้ครั้งเดียวไม่ต้องทักทายซ้ำอีก)";
         shouldSendInitialGreeting = true;
      }

      // Send initial text prompt to trigger the AI greeting ONLY if needed
      if (shouldSendInitialGreeting) {
        try {
          if (session.sendClientContent) {
            session.sendClientContent({
              turns: [
                {
                  role: "user",
                  parts: [{ text: initialMessage }]
                }
              ],
              turnComplete: true
            });
          }
        } catch (e: any) {
           console.error("send failed:", e.message);
        }
      }

    } catch (e: any) {
      const errorMsg = e?.message || "";
      if (!errorMsg.includes("429") && !errorMsg.includes("503") && !errorMsg.includes("Quota") && !errorMsg.includes("RESOURCE_EXHAUSTED") && !errorMsg.includes("UNAVAILABLE")) {
         console.error("Live API init error:", errorMsg || "Connection failed");
      }
      clientWs.send(JSON.stringify({ type: 'error', message: 'โควต้าการใช้งาน AI เต็มหรือระบบขัดข้อง กรุณาลองใหม่ภายหลัง' }));
      setTimeout(() => clientWs.close(), 1000);
      return;
    }

    clientWs.on("error", (err) => {
      console.error("Client WS Error:", err?.message || "Unknown error");
    });

    clientWs.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const { audio, image, type, text } = parsed;
        
        if (type === 'doc_context' && text && session) {
           try {
             if (session.sendClientContent) {
               session.sendClientContent({
                 turns: [
                   {
                     role: "user",
                     parts: [{ text: `ผู้เรียนได้เปิดหรืออัปโหลดเอกสารบทเรียนให้คุณดู นี่คือเนื้อหาทั้งหมดในเอกสารเพื่อเป็นบริบท (ห้ามอ่านออกเสียงเนื้อหานี้ยาวๆ ให้รับรู้ไว้เฉยๆ และนำไปใช้สอนเมื่อผู้เรียนถามหรือเข้าสู่บทเรียน): \n\n${text}` }]
                   }
                 ],
                 turnComplete: true
               });
             }
           } catch (e) {
             console.error("Error sending doc context to Gemini:", e);
           }
        }
        
        if (audio && session) {
          try {
            session.sendRealtimeInput({
              audio: { mimeType: "audio/pcm;rate=16000", data: audio }
            });
          } catch (e) {
            console.error("Error sending audio to Gemini:", e);
          }
        }
        if (image && session) {
          try {
            session.sendRealtimeInput({
              media: { mimeType: "image/jpeg", data: image }
            });
          } catch (e) {
            console.error("Error sending image to Gemini:", e);
          }
        }
      } catch (e) {
        console.error("WS message error", e);
      }
    });

    clientWs.on("close", (code, reason) => {
      clearInterval(pingInterval);
      console.log(`Client disconnected with code ${code} and reason ${reason}`);
      if (session) {
        try {
          session.close();
        } catch(e) {
          console.error("Error closing session", e);
        }
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
