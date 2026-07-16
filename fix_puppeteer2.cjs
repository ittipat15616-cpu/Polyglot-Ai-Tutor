const fs = require('fs');
['scratch_writing.cjs', 'scratch_speaking.cjs'].forEach(file => {
  let f = fs.readFileSync(file, 'utf8');
  f = f.replace("pdfPath.replace('.pdf', e.message);", "pdfPath.replace('.pdf', '.jpg'), e.message);");
  fs.writeFileSync(file, f);
});
