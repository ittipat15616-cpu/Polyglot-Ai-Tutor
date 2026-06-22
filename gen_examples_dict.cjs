const fs = require('fs');
const axios = require('axios');

async function main() {
  const db = JSON.parse(fs.readFileSync('c2_grouped.json', 'utf8'));
  let modified = false;
  
  for (const cat of Object.keys(db)) {
      let items = db[cat];
      
      for (const item of items) {
          if (!item.example) {
              const word = item.word.toLowerCase();
              try {
                  const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
                  const data = res.data[0];
                  
                  // search for an example
                  let example = '';
                  for (const m of data.meanings) {
                      for (const def of m.definitions) {
                          if (def.example) {
                              example = def.example;
                              break;
                          }
                      }
                      if (example) break;
                  }
                  
                  if (example) {
                      // capitalize first letter
                      example = example.charAt(0).toUpperCase() + example.slice(1);
                      item.example = example;
                      item.exampleTh = `(คำแปล: ${item.th})`;
                      console.log(`+ Found: ${word}`);
                      modified = true;
                  } else {
                      console.log(`- No ex: ${word}`);
                  }
              } catch (e) {
                  console.log(`! Error: ${word}`);
              }
              await new Promise(r => setTimeout(r, 200)); // avoid rate limit
          }
      }
      fs.writeFileSync('c2_grouped.json', JSON.stringify(db, null, 2));
  }
}

main().catch(console.error);
