import React, { useState, useEffect, useRef } from 'react';
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live?lang=English&clientId=floating_${Date.now()}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("Floating Call connected to server");
      setIsConnected(true);
      setIsConnecting(false);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        streamRef.current = stream;

        // Initialize AudioContext
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTime = audioCtxRef.current.currentTime;

        // Setup Audio Input Node
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        await audioCtxRef.current.audioWorklet.addModule('/audio-processor.js');
        const processor = new AudioWorkletNode(audioCtxRef.current, 'audio-processor');
        
        processor.port.onmessage = (e) => {
          if (ws.readyState === WebSocket.OPEN && isMicOnRef.current) {
            ws.send(JSON.stringify({ audio: e.data }));
          }
        };
        source.connect(processor);
        
        // Start screen sending loop
        const intervalId = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN && canvasUrlRef.current) {
             const base64JPEG = canvasUrlRef.current.split(',')[1];
             if (base64JPEG) {
               ws.send(JSON.stringify({ image: base64JPEG }));
             }
          }
        }, 1000); // Send screen every 1 sec

        ws.onclose = () => clearInterval(intervalId);

      } catch (err) {
        console.error("Mic access denied", err);
      }
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        if (data.type === 'draw_on_exam' || data.type === 'clear_exam_drawings') {
          onToolCall(data.type, data.data);
        }
      } else if (event.data instanceof Blob) {
         // Audio Playback
         if (!audioCtxRef.current) return;
         const arrayBuffer = await event.data.arrayBuffer();
         const audioData = new Int16Array(arrayBuffer);
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
    };

    ws.onerror = () => setIsConnecting(false);

    return () => {
      ws.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
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
