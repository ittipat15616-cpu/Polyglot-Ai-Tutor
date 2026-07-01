import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('Browser:', msg.text()));
  page.on('requestfailed', request => {
    console.log(`BrowserRequestFailed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  const coursesDir = path.join(process.cwd(), 'public', 'courses');
  const levels = fs.readdirSync(coursesDir).filter(f => fs.statSync(path.join(coursesDir, f)).isDirectory());
  
  for (const levelFolder of levels) {
    const dirPath = path.join(coursesDir, levelFolder);
    
    const pdfFiles = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.pdf'))
      .map(f => f.replace('.pdf', ''));
      
    if (pdfFiles.length === 0) continue;
    
    // Process files in batches if there are too many to avoid URL length limits
    const batchSize = 10;
    for (let i = 0; i < pdfFiles.length; i += batchSize) {
      const batch = pdfFiles.slice(i, i + batchSize);
      const filesParam = batch.join(',');
      const url = `http://localhost:3000/extract.html?basePath=/courses/${levelFolder}&levelCode=${levelFolder}&files=${filesParam}&saveEndpoint=/api/save-course-image`;
      
      console.log(`Navigating to extract page for ${levelFolder} (batch ${i/batchSize + 1})...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
      
      console.log(`Waiting for extraction of ${levelFolder} batch ${i/batchSize + 1} to finish...`);
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.innerText.includes('Done!');
      }, { timeout: 0 });
      console.log(`Extraction of ${levelFolder} batch ${i/batchSize + 1} complete!`);
    }
  }
  
  await browser.close();
  console.log("All extractions complete!");
  process.exit(0);
})();
