const fs = require('fs');
const https = require('https');

// try to fetch from a known repo
const urls = [
    'https://raw.githubusercontent.com/gigacore/hsk-new-3.0/main/data/level-2.csv',
    'https://raw.githubusercontent.com/infinyte7/HSK-3.0-words-list/main/HSK2.json'
];

https.get(urls[1], (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data.substring(0, 500)));
});
