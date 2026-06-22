const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
    console.log("Reading cefrVocab.ts...");
    const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
    let cefrVocab;
    eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));

    const levels = Object.keys(cefrVocab);
    let totalFixed = 0;

    for (const lvl of levels) {
        let items = cefrVocab[lvl];
        let toFix = items.filter(i => 
            i.example.includes('/') || 
            (!i.example.trim().endsWith('.') && !i.example.trim().endsWith('?') && !i.example.trim().endsWith('!')) ||
            i.example.split(' ').length < 3 || 
            i.example.length > 80
        );
        // limit to 600 per run to not hit rate limits broadly, but do it in parallel
        toFix = toFix.slice(0, 600);

        console.log(`Level ${lvl}: Fixing ${toFix.length} items out of ${items.length}`);

        const batchSize = 100;
        const promises = [];

        for (let i = 0; i < toFix.length; i += batchSize) {
            const batch = toFix.slice(i, i + batchSize);
            const prompt = `Rewrite the example sentence for each of the following words. Provide exactly 1 simple, short, grammatically correct example sentence for the word. Also translate it to Thai.
Input data:
${JSON.stringify(batch.map(item => ({word: item.word, type: item.type})), null, 2)}`;

            promises.push(
                ai.models.generateContent({
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
                                new_example_th: { type: Type.STRING }
                            },
                            required: ["word", "new_example", "new_example_th"]
                        }
                    }
                  }
                }).then(resp => {
                   const parsed = JSON.parse(resp.text);
                   for (const p of parsed) {
                       const original = items.find(x => x.word === p.word);
                       if (original) {
                           original.example = p.new_example;
                           original.exampleTh = p.new_example_th;
                           totalFixed++;
                       }
                   }
                }).catch(e => console.error("Batch error:", e.message))
            );
        }
        
        await Promise.all(promises);
        
        const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.\nexport const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};\n`;
        fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
        console.log(`Saved level ${lvl}`);
    }
    console.log("Total fixed:", totalFixed);
}

main().catch(console.error);
