const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("Loading HSK 7-9 data...");
    const content = fs.readFileSync('src/data/hsk7to9Data.ts', 'utf8');
    let hsk7to9Data;
    eval(content.replace('export const hsk7to9Data =', 'hsk7to9Data ='));
    
    // Find missing items
    let toFix = [];
    for (const item of hsk7to9Data) {
        const isMissingTh = !item.th || item.th.trim() === "" || item.th.trim() === "รอคำแปล";
        const isMissingExample = !item.example || item.example.trim() === "";
        const isMissingExampleTh = !item.exampleTh || item.exampleTh.trim() === "";
        
        if (isMissingTh || isMissingExample || isMissingExampleTh) {
            toFix.push(item);
        }
    }
    
    console.log(`Found ${toFix.length} words missing data out of ${hsk7to9Data.length}`);
    
    if (toFix.length === 0) {
        console.log("All done!");
        return;
    }
    
    const batchSize = 100;
    
    for (let i = 0; i < toFix.length; i += batchSize) {
        const batch = toFix.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(toFix.length/batchSize)}`);
        
        const batchWords = batch.map(b => b.word);
        
        let success = false;
        let retries = 0;
        
        const modelsToTry = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-pro', 'gemini-2.5-flash'];
        let currentModelIndex = 0;

        while (!success && retries < 15) {
            try {
                const currentModel = modelsToTry[currentModelIndex % modelsToTry.length];
                console.log(`Trying with model: ${currentModel}`);
                
                const prompt = `You are a professional Chinese-Thai dictionary creator and teacher. 
For the following advanced HSK 7-9 Chinese words, provide a JSON array of objects.
Each object MUST have:
- "word": the exact chinese word from the list
- "th": Accurate Thai translation of the word (short, concise).
- "example": A natural, advanced Chinese example sentence using this word.
- "exampleTh": Accurate Thai translation of the example sentence.

Words list:
${JSON.stringify(batchWords)}

Output ONLY valid JSON array. The length of the array MUST be exactly ${batch.length}.`;
                
                const response = await ai.models.generateContent({
                    model: currentModel,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    th: { type: Type.STRING },
                                    example: { type: Type.STRING },
                                    exampleTh: { type: Type.STRING }
                                },
                                required: ["word", "th", "example", "exampleTh"]
                            }
                        },
                        temperature: 0.1
                    }
                });
                
                const arr = JSON.parse(response.text);
                
                if (arr.length > 0) {
                    // Merge results back into main array
                    for (const result of arr) {
                        const original = hsk7to9Data.find(x => x.word === result.word);
                        if (original) {
                            if (!original.th || original.th === "รอคำแปล" || original.th === "") original.th = result.th;
                            if (!original.example || original.example === "") original.example = result.example;
                            if (!original.exampleTh || original.exampleTh === "") original.exampleTh = result.exampleTh;
                        }
                    }
                    
                    // Save to file immediately after a successful batch
                    const finalContent = `// Generated automatically\nexport const hsk7to9Data = ${JSON.stringify(hsk7to9Data, null, 2)};\n`;
                    fs.writeFileSync('src/data/hsk7to9Data.ts', finalContent);
                    
                    success = true;
                    console.log(`Success! Updated ${arr.length} words. Waiting 15 seconds before next batch...`);
                    await sleep(15000); 
                } else {
                    retries++;
                    console.log(`Returned empty array, retry ${retries}/15 after 30s...`);
                    await sleep(30000);
                }
            } catch (err) {
                retries++;
                console.error(`Error in batch (retry ${retries}/15):`, err.message);
                // Cycle model
                currentModelIndex++;
                console.log("Waiting 30 seconds to clear rate limits before trying next model...");
                await sleep(30000);
            }
        }
        
        if (!success) {
            console.error("Failed batch after 15 retries. Stopping script.");
            process.exit(1);
        }
    }
    
    console.log("\nAll missing words successfully populated!");
}

run().catch(console.error);
