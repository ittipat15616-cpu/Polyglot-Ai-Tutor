const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const dataPath = path.join(__dirname, '../src/data/listening_lessons.json');
if (!fs.existsSync(dataPath)) {
    console.error("No listening_lessons.json found. Run the batch generator first.");
    process.exit(1);
}
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const intermediateDir = path.join(__dirname, '../public/listening/intermediate');
const advancedDir = path.join(__dirname, '../public/listening/advanced');

if (!fs.existsSync(intermediateDir)) fs.mkdirSync(intermediateDir, { recursive: true });
if (!fs.existsSync(advancedDir)) fs.mkdirSync(advancedDir, { recursive: true });

function generateHTML(article, lessonNum) {
    let quizHTML = '';
    if (article.quiz && article.quiz.length > 0) {
        quizHTML = `
            <div class="section-title">Listening Comprehension Quiz</div>
            ${article.quiz.map((q, idx) => `
                <div class="quiz-question">${idx + 1}. ${q.question}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, optIdx) => {
                        let isCorrect = q.answer === optIdx;
                        return `<div class="quiz-option ${isCorrect ? 'correct-answer' : ''}">${opt} ${isCorrect ? '✅' : ''}</div>`;
                    }).join('')}
                </div>
                ${q.explanation ? `<div class="explanation"><b>คำอธิบาย:</b> ${q.explanation}</div>` : ''}
            `).join('')}
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { 
        font-family: 'Sarabun', sans-serif; 
        font-size: 20px; 
        line-height: 1.8; 
        padding: 60px; 
        color: #333; 
        background-color: #fff;
        width: 1000px;
        margin: 0 auto;
    }
    h1 { 
        font-size: 32px; 
        text-align: center; 
        margin-bottom: 30px; 
        color: #1a365d;
    }
    .section-title { 
        font-size: 26px; 
        font-weight: bold; 
        margin-top: 40px; 
        margin-bottom: 15px; 
        border-bottom: 3px solid #e2e8f0; 
        padding-bottom: 10px; 
        color: #2d3748;
    }
    .quiz-question { 
        font-weight: bold; 
        margin-top: 30px; 
        margin-bottom: 15px;
    }
    .quiz-options { 
        margin-left: 30px; 
    }
    .quiz-option { 
        margin-bottom: 10px; 
    }
    .correct-answer {
        color: #16a34a;
        font-weight: bold;
    }
    .explanation {
        margin-top: 15px;
        padding: 15px;
        background-color: #f0fdf4;
        border-left: 4px solid #16a34a;
        color: #166534;
        font-size: 18px;
        border-radius: 4px;
    }
    .lesson-tag {
        text-align: center;
        color: #718096;
        font-size: 20px;
        margin-bottom: 10px;
    }
    .instruction {
        text-align: center;
        font-size: 22px;
        color: #e63946;
        font-weight: bold;
        margin-bottom: 40px;
        padding: 15px;
        background-color: #fff1f2;
        border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="lesson-tag">Listening Lesson ${lessonNum}</div>
  <h1>${article.title}</h1>
  <div class="instruction">
    โปรดฟังไฟล์เสียงจากแถบเครื่องเล่นด้านบนก่อน แล้วจึงทำแบบทดสอบด้านล่างนี้
  </div>
  ${quizHTML}
</body>
</html>
    `;
}

async function run() {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: 'new' });
    
    const levels = [
        { name: 'intermediate', dir: intermediateDir, articles: data.intermediate.articles },
        { name: 'advanced', dir: advancedDir, articles: data.advanced.articles }
    ];
    
    for (const level of levels) {
        if (!level.articles || level.articles.length === 0) continue;
        console.log(`Processing ${level.name} - ${level.articles.length} articles`);
        for (let i = 0; i < level.articles.length; i++) {
            const article = level.articles[i];
            const lessonNum = i + 1;
            const imgPath = path.join(level.dir, `Lesson${lessonNum}.jpg`);
            
            const html = generateHTML(article, lessonNum);
            
            const page = await browser.newPage();
            await page.setViewport({ width: 1100, height: 800 });
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            await page.screenshot({ 
                path: imgPath, 
                fullPage: true,
                type: 'jpeg',
                quality: 90
            });
            await page.close();
            console.log(`Generated Listening ${level.name} Lesson ${lessonNum}.jpg`);
        }
    }
    
    await browser.close();
    console.log("All Images generated successfully!");
}

run();
