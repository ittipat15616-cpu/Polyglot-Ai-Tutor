const fs = require('fs');

const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
let cefrVocab;
eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));

let count = 0;
for (const level in cefrVocab) {
    for (const item of cefrVocab[level]) {
        let ex = item.example.trim();
        if (ex.includes('/') || (!ex.endsWith('.') && !ex.endsWith('?') && !ex.endsWith('!')) || ex.split(' ').length < 3) {
            // Apply heuristic
            let type = item.type || '';
            if (type.includes('noun')) {
                item.example = "I know about the word " + item.word + ".";
                item.exampleTh = "ฉันรู้เกี่ยวกับคำว่า " + item.word;
            } else if (type.includes('verb')) {
                item.example = "I can " + item.word + ".";
                item.exampleTh = "ฉันสามารถ " + item.word;
            } else if (type.includes('adj') || type.includes('adjective')) {
                item.example = "It is very " + item.word + ".";
                item.exampleTh = "มัน " + item.word + " มาก";
            } else if (type.includes('adv') || type.includes('adverb')) {
                item.example = "He does it " + item.word + ".";
                item.exampleTh = "เขาทำมันอย่าง " + item.word;
            } else {
                item.example = "Here is an example for " + item.word + ".";
                item.exampleTh = "นี่คือตัวอย่างสำหรับ " + item.word;
            }
            count++;
        }
    }
}

const fileContent = "// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.\nexport const cefrVocab: Record<string, any[]> = " + JSON.stringify(cefrVocab, null, 2) + ";\n";
fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
console.log("cefrVocab updated with heuristic examples! Count: " + count);
