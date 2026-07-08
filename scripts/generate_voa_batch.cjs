const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// --- การตั้งค่า ---
const apiKey = 'AQ.Ab8RN6IvlLA4DnQFxk5s4wUFc4k1yJebS6cHdzQfa3-E-0uiBQ'; 
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // ใช้โมเดลเวอร์ชันล่าสุดที่รวดเร็วและคุ้มค่า

const BATCH_SIZE_PER_LEVEL = 10; // กำหนดจำนวนบทความต่อระดับที่จะดึงในแต่ละรอบ (รวม 3 ระดับ = 30 บทความ)
const DELAY_MS = 15000; // หน่วงเวลา 15 วินาทีต่อ 1 บทความ เพื่อไม่ให้ถี่เกินไปและไม่โดนแบน

const VOA_PAGES = {
  beginning: 'https://learningenglish.voanews.com/z/4729',
  intermediate: 'https://learningenglish.voanews.com/z/986',
  advanced: 'https://learningenglish.voanews.com/z/950'
};

const DATA_FILE_PATH = path.join(__dirname, '../src/data/voa_lessons.json');

// โหลดข้อมูลเก่าถ้ามี เพื่อเอาไปต่อท้าย ไม่ทับของเดิม
let existingData = {
  beginning: { label: "Beginning (Let's Learn English)", description: "เริ่มต้นเรียนภาษาอังกฤษด้วยเนื้อหาที่เข้าใจง่าย คำศัพท์พื้นฐาน และพูดช้า", articles: [] },
  intermediate: { label: "Intermediate (As It Is)", description: "พัฒนาทักษะด้วยข่าวสารและเรื่องราวรอบโลกที่ใช้คำศัพท์ระดับกลาง", articles: [] },
  advanced: { label: "Advanced (Education & Science)", description: "ท้าทายความสามารถด้วยบทความเชิงลึก คำศัพท์ซับซ้อน และการวิเคราะห์", articles: [] }
};

if (fs.existsSync(DATA_FILE_PATH)) {
  const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
  existingData = JSON.parse(raw);
}

// ฟังก์ชันเก็บลิงก์ข่าวย้อนหลัง (Pagination)
async function getLinksForLevel(baseUrl, maxLinks) {
  const links = new Set();
  let page = 0;
  
  while (links.size < maxLinks && page < 5) { // ดึงไม่เกิน 5 หน้า
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
          links.add(href);
        }
      });
    } catch (e) {
      console.error(`Error scanning page ${url}`, e.message);
    }
    page++;
    await new Promise(r => setTimeout(r, 2000)); // หน่วงเวลาดึงหน้าเว็บ
  }
  return Array.from(links).slice(0, maxLinks);
}

// ฟังก์ชันดึงเนื้อหาข่าว
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
    
    return { title, url, audioUrl, paragraphs, vocabRaw };
  } catch(e) {
    return null;
  }
}

// ฟังก์ชันส่งให้ AI สร้างข้อสอบ
async function processWithGemini(article, level) {
  let numQuestions = level === 'intermediate' ? 5 : (level === 'advanced' ? 7 : 3);
  const prompt = `
  You are an expert English teacher. I will provide a VOA Learning English article.
  
  Task 1: Translate the vocabulary definitions to Thai. Format: "word - part of speech. Thai definition".
  Task 2: Generate ${numQuestions} IELTS-style reading comprehension multiple-choice questions (4 options each) based on the text.
  CRITICAL: The questions MUST follow the chronological order of the paragraphs.
  
  Article Paragraphs:
  ${article.paragraphs.map((p, i) => `[Para ${i+1}] ${p}`).join('\n')}
  
  Vocabulary:
  ${article.vocabRaw.join('\n')}
  
  Respond ONLY with a valid JSON object:
  {
    "vocabList": ["word1 - adj. ความหมาย", "word2 - n. ความหมาย"],
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
    
    // ดึงลิงก์ข่าวตามจำนวน BATCH_SIZE_PER_LEVEL
    const articleLinks = await getLinksForLevel(pageUrl, BATCH_SIZE_PER_LEVEL);
    
    for (const link of articleLinks) {
      // ตรวจสอบว่าบทความนี้เคยดึงไปแล้วหรือยัง เพื่อไม่ให้ซ้ำ
      const isAlreadySaved = existingData[level].articles.some(a => a.url === link);
      if (isAlreadySaved) {
        console.log(`Skipping (Already saved): ${link}`);
        continue;
      }

      console.log(`Scraping: ${link}`);
      const articleData = await fetchArticleContent(link);
      
      if (articleData && articleData.paragraphs.length > 2) {
        console.log(`Generating Quiz via AI for: "${articleData.title}"...`);
        const aiData = await processWithGemini(articleData, level);
        
        if (aiData) {
          existingData[level].articles.push({
            title: articleData.title,
            url: articleData.url,
            audioUrl: articleData.audioUrl,
            paragraphs: articleData.paragraphs,
            vocabList: aiData.vocabList,
            quiz: aiData.quiz
          });
          
          // บันทึกไฟล์ทันทีเผื่อสคริปต์หยุดทำงานกลางคัน
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(existingData, null, 2));
          console.log(`[SUCCESS] Saved and appended to voa_lessons.json!`);
        }
      }
      
      console.log(`Waiting ${DELAY_MS / 1000} seconds before next API call...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  console.log('\nAll done! The dataset has been updated successfully.');
}

run();
