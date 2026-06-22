const fs = require('fs');
const thaidict = require('thaidict');
const translate = require('google-translate-api-x');

async function main() {
  console.log("Fetching Oxford 5000 JSON...");
  const res = await fetch('https://raw.githubusercontent.com/tyypgzl/Oxford-5000-words/master/full-word.json');
  const data = await res.json();
  
  console.log(`Fetched ${data.length} words. Loading thaidict...`);
  thaidict.init();
  
  const levels = {};

  // Group to levels, collect examples
  const examplesToTranslate = [];
  const mapWordToItem = {};

  for (const item of Object.values(data)) {
    if (!item.value || !item.value.word) continue;
    
    const level = item.value.level ? item.value.level.trim() : 'Unknown';
    if (!level.match(/^[ABC][12]$/)) {
        continue;
    }
    
    if (!levels[level]) levels[level] = [];
    
    const word = item.value.word.trim();
    const typeStr = (item.value.type || '').toLowerCase();
    
    // Choose the best Thai meaning
    const thaiSearch = thaidict.search(word);
    let thaiMeaning = "";
    if (thaiSearch && thaiSearch.length > 0) {
      let bestMatch = thaiSearch[0];
      // simple heuristics for pos
      for (const t of thaiSearch) {
          const lType = (t.type || '').toLowerCase();
          if (typeStr.includes('noun') && lType.includes('n')) { bestMatch = t; break; }
          if (typeStr.includes('verb') && (lType.includes('v') || lType.includes('vi') || lType.includes('vt'))) { bestMatch = t; break; }
          if (typeStr.includes('adjective') && lType.includes('adj')) { bestMatch = t; break; }
          if (typeStr.includes('adverb') && lType.includes('adv')) { bestMatch = t; break; }
          if (typeStr.includes('pronoun') && lType.includes('pron')) { bestMatch = t; break; }
          if (typeStr.includes('preposition') && lType.includes('prep')) { bestMatch = t; break; }
          if (typeStr.includes('conjunction') && lType.includes('conj')) { bestMatch = t; break; }
          if (typeStr.includes('article') && lType.includes('det')) { bestMatch = t; break; }
      }
      
      thaiMeaning = bestMatch.result;
      
      // Clean up parentheses from the meaning to make it look clean like "หนึ่ง" instead of "หนึ่ง (คำนำหน้าคำนาม...)"
      thaiMeaning = thaiMeaning.replace(/\s*\(.*?\)\s*/g, '').trim();
    } else {
        // Fallback multi-word? Use basic thaidict search
        const parts = word.split(' ');
        if (parts.length > 1) {
            const firstPartSearch = thaidict.search(parts[0]);
             if (firstPartSearch && firstPartSearch.length > 0) {
                 thaiMeaning = firstPartSearch[0].result.replace(/\s*\(.*?\)\s*/g, '').trim() + '...';
             }
        }
    }
    
    // Fallback if thaiMeaning is still very empty, just use the word itself or "N/A"
    if (!thaiMeaning) thaiMeaning = word;
    
    let example = "";
    if (item.value.examples && item.value.examples.length > 0) {
      example = item.value.examples[0].trim();
      // the JSON example sometimes starts with " abandon somebody " followed by actual example, need to clean it up lightly
      // Example: " abandon somebody The baby had been abandoned by its mother."
      // If there's an example that starts with the word, it's often a grammar note.
      // We'll leave it as is, or strip if there are 2+ words before a capital letter.
      const match = example.match(/^(?:.*?\s+)?[A-Z].*$/);
      if (match && !example.startsWith(word)) { // just heuristic
          // example is fine
      }
    }
    
    const vocabItem = {
      word: word,
      type: item.value.type || '',
      th: thaiMeaning,
      phonetic: item.value.phonetics?.us || item.value.phonetics?.uk || '',
      example: example,
      exampleTh: '' 
    };
    
    levels[level].push(vocabItem);
    
    if (example) {
        examplesToTranslate.push({ item: vocabItem, example: example });
    }
  }

  // Remove duplicate words in the same level just in case
  for (const level in levels) {
      const uniqueWords = {};
      levels[level].forEach(w => {
          if (!uniqueWords[w.word]) uniqueWords[w.word] = w;
      });
      levels[level] = Object.values(uniqueWords);
      console.log(`Level ${level}: ${levels[level].length} words`);
  }

  // Translate examples in chunks to avoid overwhelming the translate API
  // Translate API might block us if we send 5000 in one array, let's chunk by 50
  const CHUNK_SIZE = 50;
  console.log(`Translating ${examplesToTranslate.length} examples in chunks of ${CHUNK_SIZE}...`);
  
  // We'll extract only the unique example sentences to save requests
  const uniqueExamples = [...new Set(examplesToTranslate.map(x => x.example))];
  const translatedExamplesMap = {};
  
  for (let i = 0; i < uniqueExamples.length; i += CHUNK_SIZE) {
      const chunk = uniqueExamples.slice(i, i + CHUNK_SIZE);
      try {
          const res = await translate(chunk, { to: 'th' });
          if (Array.isArray(res)) {
              for (let j = 0; j < res.length; j++) {
                  translatedExamplesMap[chunk[j]] = res[j].text;
              }
          } else {
              // single result
              translatedExamplesMap[chunk[0]] = res.text;
          }
          console.log(`Translated chunk ${Math.floor(i/CHUNK_SIZE) + 1}/${Math.ceil(uniqueExamples.length/CHUNK_SIZE)}`);
      } catch (e) {
          console.error(`Error translating chunk ${i}:`, e.message);
          // if chunk fails, we just don't have the translation
      }
      // wait a bit between requests to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
  }
  
  // Apply translations
  for (const entry of examplesToTranslate) {
      if (translatedExamplesMap[entry.example]) {
          entry.item.exampleTh = translatedExamplesMap[entry.example];
      }
  }

  console.log("Writing to src/data/cefrVocab.ts");
  
  const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.
export const cefrVocab: Record<string, any[]> = ${JSON.stringify(levels, null, 2)};
`;
  
  fs.writeFileSync('./src/data/cefrVocab.ts', fileContent);
  console.log("Done!");
}

main().catch(err => console.error(err));
