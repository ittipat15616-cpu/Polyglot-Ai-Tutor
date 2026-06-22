const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/infinyte7/HSK-3.0-words-list/main/HSK2.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const arr = JSON.parse(data);
            console.log("Count:", arr.length);
            console.log(arr[0]);
            fs.writeFileSync('temp_hsk2.json', JSON.stringify(arr, null, 2));
        } catch(e) { console.log(e) }
    });
});
