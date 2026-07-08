import os
import fitz
import json

topics_to_process = [
    {"id": "02_Pronouns", "dir": r"C:\Users\USER\Desktop\Grammar_Beginner_02_Pronouns"},
    {"id": "03_Articles", "dir": r"C:\Users\USER\Desktop\Grammar_Beginner_03_Articles"}
]

manifest_path = r"src\data\image_manifest.json"

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for topic in topics_to_process:
    base_dir = topic["dir"]
    output_base = rf"public\Courseware_Images\grammar_beginner\{topic['id']}"
    
    if not os.path.exists(output_base):
        os.makedirs(output_base)

    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} does not exist yet. Skipping.")
        continue

    for pdf_file in os.listdir(base_dir):
        if not pdf_file.endswith('.pdf'):
            continue
        
        parts = pdf_file.split('_')
        subtopic_id = f"{parts[0]}_{parts[1]}"
        
        out_dir = os.path.join(output_base, subtopic_id)
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)
            
        pdf_path = os.path.join(base_dir, pdf_file)
        doc = fitz.open(pdf_path)
        
        pages_list = []
        for i in range(len(doc)):
            page = doc[i]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_name = f"page{i+1}.jpg"
            img_path = os.path.join(out_dir, img_name)
            pix.save(img_path)
            pages_list.append(img_name)
            
        manifest_key = f"Courseware_Images/grammar_beginner/{topic['id']}/{subtopic_id}"
        manifest[manifest_key] = pages_list
        print(f"Processed {pdf_file} -> {manifest_key} ({len(pages_list)} pages)")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

