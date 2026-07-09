import os
import json
import time
import sys
import google.generativeai as genai
import shutil
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

# Setup paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'public', 'data')
downloads_dir = os.path.join(base_dir, 'public', 'downloads', 'grammar')
os.makedirs(data_dir, exist_ok=True)
os.makedirs(downloads_dir, exist_ok=True)

# Read API Key
api_key = None
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

intermediate_topics = grammar_topics.get("grammar_intermediate", [])

model = genai.GenerativeModel('gemini-2.5-pro', generation_config={"response_mime_type": "application/json"})

def generate_subtopic_data(topic_name, subtopic_name, is_summary=False):
    num_questions = 50 if is_summary else 10
    
    prompt = f"""
    คุณคือผู้เชี่ยวชาญด้านการสอนภาษาอังกฤษสำหรับคนไทย หน้าที่ของคุณคือสร้างเนื้อหาการสอน Grammar ในระดับ Intermediate (B1-B2) ที่ 'ละเอียด ครบถ้วน ท้าทาย และเข้าใจง่ายที่สุด' 
    สำหรับหัวข้อหลัก: {topic_name}
    หัวข้อย่อยปัจจุบัน: {subtopic_name}
    
    {'นี่คือหน้า Summary (สรุปรวบยอด) ให้สรุปเนื้อหาทั้งหมดของหัวข้อหลักนี้สั้นๆ แต่ครอบคลุม เน้นระดับ B1-B2 ยกตัวอย่างด้วยถ้าจำเป็น และบอกจุดที่คนไทยมักจะทำผิดในระดับกลาง (Common Mistakes) ท้ายสุดสร้างแบบฝึกหัดทบทวนความเข้าใจในระดับกลาง ' + str(num_questions) + ' ข้อ' if is_summary else 'อธิบายเนื้อหาอย่างละเอียดให้เหมาะสมกับระดับ B1-B2 ยกตัวอย่างที่ท้าทายและซับซ้อนขึ้นให้ชัดเจน และบอกจุดที่คนไทยมักจะทำผิด (Common Mistakes)'}
    
    คำสั่งสำคัญมาก (CRITICAL INSTRUCTION):
    คุณต้องสร้างข้อสอบ (practice_questions) ให้ครบถ้วนจำนวน EXACTLY {num_questions} ข้อ ห้ามขาดแม้แต่ข้อเดียว ห้ามหยุดกลางคัน ห้ามทำแค่ 3 หรือ 4 ข้อเด็ดขาด ต้องทำให้ครบ {num_questions} ข้อเป๊ะๆ คำศัพท์ในข้อสอบควรจะเป็นระดับ B1-B2

    สร้างข้อมูลในรูปแบบ JSON 1 Object ตามโครงสร้างนี้ (ห้ามมี array คลุมข้างนอก):
    {{
      "id": "<รหัสหัวข้อย่อย ใช้ภาษาอังกฤษเท่านั้น และไม่มีช่องว่าง>",
      "title": "{subtopic_name}",
      "explanation": "<คำอธิบายภาษาไทยแบบละเอียด เข้าใจง่าย ใช้ \\n เพื่อขึ้นบรรทัดใหม่>",
      "examples": [
        {{"eng": "<ประโยคภาษาอังกฤษ B1-B2>", "thai": "<คำแปลและคำอธิบาย>"}}
      ], // ถ้าเป็นหน้า Summary อาจจะยกตัวอย่างที่ครอบคลุมทั้งหมด หรือจะใส่ [] ก็ได้
      "common_mistakes": "<จุดที่คนไทยมักพลาด อธิบายให้เคลียร์ ใช้ \\n ขึ้นบรรทัดใหม่>",
      "practice_questions": [ // ต้องมี EXACTLY {num_questions} objects ใน array นี้
        {{
          "question": "<คำถามระดับ B1-B2>",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "answer": "<A, B, C, หรือ D>",
          "explanation": "<เฉลยและอธิบายอย่างละเอียดว่าทำไมถึงตอบข้อนี้>"
        }}
      ]
    }}
    """
    
    try:
        response = model.generate_content(prompt, request_options={"timeout": 60})
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error generating {subtopic_name}: {e}")
        return None

