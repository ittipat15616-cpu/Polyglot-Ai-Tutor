import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

let apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function processFile(filepath, varName, isCefr) {
    console.log("Processing", filepath);
    let content = fs.readFileSync(filepath, 'utf8');
    const regex = new RegExp(`export const ${varName}(?:\\s*:\\s*[^=]+)?\\s*=\\s*([\\s\\S]*?);\\s*$`, 'm');
    const match = content.match(regex);
    
    // Some files might not end cleanly or have other stuff. Let's do a simpler match.
    // Assuming the object is the rest of the file after the equals sign.
    const startIdx = content.indexOf(`export const ${varName}`);
    const equalsIdx = content.indexOf('=', startIdx);
    let objStr = content.substring(equalsIdx + 1).trim();
    if (objStr.endsWith(';')) objStr = objStr.slice(0, -1);
    
    const codeToEval = `return ${objStr}`;
    let data;
    try {
        data = new Function(codeToEval)();
    } catch(e) {
        console.log("Failed to parse", filepath, e);
        return;
    }
    
    let allWords = [];
    if (isCefr) {
        for (const level in data) {
            for (const item of data[level]) allWords.push(item.word);
        }
    } else {
        if (Array.isArray(data)) {
            for (const item of data) allWords.push(item.word);
        } else {
            for (const lesson in data) {
                for (const item of data[lesson]) allWords.push(item.word);
            }
        }
    }
    
    console.log(`Found ${allWords.length} words in ${filepath}`);
    const translations = {};
    const batchSize = 100;
    
    for (let i = 0; i < allWords.length; i += batchSize) {
        const batch = allWords.slice(i, i + batchSize);
        console.log(`Translating ${i} to ${i + batch.length} of ${allWords.length}...`);
        
        const prompt = `You are an English to Thai dictionary specialized in providing the most common, natural, and widely used everyday meanings.
Translate the following list of English words into Thai.
Rules:
1. Provide ONLY 1 to 3 of the most common and natural everyday meanings (like Google Translate).
2. Do NOT include any part-of-speech abbreviations (e.g. น., ก., วิ.).
3. Do NOT include any trailing explanations like (ความหมายอาจผันตามบริบทหรือรูปแบบคำ).
4. Output strictly as a JSON object where the key is the English word and the value is the Thai translation string (comma separated if multiple).

Words:
${JSON.stringify(batch)}

Output JSON only, no markdown blocks.`;

        let retries = 3;
        while (retries > 0) {
            try {
                const result = await model.generateContent(prompt);
                let text = result.response.text().trim();
                text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                const parsed = JSON.parse(text);
                Object.assign(translations, parsed);
                break;
            } catch (e) {
                console.error("Error:", e.message);
                retries--;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        await new Promise(r => setTimeout(r, 1000)); // sleep 1 sec
    }
    
    // Update data
    let updatedCount = 0;
    if (isCefr) {
        for (const level in data) {
            for (const item of data[level]) {
                if (translations[item.word]) {
                    item.th = translations[item.word];
                    updatedCount++;
                }
            }
        }
    } else {
        if (Array.isArray(data)) {
            for (const item of data) {
                if (translations[item.word]) {
                    item.th = translations[item.word];
                    updatedCount++;
                }
            }
        } else {
            for (const lesson in data) {
                for (const item of data[lesson]) {
                    if (translations[item.word]) {
                        item.th = translations[item.word];
                        updatedCount++;
                    }
                }
            }
        }
    }
    
    console.log(`Updated ${updatedCount} words. Saving...`);
    const newJson = JSON.stringify(data, null, 2);
    let typeAnnotation = isCefr ? ": Record<string, any[]>" : "";
    if (filepath.includes('englishVocab')) typeAnnotation = ": any[]";
    // For ieltsData, no type annotation
    const newContent = `export const ${varName}${typeAnnotation} = ${newJson};\n`;
    fs.writeFileSync(filepath, newContent, 'utf8');
}

async function run() {
    await processFile('src/data/englishVocab.ts', 'englishVocab', false);
    await processFile('src/data/ieltsData.ts', 'ieltsData', false);
    await processFile('src/data/cefrC2Vocab.ts', 'cefrC2Vocab', true);
    await processFile('src/data/cefrVocab.ts', 'cefrVocab', true);
    console.log("All done!");
}
run();
