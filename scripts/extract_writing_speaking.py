import os
import fitz
import json

targets = [
    {
        "in_dir": r"public\en_writing",
        "prefix": "EN_Writing_Lesson_",
        "manifest_path": "en_writing"
    },
    {
        "in_dir": r"public\en_speaking_conv",
        "prefix": "Lesson",
        "manifest_path": "en_speaking_conv"
    }
]

manifest_path = r"src\data\image_manifest.json"

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for target in targets:
    in_dir = target["in_dir"]
    if not os.path.exists(in_dir):
        continue
        
    for f in os.listdir(in_dir):
        if not f.endswith('.pdf'): continue
        
        # e.g., EN_Writing_Lesson_1.pdf -> EN_Writing_Lesson_1
        lesson_name = f.replace('.pdf', '')
        
        out_dir = os.path.join(r"public\Courseware_Images", target["manifest_path"], lesson_name)
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)
            
        pdf_path = os.path.join(in_dir, f)
        doc = fitz.open(pdf_path)
        
        pages_list = []
        for i in range(len(doc)):
            page = doc[i]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_name = f"page{i+1}.jpg"
            img_path = os.path.join(out_dir, img_name)
            pix.save(img_path)
            pages_list.append(img_name)
            
        manifest_key = f"Courseware_Images/{target['manifest_path']}/{lesson_name}"
        manifest[manifest_key] = pages_list
        print(f"Processed {f} -> {manifest_key} ({len(pages_list)} pages)")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print("Extraction completed!")
