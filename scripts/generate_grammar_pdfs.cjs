const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data/grammar_beginner_01_nouns.json');
const outputDir = path.join('C:\\Users\\USER\\Desktop\\Grammar_Beginner_Nouns');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const grammarData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function generatePDFs() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const topic of grammarData) {
    const isSummary = topic.id.includes('Summary');
    
    // HTML Template
    let html = `
    <html>
    <head>
      <style>
        body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
        h1 { color: #4f46e5; font-size: 32px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; }
        h2 { color: #3730a3; font-size: 24px; margin-top: 30px; }
        p { font-size: 16px; margin-bottom: 15px; }
        .explanation { background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px; }
        .mistake { background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 20px; }
        .example-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .example-table th, .example-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        .example-table th { background-color: #f3f4f6; font-weight: bold; }
        .page-break { page-break-before: always; }
        .question-box { margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .question-text { font-weight: bold; margin-bottom: 15px; font-size: 16px; }
        .option { margin-bottom: 10px; padding: 10px; border: 1px solid #f3f4f6; border-radius: 4px; }
        .answer-box { background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 4px; padding: 15px; margin-top: 15px; }
        .answer-label { font-weight: bold; color: #047857; margin-bottom: 5px; }
        .test-title { text-align: center; color: #1d4ed8; font-size: 28px; margin-top: 50px; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <h1>${topic.title}</h1>
    `;

    if (!isSummary) {
      // Teaching Content
      html += `
        <div class="explanation">
          <h2>คำอธิบาย (Explanation)</h2>
          <p>${topic.explanation.replace(/\\n/g, '<br>')}</p>
        </div>
        
        <h2>ตัวอย่าง (Examples)</h2>
        <table class="example-table">
          <tr><th>English</th><th>Thai</th></tr>
          ${topic.examples.map(ex => `<tr><td>${ex.eng}</td><td>${ex.thai}</td></tr>`).join('')}
        </table>

        <div class="mistake">
          <h2>จุดที่คนไทยมักพลาด (Common Mistakes)</h2>
          <p>${topic.common_mistakes.replace(/\\n/g, '<br>')}</p>
        </div>
      `;
    } else {
      // Summary Content
      html += `
        <div class="explanation">
          <h2>สรุปรวบยอด (Summary)</h2>
          <p>${topic.explanation.replace(/\\n/g, '<br>')}</p>
        </div>
      `;
    }

    // Practice Test (No Answers)
    html += `
      <div class="page-break"></div>
      <div class="test-title">แบบฝึกหัด (Practice Test)</div>
      <p style="text-align:center; margin-bottom:30px;">ลองทำด้วยตัวเองก่อนดูเฉลยในหน้าถัดไปนะครับ</p>
    `;

    topic.practice_questions.forEach((q, idx) => {
      html += `
        <div class="question-box">
          <div class="question-text">${idx + 1}. ${q.question}</div>
          ${q.options.map(opt => `<div class="option">${opt}</div>`).join('')}
        </div>
      `;
    });

    // Answer Key
    html += `
      <div class="page-break"></div>
      <div class="test-title">เฉลยและคำอธิบาย (Answer Key)</div>
    `;

    topic.practice_questions.forEach((q, idx) => {
      html += `
        <div class="question-box">
          <div class="question-text">${idx + 1}. ${q.question}</div>
          ${q.options.map(opt => {
            const isCorrect = opt.startsWith(q.answer + ".");
            return `<div class="option" style="${isCorrect ? 'background-color:#d1fae5; border-color:#34d399; font-weight:bold;' : ''}">${opt}</div>`;
          }).join('')}
          <div class="answer-box">
            <div class="answer-label">เฉลย: ข้อ ${q.answer}</div>
            <div>${q.explanation}</div>
          </div>
        </div>
      `;
    });

    html += `
    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Add Google Fonts
    await page.evaluate(() => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    });
    
    // Wait for font to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const outputPath = path.join(outputDir, `${topic.id}_${topic.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
    console.log(`Generated: ${outputPath}`);
  }

  await browser.close();
}

generatePDFs().catch(console.error);
