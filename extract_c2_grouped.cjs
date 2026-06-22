const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

async function main() {
    const res = await axios.get('http://sh.prepedu.com/blog-6sSH-dTo4');
    const $ = cheerio.load(res.data);
    
    // categories
    const categoriesList = [
      'โลกธุรกิจ',
      'โลกแห่งการเมือง',
      'การจ้างงาน',
      'อาชญากรรมและการลงโทษ',
      'ลักษณะของผู้คน',
      'ความยากจนและปัญหาสังคม',
      'อาหาร การเดินทาง และวันหยุด',
      'ปัญหาที่คนหนุ่มสาวต้องเผชิญ',
      'วงการบันเทิงและสื่อมวลชน',
      'ปัญหาสิ่งแวดล้อมและธรรมชาติ'
    ];
    
    let db = {};
    for (const c of categoriesList) {
        db[`TH_${c}`] = [];
    }

    const elements = $('h3, table');
    let currentCategory = '';
    
    for (let i = 0; i < elements.length; i++) {
        const el = $(elements[i]);
        if (el.is('h3')) {
            let catText = el.text().trim();
            let match = catText.match(/^\d+\.\s*(.+)/);
            if (match && categoriesList.includes(match[1])) {
                currentCategory = match[1];
            } else {
                currentCategory = '';
            }
        } else if (el.is('table') && currentCategory !== '') {
            el.find('tr').each((j, tr) => {
                if (j === 0) return; // skip header
                
                $(tr).find('td').each((k, td) => {
                    const text = $(td).text().trim();
                    if (!text) return;
                    
                    const lines = text.split('\n').map(x => x.trim()).filter(x => x);
                    if (lines.length >= 2) {
                        let word = '';
                        let type = '';
                        let th = '';
                        let phonetic = '';
                        
                        let line1 = lines[0]; // word + type ?
                        // Try to split line1 by ":"
                        let colonSplit = line1.split(':');
                        if (colonSplit.length > 1) {
                            // "Gambit (n): กลเม็ด"
                            let wordPart = colonSplit[0].trim(); // "Gambit (n)"
                            th = colonSplit.slice(1).join(':').trim(); // "กลเม็ด"
                            if (lines.length >= 2) phonetic = lines[1];
                            
                            let match = wordPart.match(/^(.+?)\s*\((.+?)\)/);
                            if (match) {
                                word = match[1].trim();
                                type = match[2].trim();
                            } else {
                                word = wordPart;
                            }
                        } else {
                            // "Conglomerate (n)"
                            // "กลุ่มบริษัท"
                            let wordPart = line1.trim();
                            th = lines.length >= 2 ? lines[1] : '';
                            phonetic = lines.length >= 3 ? lines[2] : '';
                            
                            let match = wordPart.match(/^(.+?)\s*\((.+?)\)/);
                            if (match) {
                                word = match[1].trim();
                                type = match[2].trim();
                            } else {
                                word = wordPart;
                            }
                        }
                        
                        if (!word.includes('คำศัพท์') && word.length < 40) {
                            db[`TH_${currentCategory}`].push({
                                word: word,
                                type: type,
                                th: th,
                                phonetic: phonetic,
                                en: '',
                                cn: '',
                                example: '',
                                exampleTh: ''
                            });
                        }
                    }
                });
            });
        }
    }

    // Now write to a file so we can fill examples next
    fs.writeFileSync('c2_grouped.json', JSON.stringify(db, null, 2));
    console.log("Written to c2_grouped.json");
}

main().catch(console.error);
