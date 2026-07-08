const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const apiKey = 'AQ.Ab8RN6IvlLA4DnQFxk5s4wUFc4k1yJebS6cHdzQfa3-E-0uiBQ'; 
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const VOA_PAGES = {
  beginning: 'https://learningenglish.voanews.com/z/4729', // Let's Learn English
  intermediate: 'https://learningenglish.voanews.com/z/986', // As It Is
  advanced: 'https://learningenglish.voanews.com/z/950' // Education
};

async function fetchArticleContent(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const title = $('h1.title').text().trim() || $('h1').text().trim();
    
    let audioUrl = '';
    const audioLinks = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.endsWith('.mp3')) {
        audioLinks.push(href);
      }
    });
    audioUrl = audioLinks.length > 0 ? audioLinks[0] : '';
    
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
      
      if (isWordsInThisStory) {
        vocabRaw.push(pText);
      } else {
        paragraphs.push(pText);
      }
    });
    
    return { title, url, audioUrl, paragraphs, vocabRaw };
  } catch(e) {
    console.error("Error fetching article:", url, e.message);
    return null;
  }
}

async function processWithGemini(article, level) {
  let numQuestions = 3;
  if (level === 'intermediate') numQuestions = 5;
  if (level === 'advanced') numQuestions = 7;

  const prompt = `
  You are an expert English teacher. I will provide a VOA Learning English article, including its paragraphs and vocabulary.
  
  Task 1: Translate the vocabulary definitions to Thai. Maintain the format "word - part of speech. Thai definition". If no vocab provided, extract 3 hard words and define in Thai.
  Task 2: Generate ${numQuestions} IELTS-style reading comprehension multiple-choice questions (4 options each) based on the text.
  CRITICAL: The questions MUST follow the chronological order of the paragraphs. Question 1 must be from the beginning, Question 2 from after that, etc. Do not jump back.
  
  Article Paragraphs:
  ${article.paragraphs.map((p, i) => `[Para ${i+1}] ${p}`).join('\n')}
  
  Vocabulary:
  ${article.vocabRaw.join('\n')}
  
  Respond ONLY with a valid JSON object matching exactly this schema, with no markdown formatting around it:
  {
    "vocabList": [
      "word1 - part of speech. Thai meaning",
      "word2 - part of speech. Thai meaning"
    ],
    "quiz": [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": 0,
        "explanation": "Thai explanation of why this is correct and which paragraph it is from."
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
    console.error("Gemini processing failed for article:", article.title, e.message);
    return null;
  }
}

async function run() {
  const dataset = {
    beginning: {
      label: "Beginning (Let's Learn English)",
      description: "เริ่มต้นเรียนภาษาอังกฤษด้วยเนื้อหาที่เข้าใจง่าย คำศัพท์พื้นฐาน และพูดช้า",
      articles: []
    },
    intermediate: {
      label: "Intermediate (As It Is)",
      description: "พัฒนาทักษะด้วยข่าวสารและเรื่องราวรอบโลกที่ใช้คำศัพท์ระดับกลาง",
      articles: []
    },
    advanced: {
      label: "Advanced (Education & Science)",
      description: "ท้าทายความสามารถด้วยบทความเชิงลึก คำศัพท์ซับซ้อน และการวิเคราะห์",
      articles: []
    }
  };

  for (const [level, pageUrl] of Object.entries(VOA_PAGES)) {
    console.log(\`Fetching page for \${level}...\`);
    try {
      const res = await fetch(pageUrl);
      const html = await res.text();
      const $ = cheerio.load(html);
      
      const links = new Set();
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.includes('/a/') && href.endsWith('.html')) {
          if (!href.startsWith('http')) {
            href = 'https://learningenglish.voanews.com' + href;
          }
          links.add(href);
        }
      });
      
      const articleLinks = Array.from(links).slice(0, 5); // Get 5 articles per level
      
      for (const link of articleLinks) {
        console.log(\`Scraping article: \${link}\`);
        const articleData = await fetchArticleContent(link);
        if (articleData && articleData.paragraphs.length > 0) {
          console.log(\`Generating AI quiz for: \${articleData.title}\`);
          const aiData = await processWithGemini(articleData, level);
          if (aiData) {
            dataset[level].articles.push({
              title: articleData.title,
              url: articleData.url,
              audioUrl: articleData.audioUrl,
              paragraphs: articleData.paragraphs,
              vocabList: aiData.vocabList,
              quiz: aiData.quiz
            });
            console.log(\`Success! Wait 5 seconds...\`);
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      }
    } catch(e) {
      console.error(\`Error processing \${level}:\`, e.message);
    }
  }

  const outputPath = path.join('C:\\Users\\USER\\antigravity\\Polyglot-AI-Tutor-New', 'src/data/voa_lessons.json');
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
  console.log('Successfully generated voa_lessons.json with AI quizzes!');
}

run();
