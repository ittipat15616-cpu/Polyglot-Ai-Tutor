const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
    const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
    let cefrVocab;
    eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));

    const items = cefrVocab['A1'];
    let toFix = items.filter(i => 
        i.example.includes('/') || 
        (!i.example.trim().endsWith('.') && !i.example.trim().endsWith('?') && !i.example.trim().endsWith('!')) ||
        i.example.split(' ').length < 3 || 
        i.example.length > 80
    ).slice(0, 50); // Just fix the first 50 visible ones

    console.log(`Fixing ${toFix.length} priority items in A1...`);

    const prompt = `Rewrite the example sentence for each of the following words. Provide exactly 1 simple, short, standard example sentence for the word. Also translate it to Thai.
Input data:
${JSON.stringify(toFix.map(item => ({word: item.word, type: item.type})), null, 2)}`;

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
        for (const p of parsed) {
            const original = items.find(x => x.word === p.word);
            if (original) {
                original.example = p.new_example;
                original.exampleTh = p.new_example_th;
            }
        }
        
        const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.\nexport const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};\n`;
        fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
        console.log("cefrVocab updated with fixed examples for A1 priority!");
    } catch (e) {
        console.error("Batch error:", e.message);
    }
}

main().catch(console.error);
