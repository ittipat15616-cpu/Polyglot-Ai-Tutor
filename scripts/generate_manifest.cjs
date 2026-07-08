const fs = require('fs');
const path = require('path');

const manifest = {};

function scanDir(localDir, basePath) {
    if (!fs.existsSync(localDir)) return;
    
    const items = fs.readdirSync(localDir);
    for (const item of items) {
        const fullPath = path.join(localDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            const manifestKey = `${basePath}/${item}`;
            if (!manifest[manifestKey]) {
                manifest[manifestKey] = [];
            }
            
            const files = fs.readdirSync(fullPath);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    manifest[manifestKey].push(file);
                }
            }
        }
    }
}

function run() {
    console.log("Scanning Courseware_Images...");
    scanDir('C:/Users/USER/Desktop/Courseware_Images', 'Courseware_Images');
    
    console.log("Scanning Reading_Images...");
    scanDir('C:/Users/USER/Desktop/Reading_Images', 'Courseware_Images');
    
    console.log("Scanning HSK_Images...");
    scanDir('C:/Users/USER/Desktop/HSK_Images', 'HSK_Images');

    // Ensure they are sorted for consistency
    for (const cat in manifest) {
        manifest[cat].sort();
    }

    fs.writeFileSync('C:/Users/USER/antigravity/Polyglot-AI-Tutor-New/src/data/image_manifest.json', JSON.stringify(manifest, null, 2));
    console.log("Manifest generated at src/data/image_manifest.json");
}

run();
