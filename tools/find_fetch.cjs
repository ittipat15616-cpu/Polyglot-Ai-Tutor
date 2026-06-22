const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('fetch =') || content.includes('.fetch =')) {
          console.log(`Found in: ${file}`);
        }
      }
    }
  });
  return results;
}

walk('./node_modules');
