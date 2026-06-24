const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'temp_extract');
const destDir = path.join(__dirname, '..', 'public', 'courses', 'HSK4-1');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);

for (const file of files) {
    if (file.endsWith('.pdf')) {
        // Filename looks like: HSK4?-?10?-8a825d15...
        const match = file.match(/HSK4[^\d]*(\d+)[^\d]*-/);
        if (match) {
            const lessonNum = match[1];
            const newName = `Lesson${lessonNum}.pdf`;
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, newName));
            console.log(`Copied ${file} to ${newName}`);
        }
    }
}
console.log('Done!');
