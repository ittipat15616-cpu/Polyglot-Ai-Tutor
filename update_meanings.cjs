const fs = require('fs');
const thaidict = require('thaidict');

function getMeanings(word, actualType) {
  const r = thaidict.search(word);
  if (!r || r.length === 0) return word;
  
  // Sort or filter by actual type if provided
  const pt = (actualType || '').toLowerCase();
  
  let results = [];
  const typeMap = { 'N': 'น.', 'VT': 'ก.', 'VI': 'ก.', 'V': 'ก.', 'ADJ': 'ว.', 'ADV': 'วิ.', 'PRON': 'ส.', 'PREP': 'บุ.', 'CONJ': 'สัน.' };

  for (const item of r) {
    let m = item.result.replace(/\s*\(.*?\)\s*/g, '').trim();
    if (!m) continue;
    
    // Check if the type somewhat matches to prioritize
    const t = (item.type || '').toLowerCase();
    const isMatch = (pt.includes('noun')&&t.includes('n')) || 
                    (pt.includes('verb')&&t.includes('v')) || 
                    (pt.includes('article')&&t.includes('det')) ||
                    (pt.includes('adverb')&&t.includes('adv')) ||
                    (pt.includes('prep')&&t.includes('prep')) ||
                    (pt.includes('adj')&&t.includes('adj')) ||
                    (pt.includes('pron')&&t.includes('pron')) ||
                    (pt.includes('conj')&&t.includes('conj'));
                    
    const prefix = typeMap[item.type] ? typeMap[item.type] + ' ' : '';
    
    let relateArr = [];
    if (item.relate && item.relate.length > 0) {
      relateArr = item.relate.filter(x => x !== m).slice(0, 2);
    }
    
    let text = relateArr.length > 0 ? `${prefix}${m} (${relateArr.join(', ')})` : `${prefix}${m}`;
    
    results.push({text, isMatch});
  }

  // Prioritize matches, then non-matches
  let sorted = results.sort((a, b) => (b.isMatch ? 1 : 0) - (a.isMatch ? 1 : 0));
  
  // Keep unique texts
  let uniqueTexts = [];
  for (const s of sorted) {
      if (!uniqueTexts.includes(s.text)) uniqueTexts.push(s.text);
  }
  
  if (uniqueTexts.length === 0) return word;
  
  const finalList = uniqueTexts.slice(0, 3).join(', ');
  return finalList + ' (ความหมายอาจผันตามบริบทหรือรูปแบบคำ)';
}

async function main() {
    thaidict.init();
    
    const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
    let cefrVocab;
    eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));
    
    for (const level in cefrVocab) {
        for (const item of cefrVocab[level]) {
            const rawMeaning = item.th; 
            // Re-generate
            const refined = getMeanings(item.word, item.type);
            item.th = refined;
        }
    }
    
    const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.
export const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};
`;
    fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
    console.log("cefrVocab updated with deep meanings!");
}

main().catch(console.error);
