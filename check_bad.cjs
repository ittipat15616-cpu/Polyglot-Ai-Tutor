const fs = require('fs');

const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
let cefrVocab;
eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));

let badCount = 0;
for (const level in cefrVocab) {
    for (const item of cefrVocab[level]) {
        let ex = item.example.trim();
        let exTh = item.exampleTh || "";
        
        let isBad = false;
        if (ex.startsWith("I know about the word ")) isBad = true;
        if (ex.startsWith("I can ") && ex.split(" ").length === 3) isBad = true; // "I can word."
        if (ex.startsWith("It is very ") && ex.split(" ").length === 4) isBad = true;
        if (ex.startsWith("He does it ") && ex.split(" ").length === 4) isBad = true;
        if (ex.startsWith("Here is an example for ")) isBad = true;
        
        // Check for English characters in Thai translation
        if (exTh && /[a-zA-Z]/.test(exTh)) isBad = true;
        
        if (isBad) {
            badCount++;
            item._needsFix = true;
        }
    }
}
console.log("Total needing fix:", badCount);
