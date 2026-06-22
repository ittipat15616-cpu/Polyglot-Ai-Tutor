const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/gigacore/hsk-new-3.0/main/data/level-2.csv', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(data.substring(0, 500));
        fs.writeFileSync('level-2.csv', data);
    });
});
