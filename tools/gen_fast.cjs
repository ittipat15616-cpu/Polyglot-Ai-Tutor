const fs = require('fs');

const a1Words = ["about", "above", "across", "action", "activity", "actor", "add", "address", "adult", "advice", "afraid", "after", "afternoon", "again", "age", "ago", "agree", "air", "airport", "all", "also", "always", "amazing", "and", "angry", "animal", "another", "answer", "any", "anyone", "anything", "apartment", "apple", "area", "arm", "around", "arrive", "art", "article", "artist", "ask", "at", "aunt", "autumn", "away", "baby", "back", "bad", "bag", "ball"];
const a2Words = ["ability", "able", "accept", "accident", "according to", "account", "achieve", "act", "active", "actually", "add", "addition", "admit", "adult", "advantage", "adventure", "advertise", "advertisement", "advertising", "affect", "after", "against", "ah", "airline", "alive", "all", "all right", "allow", "almost", "alone", "along", "already", "alternative", "although", "among", "amount", "ancient", "ankle", "anyway", "anywhere", "apart", "appear", "appearance", "apply", "architect", "architecture", "argue", "argument", "army", "arrange"];
const b1Words = ["absolutely", "academic", "access", "accommodation", "account", "achievement", "act", "ad", "addition", "admire", "admit", "advanced", "advise", "afford", "age", "aged", "agent", "agreement", "ahead", "aim", "alarm", "album", "alcohol", "alcoholic", "alternative", "amazed", "ambition", "ambitious", "analyse", "analysis", "announce", "announcement", "annoy", "annoyed", "annoying", "apart", "apologize", "application", "appointment", "appreciate", "approximately", "arrest", "arrival", "assignment", "assist", "atmosphere", "attach", "attitude", "attract", "attraction"];
const b2Words = ["abandon", "absolute", "absorb", "abstract", "academic", "accent", "acceptable", "accidentally", "accommodate", "accompany", "accomplish", "account", "accountant", "accuracy", "accurate", "accurately", "acid", "acknowledge", "acquire", "action", "actual", "adapt", "additional", "address", "adequate", "adjust", "administration", "adopt", "advance", "affair", "afterwards", "agency", "agenda", "aggressive", "aid", "aircraft", "alien", "alongside", "alter", "altogether", "ambulance", "amount", "amuse", "analyst", "anger", "angle", "anniversary", "annual", "anticipate", "anxiety"];

// We will fetch definitions from dictionary api or just mock them
const data = {
  A1: a1Words.map((w,i) => ({ word: w, phonetic: '', th: 'คำแปล A1-' + i, example: 'Example for ' + w, exampleTh: 'ตัวอย่าง A1-' + i })),
  A2: a2Words.map((w,i) => ({ word: w, phonetic: '', th: 'คำแปล A2-' + i, example: 'Example for ' + w, exampleTh: 'ตัวอย่าง A2-' + i })),
  B1: b1Words.map((w,i) => ({ word: w, phonetic: '', th: 'คำแปล B1-' + i, example: 'Example for ' + w, exampleTh: 'ตัวอย่าง B1-' + i })),
  B2: b2Words.map((w,i) => ({ word: w, phonetic: '', th: 'คำแปล B2-' + i, example: 'Example for ' + w, exampleTh: 'ตัวอย่าง B2-' + i }))
};

const tsContent = 'export const cefrVocab: Record<string, any[]> = ' + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync('src/data/cefrVocab.ts', tsContent);
console.log('Saved');
