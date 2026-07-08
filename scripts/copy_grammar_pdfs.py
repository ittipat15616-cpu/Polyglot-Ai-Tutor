import os
import shutil

topics = [
    {"id": "01_Nouns", "dir": r"C:\Users\USER\Desktop\Grammar_Beginner_01_Nouns"},
    {"id": "02_Pronouns", "dir": r"C:\Users\USER\Desktop\Grammar_Beginner_02_Pronouns"},
    {"id": "03_Articles", "dir": r"C:\Users\USER\Desktop\Grammar_Beginner_03_Articles"}
]

output_base = r"public\downloads\grammar"

for topic in topics:
    out_dir = os.path.join(output_base, topic['id'])
    os.makedirs(out_dir, exist_ok=True)
    
    in_dir = topic['dir']
    if not os.path.exists(in_dir):
        continue
        
    for f in os.listdir(in_dir):
        if not f.endswith('.pdf'): continue
        
        parts = f.split('_')
        subtopic_id = f"{parts[0]}_{parts[1]}"
        
        src_path = os.path.join(in_dir, f)
        dest_path = os.path.join(out_dir, f"{subtopic_id}.pdf")
        
        shutil.copy2(src_path, dest_path)
        print(f"Copied {f} to {dest_path}")
