const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('C:/Users/USER/Downloads/polyglot-ai-tuto-firebase-adminsdk-fbsvc-fa7491cb65.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function testBucket() {
  try {
    const bucket = admin.storage().bucket('polyglot-ai-tuto.firebasestorage.app');
    const [exists] = await bucket.exists();
    if (!exists) throw new Error("Bucket does not exist");
    return bucket;
  } catch(e) {
    console.log("Bucket .firebasestorage.app failed:", e.message);
    try {
      const bucket2 = admin.storage().bucket('polyglot-ai-tuto.appspot.com');
      const [exists2] = await bucket2.exists();
      if (exists2) return bucket2;
    } catch (e2) {
      console.log("Bucket .appspot.com failed:", e2.message);
    }
    throw new Error("Both bucket names failed.");
  }
}

async function uploadDir(localDir, remoteDir, actualBucket) {
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
            await uploadDir(fullPath, `${remoteDir}/${item}`, actualBucket);
        } else {
            const destPath = `${remoteDir}/${item}`;
            
            // Limit concurrency check
            if (promises.length >= 20) {
                await Promise.all(promises);
                promises.length = 0;
            }

            const uploadTask = (async () => {
                try {
                    // Check if exists
                    const fileRef = actualBucket.file(destPath);
                    const [exists] = await fileRef.exists();
                    if (exists) {
                        console.log(`Skipping (already exists): ${destPath}`);
                        return;
                    }
                    
                    // Upload file
                    await actualBucket.upload(fullPath, {
                        destination: destPath,
                        metadata: {
                            cacheControl: 'public, max-age=31536000',
                        }
                    });
                    console.log(`Uploaded ${destPath}`);
                } catch (e) {
                    console.error(`Failed to process ${destPath}:`, e.message);
                }
            })();
            
            promises.push(uploadTask);
        }
    }
    if (promises.length > 0) {
        await Promise.all(promises);
    }
}

async function main() {
    try {
        const actualBucket = await testBucket();
        console.log("Using bucket:", actualBucket.name);
        
        const publicDir = path.join(__dirname, '../public');
        
        const directoriesToUpload = [
            'Courseware_Images',
            'downloads',
            'en_speaking_conv',
            'en_writing',
            'voa',
            'ielts_exams',
            'en_speaking_ielts_audio',
            'listening',
            'hsk',
            'hskk'
        ];

        for (const dirName of directoriesToUpload) {
            const localPath = path.join(publicDir, dirName);
            console.log(`\n=== Starting upload of ${dirName} ===`);
            await uploadDir(localPath, dirName, actualBucket);
        }
        
        console.log("\nUpload process completed successfully!");
    } catch (e) {
        console.error("Upload process failed:", e);
    }
}

main();
