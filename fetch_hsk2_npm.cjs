const hsk3 = require('@leonsilicon/hsk3.0');
const fs = require('fs');

if (hsk3.hsk30WordsLevel2) {
    fs.writeFileSync('temp_level2.json', JSON.stringify(hsk3.hsk30WordsLevel2, null, 2));
    console.log("length:", hsk3.hsk30WordsLevel2.length);
    console.log("first item:", hsk3.hsk30WordsLevel2[0]);
} else {
   console.log('No level 2 found');
}
