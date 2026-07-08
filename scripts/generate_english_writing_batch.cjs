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

const TOTAL_LESSONS = 150;
const OUTPUT_FILE = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_writing_data.json');

async function generateLesson(lessonNum) {
  console.log(`Generating Writing Lesson ${lessonNum}...`);
  let difficulty = "Easy (A1-A2)";
  if (lessonNum > 50 && lessonNum <= 100) {
    difficulty = "Medium (B1-B2)";
  } else if (lessonNum > 100) {
    difficulty = "Hard (C1-C2)";
  }

  const prompt = `
You are an expert English teacher preparing IELTS/CEFR writing exercises.
Generate exactly 3 writing questions for Lesson ${lessonNum}. 
The difficulty level for this lesson must be: ${difficulty}.
Make sure vocabulary, grammar, and topics match this difficulty level.

Format the output strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json.
Each object must have the following structure:
{
  "question": "The writing prompt (e.g. Write an essay about global warming...)",
  "grammarStructure": "Suggested grammar structure to use (e.g. Conditional sentences, Passive voice)",
  "modelAnswer": "A high-quality model answer demonstrating vocabulary and grammar appropriate for ${difficulty} level.",
  "scoreExplanation": "Explanation in Thai of why this answer scores high and what makes it good.",
  "vocabulary": [
    {
      "word": "English word",
      "translation": "Thai translation",
      "explanation": "Brief explanation in Thai of how to use it"
    }
  ] // Include 3-5 difficult/important words from the model answer
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
    const key = `EN_Writing_Lesson_${i}`;
    
    // Skip if already generated
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
    
    // Rate limit delay (15 RPM -> 4 seconds per request)
    await new Promise(r => setTimeout(r, 4500));
  }

  console.log("Finished generating all writing lessons.");
}

run();
