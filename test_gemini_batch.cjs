const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
  // Hacky parse
  let cefrVocab;
  eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));
  
  const allVocab = [];
  for (const lvl in cefrVocab) {
      allVocab.push(...cefrVocab[lvl]);
  }
  
  const batch = allVocab.slice(0, 150);
  
  console.log("Asking Gemini to translate 150 items...");
  
  const prompt = `Translate the following English words into Thai. 
Provide a concise, accurate dictionary-style Thai translation for the word (e.g. 1-2 words long), taking into consideration its part of speech and example context.
Also, translate the example sentence into natural Thai.

Input data:
${JSON.stringify(batch.map(i => ({word: i.word, type: i.type, example: i.example})), null, 2)}`;

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
                      th: { type: Type.STRING },
                      exampleTh: { type: Type.STRING }
                  },
                  required: ["word", "th", "exampleTh"]
              }
          }
        }
      });
      console.log(response.text.substring(0, 500) + '...');
      const parsed = JSON.parse(response.text);
      console.log('Result count: ', parsed.length);
  } catch (e) {
      console.error(e.message);
  }
}

main().catch(console.error);
