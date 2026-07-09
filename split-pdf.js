import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function splitPDF() {
  const sourcePath = "C:\\Users\\USER\\Downloads\\teachers_guide_for_creating_lessons_with_moocs-508.pdf";
  const listeningPath = "C:\\Users\\USER\\Downloads\\Guide_for_Listening.pdf";
  const readingPath = "C:\\Users\\USER\\Downloads\\Guide_for_Reading.pdf";

  const existingPdfBytes = fs.readFileSync(sourcePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Listening Document
  const listeningDoc = await PDFDocument.create();
  // We want pages 1-3 (intro) and 4-24 (listening) => indices 0 to 23
  const listeningPages = await listeningDoc.copyPages(pdfDoc, Array.from({length: 24}, (_, i) => i));
  listeningPages.forEach((page) => listeningDoc.addPage(page));
  const listeningBytes = await listeningDoc.save();
  fs.writeFileSync(listeningPath, listeningBytes);
  console.log('Created:', listeningPath);

  // Reading Document
  const readingDoc = await PDFDocument.create();
  // We want pages 1-3 (intro) and 25-41 (reading) => indices 0,1,2 and 24 to 40
  const readingIndices = [0, 1, 2, ...Array.from({length: 17}, (_, i) => i + 24)];
  const readingPages = await readingDoc.copyPages(pdfDoc, readingIndices);
  readingPages.forEach((page) => readingDoc.addPage(page));
  const readingBytes = await readingDoc.save();
  fs.writeFileSync(readingPath, readingBytes);
  console.log('Created:', readingPath);
}

splitPDF().catch(err => console.error(err));
