import fitz
import requests
import os
import json

skills = ["Listening", "Reading", "Writing", "Speaking"]
base_url = "https://firebasestorage.googleapis.com/v0/b/polyglot-ai-tuto.firebasestorage.app/o/IELTS_Mock_Tests%2FIELTS_Mock_Test_{exam}%2F{skill}_Full.pdf?alt=media"

manifest_path = "src/data/image_manifest.json"
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for exam in range(1, 11):
    for skill in skills:
        url = base_url.format(exam=exam, skill=skill)
        print(f"Downloading {exam} {skill}...")
        resp = requests.get(url)
        if resp.status_code != 200:
            print(f"Skipping {exam} {skill}: {resp.status_code}")
            continue
            
        pdf_path = "temp.pdf"
        with open(pdf_path, "wb") as f:
            f.write(resp.content)
            
        doc = fitz.open(pdf_path)
        
        # Save to public directory
        out_dir = f"public/Courseware_Images/IELTS_Mock_Tests/IELTS_Mock_Test_{exam}/{skill}_Full"
        os.makedirs(out_dir, exist_ok=True)
        
        manifest_key = f"Courseware_Images/IELTS_Mock_Tests/IELTS_Mock_Test_{exam}/{skill}_Full"
        manifest[manifest_key] = []
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_name = f"page{page_num + 1}.jpg"
            img_path = os.path.join(out_dir, img_name)
            pix.save(img_path)
            manifest[manifest_key].append(img_name)
            
        print(f"Saved {len(doc)} pages for {exam} {skill}")
        doc.close()

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, sort_keys=True)
    
if os.path.exists("temp.pdf"):
    os.remove("temp.pdf")
print("Done!")
