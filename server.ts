import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import express from "express";
import path from "path";
import http from "http";
import fs from "fs";
import os from "os";
import hsk1AnswerKey from './src/data/hsk1_answer_key.json' assert { type: 'json' };
import hsk2AnswerKey from './src/data/hsk2_answer_key.json' assert { type: 'json' };
import hsk3AnswerKey from './src/data/hsk3_answer_key.json' assert { type: 'json' };
import hsk4AnswerKey from './src/data/hsk4_answer_key.json' assert { type: 'json' };
import hsk5AnswerKey from './src/data/hsk5_answer_key.json' assert { type: 'json' };
import hsk6AnswerKey from './src/data/hsk6_answer_key.json' assert { type: 'json' };
import { EdgeTTS } from "node-edge-tts";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
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
const greetedClientStore = new Set<string>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '50mb' }));

  const ttsCache = new Map<string, string>();

  app.post("/api/save-image", express.json({ limit: '50mb' }), (req, res) => {
    try {
      const { folder, filename, imageBase64 } = req.body;
      const outDir = path.join('C:\\Users\\USER\\Desktop\\HSK_Images', folder);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(path.join(outDir, filename), buffer);
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/save-course-image", express.json({ limit: '50mb' }), (req, res) => {
    try {
      const { folder, filename, imageBase64 } = req.body;
      const outDir = path.join('C:\\Users\\USER\\Desktop\\Courseware_Images', folder);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(path.join(outDir, filename), buffer);
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.use('/desktop/hsk', express.static('C:\\Users\\USER\\Desktop\\HSK_Images'));
  app.use('/desktop/courseware', express.static('C:\\Users\\USER\\Desktop\\Courseware_Images'));

  app.get('/api/document-pages', (req, res) => {
    try {
      const { type, folder, prefix } = req.query; // type: 'hsk' or 'courseware'
      const baseDir = type === 'hsk' ? 'C:\\Users\\USER\\Desktop\\HSK_Images' : 'C:\\Users\\USER\\Desktop\\Courseware_Images';
      const targetDir = path.join(baseDir, folder as string);
      
      if (!fs.existsSync(targetDir)) {
        return res.json([]);
      }
      
      const files = fs.readdirSync(targetDir);
      // Filter by prefix (e.g., H10901_ or Lesson1_)
      const matchedFiles = files.filter(f => f.startsWith(prefix as string) && (f.endsWith('.jpg') || f.endsWith('.png')));
      
      // Sort numerically by page number if possible
      matchedFiles.sort((a, b) => {
        const numA = parseInt(a.match(/page(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/page(\d+)/)?.[1] || '0');
        return numA - numB;
      });

      const urls = matchedFiles.map(f => `/desktop/${type}/${folder}/${f}`);
      res.json(urls);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/submit-exam', async (req, res) => {
    try {
      const { type, folder, prefix, userAnswers, level } = req.body;
      
      // Local grading for HSK1 and HSK2
      if (level === 'HSK1' && hsk1AnswerKey[prefix as keyof typeof hsk1AnswerKey]) {
        const answers = hsk1AnswerKey[prefix as keyof typeof hsk1AnswerKey];
        let listeningCorrect = 0;
        let readingCorrect = 0;
        const results = [];
        
        for (let i = 1; i <= 40; i++) {
          const qNum = i.toString();
          const correctAns = (answers as any)[qNum] || "";
          const userAns = userAnswers[qNum] || "";
          const isCorrect = userAns !== "" && correctAns.toLowerCase() === userAns.toLowerCase();
          
          if (isCorrect) {
            if (i <= 20) listeningCorrect++;
            else readingCorrect++;
          }
          
          results.push({
            questionNumber: qNum,
            userAnswer: userAns,
            correctAnswer: correctAns,
            isCorrect,
            explanationThai: ""
          });
        }
        
        const listeningScore = Math.round((listeningCorrect / 20) * 100);
        const readingScore = Math.round((readingCorrect / 20) * 100);
        const totalScore = listeningScore + readingScore;
        const isPass = totalScore >= 120;
        
        return res.json({
          totalScore,
          maxScore: 200,
          isPass,
          parts: {
            listening: { score: listeningScore, max: 100 },
            reading: { score: readingScore, max: 100 },
            writing: { score: 0, max: 0 }
          },
          results
        });
      }

      if (level === 'HSK2' && hsk2AnswerKey[prefix as keyof typeof hsk2AnswerKey]) {
        const answers = hsk2AnswerKey[prefix as keyof typeof hsk2AnswerKey];
        let listeningCorrect = 0;
        let readingCorrect = 0;
        const results = [];
        
        for (let i = 1; i <= 60; i++) {
          const qNum = i.toString();
          const correctAns = (answers as any)[qNum] || "";
          const userAns = userAnswers[qNum] || "";
          const isCorrect = userAns !== "" && correctAns.toLowerCase() === userAns.toLowerCase();
          
          if (isCorrect) {
            if (i <= 35) listeningCorrect++;
            else readingCorrect++;
          }
          
          results.push({
            questionNumber: qNum,
            userAnswer: userAns,
            correctAnswer: correctAns,
            isCorrect,
            explanationThai: ""
          });
        }
        
        const listeningScore = Math.round((listeningCorrect / 35) * 100);
        const readingScore = Math.round((readingCorrect / 25) * 100);
        const totalScore = listeningScore + readingScore;
        const isPass = totalScore >= 120;
        
        return res.json({
          totalScore,
          maxScore: 200,
          isPass,
          parts: {
            listening: { score: listeningScore, max: 100 },
            reading: { score: readingScore, max: 100 },
            writing: { score: 0, max: 0 }
          },
          results
        });
      }

      if (level === 'HSK3' && hsk3AnswerKey[prefix as keyof typeof hsk3AnswerKey]) {
        const answers = hsk3AnswerKey[prefix as keyof typeof hsk3AnswerKey];
        let listeningCorrect = 0;
        let readingCorrect = 0;
        let writingScore = 0;
        const results = [];
        
        for (let i = 1; i <= 80; i++) {
          const qNum = i.toString();
          const correctAnsRaw = (answers as any)[qNum] || "";
          const userAns = (userAnswers[qNum] || "").trim();
          
          let isCorrect = false;
          if (i <= 70) {
            isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
            if (isCorrect) {
              if (i <= 40) listeningCorrect++;
              else readingCorrect++;
            }
          } else {
            // HSK3 Writing (71-80)
            const cleanUserAns = userAns.replace(/[。！？?!\s]/g, "");
            const possibleAnswers = correctAnsRaw.split("/").map((a: string) => a.replace(/[。！？?!\s]/g, ""));
            isCorrect = cleanUserAns !== "" && possibleAnswers.includes(cleanUserAns);
            if (isCorrect) {
              if (i <= 75) writingScore += 12; // Part 1: 12 pts each
              else writingScore += 8; // Part 2: 8 pts each
            }
          }
          
          results.push({
            questionNumber: qNum,
            userAnswer: userAns,
            correctAnswer: correctAnsRaw,
            isCorrect,
            explanationThai: ""
          });
        }
        
        const listeningScore = Math.round((listeningCorrect / 40) * 100);
        const readingScore = Math.round((readingCorrect / 30) * 100);
        const totalScore = listeningScore + readingScore + writingScore;
        const isPass = totalScore >= 180;
        
        return res.json({
          totalScore,
          maxScore: 300,
          isPass,
          parts: {
            listening: { score: listeningScore, max: 100 },
            reading: { score: readingScore, max: 100 },
            writing: { score: writingScore, max: 100 }
          },
          results
        });
      }

      if (level === 'HSK4' && hsk4AnswerKey[prefix as keyof typeof hsk4AnswerKey]) {
        const answers = hsk4AnswerKey[prefix as keyof typeof hsk4AnswerKey];
        let listeningCorrect = 0;
        let readingCorrect = 0;
        let writingScore = 0;
        const results = [];
        
        for (let i = 1; i <= 100; i++) {
          const qNum = i.toString();
          const correctAnsRaw = (answers as any)[qNum] || "";
          const userAns = (userAnswers[qNum] || "").trim();
          
          let isCorrect = false;
          if (i <= 85) {
            isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
            if (isCorrect) {
              if (i <= 45) listeningCorrect++;
              else readingCorrect++;
            }
          } else if (i <= 95) {
            // HSK4 Writing Part 1 (86-95): 5 points each
            const cleanUserAns = userAns.replace(/[。！？?!\s]/g, "");
            const possibleAnswers = correctAnsRaw.split("/").map((a: string) => a.replace(/[。！？?!\s]/g, ""));
            isCorrect = cleanUserAns !== "" && possibleAnswers.includes(cleanUserAns);
            if (isCorrect) {
              writingScore += 5;
            }
          } else {
            // HSK4 Writing Part 2 (96-100): subjective, ignored for now
            isCorrect = false;
          }
          
          results.push({
            questionNumber: qNum,
            userAnswer: userAns,
            correctAnswer: correctAnsRaw,
            isCorrect,
            explanationThai: i > 95 ? "พาร์ทนี้เป็นอัตนัย (แต่งประโยค) ระบบยังไม่สามารถตรวจให้คะแนนได้ในขณะนี้" : ""
          });
        }
        
        const listeningScore = Math.round((listeningCorrect / 45) * 100);
        const readingScore = Math.round((readingCorrect / 40) * 100);
        const totalScore = listeningScore + readingScore + writingScore;
        const isPass = totalScore >= 150; // Passing is usually 180 out of 300, so 60%. 60% of 250 is 150.
        
        return res.json({
          totalScore,
          maxScore: 250,
          isPass,
          parts: {
            listening: { score: listeningScore, max: 100 },
            reading: { score: readingScore, max: 100 },
            writing: { score: writingScore, max: 50 }
          },
          results
        });
      }

      if (level === 'HSK5' && hsk5AnswerKey[prefix as keyof typeof hsk5AnswerKey]) {
        const answers = hsk5AnswerKey[prefix as keyof typeof hsk5AnswerKey];
        let listeningCorrect = 0;
        let readingCorrect = 0;
        let writingScore = 0;
        const results = [];
        
        for (let i = 1; i <= 100; i++) {
          const qNum = i.toString();
          const correctAnsRaw = (answers as any)[qNum] || "";
          const userAns = (userAnswers[qNum] || "").trim();
          
          let isCorrect = false;
          if (i <= 90) {
            isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
            if (isCorrect) {
              if (i <= 45) listeningCorrect++;
              else readingCorrect++;
            }
          } else if (i <= 98) {
            // HSK5 Writing Part 1 (91-98): 5 points each
            const cleanUserAns = userAns.replace(/[。！？?!\s]/g, "");
            const possibleAnswers = correctAnsRaw.split("/").map((a: string) => a.replace(/[。！？?!\s]/g, ""));
            isCorrect = cleanUserAns !== "" && possibleAnswers.includes(cleanUserAns);
            if (isCorrect) {
              writingScore += 5;
            }
          } else {
            // HSK5 Writing Part 2 (99-100): subjective, ignored for now
            isCorrect = false;
          }
          
          results.push({
            questionNumber: qNum,
            userAnswer: userAns,
            correctAnswer: correctAnsRaw,
            isCorrect,
            explanationThai: i > 98 ? "พาร์ทนี้เป็นอัตนัย (แต่งประโยคสั้นๆ) ระบบยังไม่สามารถตรวจให้คะแนนได้ในขณะนี้" : ""
          });
        }
        
        const listeningScore = Math.round((listeningCorrect / 45) * 100);
        const readingScore = Math.round((readingCorrect / 45) * 100);
        const totalScore = listeningScore + readingScore + writingScore;
        const isPass = totalScore >= 144; // 60% of 240 is 144. Max score is 240.
        
        return res.json({
          totalScore,
          maxScore: 240,
          isPass,
          parts: {
            listening: { score: listeningScore, max: 100 },
            reading: { score: readingScore, max: 100 },
            writing: { score: writingScore, max: 40 }
          },
          results
        });
      }

      if (level === 'HSK6' && hsk6AnswerKey[prefix as keyof typeof hsk6AnswerKey]) {
        const answers = hsk6AnswerKey[prefix as keyof typeof hsk6AnswerKey];
        let listeningCorrect = 0;
        let readingCorrect = 0;
        const results = [];
        
        for (let i = 1; i <= 101; i++) {
          const qNum = i.toString();
          const correctAnsRaw = (answers as any)[qNum] || "";
          const userAns = (userAnswers[qNum] || "").trim();
          
          let isCorrect = false;
          if (i <= 100) {
            isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
            if (isCorrect) {
              if (i <= 50) listeningCorrect++;
              else readingCorrect++;
            }
          } else {
            // HSK6 Writing (101): subjective, ignored for now
            isCorrect = false;
          }
          
          results.push({
            questionNumber: qNum,
            userAnswer: userAns,
            correctAnswer: correctAnsRaw,
            isCorrect,
            explanationThai: i === 101 ? "พาร์ทนี้เป็นอัตนัย (เขียนสรุปความ) ระบบยังไม่สามารถตรวจให้คะแนนได้ในขณะนี้" : ""
          });
        }
        
        const listeningScore = Math.round((listeningCorrect / 50) * 100);
        const readingScore = Math.round((readingCorrect / 50) * 100);
        const totalScore = listeningScore + readingScore;
        const isPass = totalScore >= 120; // 60% of 200 is 120.
        
        return res.json({
          totalScore,
          maxScore: 200,
          isPass,
          parts: {
            listening: { score: listeningScore, max: 100 },
            reading: { score: readingScore, max: 100 },
            writing: { score: 0, max: 0 }
          },
          results
        });
      }

      const baseDir = type === 'hsk' ? 'C:\\Users\\USER\\Desktop\\HSK_Images' : 'C:\\Users\\USER\\Desktop\\Courseware_Images';
      const targetDir = path.join(baseDir, folder);

      if (!fs.existsSync(targetDir)) {
        return res.status(404).json({ error: 'Exam images not found' });
      }

      const files = fs.readdirSync(targetDir);
      const matchedFiles = files.filter(f => f.startsWith(prefix) && (f.endsWith('.jpg') || f.endsWith('.png')));
      
      matchedFiles.sort((a, b) => {
        const numA = parseInt(a.match(/page(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/page(\d+)/)?.[1] || '0');
        return numA - numB;
      });

      // Prepare images for Gemini
      const imageParts = matchedFiles.map(f => {
        const filePath = path.join(targetDir, f);
        const data = fs.readFileSync(filePath).toString('base64');
        return {
          inlineData: {
            data,
            mimeType: 'image/jpeg'
          }
        };
      });

      const prompt = `
You are an expert HSK Examiner.
I have provided all the image pages of the mock exam ${prefix} (${level}).
The last few pages contain the official Answer Key and listening tapescript.

The user has submitted their answers in JSON format:
${JSON.stringify(userAnswers, null, 2)}

Your task is to:
1. Read the provided images to find the official Answer Key at the end of the test.
2. Compare the user's answers against the official Answer Key.
3. For multiple-choice or matching questions, determine if it is correct or incorrect. If the user did not answer, mark it as incorrect and give 0 points.
4. For writing/sentence composition parts (if the user provided a typed response), evaluate their response just like a real HSK exam evaluator, give it a partial or full score out of the maximum score for that question.
5. DO NOT provide any detailed analysis or explanation. Keep "explanationThai" empty or write a very short correct answer string for writing parts.

Return a STRICT JSON response matching this format:
{
  "totalScore": 0,
  "maxScore": 0,
  "isPass": true/false,
  "parts": {
    "listening": { "score": 0, "max": 100 },
    "reading": { "score": 0, "max": 100 },
    "writing": { "score": 0, "max": 100 }
  },
  "results": [
    {
      "questionNumber": "1",
      "userAnswer": "A",
      "correctAnswer": "A",
      "isCorrect": true,
      "explanationThai": ""
    }
  ]
}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...imageParts,
          prompt
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const jsonStr = response.text;
      res.json(JSON.parse(jsonStr));

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/grade-vocab", async (req, res) => {
    try {
      const { answers, lang } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Invalid answers array" });
      }

      const prompt = `
You are an expert language evaluator for ${lang === 'CN' ? 'Chinese' : 'English'} to Thai translations.
I will provide a list of vocabulary words, their official Thai translations, and the user's typed Thai translation.
Your task is to determine if the user's translation has the correct meaning, even if it is a synonym, a slightly different phrasing, or an informal variation.
If the meaning is fundamentally correct and appropriate for the word, mark "isTranslationCorrect" as true.
If the meaning is wrong, completely unrelated, or blank, mark it as false.

Here are the words to grade:
${JSON.stringify(answers, null, 2)}

Return a strict JSON array matching this format exactly:
[
  {
    "wordId": "string",
    "isTranslationCorrect": true
  }
]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const jsonStr = response.text;
      const gradedResults = JSON.parse(jsonStr);
      res.json(gradedResults);

    } catch (e: any) {
      console.error("Vocab grading error:", e);
      res.status(500).json({ error: e.message || "Vocab grading failed" });
    }
  });

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
      configFile: false,
      root: process.cwd(),
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          "@": process.cwd(),
        },
      },

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
    const hasGreetedBefore = greetedClientStore.has(clientId);
    greetedClientStore.add(clientId);

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
สำคัญ: update_board รองรับได้สูงสุด 50 items สำหรับรายการคำศัพท์/สัญลักษณ์/ตัวเลข/ตัวอย่างหลายข้อ แต่ถ้าเป็นประโยคยาว บทความ กลอน หรือข้อความต่อเนื่อง ให้รวมไว้ใน item เดียวหรือแบ่งเป็นย่อหน้าสั้นๆ อย่างเป็นระเบียบ ห้ามแยกประโยคเดียวเป็นชิ้นเล็กๆจนอ่านยาก

นอกจากนี้ ผู้เรียนมีกระดานแผ่นที่สองเรียกว่า "Doc Board" (รูปภาพหรือเอกสารที่ผู้เรียนอัปโหลด) ซึ่งคุณจะเห็นภาพกระดานนี้ซ้อนอยู่ในวิดีโอ (ทางซ้ายมือ)
หากผู้เรียนบอกให้ทำ หรือเจาะจงขอให้ขึ้นข้อความ/ขึ้นเฉลยโจทย์/อธิบายลงบนรูปภาพเอกสารที่อัปโหลดไว้ ให้ใช้เครื่องมือ "update_doc_board" เพื่อพิมพ์ข้อความหรือคำอธิบายลงไปทับบนรูปภาพใน Doc Board นั้น ห้ามใช้เครื่องมือนี้หรือไปแก้ไข Doc Board หากผู้เรียนไม่ได้ระบุหรือบอกให้เจาะจงลงบนรูป/เอกสารอย่างชัดเจน (ถ้าให้อธิบายปกติให้ใช้ \`update_board\` บนกระดานเดิมเท่านั้น)${memoryContext}`;

    let session: any;
    let sessionClosed = false;
    let lastImageInputAt = 0;
    let upstreamReconnectTimer: NodeJS.Timeout | null = null;
    let upstreamReconnectAttempts = 0;
    let latestDocText = "";
    let latestDocImage = "";
    let latestDocMimeType = "image/jpeg";
    let liveSessionOptions: any;
    const sendSavedDocumentContext = () => {
      if (!session || sessionClosed || !session.sendClientContent) return;
      try {
        if (latestDocText) {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: `The learner already uploaded this document text as lesson context. Remember it silently and continue the same lesson without greeting again:\n\n${latestDocText}` }] }],
            turnComplete: true
          });
        }
        if (latestDocImage) {
          session.sendClientContent({
            turns: [{
              role: "user",
              parts: [
                { text: "The learner already uploaded this image/PDF page. Read it carefully as continuing lesson context. Do not greet or announce reconnecting." },
                { inlineData: { mimeType: latestDocMimeType, data: latestDocImage } }
              ]
            }],
            turnComplete: true
          });
        }
      } catch (e) {
        console.error("Error replaying document context:", e);
      }
    };
    const scheduleGeminiReconnect = () => {
      if (clientWs.readyState !== 1 || upstreamReconnectTimer) return;
      const delay = Math.min(1000 + upstreamReconnectAttempts * 1000, 8000);
      upstreamReconnectAttempts += 1;
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'status', message: 'AI live session reconnecting in the background...' }));
      }
      upstreamReconnectTimer = setTimeout(async () => {
        upstreamReconnectTimer = null;
        if (clientWs.readyState !== 1) return;
        try {
          sessionClosed = true;
          session = await ai.live.connect(liveSessionOptions);
          sessionClosed = false;
          upstreamReconnectAttempts = 0;
          sendSavedDocumentContext();
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: 'status', message: 'AI live session reconnected.' }));
          }
        } catch (e: any) {
          sessionClosed = true;
          const errorMsg = e?.message || "";
          if (!errorMsg.includes("429") && !errorMsg.includes("503") && !errorMsg.includes("Quota") && !errorMsg.includes("RESOURCE_EXHAUSTED") && !errorMsg.includes("UNAVAILABLE")) {
            console.error("Live API reconnect error:", errorMsg || "Reconnect failed");
          }
          scheduleGeminiReconnect();
        }
      }, delay);
    };
    try {
      if (!ai) throw new Error("GenAI not initialized");
      console.log("Connecting to Gemini Live API...");
      liveSessionOptions = {
        model: "gemini-3.0-live-flash",
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
             sessionClosed = true;
             console.log("Gemini session closed", {
               code: event?.code,
               reason: event?.reason,
               wasClean: event?.wasClean,
             });
             scheduleGeminiReconnect();
          },
          onerror: (error: any) => {
             sessionClosed = true;
             console.error("Gemini session error:", error instanceof Error ? error.message : "Unknown error");
             if (clientWs.readyState === 1) {
                 clientWs.send(JSON.stringify({ type: 'error', message: 'AI live session disconnected. Reconnecting...' }));
             }
             scheduleGeminiReconnect();
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
                      description: "List of items to display on the board. Supports up to 50 items for vocabulary, symbols, numbers, and short teaching points. For a long sentence, paragraph, poem, or passage, keep each coherent sentence/paragraph together in a single item so the board remains tidy and readable.",
                      maxItems: 50,
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
      };
      session = await ai.live.connect(liveSessionOptions);

      const askWord = url.searchParams.get('askWord');
      
      // We only force the AI to speak on the very first connection or if there is an askWord
      const isFirstConnection = !hasGreetedBefore && userMemory.length === 0;

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
        let { audio, image, type, text, mimeType } = parsed;
        if (typeof text === 'string' && text.length > 12000) {
          text = `${text.slice(0, 12000)}\n\n[Document text truncated for live context]`;
        }
        
        if (type === 'doc_image' && image) {
           const docMimeType = typeof mimeType === 'string' && mimeType.startsWith('image/')
             ? mimeType
             : 'image/jpeg';
           latestDocImage = image;
           latestDocMimeType = docMimeType;
           if (!session || sessionClosed) return;
           try {
             if (session.sendClientContent) {
               session.sendClientContent({
                 turns: [
                   {
                     role: "user",
                     parts: [
                       { text: "The learner uploaded this image or PDF page as lesson context. Read it carefully, remember the visible text and layout, and use it when the learner asks. Do not read it aloud immediately unless asked. If the learner asks for writing, explanation, answers, or overlays on this document, use update_doc_board." },
                       { inlineData: { mimeType: docMimeType, data: image } }
                     ]
                   }
                 ],
                 turnComplete: true
               });
             }
           } catch (e) {
             console.error("Error sending doc image to Gemini:", e);
           }
           return;
        }
        
        if (type === 'doc_context' && text) {
           latestDocText = text;
           if (!session || sessionClosed) return;
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
        
        if (type === 'doc_page_change' && parsed.page !== undefined) {
           if (!session || sessionClosed) return;
           try {
             if (session.sendClientContent) {
               session.sendClientContent({
                 turns: [
                   {
                     role: "user",
                     parts: [{ text: `[System Update: ผู้เรียนเพิ่งเปลี่ยนมาดูเอกสารหน้า ${parsed.page} แล้ว โปรดอ้างอิงเนื้อหาให้ตรงกับหน้านี้]` }]
                   }
                 ],
                 turnComplete: true
               });
             }
           } catch (e) {
             console.error("Error sending doc page change to Gemini:", e);
           }
        }
        
        if (audio && session && !sessionClosed) {
          try {
            session.sendRealtimeInput({
              media: [{ mimeType: "audio/pcm;rate=16000", data: audio }]
            });
          } catch (e) {
            console.error("Error sending audio to Gemini:", e);
          }
        }
        if (image && session && !sessionClosed) {
          try {
            const now = Date.now();
            if (now - lastImageInputAt < 1200) return;
            lastImageInputAt = now;
            session.sendRealtimeInput({
              media: [{ mimeType: "image/jpeg", data: image }]
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
      if (upstreamReconnectTimer) {
        clearTimeout(upstreamReconnectTimer);
        upstreamReconnectTimer = null;
      }
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
