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
        // We only fix items that have bad examples
        // Bad: contains '/' but doesn't look like an actual sentence (or just fix all that contain '/')
        // Wait, just giving ALL of them to Gemini to make sure they are "a plain, single appropriate example sentence" is safer.
        // Let's filter those that are NOT complete sentences.
        let toFix = items.filter(i => 
            i.example.includes('/') || 
            !i.example.trim().endsWith('.') && !i.example.trim().endsWith('?') && !i.example.trim().endsWith('!') ||
            i.example.split(' ').length < 3 || 
            i.example.length > 80 // too long
        );

        console.log(`Level ${lvl}: Found ${toFix.length} items to fix out of ${items.length}`);

        // process in batches of 300
        const batchSize = 300;
        for (let i = 0; i < toFix.length; i += batchSize) {
            const batch = toFix.slice(i, i + batchSize);
            console.log(`Processing batch ${i} to ${i + batch.length} for ${lvl}...`);

            const prompt = `Rewrite the example sentence for each of the following English words. 
Rules:
1. Provide ONLY 1 plain, simple, and grammatically correct example sentence.
2. The sentence MUST clearly use the word in its correct part of speech.
3. Translate the new example sentence into natural Thai.
4. It must NOT contain slashes (/) or multiple alternatives.

Input data:
${JSON.stringify(batch.map(item => ({word: item.word, type: item.type, old_example: item.example})), null, 2)}`;

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
                                new_example_th: { type: Type.STRING }
                            },
                            required: ["word", "new_example", "new_example_th"]
                        }
                    }
                  }
                });

                const parsed = JSON.parse(response.text);
                
                // apply fixes
                for (const p of parsed) {
                    const original = items.find(x => x.word === p.word);
                    if (original) {
                        original.example = p.new_example;
                        original.exampleTh = p.new_example_th;
                        totalFixed++;
                    }
                }
            } catch (e) {
                console.error("Batch error ignored:", e.message);
            }
        }
    }

    const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.\nexport const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};\n`;
    fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
    console.log("cefrVocab updated with fixed examples! Total fixed:", totalFixed);
}

main().catch(console.error);