# Loop through all intermediate topics
for topic in intermediate_topics: 
    topic_id = topic['id']
    topic_name = topic['name']
    
    print(f"=== Processing {topic_name} ===")
    
    json_path = os.path.join(data_dir, f"grammar_intermediate_{topic_id}.json")
    
    # Generate JSON
    if not os.path.exists(json_path):
        topic_data = []
        print(f"Generating JSON for Topic: {topic['name']}", flush=True)
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
            
            time.sleep(3) # Avoid rate limits
            
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(topic_data, f, ensure_ascii=False, indent=2)
        print(f"Saved {json_path}")
    else:
        print(f"JSON already exists at {json_path}. Skipping generation.")

    # PDF Generation
    pdf_out_dir = os.path.join(downloads_dir, topic_id)
    os.makedirs(pdf_out_dir, exist_ok=True)
    
    desktop_out_dir = rf"C:\Users\USER\Desktop\Grammar_Intermediate_{topic_id}"
    
    json_path_js = json_path.replace(os.sep, '/')
    pdf_out_dir_js = pdf_out_dir.replace(os.sep, '/')
    desktop_out_dir_js = desktop_out_dir.replace('\\', '\\\\')
    
    temp_cjs = f"""
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const dataPath = '{json_path_js}';
const outputDir = '{pdf_out_dir_js}';
const desktopDir = '{desktop_out_dir_js}';

if (!fs.existsSync(desktopDir)) {{
    fs.mkdirSync(desktopDir, {{ recursive: true }});
}}

const grammarData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function generatePDFs() {{
  const browser = await puppeteer.launch({{ headless: 'new' }});

  for (const topic of grammarData) {{
    try {{
      const outputPath = path.join(outputDir, `${{topic.id}}.pdf`);
      const desktopPath = path.join(desktopDir, `${{topic.id}}.pdf`);
      
      if (fs.existsSync(outputPath) && fs.existsSync(desktopPath)) {{
          console.log(`Skipping existing PDF: ${{outputPath}}`);
          continue;
      }}

      const page = await browser.newPage();
      const isSummary = topic.title.includes('Summary') || topic.id.includes('Summary');
      
      let html = `<html><head><style>
          body {{ font-family: 'Sarabun', sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }}
          h1 {{ color: #4f46e5; font-size: 32px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; }}
          h2 {{ color: #3730a3; font-size: 24px; margin-top: 30px; }}
          p {{ font-size: 16px; margin-bottom: 15px; }}
          .explanation {{ background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px; }}
          .example {{ background-color: #ecfdf5; padding: 15px; border-radius: 4px; margin-bottom: 15px; }}
          .example p {{ margin: 5px 0; }}
          .mistakes {{ background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 30px; }}
          .question {{ margin-bottom: 20px; page-break-inside: avoid; }}
          .options {{ margin-left: 20px; color: #4b5563; }}
          .answer-box {{ background-color: #eff6ff; padding: 15px; border-radius: 4px; margin-top: 10px; }}
          .watermark {{ position: fixed; bottom: 20px; right: 20px; font-size: 12px; color: #9ca3af; }}
          .page-break {{ page-break-before: always; }}
      </style></head><body>`;
      
      html += `<h1>${{topic.title}}</h1>`;
      
      if (topic.explanation) {{
          html += `<div class="explanation">${{topic.explanation.replace(/\\n/g, '<br>')}}</div>`;
      }}
      
      if (topic.examples && topic.examples.length > 0) {{
          html += `<h2>Examples (ตัวอย่างการใช้งาน)</h2>`;
          for (const ex of topic.examples) {{
              html += `<div class="example">
                  <p><strong>🇬🇧 ${{ex.eng}}</strong></p>
                  <p>🇹🇭 ${{ex.thai}}</p>
              </div>`;
          }}
      }}
      
      if (topic.common_mistakes) {{
          html += `<h2>⚠️ Common Mistakes (จุดที่มักทำผิดบ่อย)</h2>`;
          html += `<div class="mistakes">${{topic.common_mistakes.replace(/\\n/g, '<br>')}}</div>`;
      }}
      
      html += `<div class="page-break"></div>`;
      html += `<h2>📝 Practice Exercises (${{isSummary ? '50' : '10'}} Questions)</h2>`;
      
      let qNum = 1;
      for (const q of topic.practice_questions) {{
          html += `<div class="question">`;
          html += `<p><strong>${{qNum}}. ${{q.question}}</strong></p>`;
          html += `<div class="options">`;
          for (const opt of q.options) {{
              html += `<p>${{opt}}</p>`;
          }}
          html += `</div>`;
          
          html += `<div class="answer-box">
              <p><strong>✅ Answer:</strong> ${{q.answer}}</p>
              <p><strong>💡 Explanation:</strong> ${{q.explanation}}</p>
          </div>`;
          html += `</div>`;
          qNum++;
      }}
      
      html += `<div class="watermark">Polyglot AI Tutor - Intermediate Grammar (B1-B2)</div>`;
      html += `</body></html>`;
      
      await page.setContent(html, {{ waitUntil: 'networkidle0' }});
      await page.pdf({{ path: outputPath, format: 'A4', printBackground: true, margin: {{ top: '20px', bottom: '20px', left: '20px', right: '20px' }} }});
      console.log(`Saved PDF: ${{outputPath}}`);
      
      // Copy to desktop
      fs.copyFileSync(outputPath, desktopPath);
      console.log(`Copied to desktop: ${{desktopPath}}`);
      
      await page.close();
    }} catch (error) {{
      console.error(`Error processing PDF for ${{topic.id}}:`, error);
    }}
  }}

  await browser.close();
}}

generatePDFs();
"""
    temp_script_path = os.path.join(base_dir, 'scripts', f'temp_render_intermediate_{topic_id}.cjs')
    with open(temp_script_path, 'w', encoding='utf-8') as f:
        f.write(temp_cjs)
        
    print(f"Running PDF generation for {topic_id}...")
    subprocess.run(['node', temp_script_path], cwd=base_dir)
    
    # Cleanup temp script
    if os.path.exists(temp_script_path):
        os.remove(temp_script_path)

print("All intermediate grammar processing complete!")
