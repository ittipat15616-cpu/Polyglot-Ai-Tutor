const fs = require('fs');
const lines = fs.readFileSync("/skills/system_skills/gemini_api/SKILL.md", 'utf-8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('live.connect')) {
     console.log(lines.slice(i-10, i+20).join('\n'));
     break;
  }
}
