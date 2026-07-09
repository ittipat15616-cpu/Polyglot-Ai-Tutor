const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// --- Settings ---
const apiKey = 'AQ.Ab8RN6IvlLA4DnQFxk5s4wUFc4k1yJebS6cHdzQfa3-E-0uiBQ'; 
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 

const BATCH_SIZE_PER_LEVEL = 10;
const DELAY_MS = 15000; 

const VOA_PAGES = {
  intermediate: 'https://learningenglish.voanews.com/z/986',
  advanced: 'https://learningenglish.voanews.com/z/950'
};

const DATA_FILE_PATH = path.join(__dirname, '../src/data/listening_lessons.json');
const VOA_FILE_PATH = path.join(__dirname, '../src/data/voa_lessons.json');

// Get existing VOA URLs to avoid duplicates
let existingVOAUrls = new Set();
if (fs.existsSync(VOA_FILE_PATH)) {
    const raw = fs.readFileSync(VOA_FILE_PATH, 'utf-8');
    const voaData = JSON.parse(raw);
    for (const level in voaData) {
        if (voaData[level].articles) {
            voaData[level].articles.forEach(a => existingVOAUrls.add(a.url));
        }
    }
}

let existingData = {
  intermediate: { label: "Intermediate", description: "Listening Practice - Intermediate Level", articles: [] },
  advanced: { label: "Advanced", description: "Listening Practice - Advanced Level", articles: [] }
};

if (fs.existsSync(DATA_FILE_PATH)) {
  const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
  existingData = JSON.parse(raw);
}

// Ensure we know what URLs are already saved in listening as well
existingData.intermediate.articles.forEach(a => existingVOAUrls.add(a.url));
if (existingData.advanced) {
    existingData.advanced.articles.forEach(a => existingVOAUrls.add(a.url));
}

async function getLinksForLevel(baseUrl, targetCount) {
  const links = new Set();
  let page = 0;
  
  while (links.size < targetCount && page < 20) { // Scan up to 20 pages
    const url = `${baseUrl}?p=${page}`;
    console.log(`Scanning page: ${url}`);
    try {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.includes('/a/') && href.endsWith('.html')) {
          if (!href.startsWith('http')) {
            href = 'https://learningenglish.voanews.com' + href;
          }
          if (!existingVOAUrls.has(href)) {
             links.add(href);
          }
        }
      });
    } catch (e) {
      console.error(`Error scanning page ${url}`, e.message);
    }
    page++;
    await new Promise(r => setTimeout(r, 2000));
  }
  return Array.from(links).slice(0, targetCount);
}

async function fetchArticleContent(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const title = $('h1.title').text().trim() || $('h1').text().trim();
    
    let audioUrl = '';
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.endsWith('.mp3')) audioUrl = href;
    });
    
    const paragraphs = [];
    let isWordsInThisStory = false;
    const vocabRaw = [];
    
    $('div.wsw p').each((i, el) => {
      const pText = $(el).text().trim();
      if (!pText) return;
      if (pText.toLowerCase().includes('words in this story') || pText.toLowerCase() === 'words in this story') {
        isWordsInThisStory = true;
        return;
      }
      if (isWordsInThisStory) vocabRaw.push(pText);
      else paragraphs.push(pText);
    });
    
    // We only want articles that have audio
    if (!audioUrl) return null;
    return { title, url, audioUrl, paragraphs, vocabRaw };
  } catch(e) {
    return null;
  }
}

async function processWithGemini(article) {
  const prompt = `
  You are an expert English listening teacher. I will provide a VOA Learning English transcript.
  
  Task 1: Generate EXACTLY 15 listening comprehension multiple-choice questions (4 options each) based on the transcript.
  CRITICAL 1: The questions MUST follow the chronological order of the information presented in the transcript.
  CRITICAL 2: Ensure there are EXACTLY 15 questions. Do not generate fewer or more.
  
  Transcript Paragraphs:
  ${article.paragraphs.map((p, i) => `[Para ${i+1}] ${p}`).join('\n')}
  
  Respond ONLY with a valid JSON object matching this schema EXACTLY:
  {
    "quiz": [
      {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "answer": 0,
        "explanation": "Thai explanation of why this is correct."
      }
    ]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Error:", e.message);
    return null;
  }
}

async function run() {
  for (const [level, pageUrl] of Object.entries(VOA_PAGES)) {
    console.log(`\n=== Starting Level: ${level.toUpperCase()} ===`);
    
    // Calculate how many we still need for this level (if resuming)
    const currentCount = existingData[level].articles.length;
    const needed = Math.max(0, BATCH_SIZE_PER_LEVEL - currentCount);
    
    if (needed === 0) {
        console.log(`Already have ${BATCH_SIZE_PER_LEVEL} articles for ${level}. Skipping.`);
        continue;
    }
    
    const articleLinks = await getLinksForLevel(pageUrl, needed);
    
    for (const link of articleLinks) {
      console.log(`Scraping: ${link}`);
      const articleData = await fetchArticleContent(link);
      
      if (articleData && articleData.paragraphs.length > 2) {
        console.log(`Generating 15-question Listening Quiz via AI for: "${articleData.title}"...`);
        const aiData = await processWithGemini(articleData);
        
        if (aiData && aiData.quiz && aiData.quiz.length === 15) {
          existingData[level].articles.push({
            title: articleData.title,
            url: articleData.url,
            audioUrl: articleData.audioUrl,
            // DO NOT SAVE PARAGRAPHS or VOCAB - the user only wants listening quiz!
            quiz: aiData.quiz
          });
          
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(existingData, null, 2));
          console.log(`[SUCCESS] Saved and appended to listening_lessons.json! (${existingData[level].articles.length}/${BATCH_SIZE_PER_LEVEL})`);
          existingVOAUrls.add(link);
        } else {
            console.log(`[FAILED] AI generation failed or returned invalid format. Got ${aiData?.quiz?.length || 0} questions.`);
        }
      } else {
          console.log(`[FAILED] Could not extract valid article/audio from URL.`);
      }
      
      console.log(`Waiting ${DELAY_MS / 1000} seconds before next API call...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  console.log('\nAll done! The listening dataset has been generated successfully.');
}

run();
