const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_NAME = 'gemini-1.5-flash';
// duplicate imports removed
const envPath = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = process.env.GEMINI_API_KEY || (apiKeyMatch ? apiKeyMatch[1].trim() : null);

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1);
}

const TOTAL_LESSONS = 2;
const OUTPUT_FILE = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_speaking_ielts_data.json');
const AUDIO_DIR = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_speaking_ielts_audio');

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

async function downloadTTS(text, filepath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filepath)) {
      return resolve();
    }
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodedText}`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        reject(new Error(`TTS Failed with status: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function generateLesson(lessonNum) {
  console.log(`Generating IELTS Speaking Lesson ${lessonNum}...`);
  const prompt = `
You are an IELTS examiner. Generate a complete IELTS Speaking mock test for Lesson ${lessonNum}.

Format strictly as JSON without markdown.
{
  "task1": [
    "Let's talk about where you live. Do you live in a house or an apartment?",
    "What do you like about your neighborhood?",
    "Is it a good place for children to grow up?"
  ],
  "task2": {
    "topic": "Describe a book you have recently read.",
    "bulletPoints": [
      "What kind of book it is",
      "What it is about",
      "Why you decided to read it",
      "And explain how you felt about this book"
    ]
  },
  "task3": [
    "Do you think reading is as important as it used to be?",
    "Why do some people prefer reading on digital devices rather than physical books?",
    "How can parents encourage their children to read more?"
  ]
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, response_mime_type: "application/json" }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      try { return JSON.parse(text); } catch (e) { return null; }
    }
    return null;
  } catch (error) {
    return null;
  }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  let existingData = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try { existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')); } catch (e) {}
  }

  for (let i = 1; i <= TOTAL_LESSONS; i++) {
    const key = `Lesson${i}`;
    let result = existingData[key];

    if (!result) {
      let retries = 3;
      while (!result && retries > 0) {
        result = await generateLesson(i);
        if (!result) { retries--; await delay(5000); }
      }
      if (result) {
        existingData[key] = result;
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingData, null, 2));
      } else {
        console.error(`Failed to generate JSON for Lesson ${i}`);
        continue;
      }
    }

    // Now generate Audio
    try {
      const t1text = "Task 1. " + result.task1.join(" ");
      await downloadTTS(t1text, path.join(AUDIO_DIR, `${key}_task1.mp3`));
      
      const t2text = "Task 2. " + result.task2.topic + " You should say: " + result.task2.bulletPoints.join(". ");
      await downloadTTS(t2text, path.join(AUDIO_DIR, `${key}_task2.mp3`));
      
      const t3text = "Task 3. " + result.task3.join(" ");
      await downloadTTS(t3text, path.join(AUDIO_DIR, `${key}_task3.mp3`));
      
      console.log(`Audio saved for Lesson ${i}`);
    } catch (e) {
      console.error(`Audio fail for Lesson ${i}`, e);
    }

    await delay(5000);
  }
}

main();
