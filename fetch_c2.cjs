const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

async function main() {
    const res = await axios.get('http://sh.prepedu.com/blog-6sSH-dTo4');
    const $ = cheerio.load(res.data);
    
    const c2Vocab = [];
    
    $('td').each((i, td) => {
        const text = $(td).text().trim();
        if (!text) return;
        
        // lines in each td:
        // Conglomerate (n)
        // กลุ่มบริษัท
        // /kənˈɡlɒm.ər.ət/
        
        const lines = text.split('\n').map(x => x.trim()).filter(x => x);
        if (lines.length >= 2) {
            let line1 = lines[0]; // word + type
            let line2 = lines[1]; // th
            let phonetic = lines.length >= 3 ? lines[2] : '';
            
            let word = line1;
            let type = '';
            
            let match = line1.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
                word = match[1].trim();
                type = match[2].trim();
            }
            
            // basic check
            if (!word.includes('คำศัพท์') && word.length < 40) {
                c2Vocab.push({
                    word,
                    type,
                    th: line2,
                    phonetic,
                    example: '',
                    exampleTh: ''
                });
            }
        }
    });

    console.log(`Extracted ${c2Vocab.length} C2 words`);

    // Load existing vocab
    const content = fs.readFileSync('src/data/cefrVocab.ts', 'utf8');
    let cefrVocab;
    eval(content.replace('export const cefrVocab: Record<string, any[]> =', 'cefrVocab ='));
    
    cefrVocab['C2'] = c2Vocab;

    const fileContent = `// Automatically generated from Oxford 5000 and Lexitron Thai dictionary.
export const cefrVocab: Record<string, any[]> = ${JSON.stringify(cefrVocab, null, 2)};
`;
    fs.writeFileSync('src/data/cefrVocab.ts', fileContent);
    console.log("Updated cefrVocab.ts with C2 words");
}

main().catch(console.error);
