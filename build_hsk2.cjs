const hsk3 = require('@leonsilicon/hsk3.0');
const cedict = require('cedict-json');
const fs = require('fs');

const words = hsk3.hsk30WordsLevel2;
if (!words) {
    console.log("No level 2 words");
    process.exit(1);
}

const finalData = [];
words.forEach(word => {
    // Find in cedict
    const entry = cedict.find(e => e.simplified === word || e.traditional === word);
    
    let pinyin = '';
    let en = '';
    
    if (entry) {
        pinyin = entry.pinyin || '';
        en = entry.english && entry.english.length > 0 ? entry.english.join(', ') : '';
    } else {
        en = '';
    }
    
    finalData.push({
        word,
        pinyin,
        th: "รอคำแปลภาษาไทย", // Placeholder for Thai
        en,
        example: ""
    });
});

console.log("Found:", finalData.length);
fs.writeFileSync('temp_hsk2_cedict.json', JSON.stringify(finalData, null, 2));

const tsContent = `// Generated automatically
export const hsk2Data = ${JSON.stringify(finalData, null, 2)};
`;
fs.writeFileSync('./src/data/hsk2Data.ts', tsContent);
console.log("Saved to src/data/hsk2Data.ts");
