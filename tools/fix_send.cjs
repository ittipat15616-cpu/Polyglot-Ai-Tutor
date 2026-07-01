const fs = require('fs');
const path = require('path');

function fixFile(fileName) {
    const filePath = path.join(__dirname, '..', 'src', 'components', fileName);
    let content = fs.readFileSync(filePath, 'utf8');

    // Tool Response
    content = content.replace(/session\.send\(\{ toolResponse: \{ functionResponses: toolResponses \} \}\);/g, 
                              'session.sendToolResponse({ functionResponses: toolResponses });');

    // Client Content
    content = content.replace(/session\.send\(\{\s*clientContent:\s*\{\s*turns:\s*\[\{\s*role:\s*"user",\s*parts:\s*\[\{\s*text:\s*initialText\s*\}\]\s*\}\],\s*turnComplete:\s*true\s*\}\s*\}\);/g, 
                              'session.sendClientContent({ turns: [{ role: "user", parts: [{ text: initialText }] }], turnComplete: true });');

    // Realtime Input Audio
    content = content.replace(/\(wsRef\.current as any\)\.send\(\{\s*realtimeInput:\s*\{\s*mediaChunks:\s*\[\{\s*mimeType:\s*"audio\/pcm;rate=16000",\s*data:\s*base64\s*\}\]\s*\}\s*\}\);/g, 
                              '(wsRef.current as any).sendRealtimeInput([{ mimeType: "audio/pcm;rate=16000", data: base64 }]);');
    content = content.replace(/wsSession\.send\(\{\s*realtimeInput:\s*\{\s*mediaChunks:\s*\[\{\s*mimeType:\s*"audio\/pcm;rate=16000",\s*data:\s*base64\s*\}\]\s*\}\s*\}\);/g, 
                              'wsSession.sendRealtimeInput([{ mimeType: "audio/pcm;rate=16000", data: base64 }]);');

    // Realtime Input Image
    content = content.replace(/\(wsRef\.current as any\)\.send\(\{\s*realtimeInput:\s*\{\s*mediaChunks:\s*\[\{\s*mimeType:\s*"image\/jpeg",\s*data:\s*base64JPEG\s*\}\]\s*\}\s*\}\);/g, 
                              '(wsRef.current as any).sendRealtimeInput([{ mimeType: "image/jpeg", data: base64JPEG }]);');
    content = content.replace(/wsSession\.send\(\{\s*realtimeInput:\s*\{\s*mediaChunks:\s*\[\{\s*mimeType:\s*"image\/jpeg",\s*data:\s*base64JPEG\s*\}\]\s*\}\s*\}\);/g, 
                              'wsSession.sendRealtimeInput([{ mimeType: "image/jpeg", data: base64JPEG }]);');

    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('VideoCallArea.tsx');
fixFile('FloatingAICall.tsx');
console.log("Fix send complete.");
