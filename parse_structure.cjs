const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
    const res = await axios.get('http://sh.prepedu.com/blog-6sSH-dTo4');
    const $ = cheerio.load(res.data);
    
    // Attempt to structure by categories (likely h3)
    $('h3').each((i, el) => {
        console.log('H3: ', $(el).text().trim());
    });
    console.log('---');
    $('h4').each((i, el) => {
        console.log('H4: ', $(el).text().trim());
    });
}
main().catch(console.error);
