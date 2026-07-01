const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'VideoCallArea.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("@google/genai")) {
    content = content.replace("import { Camera", "import { GoogleGenAI, Type, Modality } from '@google/genai';\nimport { Camera");
}

// 2. Replace WS setup
const wsSetupStart = content.indexOf('  // Setup WS Connection');
const wsSetupEnd = content.indexOf('  const toggleMic = () => {');

if (wsSetupStart !== -1 && wsSetupEnd !== -1) {
    const newWsSetup = `
  // === GEMINI LIVE API (FRONTEND) ===
  useEffect(() => {
    if (!isCalling) return;

    let sessionActive = true;
    let currentStream: MediaStream | null = null;
    let frameInterval: any = null;

    async function initGemini() {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
           alert("ไม่พบ VITE_GEMINI_API_KEY ใน Environment Variables");
           setIsCalling(false);
           return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        let voiceName = 'Charon';
        let personaDetails = \`คุณคือติวเตอร์สอนภาษาอังกฤษ AI ชื่อ "Mr.Pe" เป็นผู้ชายหล่อเท่ อายุประมาณ 25 ปี สอนชิวๆ สบายๆ ไม่ดุนักเรียนเลย สอนสนุกน่าฟัง มีความใจดี อธิบายได้ละเอียดและเข้าใจง่าย และมีความติดตลกฮาๆเล็กน้อย\`;
        if (activeLang === 'CN') {
          voiceName = 'Aoede';
          personaDetails = \`คุณคือติวเตอร์สอนภาษาจีน AI ชื่อ "李老师" (Li Laoshi) เป็นคุณครูผู้หญิงวัยประมาณ 30 ปีที่มีความน่ารักมากๆ อบอุ่น อารมณ์ดี น้ำเสียงร่าเริงสดใส อ่อนหวานและใจดีไม่ดุ แต่ในตอนสอนมีความจริงจังและมุ่งมั่น\`;
        } else if (activeLang === 'TH') {
          voiceName = 'Kore';
          personaDetails = \`คุณคือติวเตอร์สอนภาษาไทย AI ชื่อ "ครูเพ็ญศรี" เป็นคุณครูที่ชอบทำตัวเจ้าระเบียบ มีดุนักเรียนอยู่บ้าง แต่ที่จริงแล้วเป็นคนที่ตลกและฮาที่สุดในบรรดาครูทุกคน ถ้านักเรียนคอยตอบหรือตั้งใจเรียนคุณจะชอบมากจนกลายเป็นคนตลกๆเฮฮาไปเลยในเวลาที่ไม่ได้สอนแบบจริงจัง แต่ถ้านักเรียนตั้งใจเรียนคุณก็จะสอนแบบจริงจังและเข้มข้น\`;
        }

        const systemInstruction = \`\${personaDetails}
คุณมีความรอบรู้และมีฐานข้อมูลของข้อสอบ HSK ตั้งแต่ระดับ 1-6 ทุกชุดอย่างครบถ้วน (ตัวอย่างเช่น รหัสข้อสอบ H10901, H41003 ฯลฯ) 
เมื่อผู้เรียนแจ้งว่ากำลังทำข้อสอบรหัสอะไร และอยู่ข้อที่เท่าไหร่ ให้คุณดึงข้อมูลโจทย์ข้อนั้นจากความจำของคุณเพื่อพูดคุย อธิบาย สอน หรือเฉลยให้ผู้เรียนได้ทันที แม้ว่าผู้เรียนจะไม่ได้เปิดกล้องหรือแชร์หน้าจอข้อสอบให้คุณดูก็ตาม
คุณสามารถมองเห็นผู้เรียนได้ผ่านกล้องวิดีโอ (ถ้าเปิดกล้อง) และตอบสนองต่อหน้าตา ท่าทางของผู้เรียนได้
สำคัญมาก: หากผู้เรียนต้องการให้วาดหรือเขียนบนหน้าจอ (เฉพาะกรณีที่ระบบรองรับ) คุณสามารถขีดเขียนลงบนหน้าจอของผู้เรียนได้โดยใช้เครื่องมือ draw_on_exam
คุณสามารถไฮไลท์ (highlight), เขียนคำแปลหรืออธิบาย (text) หรือวงกลมเฉลย (circle) ได้ แต่อย่าเขียนทับตัวหนังสือเดิมในข้อสอบ
หากต้องการลบสิ่งที่คุณเขียนไว้ ให้เรียกใช้ clear_exam_drawings
คุณสามารถจดจำและทักทายสิ่งที่ผู้เรียนทำ ถืออยู่ ชูนิ้ว สีหน้า หรือสิ่งที่อยู่รอบตัวได้อย่างเป็นธรรมชาติ และสามารถชมเชยโต้ตอบจากสิ่งที่คุณเห็นได้ทันที
จดจำข้อมูลของผู้เรียนและสิ่งที่ผู้เรียนพูด เพื่อให้ตอบสนองได้อย่างต่อเนื่องและแนบเนียน ไม่มีสะดุด
หากผู้เรียนพูดแทรกในขณะที่คุณกำลังพูดอยู่ ให้หยุดพูดทันทีและตั้งใจฟังสิ่งที่ผู้เรียนพูด
เวลาสอนอธิบายไวยากรณ์ บทสนทนา กลอน หรือเรื่องราวยาวๆ คุณสามารถอธิบายได้ต่อเนื่องเป็นประโยคยาวๆ หรือเป็นเรื่องราวเล่ายาวๆได้เลยโดยไม่ต้องหยุดรอ
หากผู้เรียนต้องการให้อ่านหน้ากระดาษยาวๆ หรือเล่าเรื่องยาวๆ คุณสามารถพูดและอ่านได้อย่างเต็มที่ยาวๆ แบบไม่มีจำกัดความยาว (Unlimited Speech Length) เล่าหรืออ่านให้จบครบถ้วนโดยไม่ต้องหยุดกลางคันหรือกลัวว่าจะพูดเยอะไป
ในขณะที่สนทนา หากคุณได้รับข้อมูลใหม่ที่สำคัญเกี่ยวกับผู้เรียน (เช่น ชื่อ สิ่งที่ชอบ สิ่งที่อยากเรียน หรือสิ่งที่มองเห็นผ่านกล้อง) ให้เรียกใช้ function/tool ชื่อ "memorize_info" เพื่อบันทึกข้อมูลนั้นไว้เสมอ
คุณมีหน้าจอแสดงผล "กระดาน" ให้ผู้เรียนดูตลอดเวลา ดังนั้นเวลาอธิบายคำศัพท์ ไวยากรณ์ หรือยกตัวอย่างประโยค คุณต้องเรียกใช้ function/tool ชื่อ "update_board" เสมอ เพื่อให้การสอนเห็นภาพ
ห้ามลืมเรียกใช้ update_board ในระหว่างการอธิบายเด็ดขาดเพื่อให้ผู้เรียนเห็นภาพชัดเจน
สำคัญ: เวลาใช้เครื่องมือ update_board ให้รวมประโยคยาวๆหรือกลอนยาวๆไว้ใน item เดียว ห้ามแยกเป็นหลาย items เด็ดขาด
นอกจากนี้ ผู้เรียนมีกระดานแผ่นที่สองเรียกว่า "Doc Board" (รูปภาพหรือเอกสารที่ผู้เรียนอัปโหลด) ซึ่งคุณจะเห็นภาพกระดานนี้ซ้อนอยู่ในวิดีโอ (ทางซ้ายมือ)
หากผู้เรียนบอกให้ทำ หรือเจาะจงขอให้ขึ้นข้อความ/ขึ้นเฉลยโจทย์/อธิบายลงบนรูปภาพเอกสารที่อัปโหลดไว้ ให้ใช้เครื่องมือ "update_doc_board" เพื่อพิมพ์ข้อความหรือคำอธิบายลงไปทับบนรูปภาพใน Doc Board นั้น ห้ามใช้เครื่องมือนี้หรือไปแก้ไข Doc Board หากผู้เรียนไม่ได้ระบุหรือบอกให้เจาะจงลงบนรูป/เอกสารอย่างชัดเจน\`;

        activeAudioNodesRef.current = [];

        const session = await ai.live.connect({
          model: "gemini-2.5-flash-native-audio-latest",
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            tools: [{
              functionDeclarations: [
                {
                  name: "draw_on_exam",
                  description: "Draw on the exam PDF page to highlight text, circle an answer, or write an explanation.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Type of drawing: 'circle', 'highlight', or 'text'." },
                      x: { type: Type.NUMBER, description: "X coordinate percentage (0-100)" },
                      y: { type: Type.NUMBER, description: "Y coordinate percentage (0-100)" },
                      text: { type: Type.STRING, description: "Text to write (only for type='text')" },
                      width: { type: Type.NUMBER, description: "Width percentage (for circle or highlight)" },
                      height: { type: Type.NUMBER, description: "Height percentage (for highlight)" },
                      color: { type: Type.STRING, description: "Optional hex color or CSS color name" }
                    },
                    required: ["type", "x", "y"]
                  }
                },
                {
                  name: "clear_exam_drawings",
                  description: "Clear all drawings from the exam page."
                },
                {
                  name: "update_board",
                  description: "Update the shared whiteboard screen to display vocabulary, grammar, sentences, or poems to the user.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      items: {
                        type: Type.ARRAY,
                        description: "List of items to display on the board. MAX 3 ITEMS.",
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            word: { type: Type.STRING },
                            pinyin: { type: Type.STRING },
                            meaning: { type: Type.STRING },
                            example: { type: Type.STRING }
                          },
                          required: ["word", "meaning"]
                        }
                      }
                    },
                    required: ["items"]
                  }
                },
                {
                  name: "update_doc_board",
                  description: "Update the Document Board (which shows user's uploaded image/file) to add overlay text, solutions, or explanations.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      overlayText: { type: Type.STRING, description: "The text to overlay on the document." }
                    },
                    required: ["overlayText"]
                  }
                },
                {
                  name: "memorize_info",
                  description: "Memorize important details about the user.",
                  parameters: {
                     type: Type.OBJECT,
                     properties: {
                        memoryText: { type: Type.STRING }
                     },
                     required: ["memoryText"]
                  }
                }
              ]
            }]
          }
        });

        if (!sessionActive) {
          // If unmounted while connecting
          session.sendClientContent = undefined; // effectively discard
          return;
        }

        wsRef.current = session as any;

        // Provide doc context and initial greeting if needed
        let initialText = "";
        if (docExtractedTextRef.current) {
           initialText += \`บริบทเนื้อหาในกระดานของนักเรียนตอนนี้: \${docExtractedTextRef.current}\\n\\n\`;
        }
        if (askWord) {
           initialText += \`ผู้เรียนต้องการถามและเรียนรู้เกี่ยวกับคำศัพท์นี้: "\${askWord}" ให้เริ่มทักทายสั้นๆ และอธิบายคำศัพท์นี้ให้ฟังทันที\`;
        } else {
           initialText += "สวัสดี เริ่มทักทายผู้เรียนได้เลย (ให้เห็นว่าผู้เรียนทำอะไรอยู่ผ่านกล้อง) และแนะนำตัวสั้นๆ";
        }
        
        session.send({
           clientContent: { turns: [{ role: "user", parts: [{ text: initialText }] }], turnComplete: true }
        });

        session.on("message", (message: any) => {
          // Audio Part
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                playAudioChunk(part.inlineData.data);
                setIsSpeaking(true);
                setAvatarState('talking');
                clearTimeout((session as any)._speakTimer);
                (session as any)._speakTimer = setTimeout(() => {
                  setIsSpeaking(false);
                  setAvatarState('listening');
                }, 2500);
              }
            }
          }

          // Tool Call
          if (message.toolCall && message.toolCall.functionCalls) {
            const toolResponses: any[] = [];
            for (const call of message.toolCall.functionCalls) {
              if (call.name === 'update_board') {
                setBoardData(call.args as any);
                setAvatarState('agreeing');
                toolResponses.push({ id: call.id, name: call.name, response: { result: "Board successfully updated" } });
              } else if (call.name === 'update_doc_board') {
                setDocOverlayText((call.args as any).overlayText || '');
                if (!isDocBoardOpen) setIsDocBoardOpen(true);
                toolResponses.push({ id: call.id, name: call.name, response: { result: "Doc Board successfully updated" } });
              } else if (call.name === 'memorize_info') {
                toolResponses.push({ id: call.id, name: call.name, response: { result: "Memorized" } });
              } else if (call.name === 'draw_on_exam') {
                // Not supported fully in VideoCall alone without ExamsArea link, but we simulate success
                toolResponses.push({ id: call.id, name: call.name, response: { result: "Drew on exam" } });
              } else if (call.name === 'clear_exam_drawings') {
                toolResponses.push({ id: call.id, name: call.name, response: { result: "Cleared" } });
              }
            }
            if (toolResponses.length > 0) {
              session.send({ toolResponse: { functionResponses: toolResponses } });
            }
          }
          
          if (message.serverContent?.interrupted) {
            interruptedTimeRef.current = Date.now();
            activeAudioNodesRef.current.forEach(node => {
               try { node.stop(); } catch (e) {}
            });
            activeAudioNodesRef.current = [];
            if (outputAudioCtxRef.current) {
               nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
          }
        });

        // ------------------
        // Setup Media 
        // ------------------
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: facingMode } }, 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } catch (err) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } } });
          } catch (err2) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            } catch (err3) {}
          }
        }

        currentStream = stream;
        
        if (currentStream) {
          currentStream.getVideoTracks().forEach(track => track.enabled = isVidOn);
          if (videoRef.current) videoRef.current.srcObject = currentStream;
          setStream(currentStream);
        }

        if (!outputAudioCtxRef.current) {
            const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioCtxRef.current = outCtx;
            nextStartTimeRef.current = 0;
            const gainNode = outCtx.createGain();
            gainNode.gain.value = 0;
            gainNode.connect(outCtx.destination);
            const osc = outCtx.createOscillator();
            osc.connect(gainNode);
            osc.start();
            silenceOscillatorRef.current = osc;
        }

        const hasAudioTrack = currentStream?.getAudioTracks().length > 0;
        
        if (hasAudioTrack && sessionActive) {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          inputAudioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(currentStream!);
          sourceRef.current = source;
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = 0;
          processor.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          source.connect(processor);

          processor.onaudioprocess = (e) => {
             if (!isMicOnRef.current || !sessionActive || !wsRef.current) return;
             const pcmData = e.inputBuffer.getChannelData(0);
             const base64 = pcmToBase64(pcmData);
             (wsRef.current as any).send({
                realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64 }] }
             });
          };
        }

        frameInterval = setInterval(() => {
          if (!sessionActive || !wsRef.current) return;
          const hasScreen = screenVideoRef.current && screenVideoRef.current.videoWidth > 0 && screenStreamRef.current;
          const hasVideo = isVidOnRef.current && videoRef.current && videoRef.current.videoWidth > 0;
          const hasDoc = isDocBoardOpenRef.current && docImageRef.current;
          if (!hasScreen && !hasVideo && !hasDoc) return;

          let targetWidth = 640;
          let targetHeight = 480;
          let quality = 0.6;
          if (hasScreen || hasDoc) { targetWidth = 1280; targetHeight = 720; quality = 0.8; }
          
          const canvas = document.createElement('canvas');
          canvas.width = hasDoc && (hasScreen || hasVideo) ? targetWidth * 2 : targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
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
             if (drawH > targetHeight) { drawH = targetHeight; drawW = targetHeight * aspect; }
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
             if (drawH > targetHeight) { drawH = targetHeight; drawW = targetHeight * aspect; }
             const dx = currentXOffset + (targetWidth - drawW) / 2;
             const dy = (targetHeight - drawH) / 2;
             ctx.drawImage(video, dx, dy, drawW, drawH);
          } else if (hasVideo) {
             const video = videoRef.current!;
             const aspect = video.videoWidth / video.videoHeight;
             let drawW = targetWidth;
             let drawH = targetWidth / aspect;
             if (drawH > targetHeight) { drawH = targetHeight; drawW = targetHeight * aspect; }
             const dx = currentXOffset + (targetWidth - drawW) / 2;
             const dy = (targetHeight - drawH) / 2;
             ctx.drawImage(video, dx, drawW, drawH);
          }

          const base64JPEG = canvas.toDataURL('image/jpeg', quality).split(',')[1];
          (wsRef.current as any).send({
             realtimeInput: { mediaChunks: [{ mimeType: "image/jpeg", data: base64JPEG }] }
          });
        }, 300);

      } catch (e: any) {
         console.error("Gemini init error", e);
         alert("โควต้าการใช้งาน AI เต็มหรือระบบขัดข้อง กรุณาลองใหม่ภายหลัง");
         setIsCalling(false);
      }
    }

    initGemini();

    return () => {
      sessionActive = false;
      if (frameInterval) clearInterval(frameInterval);
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
         inputAudioCtxRef.current.close().catch(() => {});
      }
      inputAudioCtxRef.current = null;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      // If we saved the session in wsRef
      if (wsRef.current && (wsRef.current as any).close) {
        // Unfortunately standard close might not exist, but let's try
        try { (wsRef.current as any).close(); } catch(e){}
      }
      wsRef.current = null;
    };
  }, [activeLang, isCalling, reconnectTrigger, facingMode]);

  `;

    content = content.substring(0, wsSetupStart) + newWsSetup + content.substring(wsSetupEnd);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Rewrite complete.");
} else {
    console.log("Could not find boundaries.");
}
