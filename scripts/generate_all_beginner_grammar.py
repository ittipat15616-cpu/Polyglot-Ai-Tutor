import os
import json
import time
import re
import google.generativeai as genai

# Read API Key
api_key = None
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(base_dir, '.env'), 'r') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            api_key = line.strip().split('=', 1)[1]
            break

if not api_key:
    raise ValueError("API Key not found in .env")

genai.configure(api_key=api_key)

# Read grammar syllabus
with open(os.path.join(base_dir, 'src', 'data', 'grammar_topics.ts'), 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Extract JSON from TS
json_str = ts_content.replace('export const grammarTopics = ', '').strip().rstrip(';')
grammar_topics = json.loads(json_str)

beginner_topics = grammar_topics.get("grammar_beginner", [])

# Model configuration
model = genai.GenerativeModel('gemini-2.5-pro', generation_config={"response_mime_type": "application/json"})

def generate_subtopic_data(topic_name, subtopic_name, is_summary=False):
    num_questions = 50 if is_summary else 10
    
    prompt = f"""
    คุณคือผู้เชี่ยวชาญด้านการสอนภาษาอังกฤษสำหรับคนไทย หน้าที่ของคุณคือสร้างเนื้อหาการสอน Grammar ที่ 'ละเอียด ครบถ้วน และเข้าใจง่ายที่สุด' 
    สำหรับหัวข้อหลัก: {topic_name}
    หัวข้อย่อยปัจจุบัน: {subtopic_name}
    
    {'นี่คือหน้า Summary (สรุปรวบยอด) ให้สรุปเนื้อหาทั้งหมดของหัวข้อหลักนี้สั้นๆ แต่ครอบคลุม ยกตัวอย่างด้วยถ้าจำเป็น และบอกจุดที่คนไทยมักจะทำผิด (Common Mistakes) ท้ายสุดสร้างแบบฝึกหัดทบทวน ' + str(num_questions) + ' ข้อ' if is_summary else 'อธิบายเนื้อหาอย่างละเอียด ยกตัวอย่างให้ชัดเจน และบอกจุดที่คนไทยมักจะทำผิด (Common Mistakes)'}
    
    คำสั่งสำคัญมาก (CRITICAL INSTRUCTION):
    คุณต้องสร้างข้อสอบ (practice_questions) ให้ครบถ้วนจำนวน EXACTLY {num_questions} ข้อ ห้ามขาดแม้แต่ข้อเดียว ห้ามหยุดกลางคัน ห้ามทำแค่ 3 หรือ 4 ข้อเด็ดขาด ต้องทำให้ครบ {num_questions} ข้อเป๊ะๆ

    สร้างข้อมูลในรูปแบบ JSON 1 Object ตามโครงสร้างนี้ (ห้ามมี array คลุมข้างนอก):
    {{
      "id": "<รหัสหัวข้อย่อย เช่น 1_1_... ใช้ภาษาอังกฤษเท่านั้น และไม่มีช่องว่าง>",
      "title": "{subtopic_name}",
      "explanation": "<คำอธิบายภาษาไทยแบบละเอียด เข้าใจง่าย ใช้ \\n เพื่อขึ้นบรรทัดใหม่>",
      "examples": [
        {{"eng": "<ประโยคภาษาอังกฤษ>", "thai": "<คำแปลและคำอธิบาย>"}}
      ], // ถ้าเป็นหน้า Summary อาจจะยกตัวอย่างที่ครอบคลุมทั้งหมด หรือจะใส่ [] ก็ได้
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
        # Parse JSON to ensure it's valid
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error generating {subtopic_name}: {e}")
        return None

# Generate for topics 02 to 18 (skip 01 Nouns since we already did it)
data_dir = os.path.join(base_dir, 'public', 'data')
os.makedirs(data_dir, exist_ok=True)

# Generate PDFs script path
pdf_script = os.path.join(base_dir, 'scripts', 'generate_grammar_pdfs.cjs')

# Modify the PDF generation script dynamically to accept input and output args
# Actually, it's easier to just write a dynamic wrapper for the PDF generator in CJS.

for topic in beginner_topics[1:3]: # Process 02_Pronouns and 03_Articles
    topic_id = topic['id']
    topic_name = topic['name']
    
    print(f"=== Processing {topic_name} ===")
    topic_data = []
    
    json_path = os.path.join(data_dir, f"grammar_beginner_{topic_id}.json")
    
    # If already exists, skip
    if os.path.exists(json_path):
        print(f"Skipping {topic_id}, already exists.")
        continue

    topic_data = []
    print(f"Generating Topic: {topic['name']}", flush=True)
    for subtopic in topic['subtopics']:
        sub_id = subtopic['id']
        sub_name = subtopic['name']
        is_summary = 'Summary' in sub_name
        
        print(f"  -> Subtopic: {sub_name}...", flush=True)
        
        max_retries = 3
        for attempt in range(max_retries):
            data = generate_subtopic_data(topic_name, sub_name, is_summary)
            if data and len(data.get('practice_questions', [])) == (50 if is_summary else 10):
                data['id'] = sub_id
                topic_data.append(data)
                print(f"     Success!", flush=True)
                break
            else:
                print(f"     Attempt {attempt+1} failed to generate exact number of questions. Retrying...", flush=True)
        
        # Sleep to avoid rate limits
        time.sleep(3)
        
    # Save JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(topic_data, f, ensure_ascii=False, indent=2)
    print(f"Saved {json_path}")
    
    # Run PDF Generation for this topic
    # We will modify generate_grammar_pdfs.cjs to take arguments, or just create a temp script.
    temp_cjs = f"""
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data/grammar_beginner_{topic_id}.json');
const outputDir = path.join('C:\\\\Users\\\\USER\\\\Desktop\\\\Grammar_Beginner_{topic_id}');

if (!fs.existsSync(outputDir)) {{
  fs.mkdirSync(outputDir, {{ recursive: true }});
}}

const grammarData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function generatePDFs() {{
  const browser = await puppeteer.launch({{ headless: 'new' }});

  for (const topic of grammarData) {{
    try {{
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

      html += `<div class="explanation"><h2>${{isSummary ? 'สรุปรวบยอด (Summary)' : 'คำอธิบาย (Explanation)'}}</h2><p>${{topic.explanation.replace(/\\n/g, '<br>')}}</p></div>`;
      
      if (topic.examples && topic.examples.length > 0) {{
        html += `<h2>ตัวอย่าง (Examples)</h2><table class="example-table"><tr><th>English</th><th>Thai</th></tr>
          ${{topic.examples.map(ex => `<tr><td>${{ex.eng}}</td><td>${{ex.thai}}</td></tr>`).join('')}}</table>`;
      }}
      
      if (topic.common_mistakes && topic.common_mistakes.trim() !== '') {{
        html += `<div class="mistake"><h2>จุดที่คนไทยมักพลาด (Common Mistakes)</h2><p>${{topic.common_mistakes.replace(/\\n/g, '<br>')}}</p></div>`;
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
      await page.setContent(html, {{ waitUntil: 'domcontentloaded' }});
      await page.evaluate(() => {{
        const link = document.createElement('link'); link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap'; link.rel = 'stylesheet'; document.head.appendChild(link);
      }});
      await new Promise(resolve => setTimeout(resolve, 1000));
      const outputPath = path.join(outputDir, `${{topic.id}}_${{topic.title.replace(/[^a-zA-Z0-9]/g, '_')}}.pdf`);
      await page.pdf({{ path: outputPath, format: 'A4', printBackground: true, margin: {{ top: '20px', bottom: '20px' }} }});
      console.log(`Generated: ${{outputPath}}`);
      await page.close();
    }} catch (e) {{
      console.error(`Error generating PDF for ${{topic.title}}:`, e);
    }}
  }}

  await browser.close();
}}

generatePDFs().catch(console.error);
    """
    
    temp_cjs_path = os.path.join(base_dir, 'scripts', f'temp_gen_{topic_id}.cjs')
    with open(temp_cjs_path, 'w', encoding='utf-8') as f:
        f.write(temp_cjs)
        
    os.system(f"node {temp_cjs_path}")
    os.remove(temp_cjs_path)

print("All Beginner Topics PDF Generation Completed!")
