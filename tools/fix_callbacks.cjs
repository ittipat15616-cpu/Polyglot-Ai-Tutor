const fs = require('fs');
const path = require('path');

function fixFile(filename) {
    const filePath = path.join(__dirname, '..', 'src', 'components', filename);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Find the ai.live.connect call
    const connectMatch = content.match(/const session = await ai\.live\.connect\(\{([\s\S]*?config:\s*\{[\s\S]*?\})\s*\}\);/);
    if (!connectMatch) {
        console.log(`Could not find ai.live.connect in ${filename}`);
        return;
    }

    // 2. Find the async receive loop
    const loopRegex = /\(async\s*\(\)\s*=>\s*\{\s*try\s*\{\s*for\s+await\s*\(\s*const\s+message\s+of\s+session\.receive\(\)\s*\)\s*\{([\s\S]*?)\}\s*\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\}\)\(\);/;
    const loopMatch = content.match(loopRegex);
    if (!loopMatch) {
        console.log(`Could not find receive loop in ${filename}`);
        return;
    }

    const loopBody = loopMatch[1];
    
    // 3. Rebuild ai.live.connect to include callbacks
    const originalConnectStr = connectMatch[0];
    const newConnectStr = originalConnectStr.replace(
        /\}\);$/,
        `  },
          callbacks: {
            onmessage: (message: any) => {
${loopBody}
            }
          }
        });`
    );

    // 4. Replace connect call
    content = content.replace(originalConnectStr, newConnectStr);

    // 5. Remove the loop entirely
    content = content.replace(loopMatch[0], '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully fixed ${filename}`);
}

fixFile('VideoCallArea.tsx');
fixFile('FloatingAICall.tsx');
