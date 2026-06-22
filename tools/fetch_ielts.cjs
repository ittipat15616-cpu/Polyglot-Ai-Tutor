const fs = require('fs');

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const words = JSON.parse(fs.readFileSync('temp_ielts.json', 'utf8'));

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    let results = [];
    const BATCH_SIZE = 50;
    const MAX_PROCESS = 50;
    let processedThisRun = 0;
    
    let currentResults = [];
    if (fs.existsSync('temp_ielts_full.json')) {
        currentResults = JSON.parse(fs.readFileSync('temp_ielts_full.json', 'utf8'));
    }
    
    for (let i = currentResults.length; i < words.length; i += BATCH_SIZE) {
        if (processedThisRun >= MAX_PROCESS) break;
        processedThisRun += BATCH_SIZE;
        const batch = words.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(words.length / BATCH_SIZE)}...`);
        
        try {
            const prompt = `You are an expert English-Thai dictionary creator. For the following list of English words (all relevant to IELTS), provide the part of speech, phonetic transcription (in IPA), Thai meaning (that correctly reflects the word/synonym context), an authentic English example sentence, and a natural Thai translation of that example sentence.
            
Format your response as a JSON array EXACTLY matching this structure:
[
  { "word": "apple", "type": "n.", "phonetic": "/ˈæpəl/", "th": "แอปเปิล", "example": "I ate a red apple.", "example_th": "ฉันกินแอปเปิลสีแดง" }
]

Here is the list to process:
${JSON.stringify(batch)}

Ensure the JSON is perfectly valid and ONLY the JSON array is returned, no markdown formatting.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: {
                    temperature: 0.2,
                }
            });
            
            let text = response.text;
            text = text.replace(/```json/g, '').replace(/```/g, '');
            
            const batchResults = JSON.parse(text);
            let currentResults = [];
            if (fs.existsSync('temp_ielts_full.json')) {
                currentResults = JSON.parse(fs.readFileSync('temp_ielts_full.json', 'utf8'));
            }
            results = currentResults.concat(batchResults);
            
            // Save incrementally
            fs.writeFileSync('temp_ielts_full.json', JSON.stringify(results, null, 2));
            
            if (i + BATCH_SIZE < words.length) {
                await delay(2000);
            }
        } catch (error) {
            console.error(`Error on batch ${i / BATCH_SIZE + 1}:`, error);
            // Wait longer on error
            await delay(5000);
            i -= BATCH_SIZE; // Retry
        }
    }
    
    console.log("Done!");
}

run();
