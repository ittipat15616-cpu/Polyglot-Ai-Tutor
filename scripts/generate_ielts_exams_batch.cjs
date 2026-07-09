const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const MODEL_NAME = 'gemini-2.5-flash';
// duplicate imports removed
const envPath = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = process.env.GEMINI_API_KEY || (apiKeyMatch ? apiKeyMatch[1].trim() : null);

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1);
}

const TOTAL_EXAMS = 10;
const OUTPUT_DIR = path.join('C:', 'Users', 'USER', 'antigravity', 'Polyglot-AI-Tutor-New', 'public', 'ielts_exams');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateExamData(examNum) {
  console.log(`Generating IELTS Mock Exam ${examNum}...`);
  const prompt = `
You are an IELTS examiner. Generate a short but complete Mock IELTS Exam paper.
Format as JSON without markdown.
{
  "listening": { "part1": "Listening script/questions placeholder", "part2": "Listening script/questions placeholder" },
  "reading": { "passage1": "A short reading passage", "questions": ["Q1", "Q2"] },
  "writing": { "task1": "Writing Task 1 prompt", "task2": "Writing Task 2 prompt" },
  "speaking": { "part1": ["Q1"], "part2": "Describe something", "part3": ["Q1"] },
  "answers": "Answers to listening and reading."
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, response_mime_type: "application/json" } })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      try { return JSON.parse(text); } catch (e) { return null; }
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function createExamPDF(examNum, data) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const pdfPath = path.join(OUTPUT_DIR, `IELTS_Mock_${examNum}.pdf`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>body{font-family: sans-serif; padding: 40px;} h1, h2 {color: #333;} .section{margin-bottom:40px; page-break-after: always;}</style></head>
    <body>
      <div class="section">
        <h1 style="text-align:center;">IELTS Mock Exam ${examNum}</h1>
        <hr/>
      </div>
      <div class="section">
        <h2>Listening</h2>
        <p>${data.listening.part1}</p>
        <p>${data.listening.part2}</p>
      </div>
      <div class="section">
        <h2>Reading</h2>
        <p>${data.reading.passage1}</p>
        <h3>Questions</h3>
        <ul>${data.reading.questions.map(q => `<li>${q}</li>`).join('')}</ul>
      </div>
      <div class="section">
        <h2>Writing</h2>
        <h3>Task 1</h3><p>${data.writing.task1}</p>
        <h3>Task 2</h3><p>${data.writing.task2}</p>
      </div>
      <div class="section">
        <h2>Speaking</h2>
        <h3>Part 1</h3><ul>${data.speaking.part1.map(q => `<li>${q}</li>`).join('')}</ul>
        <h3>Part 2</h3><p>${data.speaking.part2}</p>
        <h3>Part 3</h3><ul>${data.speaking.part3.map(q => `<li>${q}</li>`).join('')}</ul>
      </div>
      <div class="section">
        <h2>Answer Key</h2>
        <p>${data.answers}</p>
      </div>
    </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: pdfPath.replace('.pdf', '.jpg'), fullPage: true, quality: 90, type: 'jpeg' });
  await browser.close();
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  for (let i = 1; i <= TOTAL_EXAMS; i++) {
    const pdfPath = path.join(OUTPUT_DIR, `IELTS_Mock_${i}.pdf`);
    if (fs.existsSync(pdfPath)) continue;

    let result = null, retries = 3;
    while (!result && retries > 0) {
      result = await generateExamData(i);
      if (!result) { retries--; await delay(5000); }
    }

    if (result) {
      await createExamPDF(i, result);
      console.log(`Exam ${i} saved.`);
    } else {
      console.error(`Failed Exam ${i}`);
    }
    await delay(5000);
  }
}

main();
