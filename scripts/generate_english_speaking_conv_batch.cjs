const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = process.env.GEMINI_API_KEY || (apiKeyMatch ? apiKeyMatch[1].trim() : null);

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const TOTAL_LESSONS = 50;
const OUTPUT_FILE = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_speaking_conv_data.json');

async function generateLesson(lessonNum) {
  console.log(`Generating Speaking Conv Lesson ${lessonNum}...`);
  const prompt = `
You are an expert English speaking coach.
Generate 3 distinct conversational situations for Speaking Lesson ${lessonNum}.
The length of each conversation should be medium (around 8-12 lines of dialogue).

Format the output strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json.
Each object must have the following structure:
{
  "situation": "Description of the situation in English (e.g. Ordering food at a restaurant)",
  "dialogue": [
    { "speaker": "A", "text": "Hello, I'd like a table for two." },
    { "speaker": "B", "text": "Right this way. Here are your menus." }
  ],
  "vocabulary": [
    {
      "word": "English word",
      "translation": "Thai translation",
      "explanation": "Brief explanation in Thai of how to use it"
    }
  ] // Include 3-5 difficult/important words from the conversation
}
`;

  try {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
        }
    });
    
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error for lesson ${lessonNum}:`, error);
    return null;
  }
}

async function run() {
  let existingData = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      console.error("Error reading existing data, starting fresh.");
    }
  }

  for (let i = 1; i <= TOTAL_LESSONS; i++) {
    const key = `Lesson${i}`;
    
    if (existingData[key]) {
      console.log(`${key} already exists, skipping...`);
      continue;
    }

    let lessonData = null;
    let retries = 3;
    while (!lessonData && retries > 0) {
      lessonData = await generateLesson(i);
      if (!lessonData) {
        retries--;
        console.log(`Retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (lessonData) {
      existingData[key] = lessonData;
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingData, null, 2), 'utf8');
      console.log(`Successfully saved ${key}`);
    } else {
      console.error(`Failed to generate Lesson ${i} after retries.`);
    }
    
    await new Promise(r => setTimeout(r, 4500));
  }

  console.log("Finished generating all speaking conv lessons.");
}

run();
