const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const dataPath = path.join(__dirname, '../src/data/voa_lessons.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const intermediateDir = path.join(__dirname, '../public/downloads/voa/intermediate');
const advancedDir = path.join(__dirname, '../public/downloads/voa/advanced');

if (!fs.existsSync(intermediateDir)) fs.mkdirSync(intermediateDir, { recursive: true });
if (!fs.existsSync(advancedDir)) fs.mkdirSync(advancedDir, { recursive: true });

function generateHTML(article, lessonNum) {
    let paragraphsHTML = article.paragraphs
        .filter(p => p !== 'Embed' && !p.startsWith('___________________'))
        .map(p => `<p>${p}</p>`)
        .join('');
        
    let vocabHTML = '';
    if (article.vocabList && article.vocabList.length > 0) {
        vocabHTML = `
            <div class="section-title">Vocabulary</div>
            ${article.vocabList.map(v => `<div class="vocab-item">${v}</div>`).join('')}
        `;
    }
    
    let blankQuizHTML = '';
    let answerKeyHTML = '';
    
    if (article.quiz && article.quiz.length > 0) {
        blankQuizHTML = `
            <div class="page-break"></div>
            <div class="lesson-tag">Lesson ${lessonNum} - Practice</div>
            <div class="section-title">Reading Comprehension Quiz</div>
            ${article.quiz.map((q, idx) => `
                <div class="quiz-question">${idx + 1}. ${q.question}</div>
                <div class="quiz-options">
                    ${q.options.map(opt => `<div class="quiz-option">${opt}</div>`).join('')}
                </div>
            `).join('')}
        `;
        
        answerKeyHTML = `
            <div class="page-break"></div>
            <div class="lesson-tag">Lesson ${lessonNum} - Answer Key</div>
            <div class="section-title">Answers & Explanations</div>
            ${article.quiz.map((q, idx) => `
                <div class="quiz-question">${idx + 1}. ${q.question}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, optIdx) => `
                        <div class="quiz-option ${optIdx === q.answer ? 'correct-answer' : ''}">${opt}</div>
                    `).join('')}
                </div>
                ${q.explanation ? `<div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
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
        font-size: 16px; 
        line-height: 1.6; 
        color: #333; 
    }
    h1 { 
        font-size: 24px; 
        text-align: center; 
        margin-bottom: 20px; 
        color: #1a365d;
    }
    p { margin-bottom: 12px; }
    .section-title { 
        font-size: 20px; 
        font-weight: bold; 
        margin-top: 30px; 
        margin-bottom: 10px; 
        border-bottom: 2px solid #e2e8f0; 
        padding-bottom: 5px; 
        color: #2d3748;
    }
    .vocab-item { 
        margin-bottom: 8px; 
    }
    .quiz-question { 
        font-weight: bold; 
        margin-top: 20px; 
        margin-bottom: 10px;
    }
    .quiz-options { 
        margin-left: 20px; 
    }
    .quiz-option { 
        margin-bottom: 5px; 
    }
    .correct-answer {
        color: #047857;
        font-weight: bold;
        background-color: #d1fae5;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
    }
    .explanation {
        margin-top: 10px;
        margin-left: 20px;
        padding: 10px;
        background-color: #f3f4f6;
        border-left: 4px solid #3b82f6;
        border-radius: 0 4px 4px 0;
        font-size: 15px;
    }
    .lesson-tag {
        text-align: center;
        color: #718096;
        font-size: 14px;
        margin-bottom: 5px;
    }
    .page-break {
        page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="lesson-tag">Lesson ${lessonNum} - VOA Reading</div>
  <h1>${article.title}</h1>
  ${paragraphsHTML}
  ${vocabHTML}
  ${blankQuizHTML}
  ${answerKeyHTML}
</body>
</html>
    `;
}

async function run() {
    console.log("Launching Puppeteer for VOA...");
    const browser = await puppeteer.launch({ headless: 'new' });
    
    const levels = [
        { name: 'intermediate', dir: intermediateDir, articles: data.intermediate.articles },
        { name: 'advanced', dir: advancedDir, articles: data.advanced.articles }
    ];
    
    for (const level of levels) {
        console.log(`Processing ${level.name} - ${level.articles.length} articles`);
        for (let i = 0; i < level.articles.length; i++) {
            const article = level.articles[i];
            const lessonNum = i + 1;
            const pdfPath = path.join(level.dir, `Lesson${lessonNum}.pdf`);
            
            const html = generateHTML(article, lessonNum);
            
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            await page.pdf({ 
                path: pdfPath, 
                format: 'A4',
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            });
            await page.close();
            console.log(`Generated VOA ${level.name} Lesson ${lessonNum}`);
        }
    }
    
    await browser.close();
    console.log("All VOA PDFs generated successfully!");
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
