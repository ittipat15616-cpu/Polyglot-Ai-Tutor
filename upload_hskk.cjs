const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('C:/Users/USER/Downloads/polyglot-ai-tuto-firebase-adminsdk-fbsvc-fa7491cb65.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'polyglot-ai-tuto.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function uploadDir(localDir, remoteDir) {
    if (!fs.existsSync(localDir)) {
        console.log(`Directory ${localDir} does not exist. Skipping.`);
        return;
    }
    const items = fs.readdirSync(localDir);
    const promises = [];
    
    for (const item of items) {
        const fullPath = path.join(localDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            await uploadDir(fullPath, `${remoteDir}/${item}`);
        } else {
            const destPath = `${remoteDir}/${item}`;
            // Upload file
            const uploadPromise = bucket.upload(fullPath, {
                destination: destPath,
                metadata: {
                    cacheControl: 'public, max-age=31536000',
                }
            }).then(() => {
                console.log(`Uploaded ${destPath}`);
            }).catch(e => {
                console.error(`Failed to upload ${destPath}:`, e.message);
            });
            
            promises.push(uploadPromise);
            
            if (promises.length >= 10) {
                await Promise.all(promises);
                promises.length = 0;
            }
        }
    }
    
    if (promises.length > 0) {
        await Promise.all(promises);
    }
}

async function run() {
    console.log("Uploading HSKK Basic...");
    await uploadDir('C:/Users/USER/Desktop/HSK_Images/hskk_basic', 'HSK_Images/hskk_basic');
    console.log("Uploading HSKK Intermediate...");
    await uploadDir('C:/Users/USER/Desktop/HSK_Images/hskk_intermediate', 'HSK_Images/hskk_intermediate');
    console.log("Uploading HSKK Advanced...");
    await uploadDir('C:/Users/USER/Desktop/HSK_Images/hskk_advanced', 'HSK_Images/hskk_advanced');
    console.log("Upload complete.");
    process.exit(0);
}

run();
