import json
import os
import glob

base_dir = r'C:\Users\USER\Desktop'
output_file = r'C:\Users\USER\antigravity\Polyglot-AI-Tutor-New\src\data\ielts_answer_keys.json'

data = {}

for folder in glob.glob(os.path.join(base_dir, 'IELTS_Mock_Test_*')):
    exam_id = os.path.basename(folder)
    data[exam_id] = {'listening': {}, 'reading': {}}
    
    # Listening
    list_file = os.path.join(folder, 'listening.json')
    if os.path.exists(list_file):
        with open(list_file, 'r', encoding='utf-8') as f:
            data[exam_id]['listening'] = json.load(f)
            
    # Reading
    read_file = os.path.join(folder, 'reading.json')
    if os.path.exists(read_file):
        with open(read_file, 'r', encoding='utf-8') as f:
            data[exam_id]['reading'] = json.load(f)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Saved all keys to {output_file}')
