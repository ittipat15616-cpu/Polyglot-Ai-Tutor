const fs = require('fs');
const path = require('path');

function fixFile(fileName) {
    const filePath = path.join(__dirname, '..', 'src', 'components', fileName);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the old session.on
    const onStart = content.indexOf("session.on('message'");
    if (onStart === -1) return;
    
    // Find where the session.on ends (look for `});\n\n        // Setup Media for sending` or similar)
    const mediaSetup = content.indexOf("// Setup Media for sending");
    if (mediaSetup === -1) return;

    // Extract the body of session.on
    // `session.on('message', async (message: any) => {`
    // body
    // `});`
    
    const onSignature = "session.on('message', async (message: any) => {";
    const bodyStart = onStart + onSignature.length;
    // finding the `});` right before mediaSetup
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
}

fixFile('VideoCallArea.tsx');
fixFile('FloatingAICall.tsx');
console.log("Fix session.on complete.");
