const hsk3 = require('@leonsilicon/hsk3.0');
console.log(typeof hsk3.hsk30Export);
if (Array.isArray(hsk3.hsk30Export)) {
    console.log(hsk3.hsk30Export[0]);
}
if (hsk3.default) {
    console.log(Object.keys(hsk3.default));
}
