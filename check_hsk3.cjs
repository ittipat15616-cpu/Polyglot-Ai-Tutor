const hsk3 = require('@leonsilicon/hsk3.0');
console.log(Object.keys(hsk3));
console.log(hsk3.hsk30WordsLevel2 ? hsk3.hsk30WordsLevel2.slice(0,2) : "no");
if (hsk3.hsk300Words) {
    console.log("has 300 words");
}
// maybe there is a structured array
