require('dotenv').config();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("No API key found in .env");
  process.exit(1);
}

const dataDir = path.join(__dirname, '../public/data');
const downloadsDir = path.join(__dirname, '../public/downloads/grammar');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

const tsContent = fs.readFileSync(path.join(__dirname, '../src/data/grammar_topics.ts'), 'utf-8');
const jsonStr = tsContent.replace('export const grammarTopics = ', '').trim().replace(/;$/, '');
const grammarTopics = JSON.parse(jsonStr);
const intermediateTopics = grammarTopics.grammar_intermediate || [];

async function callGeminiAPI(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${await response.text()}`);
      }
      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return JSON.parse(data.candidates[0].content.parts[0].text);
      }
    } catch (e) {
      console.error(`Attempt ${i + 1} failed: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

async function renderPDF(topic, outputPath, desktopPath) {
    // Always re-render for now
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const isSummary = topic.title.includes('Summary') || topic.id.includes('Summary');
    
    let html = `<html><head><style>
        body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
        h1 { color: #4f46e5; font-size: 32px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; }
        h2 { color: #3730a3; font-size: 24px; margin-top: 30px; }
        p { font-size: 16px; margin-bottom: 15px; }
        .explanation { background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px; }
        .example { background-color: #ecfdf5; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .example p { margin: 5px 0; }
        .mistakes { background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 30px; }
        .question { margin-bottom: 20px; page-break-inside: avoid; }
        .options { margin-left: 20px; color: #4b5563; }
        .answer-box { background-color: #eff6ff; padding: 15px; border-radius: 4px; margin-top: 10px; }
        .watermark { position: fixed; bottom: 20px; right: 20px; font-size: 12px; color: #9ca3af; }
        .page-break { page-break-before: always; }
    </style></head><body>`;
    
    html += `<h1>${topic.title}</h1>`;
    
    if (topic.explanation) {
        html += `<div class="explanation">${topic.explanation.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</div>`;
    }
    
    if (topic.examples && topic.examples.length > 0) {
        html += `<h2>Examples (ตัวอย่างการใช้งาน)</h2>`;
        for (const ex of topic.examples) {
            html += `<div class="example">
                <p><strong>🇬🇧 ${ex.eng}</strong></p>
                <p>🇹🇭 ${ex.thai}</p>
            </div>`;
        }
    }
    
    if (topic.common_mistakes) {
        html += `<h2>⚠️ Common Mistakes (จุดที่มักทำผิดบ่อย)</h2>`;
        html += `<div class="mistakes">${topic.common_mistakes.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</div>`;
    }
    
    html += `<div class="page-break"></div>`;
    html += `<h2>📝 Practice Exercises (${isSummary ? '50' : '10'} Questions)</h2>`;
    
    let qNum = 1;
    for (const q of (topic.practice_questions || [])) {
        html += `<div class="question">`;
        html += `<p><strong>${qNum}. ${q.question}</strong></p>`;
        html += `<div class="options">`;
        for (const opt of q.options) {
            html += `<p>${opt}</p>`;
        }
        html += `</div>`;
        html += `</div>`;
        qNum++;
    }
    
    html += `<div class="page-break"></div>`;
    html += `<h2>✅ Answer Key & Explanations</h2>`;
    
    qNum = 1;
    for (const q of (topic.practice_questions || [])) {
        html += `<div class="question">`;
        html += `<p><strong>${qNum}. ${q.question}</strong></p>`;
        html += `<div class="answer-box">
            <p><strong>✅ Answer:</strong> ${q.answer}</p>
            <p><strong>💡 Explanation:</strong> ${q.explanation}</p>
        </div>`;
        html += `</div>`;
        qNum++;
    }
    
    html += `<div class="watermark">Polyglot AI Tutor - Intermediate Grammar (B1-B2)</div>`;
    html += `</body></html>`;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
    fs.copyFileSync(outputPath, desktopPath);
    console.log(`Saved and Copied PDF: ${outputPath}`);
    await browser.close();
}

async function run() {
  for (const topic of intermediateTopics) {
    console.log(`\n=== Processing ${topic.name} ===`);
    const jsonPath = path.join(dataDir, `grammar_intermediate_${topic.id}.json`);
    const pdfDir = path.join(downloadsDir, topic.id);
    const desktopDir = path.join('C:\\Users\\USER\\Desktop', `Grammar_Intermediate_${topic.id}`);
    
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

    let topicData = [];
    if (fs.existsSync(jsonPath)) {
      topicData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`Loaded existing JSON for ${topic.name}`);
    } else {
      for (const subtopic of topic.subtopics) {
        console.log(`  -> Generating: ${subtopic.name}...`);
        const isSummary = subtopic.name.includes('Summary');
        const numQ = isSummary ? 50 : 10;
        const prompt = `
คุณคือผู้เชี่ยวชาญด้านการสอนภาษาอังกฤษสำหรับคนไทย หน้าที่ของคุณคือสร้างเนื้อหาการสอน Grammar ในระดับ Intermediate (B1-B2) ที่ 'ละเอียด ครบถ้วน ท้าทาย และเข้าใจง่ายที่สุด' 
สำหรับหัวข้อหลัก: ${topic.name}
หัวข้อย่อยปัจจุบัน: ${subtopic.name}

${isSummary ? 'นี่คือหน้า Summary (สรุปรวบยอด) ให้สรุปเนื้อหาทั้งหมดของหัวข้อหลักนี้สั้นๆ แต่ครอบคลุม เน้นระดับ B1-B2 ยกตัวอย่างด้วยถ้าจำเป็น และบอกจุดที่คนไทยมักจะทำผิดในระดับกลาง (Common Mistakes) ท้ายสุดสร้างแบบฝึกหัดทบทวนความเข้าใจในระดับกลาง ' + numQ + ' ข้อ' : 'อธิบายเนื้อหาอย่างละเอียดให้เหมาะสมกับระดับ B1-B2 ยกตัวอย่างที่ท้าทายและซับซ้อนขึ้นให้ชัดเจน และบอกจุดที่คนไทยมักจะทำผิด (Common Mistakes)'}

คำสั่งสำคัญมาก (CRITICAL INSTRUCTION):
คุณต้องสร้างข้อสอบ (practice_questions) ให้ครบถ้วนจำนวน EXACTLY ${numQ} ข้อ ห้ามขาดแม้แต่ข้อเดียว ห้ามหยุดกลางคัน ห้ามทำแค่ 3 หรือ 4 ข้อเด็ดขาด ต้องทำให้ครบ ${numQ} ข้อเป๊ะๆ คำศัพท์ในข้อสอบควรจะเป็นระดับ B1-B2

สร้างข้อมูลในรูปแบบ JSON 1 Object ตามโครงสร้างนี้ (ห้ามมี array คลุมข้างนอก):
{
  "id": "${subtopic.id}",
  "title": "${subtopic.name}",
  "explanation": "<คำอธิบายภาษาไทยแบบละเอียด เข้าใจง่าย ใช้ \\n เพื่อขึ้นบรรทัดใหม่>",
  "examples": [
    {"eng": "<ประโยคภาษาอังกฤษ B1-B2>", "thai": "<คำแปลและคำอธิบาย>"}
  ],
  "common_mistakes": "<จุดที่คนไทยมักพลาด อธิบายให้เคลียร์ ใช้ \\n ขึ้นบรรทัดใหม่>",
  "practice_questions": [
    {
      "question": "<คำถามระดับ B1-B2>",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "<A, B, C, หรือ D>",
      "explanation": "<เฉลยและอธิบายอย่างละเอียดว่าทำไมถึงตอบข้อนี้>"
    }
  ]
}
`;
        let generated = false;
        while (!generated) {
            const data = await callGeminiAPI(prompt);
            if (data && data.practice_questions && data.practice_questions.length === numQ) {
                topicData.push(data);
                console.log(`     Success!`);
                generated = true;
            } else {
                console.log(`     Failed or incorrect question count. Retrying...`);
            }
        }
      }
      fs.writeFileSync(jsonPath, JSON.stringify(topicData, null, 2), 'utf8');
      console.log(`Saved JSON: ${jsonPath}`);
    }

    // Render PDFs
    console.log(`  -> Rendering PDFs...`);
    for (const sub of topicData) {
        const outputPath = path.join(pdfDir, `${sub.id}.pdf`);
        const desktopPath = path.join(desktopDir, `${sub.id}.pdf`);
        await renderPDF(sub, outputPath, desktopPath);
    }
  }
  console.log("All Intermediate topics processed!");
}

run();
