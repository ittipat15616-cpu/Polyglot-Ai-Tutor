const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('C:/Users/USER/Downloads/polyglot-ai-tuto-firebase-adminsdk-fbsvc-fa7491cb65.json');

// NOTE: Check if the bucket name is correct. Sometimes it is project_id.appspot.com
// Let's check both possibilities. Default is usually <project-id>.appspot.com for older ones, or .firebasestorage.app for newer.
// In newer Firebase, the default bucket is `<project-id>.appspot.com` actually.
// Wait, .firebasestorage.app is for Firebase Hosting! Storage is .appspot.com.
const BUCKET_NAME = 'polyglot-ai-tuto.firebasestorage.app'; 
// Actually, I'll let admin sdk use the default if I can, but getStorage().bucket(name) requires a name.
// Let's use 'polyglot-ai-tuto.appspot.com'.

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'polyglot-ai-tuto.firebasestorage.app'
});

const bucket = admin.storage().bucket();
// Let's do a quick test if this bucket exists. If not, fallback to appspot.com
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
            // Upload file
            const uploadPromise = actualBucket.upload(fullPath, {
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
            
            // Limit concurrency
            if (promises.length >= 20) {
                await Promise.all(promises);
                promises.length = 0;
            }
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
        console.log("Starting upload of HSK_Images...");
        await uploadDir('C:/Users/USER/Desktop/HSK_Images', 'HSK_Images', actualBucket);
        console.log("Starting upload of Courseware_Images...");
        await uploadDir('C:/Users/USER/Desktop/Courseware_Images', 'Courseware_Images', actualBucket);
        console.log("Upload completed successfully!");
    } catch (e) {
        console.error("Upload process failed:", e);
    }
}

main();
