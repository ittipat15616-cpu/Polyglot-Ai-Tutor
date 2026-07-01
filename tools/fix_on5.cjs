const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'VideoCallArea.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const onStart = content.indexOf('session.on("message"');
if (onStart !== -1) {
    const endStr = "// Setup Media";
    const onEnd = content.indexOf(endStr, onStart);
    if (onEnd !== -1) {
        const bodyStart = content.indexOf("{", onStart) + 1;
        
        // Find the last `});` before `endStr`
        const section = content.substring(bodyStart, onEnd);
        const lastCurly = section.lastIndexOf("});");
        const body = section.substring(0, lastCurly);
        
        const receiveLoop = `
        (async () => {
          try {
            for await (const message of session.receive()) {
              ${body}
            }
          } catch (e) {
            console.error("Receive loop error:", e);
          }
        })();
        `;
        
        content = content.substring(0, onStart) + receiveLoop + content.substring(onStart + bodyStart + lastCurly + 3);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fix final complete.");
    } else {
        console.log("Could not find endStr");
    }
} else {
    console.log("Could not find onStart");
}
