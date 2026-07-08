import os
import json
import time
import google.generativeai as genai

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
api_key = None
with open(os.path.join(base_dir, '.env'), 'r') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            api_key = line.strip().split('=', 1)[1]
            break

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-pro', generation_config={"response_mime_type": "application/json"})

with open(os.path.join(base_dir, 'src', 'data', 'grammar_topics.ts'), 'r', encoding='utf-8') as f:
    ts_content = f.read()
json_str = ts_content.replace('export const grammarTopics = ', '').strip().rstrip(';')
grammar_topics = json.loads(json_str)

nouns_topic = grammar_topics.get("grammar_beginner", [])[0] # Topic 01

def generate_subtopic_data(topic_name, subtopic_name, is_summary=False):
    num_questions = 50 if is_summary else 10
    prompt = f"""
    คุณคือผู้เชี่ยวชาญด้านการสอนภาษาอังกฤษสำหรับคนไทย หน้าที่ของคุณคือสร้างเนื้อหาการสอน Grammar ที่ 'ละเอียด ครบถ้วน และเข้าใจง่ายที่สุด' 
    สำหรับหัวข้อหลัก: {topic_name}
    หัวข้อย่อยปัจจุบัน: {subtopic_name}
    
    {'นี่คือหน้า Summary (สรุปรวบยอด) ให้สรุปเนื้อหาทั้งหมดของหัวข้อหลักนี้สั้นๆ แต่ครอบคลุม และสร้างแบบฝึกหัดทบทวน ' + str(num_questions) + ' ข้อ' if is_summary else 'อธิบายเนื้อหาอย่างละเอียด ยกตัวอย่างให้ชัดเจน และบอกจุดที่คนไทยมักจะทำผิด (Common Mistakes)'}
    
    คำสั่งสำคัญมาก (CRITICAL INSTRUCTION):
    คุณต้องสร้างข้อสอบ (practice_questions) ให้ครบถ้วนจำนวน EXACTLY {num_questions} ข้อ ห้ามขาดแม้แต่ข้อเดียว ห้ามหยุดกลางคัน ห้ามทำแค่ 3 หรือ 4 ข้อเด็ดขาด ต้องทำให้ครบ {num_questions} ข้อเป๊ะๆ
    
    สร้างข้อมูลในรูปแบบ JSON 1 Object ตามโครงสร้างนี้ (ห้ามมี array คลุมข้างนอก):
    {{
      "id": "<รหัสหัวข้อย่อย>",
      "title": "{subtopic_name}",
      "explanation": "<คำอธิบายภาษาไทยแบบละเอียด เข้าใจง่าย ใช้ \\n เพื่อขึ้นบรรทัดใหม่>",
      "examples": [
        {{"eng": "<ประโยคภาษาอังกฤษ>", "thai": "<คำแปลและคำอธิบาย>"}}
      ],
      "common_mistakes": "<จุดที่คนไทยมักพลาด อธิบายให้เคลียร์ ใช้ \\n ขึ้นบรรทัดใหม่>",
      "practice_questions": [ // ต้องมี EXACTLY {num_questions} objects ใน array นี้
        {{
          "question": "<คำถาม>",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "answer": "<A, B, C, หรือ D>",
          "explanation": "<เฉลยและอธิบายว่าทำไมถึงตอบข้อนี้>"
        }}
      ]
    }}
    """
    try:
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating {subtopic_name}: {e}")
        return None

topic_data = []
for subtopic in nouns_topic['subtopics']:
    sub_id = subtopic['id']
    sub_name = subtopic['name']
    is_summary = 'Summary' in sub_name
    print(f"Generating {sub_name}...", flush=True)
    
    # Retry loop
    max_retries = 3
    for attempt in range(max_retries):
        data = generate_subtopic_data(nouns_topic['name'], sub_name, is_summary)
        if data and len(data.get('practice_questions', [])) == (50 if is_summary else 10):
            data['id'] = sub_id
            topic_data.append(data)
            print(f"Success for {sub_name}", flush=True)
            break
        else:
            print(f"Attempt {attempt+1} failed to generate exact number of questions. Retrying...", flush=True)
    time.sleep(3)

