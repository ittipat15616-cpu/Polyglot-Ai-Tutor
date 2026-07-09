import fitz
import os
import glob

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
downloads_dir = os.path.join(base_dir, 'public', 'downloads', 'grammar')
images_dir = os.path.join(base_dir, 'public', 'Courseware_Images', 'grammar')

def generate_thumbnails():
    # Find all PDFs in the grammar downloads directory
    pdf_files = glob.glob(os.path.join(downloads_dir, '**', '*.pdf'), recursive=True)
    
    for pdf_path in pdf_files:
        # e.g. downloads/grammar/04_Verb_to_Be/4_1.pdf
        # topic_id = 04_Verb_to_Be, filename = 4_1.pdf
        parent_dir = os.path.basename(os.path.dirname(pdf_path))
        filename = os.path.basename(pdf_path)
        subtopic_id = os.path.splitext(filename)[0]
        
        out_dir = os.path.join(images_dir, parent_dir)
        os.makedirs(out_dir, exist_ok=True)
        
        out_path = os.path.join(out_dir, f"{subtopic_id}.jpg")
        
        if os.path.exists(out_path):
            print(f"Skipping existing thumbnail: {out_path}")
            continue
            
        try:
            doc = fitz.open(pdf_path)
            if len(doc) > 0:
                page = doc.load_page(0) # First page
                # Render at 2x resolution for better quality
                zoom = 2.0
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                pix.save(out_path)
                print(f"Generated thumbnail: {out_path}")
            doc.close()
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")

if __name__ == '__main__':
    generate_thumbnails()
    print("Thumbnail generation complete!")
