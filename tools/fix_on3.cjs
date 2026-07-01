const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'VideoCallArea.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const onStart = content.indexOf('session.on("message"');
if (onStart !== -1) {
    const endStr = "});\n\n        // Setup Media for sending";
    const onEnd = content.indexOf(endStr, onStart);
    if (onEnd !== -1) {
        const bodyStart = content.indexOf("{", onStart) + 1;
        const body = content.substring(bodyStart, onEnd);
        
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
        
        content = content.substring(0, onStart) + receiveLoop + content.substring(onEnd + endStr.length - ("// Setup Media for sending".length));
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fix session.on 3 complete.");
    } else {
        console.log("Could not find endStr");
    }
} else {
    console.log("Could not find onStart");
}
