const axios = require('axios');
const cheerio = require('cheerio');
axios.get('http://sh.prepedu.com/blog-6sSH-dTo4').then(r => {
    const $ = cheerio.load(r.data);
    $('td').each((i, td) => {
        if($(td).text().includes('Gambit')) console.log($(td).html());
    });
});
