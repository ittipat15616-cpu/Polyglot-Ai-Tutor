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
  
  for (let i = 5; i <= 6; i++) {
    const levelFolder = `hsk${i}`;
    const levelCode = `H${i}`;
    const dirPath = path.join(process.cwd(), 'public', 'hsk', levelFolder);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist, skipping...`);
      continue;
    }
    
    const pdfFiles = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.pdf'))
      .map(f => f.replace('.pdf', ''));
      
    if (pdfFiles.length === 0) continue;
    
    const filesParam = pdfFiles.join(',');
    const url = `http://localhost:3000/extract.html?levelFolder=${levelFolder}&levelCode=${levelCode}&files=${filesParam}`;
    
    console.log(`Navigating to extract page for ${levelCode}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
    
    console.log(`Waiting for extraction of ${levelCode} to finish...`);
    await page.waitForFunction(() => {
      const status = document.getElementById('status');
      return status && status.innerText.includes('Done!');
    }, { timeout: 0 });
    console.log(`Extraction of ${levelCode} complete!`);
  }
  
  await browser.close();
  console.log("All extractions complete!");
  process.exit(0);
})();
