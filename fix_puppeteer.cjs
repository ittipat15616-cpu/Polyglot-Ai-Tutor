const fs = require('fs');
['scratch_writing.cjs', 'scratch_speaking.cjs'].forEach(file => {
  let f = fs.readFileSync(file, 'utf8');
  f = f.replace(/waitUntil:\s*'networkidle0'/g, "waitUntil: 'domcontentloaded', timeout: 30000");
  
  // Replace setContent and screenshot with try/catch
  f = f.replace(/await page\.setContent\(html.*?await page\.screenshot\(\{ path: (.*?),.*?\}\);/gs, (match, pathVar) => {
    return `try {\n      ${match}\n    } catch (e) {\n      console.log('Error generating ', ${pathVar}, e.message);\n    }`;
  });

  fs.writeFileSync(file, f);
});
