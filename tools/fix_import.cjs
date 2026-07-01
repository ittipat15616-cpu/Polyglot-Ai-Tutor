const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'VideoCallArea.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("@google/genai")) {
    content = content.replace("import React,", "import { GoogleGenAI, Modality, Type as GenAIType } from '@google/genai';\nimport React,");
}

// 2. Replace Type. with GenAIType.
content = content.replace(/Type\.OBJECT/g, 'GenAIType.OBJECT');
content = content.replace(/Type\.STRING/g, 'GenAIType.STRING');
content = content.replace(/Type\.ARRAY/g, 'GenAIType.ARRAY');
content = content.replace(/Type\.NUMBER/g, 'GenAIType.NUMBER');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fix complete.");
