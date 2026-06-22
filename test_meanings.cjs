const fs = require('fs');
const thaidict = require('thaidict');

function getMeanings(word) {
  const r = thaidict.search(word);
  if (!r || r.length === 0) return word;
  
  const results = r.map(item => {
    let m = item.result.replace(/\s*\(.*?\)\s*/g, '').trim();
    const typeMap = { 'N': 'น.', 'VT': 'ก.', 'VI': 'ก.', 'V': 'ก.', 'ADJ': 'ว.', 'ADV': 'วิ.', 'PRON': 'ส.', 'PREP': 'บุ.', 'CONJ': 'สัน.' };
    const t = typeMap[item.type] ? typeMap[item.type] + ' ' : '';
    
    let relateArr = [];
    if (item.relate && item.relate.length > 0) {
      relateArr = item.relate.filter(x => x !== m).slice(0, 3);
    }
    
    if (relateArr.length > 0) {
      return `${t}${m} (${relateArr.join(', ')})`;
    } else {
      return `${t}${m}`;
    }
  });

  // Filter unique
  const uniqueResults = Array.from(new Set(results)).filter(x => x);
  
  if (uniqueResults.length === 0) return word;
  
  // Join max 3 meanings
  const joined = uniqueResults.slice(0, 3).join(', ');
  return joined + ' (อาจผันตามบริบทหรือรูปแบบคำ)';
}

async function main() {
    thaidict.init();
    console.log(getMeanings('abandon'));
    console.log(getMeanings('bank'));
    console.log(getMeanings('active'));
    console.log(getMeanings('dog'));
}

main();
