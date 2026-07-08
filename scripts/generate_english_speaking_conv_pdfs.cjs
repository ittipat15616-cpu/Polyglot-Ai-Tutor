const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_speaking_conv_data.json');
const OUTPUT_DIR = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'en_speaking_conv');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generatePDFs() {
  if (!fs.existsSync(DATA_FILE)) return;

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const [lessonKey, situations] of Object.entries(data)) {
    const pdfPath = path.join(OUTPUT_DIR, `${lessonKey}.pdf`);
    if (fs.existsSync(pdfPath)) continue;

    console.log(`Generating PDF for ${lessonKey}...`);

    let situationsHtml = situations.map((s, idx) => `
      <div style="page-break-after: always; padding: 40px;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Situation ${idx + 1}: ${s.situation}</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e293b;">Dialogue</h3>
          <div style="font-size: 16px; color: #334155; line-height: 1.8;">
            ${s.dialogue.map(d => `
              <p><strong>${d.speaker}:</strong> ${d.text}</p>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #6366f1;">Vocabulary List</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Word</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Translation</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Explanation</th>
              </tr>
            </thead>
            <tbody>
              ${(s.vocabulary || []).map(v => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${v.word}</td>
                  <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569;">${v.translation}</td>
                  <td style="padding: 12px; border: 1px solid #cbd5e1; color: #475569; font-size: 14px;">${v.explanation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: white; }</style>
      </head>
      <body>
        <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; page-break-after: always;">
          <h1 style="font-size: 48px; margin-bottom: 10px;">Speaking Practice</h1>
          <h2 style="font-size: 32px; font-weight: 400; opacity: 0.9;">${lessonKey} - Conversations</h2>
          <p style="margin-top: 50px; font-size: 18px; opacity: 0.8;">Polyglot AI Tutor</p>
        </div>
        ${situationsHtml}
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  }

  await browser.close();
}

generatePDFs().catch(console.error);
