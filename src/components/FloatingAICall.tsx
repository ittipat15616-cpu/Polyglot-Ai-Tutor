import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react';

interface FloatingAICallProps {
  canvasDataUrl: string | null;
  onToolCall: (name: string, args: any) => void;
  onClose: () => void;
}

export default function FloatingAICall({ canvasDataUrl, onToolCall, onClose }: FloatingAICallProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMicOnRef = useRef(true);
  
  // Audio Context for playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  let nextPlayTime = 0;

  useEffect(() => {
    isMicOnRef.current = isMicOn;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);


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
          },
          callbacks: {
            onmessage: (message: any) => {
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
                  session.sendToolResponse({ functionResponses: toolResponses });
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
            }
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
          wsSession.sendRealtimeInput({ media: [{ mimeType: "audio/pcm;rate=16000", data: base64 }] });
        };

        // Start screen sending loop
        intervalId = setInterval(() => {
          if (sessionActive && canvasUrlRef.current && wsSession) {
             const base64JPEG = canvasUrlRef.current.split(',')[1];
             if (base64JPEG) {
               wsSession.sendRealtimeInput({ media: [{ mimeType: "image/jpeg", data: base64JPEG }] });
             }
          }
        }, 1000); // Send screen every 1 sec

      } catch (err: any) {
        console.error("Connection failed", err);
        alert("Gemini Connection Error: " + (err?.message || JSON.stringify(err)));
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

    // Update sending interval with fresh canvasDataUrl manually is tricky in useEffect without recreating WS.
  // We use a ref to hold latest canvasDataUrl so the interval sees it.
  const canvasUrlRef = useRef(canvasDataUrl);
  useEffect(() => {
    canvasUrlRef.current = canvasDataUrl;
  }, [canvasDataUrl]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex flex-col items-center gap-4 w-64 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center relative overflow-hidden">
        {isConnecting ? (
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-600 animate-pulse flex items-center justify-center text-white font-bold text-xl">
            AI
          </div>
        )}
      </div>
      <div className="text-center">
        <h3 className="font-bold text-gray-800">Tutor Session</h3>
        <p className="text-xs text-gray-500">{isConnecting ? 'Connecting...' : 'AI is watching your screen'}</p>
      </div>

      <div className="flex gap-4 mt-2">
        <button 
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-3 rounded-full \${isMicOn ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button 
          onClick={onClose}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
