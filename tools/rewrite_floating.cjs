const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'FloatingAICall.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("@google/genai")) {
    content = content.replace("import { Mic", "import { GoogleGenAI } from '@google/genai';\nimport { Mic");
}

// 2. Replace WS setup
const wsSetupStart = content.indexOf('  useEffect(() => {\n    const protocol');
const wsSetupEnd = content.indexOf('  // Update sending interval');

if (wsSetupStart !== -1 && wsSetupEnd !== -1) {
    const newWsSetup = `
  useEffect(() => {
    let sessionActive = true;
    let wsSession: any = null;
    let intervalId: any = null;

    async function initGemini() {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
           console.error("VITE_GEMINI_API_KEY is missing");
           setIsConnecting(false);
           return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const session = await ai.live.connect({
          model: "gemini-2.5-flash-native-audio-latest",
          config: {
             systemInstruction: { parts: [{ text: "You are an AI assistant watching the user's screen." }] },
             tools: [{
               functionDeclarations: [
                 { name: "draw_on_exam", description: "Draw on the exam PDF page.", parameters: { type: "OBJECT", properties: { type: {type: "STRING"}, x: {type: "NUMBER"}, y: {type: "NUMBER"}, text: {type:"STRING"}, width: {type:"NUMBER"}, height: {type:"NUMBER"}, color: {type:"STRING"} }, required: ["type", "x", "y"] } },
                 { name: "clear_exam_drawings", description: "Clear drawings." }
               ]
             }]
          }
        });

        if (!sessionActive) {
          session.sendClientContent = undefined; // effectively discard
          return;
        }
        
        wsRef.current = session as any;
        wsSession = session;
        
        console.log("Floating Call connected to Gemini");
        setIsConnected(true);
        setIsConnecting(false);

        session.on('message', async (message: any) => {
          // Tool Call handling
          if (message.toolCall && message.toolCall.functionCalls) {
            const toolResponses: any[] = [];
            for (const call of message.toolCall.functionCalls) {
              if (call.name === 'draw_on_exam' || call.name === 'clear_exam_drawings') {
                onToolCall(call.name, call.args);
                toolResponses.push({ id: call.id, name: call.name, response: { result: "Success" } });
              }
            }
            if (toolResponses.length > 0) {
              session.send({ toolResponse: { functionResponses: toolResponses } });
            }
          }

          // Audio playback handling
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
               if (part.inlineData?.data) {
                  const base64 = part.inlineData.data;
                  const binaryStr = atob(base64);
                  const len = binaryStr.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                      bytes[i] = binaryStr.charCodeAt(i);
                  }
                  
                  if (!audioCtxRef.current) return;
                  const audioData = new Int16Array(bytes.buffer);
                  const float32Data = new Float32Array(audioData.length);
                  for (let i = 0; i < audioData.length; i++) {
                    float32Data[i] = audioData[i] / 32768.0;
                  }
                  const audioBuffer = audioCtxRef.current.createBuffer(1, float32Data.length, 24000);
                  audioBuffer.getChannelData(0).set(float32Data);
                  const source = audioCtxRef.current.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioCtxRef.current.destination);
                  
                  const currentTime = audioCtxRef.current.currentTime;
                  if (nextPlayTime < currentTime) nextPlayTime = currentTime;
                  source.start(nextPlayTime);
                  nextPlayTime += audioBuffer.duration;
               }
            }
          }
        });

        // Setup Media for sending
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        streamRef.current = stream;

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        
        // Setup input audio context at 16kHz
        const inputCtx = new AudioContext({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        const gainNode = inputCtx.createGain();
        gainNode.gain.value = 0;
        processor.connect(gainNode);
        gainNode.connect(inputCtx.destination);
        source.connect(processor);

        // helper for base64
        function pcmToBase64(pcmData: Float32Array): string {
            const buffer = new ArrayBuffer(pcmData.length * 2);
            const view = new DataView(buffer);
            for (let i = 0; i < pcmData.length; i++) {
              let s = Math.max(-1, Math.min(1, pcmData[i]));
              view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        processor.onaudioprocess = (e) => {
          if (!isMicOnRef.current || !sessionActive || !wsSession) return;
          const pcmData = e.inputBuffer.getChannelData(0);
          const base64 = pcmToBase64(pcmData);
          wsSession.send({
             realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64 }] }
          });
        };

        // Start screen sending loop
        intervalId = setInterval(() => {
          if (sessionActive && canvasUrlRef.current && wsSession) {
             const base64JPEG = canvasUrlRef.current.split(',')[1];
             if (base64JPEG) {
               wsSession.send({
                  realtimeInput: { mediaChunks: [{ mimeType: "image/jpeg", data: base64JPEG }] }
               });
             }
          }
        }, 1000); // Send screen every 1 sec

      } catch (err) {
        console.error("Connection failed", err);
        setIsConnecting(false);
      }
    }

    initGemini();

    return () => {
      sessionActive = false;
      if (intervalId) clearInterval(intervalId);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (wsSession && wsSession.close) {
         try { wsSession.close(); } catch(e){}
      }
    };
  }, []);

  `;

    content = content.substring(0, wsSetupStart) + newWsSetup + content.substring(wsSetupEnd);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Rewrite floating complete.");
} else {
    console.log("Could not find boundaries in FloatingAICall.");
}
