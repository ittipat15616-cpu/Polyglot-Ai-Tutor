const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  console.log("Fetching Oxford 5000 JSON...");
  const res = await fetch('https://raw.githubusercontent.com/tyypgzl/Oxford-5000-words/master/full-word.json');
  const data = await res.json();
  
  // Clean up and prepare input
  const itemsToProcess = [];
  for (const item of Object.values(data)) {
    if (!item.value || !item.value.word) continue;
    const level = item.value.level ? item.value.level.trim() : 'Unknown';
    if (!level.match(/^[ABC][12]$/)) continue;
    
    let example = '';
    if (item.value.examples && item.value.examples.length > 0) {
      example = item.value.examples[0].trim();
    }
    
    itemsToProcess.push({
      level,
      word: item.value.word.trim(),
      type: item.value.type || '',
      example: example,
      phonetic: item.value.phonetics?.us || item.value.phonetics?.uk || '',
    });
  }
  
  console.log(`Total words to process: ${itemsToProcess.length}`);
  // Testing with just 100 first to see how it looks
  const batch = itemsToProcess.slice(0, 5);
  
  const prompt = `Translate the following English words into Thai. 
Provide a concise, accurate dictionary-style Thai translation for the word, taking into consideration its part of speech and the example sentence context.
Also, translate the example sentence into natural Thai.

Input data:
${JSON.stringify(batch.map(i => ({word: i.word, type: i.type, example: i.example})), null, 2)}`;

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
                  th: { type: Type.STRING, description: "Accurate, concise dictionary-style Thai translation" },
                  exampleTh: { type: Type.STRING }
              },
              required: ["word", "th", "exampleTh"]
          }
      }
    }
  });
  
  console.log(response.text);
}

main().catch(console.error);
