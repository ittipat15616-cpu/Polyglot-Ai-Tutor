const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const PDF_DIR = path.join(__dirname, 'public', 'hsk', 'hsk1');
const OUTPUT_DIR = path.join(__dirname, 'HSK_Images', 'H1');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function extractPdfToImages(filePath, fileName) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  
  try {
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const code = fileName.replace('.pdf', '');
    
    console.log(`Processing ${code} (${numPages} pages)...`);
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for good resolution
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const outFileName = `${code}_page${i}.jpg`;
      const outFilePath = path.join(OUTPUT_DIR, outFileName);
      
      const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
      fs.writeFileSync(outFilePath, buffer);
      
      console.log(`  Saved ${outFileName}`);
    }
  } catch (err) {
    console.error(`Error processing ${fileName}:`, err);
  }
}

async function main() {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  
  for (const file of files) {
    await extractPdfToImages(path.join(PDF_DIR, file), file);
  }
  
  console.log("Done extracting H1 PDFs to images.");
}

main();
