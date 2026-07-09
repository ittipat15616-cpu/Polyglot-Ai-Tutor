import fitz
import os
import glob
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
downloads_dir = os.path.join(base_dir, 'public', 'downloads', 'grammar')
images_dir = os.path.join(base_dir, 'public', 'Courseware_Images', 'grammar_intermediate')
manifest_path = os.path.join(base_dir, 'src', 'data', 'image_manifest.json')

# Only process topics 17 to 34
topic_range = range(17, 35)

def extract_all_pages():
    pdf_files = glob.glob(os.path.join(downloads_dir, '**', '*.pdf'), recursive=True)
    
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    for pdf_path in pdf_files:
        parent_dir = os.path.basename(os.path.dirname(pdf_path))
        filename = os.path.basename(pdf_path)
        subtopic_id = os.path.splitext(filename)[0]
        
        # Check if topic is within intermediate range (starts with 17_ to 34_)
        try:
            topic_num = int(parent_dir.split('_')[0])
            if topic_num not in topic_range:
                continue
        except ValueError:
            continue
            
        out_dir = os.path.join(images_dir, parent_dir, subtopic_id)
        os.makedirs(out_dir, exist_ok=True)
        
        manifest_key = f"Courseware_Images/grammar_intermediate/{parent_dir}/{subtopic_id}"
        if manifest_key not in manifest:
            manifest[manifest_key] = []
            
        try:
            doc = fitz.open(pdf_path)
            pages_list = []
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                zoom = 2.0
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                
                out_filename = f"page{page_num + 1}.jpg"
                out_path = os.path.join(out_dir, out_filename)
                
                if not os.path.exists(out_path):
                    pix.save(out_path)
                    print(f"Generated: {out_path}")
                
                if out_filename not in manifest[manifest_key]:
                    manifest[manifest_key].append(out_filename)
                
                if out_filename not in pages_list:
                    pages_list.append(out_filename)
                    
            manifest[manifest_key] = pages_list
            doc.close()
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        
    print("Page extraction and manifest update for Intermediate complete!")

if __name__ == '__main__':
    extract_all_pages()