json_path = os.path.join(base_dir, 'public', 'data', 'grammar_beginner_01_Nouns_Full.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(topic_data, f, ensure_ascii=False, indent=2)

temp_cjs = f"""
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data/grammar_beginner_01_Nouns_Full.json');
const outputDir = path.join('C:\\\\Users\\\\USER\\\\Desktop\\\\Grammar_Beginner_01_Nouns');

if (!fs.existsSync(outputDir)) {{
  fs.mkdirSync(outputDir, {{ recursive: true }});
}}

const grammarData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function generatePDFs() {{
  const browser = await puppeteer.launch({{ headless: 'new' }});
  for (const topic of grammarData) {{
    const page = await browser.newPage();
    const isSummary = topic.id.includes('Summary');
    
    let html = `<html><head><style>
        body {{ font-family: 'Sarabun', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }}
        h1 {{ color: #4f46e5; font-size: 32px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; }}
        h2 {{ color: #3730a3; font-size: 24px; margin-top: 30px; }}
        p {{ font-size: 16px; margin-bottom: 15px; }}
        .explanation {{ background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px; }}
        .mistake {{ background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 20px; }}
        .example-table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
        .example-table th, .example-table td {{ border: 1px solid #e5e7eb; padding: 12px; text-align: left; }}
        .example-table th {{ background-color: #f3f4f6; font-weight: bold; }}
        .page-break {{ page-break-before: always; }}
        .question-box {{ margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .question-text {{ font-weight: bold; margin-bottom: 15px; font-size: 16px; }}
        .option {{ margin-bottom: 10px; padding: 10px; border: 1px solid #f3f4f6; border-radius: 4px; }}
        .answer-box {{ background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 4px; padding: 15px; margin-top: 15px; }}
        .answer-label {{ font-weight: bold; color: #047857; margin-bottom: 5px; }}
        .test-title {{ text-align: center; color: #1d4ed8; font-size: 28px; margin-top: 50px; margin-bottom: 30px; }}
      </style></head><body><h1>${{topic.title}}</h1>`;

    if (!isSummary) {{
      html += `<div class="explanation"><h2>คำอธิบาย (Explanation)</h2><p>${{topic.explanation.replace(/\\n/g, '<br>')}}</p></div>
        <h2>ตัวอย่าง (Examples)</h2><table class="example-table"><tr><th>English</th><th>Thai</th></tr>
        ${{topic.examples.map(ex => `<tr><td>${{ex.eng}}</td><td>${{ex.thai}}</td></tr>`).join('')}}</table>
        <div class="mistake"><h2>จุดที่คนไทยมักพลาด (Common Mistakes)</h2><p>${{topic.common_mistakes.replace(/\\n/g, '<br>')}}</p></div>`;
    }} else {{
      html += `<div class="explanation"><h2>สรุปรวบยอด (Summary)</h2><p>${{topic.explanation.replace(/\\n/g, '<br>')}}</p></div>`;
    }}

    html += `<div class="page-break"></div><div class="test-title">แบบฝึกหัด (Practice Test)</div><p style="text-align:center; margin-bottom:30px;">ลองทำด้วยตัวเองก่อนดูเฉลยในหน้าถัดไปนะครับ</p>`;
    topic.practice_questions.forEach((q, idx) => {{
      html += `<div class="question-box"><div class="question-text">${{idx + 1}}. ${{q.question}}</div>${{q.options.map(opt => `<div class="option">${{opt}}</div>`).join('')}}</div>`;
    }});

    html += `<div class="page-break"></div><div class="test-title">เฉลยและคำอธิบาย (Answer Key)</div>`;
    topic.practice_questions.forEach((q, idx) => {{
      html += `<div class="question-box"><div class="question-text">${{idx + 1}}. ${{q.question}}</div>
        ${{q.options.map(opt => {{
          const isCorrect = opt.startsWith(q.answer + ".");
          return `<div class="option" style="${{isCorrect ? 'background-color:#d1fae5; border-color:#34d399; font-weight:bold;' : ''}}">${{opt}}</div>`;
        }}).join('')}}
        <div class="answer-box"><div class="answer-label">เฉลย: ข้อ ${{q.answer}}</div><div>${{q.explanation}}</div></div></div>`;
    }});

    html += `</body></html>`;
    await page.setContent(html, {{ waitUntil: 'networkidle0' }});
    await page.evaluate(() => {{
      const link = document.createElement('link'); link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap'; link.rel = 'stylesheet'; document.head.appendChild(link);
    }});
    await new Promise(resolve => setTimeout(resolve, 1000));
    const outputPath = path.join(outputDir, `${{topic.id}}_${{topic.title.replace(/[^a-zA-Z0-9]/g, '_')}}.pdf`);
    await page.pdf({{ path: outputPath, format: 'A4', printBackground: true, margin: {{ top: '20px', bottom: '20px' }} }});
    console.log(`Generated: ${{outputPath}}`);
    await page.close();
  }}
  await browser.close();
}}
generatePDFs().catch(console.error);
"""
temp_cjs_path = os.path.join(base_dir, 'scripts', 'temp_gen_01.cjs')
with open(temp_cjs_path, 'w', encoding='utf-8') as f:
    f.write(temp_cjs)
os.system(f"node {temp_cjs_path}")
os.remove(temp_cjs_path)
