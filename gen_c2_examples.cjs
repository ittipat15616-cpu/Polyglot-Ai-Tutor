const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
  let cefrVocab;
  eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));
  
  let toTranslate = cefrVocab['C2'].filter(x => !x.example);
  console.log(`Generating examples for ${toTranslate.length} C2 words...`);
  
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
      const batch = toTranslate.slice(i, i + BATCH_SIZE);
      
      const prompt = `For each of the following words, generate a short, natural English example sentence (max 10 words) showing its meaning. Also provide a natural Thai translation of that sentence. Return JSON array.
Input data:
${batch.map(w => w.word).join(', ')}`;

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
                          example: { type: Type.STRING },
                          exampleTh: { type: Type.STRING }
                      },
                      required: ["word", "example", "exampleTh"]
                  }
              }
            }
          });
          const result = JSON.parse(response.text);
          for (const item of result) {
              const b = cefrVocab['C2'].find(x => x.word === item.word);
              if (b) {
                  b.example = item.example;
                  b.exampleTh = item.exampleTh;
              }
          }
          console.log(`Chunk ${Math.floor(i/BATCH_SIZE) + 1} done.`);
          save(cefrVocab);
      } catch (e) {
          console.error(e.message);
      }
      
      // wait
      await new Promise(r => setTimeout(r, 1000));
  }
}

function save(cefrVocab) {
  const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.
export const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};
`;
  fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
}

main().catch(console.error);
