const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_writing_data.json');
const OUTPUT_DIR = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_writing');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generatePDFs() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("Data file not found!");
    return;
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const [lessonKey, questions] of Object.entries(data)) {
    const pdfPath = path.join(OUTPUT_DIR, `${lessonKey}.pdf`);
    
    console.log(`Generating PDF for ${lessonKey}...`);

    let questionsHtml = questions.map((q, idx) => `
      <div class="question-container" style="page-break-after: always; padding: 40px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Question ${idx + 1}</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e293b;">Writing Prompt</h3>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">${q.question}</p>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Suggested Grammar Structure</h3>
          <p style="font-size: 15px; color: #7f1d1d;">${q.grammarStructure}</p>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">Model Answer</h3>
          <p style="font-size: 15px; color: #064e3b; line-height: 1.7; white-space: pre-wrap;">${q.modelAnswer}</p>
        </div>

        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Why this answer is good (Explanation)</h3>
          <p style="font-size: 15px; color: #78350f; line-height: 1.6;">${q.scoreExplanation}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #4f46e5;">Vocabulary List</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1; color: #334155;">Word</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1; color: #334155;">Translation</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1; color: #334155;">Explanation</th>
              </tr>
            </thead>
            <tbody>
              ${(q.vocabulary || []).map(v => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${v.word}</td>
                  <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">${v.translation}</td>
                  <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569; font-size: 14px;">${v.explanation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always; padding: 40px;">
          <h3 style="color: #64748b; padding-bottom: 10px; margin-bottom: 30px;">Practice Space</h3>
          ${Array(50).fill('<div style="border-bottom: 1px solid #94a3b8; height: 35px; width: 100%;"></div>').join('')}
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: white; }
        </style>
      </head>
      <body>
        <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; page-break-after: always;">
          <h1 style="font-size: 48px; margin-bottom: 10px;">English Writing Practice</h1>
          <h2 style="font-size: 32px; font-weight: 400; opacity: 0.9;">${lessonKey}</h2>
          <p style="margin-top: 50px; font-size: 18px; opacity: 0.8;">Polyglot AI Tutor</p>
        </div>
        ${questionsHtml}
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  }

  await browser.close();
  console.log("All Images generated successfully.");
}

generatePDFs().catch(console.error);
