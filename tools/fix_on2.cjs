const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'VideoCallArea.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const onStart1 = content.indexOf('session.on("message"');
const onStart2 = content.indexOf("session.on('message'");
const onStart = onStart1 !== -1 ? onStart1 : onStart2;

if (onStart !== -1) {
    const mediaSetup = content.indexOf("// Setup Media for sending", onStart);
    if (mediaSetup !== -1) {
        const onSignature1 = 'session.on("message", (message: any) => {';
        const onSignature2 = "session.on('message', async (message: any) => {";
        const onSignature3 = 'session.on("message", async (message: any) => {';
        
        let bodyStart = -1;
        if (content.substring(onStart).startsWith(onSignature1)) bodyStart = onStart + onSignature1.length;
        else if (content.substring(onStart).startsWith(onSignature2)) bodyStart = onStart + onSignature2.length;
        else if (content.substring(onStart).startsWith(onSignature3)) bodyStart = onStart + onSignature3.length;
        // else fallback:
        if (bodyStart === -1) {
            const temp = content.substring(onStart);
            bodyStart = onStart + temp.indexOf("{") + 1;
        }
        
        const beforeMedia = content.substring(bodyStart, mediaSetup);
        const bodyEnd = beforeMedia.lastIndexOf("});");
        
        const body = beforeMedia.substring(0, bodyEnd);
        
        const receiveLoop = `
        (async () => {
          try {
            for await (const message of session.receive()) {
              ${body}
            }
          } catch(e) {
            console.error("Receive loop error:", e);
          }
        })();
        `;
        
        content = content.substring(0, onStart) + receiveLoop + content.substring(mediaSetup);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fix session.on 2 complete.");
    }
}
