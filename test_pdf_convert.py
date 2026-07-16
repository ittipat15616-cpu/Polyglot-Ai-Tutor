import fitz
import requests
import os

url = "https://firebasestorage.googleapis.com/v0/b/polyglot-ai-tuto.firebasestorage.app/o/IELTS_Mock_Tests%2FIELTS_Mock_Test_1%2FListening_Full.pdf?alt=media"
response = requests.get(url)
with open("test.pdf", "wb") as f:
    f.write(response.content)

doc = fitz.open("test.pdf")
os.makedirs("test_out", exist_ok=True)
for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap(dpi=150)
    pix.save(f"test_out/page{page_num + 1}.jpg")

print(f"Saved {len(doc)} pages.")
