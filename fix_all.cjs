const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
    let cefrVocab;
    eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));

    let toFix = [];
    for (const level in cefrVocab) {
        for (const item of cefrVocab[level]) {
            let ex = item.example.trim();
            let exTh = item.exampleTh || "";
            let isBad = false;
            
            if (ex.startsWith("I know about the word ")) isBad = true;
            if (ex.startsWith("I can ") && ex.split(" ").length === 3) isBad = true; 
            if (ex.startsWith("It is very ") && ex.split(" ").length === 4) isBad = true;
            if (ex.startsWith("He does it ") && ex.split(" ").length === 4) isBad = true;
            if (ex.startsWith("Here is an example for ")) isBad = true;
            if (exTh && /[a-zA-Z]/.test(exTh)) isBad = true;
            if (ex === "1 plain, simple, and grammatically correct example sentence.") isBad = true;
            
            if (isBad) {
                toFix.push(item);
            }
        }
    }

    console.log(`Need to fix: ${toFix.length} items`);

    const batchSize = 65;
    for (let i = 0; i < toFix.length; i += batchSize) {
        const batch = toFix.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(toFix.length / batchSize)}`);

        const prompt = `Rewrite the example sentence for each of the following words. 
Rules:
1. Provide exactly 1 simple, short, grammatically correct example sentence using the word naturally.
2. The example sentence MUST sound natural and NOT mention the word as being a word (e.g. don't say "I know the word apple", say "I ate a red apple").
3. Translate the new example sentence into Thai.
4. The Thai translation MUST NOT contain ANY English characters. Translate everything entirely into Thai.
Data:
${JSON.stringify(batch.map(item => ({word: item.word, type: item.type})), null, 2)}`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                new_example: { type: Type.STRING },
                                new_example_th: { type: Type.STRING, description: "Must only contain Thai characters and punctuation, absolutely NO English letters." }
                            },
                            required: ["word", "new_example", "new_example_th"]
                        }
                    }
                }
            });

            const parsed = JSON.parse(response.text);
            for (const p of parsed) {
                const original = toFix.find(x => x.word === p.word);
                if (original) {
                    original.example = p.new_example;
                    original.exampleTh = p.new_example_th;
                }
            }
            
            // Save incrementally
             const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.\nexport const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};\n`;
             fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
            
        } catch (e) {
            console.error("Batch error:", e.message);
        }
        
        await sleep(5000); // Wait 5 seconds to avoid rate limits
    }

    console.log("Finished fixing examples!");
}

main().catch(console.error);
