const fs = require('fs');
const lines = fs.readFileSync("../../skills/system_skills/gemini_api/SKILL.md", 'utf-8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('voiceName')) {
     console.log(lines.slice(i-2, i+2).join('\n'));
  }
});
