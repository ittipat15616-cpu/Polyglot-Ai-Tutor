import fs from 'fs';

const file = 'src/components/VideoCallArea.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Frame extraction interval[\s\S]*?1500\); \/\/ 1\.5 frame per second for stability/;

const replacement = `// Frame extraction interval
         frameInterval = setInterval(() => {
            if (!isLiveConnectedRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
            
            const hasScreen = screenVideoRef.current && screenVideoRef.current.videoWidth > 0 && screenStreamRef.current;
            const hasVideo = isVidOnRef.current && videoRef.current && videoRef.current.videoWidth > 0;
            const hasDoc = isDocBoardOpenRef.current && docImageRef.current;
            
            if (!hasScreen && !hasVideo && !hasDoc) return;

            let targetWidth = 640;
            let targetHeight = 480;
            let quality = 0.5;

            if (hasScreen || hasDoc) {
               targetWidth = 1280;
               targetHeight = 720;
               quality = 0.8;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = hasDoc && (hasScreen || hasVideo) ? targetWidth * 2 : targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // ใช้ black background แทนที่ transparent
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            let currentXOffset = 0;
            if (hasDoc) {
               ctx.fillStyle = "#ffffff";
               ctx.fillRect(currentXOffset, 0, targetWidth, targetHeight);
               const img = docImageRef.current!;
               const aspect = img.width / img.height;
               let drawW = targetWidth;
               let drawH = targetWidth / aspect;
               if (drawH > targetHeight) {
                  drawH = targetHeight;
                  drawW = targetHeight * aspect;
               }
               const dx = currentXOffset + (targetWidth - drawW) / 2;
               const dy = (targetHeight - drawH) / 2;
               ctx.drawImage(img, dx, dy, drawW, drawH);
               currentXOffset += targetWidth;
            }

            if (hasScreen) {
               const video = screenVideoRef.current!;
               const aspect = video.videoWidth / video.videoHeight;
               let drawW = targetWidth;
               let drawH = targetWidth / aspect;
               if (drawH > targetHeight) {
                  drawH = targetHeight;
                  drawW = targetHeight * aspect;
               }
               const dx = currentXOffset + (targetWidth - drawW) / 2;
               const dy = (targetHeight - drawH) / 2;
               ctx.drawImage(video, dx, dy, drawW, drawH);
            } else if (hasVideo) {
               const video = videoRef.current!;
               const aspect = video.videoWidth / video.videoHeight;
               let drawW = targetWidth;
               let drawH = targetWidth / aspect;
               if (drawH > targetHeight) {
                  drawH = targetHeight;
                  drawW = targetHeight * aspect;
               }
               const dx = currentXOffset + (targetWidth - drawW) / 2;
               const dy = (targetHeight - drawH) / 2;
               ctx.drawImage(video, dx, dy, drawW, drawH);
            }

            const base64JPEG = canvas.toDataURL('image/jpeg', quality).split(',')[1];
            wsRef.current.send(JSON.stringify({ image: base64JPEG }));
         }, 500); // 2 frames per second for real-time feel`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Patched');
