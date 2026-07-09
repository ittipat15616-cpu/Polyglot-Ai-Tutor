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
model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})

mock_exams_path = os.path.join(base_dir, 'src', 'data', 'mock_exams.json')

with open(mock_exams_path, 'r', encoding='utf-8') as f:
    exams_data = json.load(f)

def generate_exam(exam_type, skill, topic, level=""):
    prompt = f"""
    คุณคือผู้เชี่ยวชาญด้านการออกข้อสอบภาษาอังกฤษ สร้างข้อสอบแบบ {exam_type} {skill} {level} ในหัวข้อ '{topic}'
    ข้อสอบต้องมีเนื้อเรื่อง (content) ความยาวพอประมาณ และมีคำถาม 5 ข้อ (questions)
    
    ตอบกลับเป็น JSON Object (ไม่ต้องมี array คลุม) โครงสร้างดังนี้:
    {{
      "id": "{exam_type.lower()}_{skill.lower()}_{int(time.time())}",
      "title": "{exam_type} {level} {skill}: {topic}",
      "type": "{exam_type}",
      "skill": "{skill}",
      "content": "<เนื้อเรื่องภาษาอังกฤษที่ให้อ่าน>",
      "questions": [
        {{
          "id": "q1",
          "question": "<คำถาม>",
          "options": ["<ตัวเลือก 1>", "<ตัวเลือก 2>", "<ตัวเลือก 3>", "<ตัวเลือก 4>"],
          "answer": <index ที่ถูกต้อง 0-3>,
          "explanation": "<คำอธิบายเฉลยภาษาไทย>"
        }}
      ] // ต้องมี 5 ข้อ
    }}
    """
    try:
        response = model.generate_content(prompt)
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

tasks = [
    ("IELTS", "Reading", "Technology and Society", "Academic"),
    ("IELTS", "Reading", "Environmental Conservation", "Academic"),
    ("CEFR", "Reading", "Daily Routines", "A2"),
    ("CEFR", "Reading", "Travel and Tourism", "B1"),
    ("CEFR", "Reading", "Business Ethics", "C1"),
]

for task in tasks:
    print(f"Generating {task[0]} {task[1]} - {task[2]}...")
    data = generate_exam(task[0], task[1], task[2], task[3])
    if data:
        exams_data.append(data)
        print("Success.")
    time.sleep(3)

with open(mock_exams_path, 'w', encoding='utf-8') as f:
    json.dump(exams_data, f, ensure_ascii=False, indent=2)

print("Appended new exams to mock_exams.json")
