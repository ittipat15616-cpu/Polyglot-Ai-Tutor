const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
    const res = await axios.get('http://sh.prepedu.com/blog-6sSH-dTo4');
    const $ = cheerio.load(res.data);
    
    const elements = $('h3, table');
    let currentCategory = '';
    
    for (let i = 0; i < elements.length; i++) {
        const el = $(elements[i]);
        if (el.is('h3')) {
            currentCategory = el.text().trim();
            console.log('\n--- ' + currentCategory + ' ---');
        } else if (el.is('table') && currentCategory.match(/^\d+\./)) {
            // Check first row
            const firstRowText = el.find('tr').first().text().trim();
            console.log('Table found under ' + currentCategory + ', first row preview: ' + firstRowText.substring(0, 80).replace(/\n/g, ' '));
            
            // Check if there are 3 columns
            el.find('tr').each((j, tr) => {
                const tds = $(tr).find('td');
                if (j === 1) { // 2nd row preview
                    console.log(`Col count: ${tds.length}`);
                    tds.each((k, td) => {
                         console.log(`  Col ${k}: ${$(td).text().trim().substring(0, 50).replace(/\n/g, ' ')}`);
                    });
                }
            });
        }
    }
}
main().catch(console.error);
