const fs = require('fs');

const f1 = 'node_modules/.vite/deps/chunk-C43FICMT.js';
const f2 = 'node_modules/.vite/deps/chunk-OPVSWTO7.js';

if (fs.existsSync(f1)) {
  const content = fs.readFileSync(f1, 'utf8');
  const lines = content.split('\n');
  lines.forEach(l => {
    if (l.includes('fetch =')) {
      console.log('f1:', l);
    }
  });
}
if (fs.existsSync(f2)) {
  const content = fs.readFileSync(f2, 'utf8');
  const lines = content.split('\n');
  lines.forEach(l => {
    if (l.includes('fetch =')) {
      console.log('f2:', l);
    }
  });
}
