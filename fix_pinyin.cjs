const fs = require('fs');
const pinyinTone = require('pinyin-tone').default;
const { hsk2Data } = require('./temp_hsk2_cedict.json') ? require('./temp_hsk2_cedict.json') : { hsk2Data: [] };

try {
  let fileContent = fs.readFileSync('temp_hsk2_cedict.json', 'utf8');
  let data = JSON.parse(fileContent);

  data = data.map(item => {
    // Some words might have space separated, e.g., "ai4 qing2"
    // pinyin-tone should handle it.
    if (item.pinyin) {
      // pinyin-tone converts "ai4" -> "ài"
      let newPinyin = pinyinTone(item.pinyin);
      // It might keep spaces or remove them. Let's see.
      item.pinyin = newPinyin;
    }
    return item;
  });

  const tsContent = `// Generated automatically\nexport const hsk2Data = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync('src/data/hsk2Data.ts', tsContent);
  console.log('Fixed pinyin for ' + data.length + ' words');
} catch (e) {
  console.error(e);
}
