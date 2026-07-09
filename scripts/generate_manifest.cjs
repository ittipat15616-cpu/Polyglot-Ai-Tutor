const fs = require('fs');
const path = require('path');

const manifest = {};

function scanDirRecursive(localDir, basePath) {
    if (!fs.existsSync(localDir)) return;
    
    const items = fs.readdirSync(localDir);
    let hasImages = false;
    const images = [];

    for (const item of items) {
        const fullPath = path.join(localDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            const newBasePath = basePath ? `${basePath}/${item}` : item;
            scanDirRecursive(fullPath, newBasePath);
        } else {
            const ext = path.extname(item).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                images.push(item);
                hasImages = true;
            }
        }
    }

    if (hasImages && basePath) {
        // Use forward slashes for the manifest key
        const manifestKey = basePath.replace(/\\/g, '/');
        manifest[manifestKey] = images.sort();
    }
}

function run() {
    const publicDir = path.join(__dirname, '../public');
    console.log("Scanning public directory recursively...");
    
    const directoriesToScan = [
        'Courseware_Images',
        'HSK_Images',
        'en_speaking_conv',
        'en_writing',
        'voa',
        'ielts_exams',
        'listening',
        'hsk',
        'hskk'
    ];

    for (const dirName of directoriesToScan) {
        const fullPath = path.join(publicDir, dirName);
        if (fs.existsSync(fullPath)) {
            console.log(`Scanning public/${dirName}...`);
            scanDirRecursive(fullPath, dirName);
        }
    }

    // Also scan legacy Desktop folders
    const desktopDirs = [
        { path: 'C:/Users/USER/Desktop/Courseware_Images', basePath: 'Courseware_Images' },
        { path: 'C:/Users/USER/Desktop/Reading_Images', basePath: 'Courseware_Images' },
        { path: 'C:/Users/USER/Desktop/HSK_Images', basePath: 'HSK_Images' }
    ];

    for (const dir of desktopDirs) {
        if (fs.existsSync(dir.path)) {
            console.log(`Scanning Desktop folder ${dir.path}...`);
            scanDirRecursive(dir.path, dir.basePath);
        }
    }

    const outputPath = path.join(__dirname, '../src/data/image_manifest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest generated at ${outputPath}`);
}

run();
