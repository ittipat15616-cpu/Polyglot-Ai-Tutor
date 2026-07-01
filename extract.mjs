import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import canvas from 'canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_DIR = path.join(__dirname, 'public', 'hsk', 'hsk1');
const OUTPUT_DIR = path.join(__dirname, 'HSK_Images', 'H1');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const { Canvas, Image } = canvas;
global.Canvas = Canvas;
global.Image = Image;

class DOMMatrix {
  constructor(init) { this.a=1; this.b=0; this.c=0; this.d=1; this.e=0; this.f=0; }
}
global.DOMMatrix = DOMMatrix;

async function extractPdfToImages(filePath, fileName) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ 
    data: data,
    disableFontFace: true,
    standardFontDataUrl: path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts').replace(/\\/g, '/') + '/'
  });
  
  try {
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const code = fileName.replace('.pdf', '');
    
    console.log(`Processing ${code} (${numPages} pages)...`);
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvasInstance = canvas.createCanvas(viewport.width, viewport.height);
      const context = canvasInstance.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const outFileName = `${code}_page${i}.jpg`;
      const outFilePath = path.join(OUTPUT_DIR, outFileName);
      
      const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.9 });
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
