const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const WRITING_DATA = require('./writing_data.json');
const SPEAKING_DATA = require('./speaking_conv_data.json');

const OUTPUT_DIR = 'C:\\Users\\USER\\Desktop\\Generated_Documents\\PDF_Review';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generatePDFs() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Generate Writing Lesson 1
  const wLesson = WRITING_DATA[0];
  const wHtml = `
    <!DOCTYPE html>
    <html>
    <head><style>body { font-family: sans-serif; margin: 40px; background: white; line-height: 1.6; }</style></head>
    <body>
      <h1 style="color: #4f46e5;">${wLesson.title}</h1>
      <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <h3 style="margin-top: 0;">Writing Prompt</h3><p style="margin-bottom: 0;">${wLesson.topic}</p>
      </div>
      <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin-top: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">Grammar Structure</h3><p style="margin-bottom: 0;">${wLesson.grammar_structure}</p>
      </div>
      <div style="background: #ecfdf5; padding: 20px; border-left: 4px solid #10b981; margin-top: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">Model Answer</h3><p style="margin-bottom: 0;">${wLesson.model_answer}</p>
      </div>
      <div style="background: #fffbeb; padding: 20px; border-left: 4px solid #f59e0b; margin-top: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">Explanation</h3><p style="margin-bottom: 0;">${wLesson.explanation}</p>
      </div>
      <h3 style="margin-top: 30px; color: #4f46e5;">Vocabulary List</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Word</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Definition</th>
          </tr>
        </thead>
        <tbody>
          ${wLesson.difficult_vocabulary.map(v => `
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold;">${v.word}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${v.definition}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <h3 style="margin-top: 40px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">Your Practice Space</h3>
      <div style="height: 350px; border: 2px dashed #cbd5e1; background: #fafafa; margin-top: 15px; border-radius: 12px;"></div>
    </body>
    </html>
  `;
  await page.setContent(wHtml);
  await page.pdf({ path: path.join(OUTPUT_DIR, 'Writing_Lesson_1.pdf'), format: 'A4', printBackground: true });

  // Generate Speaking Lesson 1
  const sLesson = SPEAKING_DATA[0];
  const sHtml = `
    <!DOCTYPE html>
    <html>
    <head><style>body { font-family: sans-serif; margin: 40px; background: white; line-height: 1.6; }</style></head>
    <body>
      <h1 style="color: #9333ea;">${sLesson.title}</h1>
      <div style="background: #fdf4ff; padding: 20px; border-left: 4px solid #c026d3; border-radius: 8px;">
        <h3 style="margin-top: 0;">Situation</h3><p style="margin-bottom: 0;">${sLesson.situation}</p>
      </div>
      <h3 style="margin-top: 30px; color: #9333ea;">Dialogue</h3>
      <div style="background: #faf5ff; padding: 20px; border-radius: 12px; border: 1px solid #e9d5ff;">
        ${sLesson.dialogue.map(d => `
          <div style="margin-bottom: 15px;">
            <strong style="color: #7e22ce;">${d.speaker}:</strong> 
            <span style="color: #4c1d95;">${d.text}</span>
          </div>
        `).join('')}
      </div>
      <h3 style="margin-top: 30px; color: #9333ea;">Vocabulary List</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Word</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Definition</th>
          </tr>
        </thead>
        <tbody>
          ${sLesson.difficult_vocabulary.map(v => `
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold;">${v.word}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${v.definition}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  await page.setContent(sHtml);
  await page.pdf({ path: path.join(OUTPUT_DIR, 'Speaking_Conv_Lesson_1.pdf'), format: 'A4', printBackground: true });

  await browser.close();
  console.log("PDFs generated in Desktop/Generated_Documents/PDF_Review");
}

generatePDFs().catch(console.error);
