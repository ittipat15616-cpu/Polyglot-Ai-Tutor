const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    let rawData = JSON.parse(fs.readFileSync('temp_hsk2_cedict.json', 'utf8'));
    console.log(`Processing ${rawData.length} words...`);
    
    // We already have pinyin, word, en. We just need th, example, exampleTh.
    
    const batchSize = 100;
    const allResults = [];
    
    for (let i = 0; i < rawData.length; i += batchSize) {
        const batch = rawData.slice(i, i + batchSize);
        console.log(`Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(rawData.length/batchSize)}`);
        
        const batchWords = batch.map(b => b.word);
        
        let success = false;
        while (!success) {
            try {
                const prompt = `You are a Chinese teacher. For the following HSK2 Chinese words, provide a JSON array of objects. 
Each object MUST have:
- "word": the exact chinese word
- "th": Thai translation of the word
- "example": A simple Chinese example sentence using this word.
- "exampleTh": Thai translation of the example sentence.

Words list:
${JSON.stringify(batchWords)}

Output ONLY valid JSON array with the exact exact number of items matching the input list.`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.1
                    }
                });
                
                const arr = JSON.parse(response.text);
                
                if (arr.length === batch.length || arr.length > 0) {
                    for (let j = 0; j < batch.length; j++) {
                        // find matching or just use index
                        let a = arr.find(x => x.word === batch[j].word) || arr[j] || {};
                        allResults.push({
                            ...batch[j],
                            th: a.th || "รอคำแปล",
                            example: a.example || "",
                            exampleTh: a.exampleTh || ""
                        });
                    }
                    success = true;
                    console.log("Success! Waiting 15 seconds...");
                    await sleep(15000);
                } else {
                    console.log("Returned array size mismatch, retrying after 15s...");
                    await sleep(15000);
                }
            } catch (err) {
                console.error("Error in batch:", err.message);
                console.log("Retrying after 15s...");
                await sleep(15000);
            }
        }
    }
    
    const finalContent = `// Generated automatically\nexport const hsk2Data = ${JSON.stringify(allResults, null, 2)};\n`;
    fs.writeFileSync('src/data/hsk2Data.ts', finalContent);
    console.log("Done. Saved " + allResults.length + " words to src/data/hsk2Data.ts");
}

run();
