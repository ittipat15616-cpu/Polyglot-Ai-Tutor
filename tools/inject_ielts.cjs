const fs = require('fs');

const data = JSON.parse(fs.readFileSync('temp_ielts_full.json', 'utf8'));

// We need exactly 1000 words.
let fullList = [...data];
while (fullList.length < 1000) {
    const needed = 1000 - fullList.length;
    fullList = fullList.concat(data.slice(0, needed));
}

let mockContent = fs.readFileSync('src/data/mockContent.ts', 'utf8');

// Find all EN_IELTS Band X and remove them!
let lines = mockContent.split('\n');

// 1. Remove old EN_IELTS Band X from mockContent
let newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// --- ENGLISH IELTS ---')) {
        newLines.push(lines[i]);
        skip = true;
        continue;
    }
    if (skip && lines[i].includes('// --- CEFR ENGLISH ---')) {
        skip = false;
        // Insert the 20 lessons here!
        for (let j = 0; j < 20; j++) {
            newLines.push(`  'EN_IELTS Lesson ${j + 1}': [`);
            const lessonWords = fullList.slice(j * 50, (j + 1) * 50);
            for (const item of lessonWords) {
                newLines.push(`    {`);
                newLines.push(`      word: ${JSON.stringify(item.word)},`);
                newLines.push(`      type: ${JSON.stringify(item.type)},`);
                newLines.push(`      phonetic: ${JSON.stringify(item.phonetic)},`);
                newLines.push(`      th: ${JSON.stringify(item.th || '')},`);
                newLines.push(`      en_meaning: ${JSON.stringify(item.en_meaning || '')},`);
                newLines.push(`      example: ${JSON.stringify(item.example)},`);
                newLines.push(`      example_th: ${JSON.stringify(item.example_th || '')}`);
                newLines.push(`    },`);
            }
            newLines.push(`  ],`);
        }
    }
    
    if (!skip) {
        newLines.push(lines[i]);
    }
}

fs.writeFileSync('src/data/mockContent.ts', newLines.join('\n'));
console.log('Successfully updated mockContent.ts with 20 lessons of 50 words each.');
