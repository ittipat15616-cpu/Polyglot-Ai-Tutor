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
    const pdfPath = path.join(OUTPUT_DIR, `${lessonKey}_blank.jpg`);
    
    if (fs.existsSync(pdfPath)) {
      console.log(`Skipping ${lessonKey} blank, JPG already exists.`);
      continue;
    }

    console.log(`Generating Blank JPG for ${lessonKey}...`);

    let questionsHtml = questions.map((q, idx) => `
      <div class="question-container" style="page-break-after: always; padding: 40px; min-height: 800px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Question ${idx + 1}</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 40px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e293b;">Writing Prompt</h3>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">${q.question}</p>
        </div>

        <div style="margin-top: 50px;">
          <h3 style="color: #64748b; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;">Your Practice Space</h3>
          <div style="height: 600px; border: 2px dashed #cbd5e1; border-radius: 12px; margin-top: 15px; background: #fafafa;"></div>
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
          <h2 style="font-size: 32px; font-weight: 400; opacity: 0.9;">${lessonKey} (Exercise)</h2>
          <p style="margin-top: 50px; font-size: 18px; opacity: 0.8;">Polyglot AI Tutor</p>
        </div>
        ${questionsHtml}
      </body>
      </html>
    `;

    await page.goto('about:blank'); await page.evaluate((html) => { document.documentElement.innerHTML = html; }, html);
    await page.screenshot({ path: pdfPath, fullPage: true, quality: 90, type: 'jpeg' });
  }

  await browser.close();
  console.log("All Blank Images generated successfully.");
}

generatePDFs().catch(console.error);
