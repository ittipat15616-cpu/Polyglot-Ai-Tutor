import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Edit3, Type, Settings2, PlayCircle, Loader2, RefreshCcw, MonitorUp, MonitorOff, Plus, Minus, ImagePlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HanziWriter from 'hanzi-writer';

function ChineseCharacters({ word }: { word: string }) {
  const chars = word.split('');
  
  // Decide size based on string length to fit up to 50 characters nicely
  let size = 120;
  if (chars.length > 20) {
    size = 40;
  } else if (chars.length > 10) {
    size = 60;
  } else if (chars.length > 6) {
    size = 80;
  }

  return (
    <div className="flex gap-1 md:gap-2 justify-center flex-wrap leading-tight">
      {chars.map((char, index) => {
        const isChinese = /[\u4e00-\u9fa5]/.test(char);
        if (isChinese) {
          return <HanziChar key={`${char}-${index}`} char={char} size={size} />;
        } else {
          return (
            <div 
              key={`${char}-${index}`} 
              className="flex items-center justify-center font-bold text-gray-900"
              style={{ width: size, height: size, fontSize: size * 0.7, flexShrink: 0 }}
            >
              {char}
            </div>
          );
        }
      })}
    </div>
  )
}

const HanziChar: React.FC<{ char: string; size: number }> = ({ char, size }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const writer = HanziWriter.create(ref.current, char, {
      width: size,
      height: size,
      padding: size * 0.05,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      showOutline: true,
      radicalColor: '#166534',
    });
    writer.loopCharacterAnimation();
  }, [char, size]);

  return <div ref={ref} className="bg-white rounded-md shadow-sm border border-gray-200" style={{ width: size, height: size, flexShrink: 0 }} />;
}

function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, s, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToPcm(base64: string): Float32Array {
  const binary = atob(base64);
  const pcm = new Float32Array(binary.length / 2);
  const view = new DataView(new ArrayBuffer(2));
  for (let i = 0; i < pcm.length; i++) {
    view.setUint8(0, binary.charCodeAt(i * 2));
    view.setUint8(1, binary.charCodeAt(i * 2 + 1));
    pcm[i] = view.getInt16(0, true) / 32768;
  }
  return pcm;
}

interface BoardItem {
  word: string;
  pinyin?: string;
  meaning: string;
  example?: string;
}

interface BoardData {
  items: BoardItem[];
}

export default function VideoCallArea({ activeLang, askWord, clearAskWord }: { activeLang: 'EN' | 'CN' | 'TH', askWord?: string | null, clearAskWord?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVidOn, setIsVidOn] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [boardData, setBoardData] = useState<BoardData | null>(null);

  const [isCalling, setIsCalling] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const [isDocBoardOpen, setIsDocBoardOpen] = useState(false);
  const [docImageObj, setDocImageObj] = useState<HTMLImageElement | null>(null);
  const [docImageBase64, setDocImageBase64] = useState<string | null>(null);
  const [docOverlayText, setDocOverlayText] = useState<string>('');
  const [docScale, setDocScale] = useState(1);
  const [docPan, setDocPan] = useState({ x: 0, y: 0 });
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const docImageRef = useRef<HTMLImageElement | null>(null);

  const isMicOnRef = useRef(isMicOn);
  const isVidOnRef = useRef(isVidOn);
  const isLiveConnectedRef = useRef(isLiveConnected);
  const isCallingRef = useRef(isCalling);
  const isDocBoardOpenRef = useRef(isDocBoardOpen);
  const getOrCreateClientId = () => {
    if (typeof window === 'undefined') return 'default';
    let id = localStorage.getItem('ai_tutor_client_id');
    if (!id) {
       id = Math.random().toString(36).substring(2, 15);
       localStorage.setItem('ai_tutor_client_id', id);
    }
    return id;
  };
  const clientIdRef = useRef(getOrCreateClientId());

  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);
  useEffect(() => { isVidOnRef.current = isVidOn; }, [isVidOn]);
  useEffect(() => { isLiveConnectedRef.current = isLiveConnected; }, [isLiveConnected]);
  useEffect(() => { isDocBoardOpenRef.current = isDocBoardOpen; }, [isDocBoardOpen]);
  useEffect(() => { 
    isCallingRef.current = isCalling; 
    if (!isCalling) {
      setBoardData(null); 
      setIsLiveConnected(false);
    } else {
      setIsLiveConnected(true);
    }
  }, [isCalling]);

  // Handle askWord auto start
  useEffect(() => {
    if (askWord && !isCalling) {
      setIsCalling(true);
    }
  }, [askWord, isCalling]);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setDocImageBase64(result);
        const img = new Image();
        img.onload = () => {
          setDocImageObj(img);
          docImageRef.current = img;
          setDocScale(1);
          setDocPan({ x: 0, y: 0 });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeAudioNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const interruptedTimeRef = useRef(0);
  const silenceOscillatorRef = useRef<OscillatorNode | null>(null);

  // Play incoming audio
  const playAudioChunk = (base64Audio: string) => {
    // Ignore lingering audio chunks immediately after an interrupt
    if (Date.now() - interruptedTimeRef.current < 500) return;

    if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0; // Reset time when new context is created
        
        // Add silent oscillator to keep JS context alive in background (especially for iOS)
        const ctx = outputAudioCtxRef.current;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(ctx.destination);
        const osc = ctx.createOscillator();
        osc.connect(gainNode);
        osc.start();
        silenceOscillatorRef.current = osc;
    }
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const pcm = base64ToPcm(base64Audio);
    const buffer = ctx.createBuffer(1, pcm.length, 24000); // Model outputs 24kHz
    buffer.copyToChannel(pcm, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
       nextStartTimeRef.current = currentTime + 0.05;
    }

    source.onended = () => {
      activeAudioNodesRef.current = activeAudioNodesRef.current.filter(n => n !== source);
    };
    activeAudioNodesRef.current.push(source);

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  useEffect(() => {
    setBoardData(null);
  }, [activeLang]);

  // Setup WS Connection
  useEffect(() => {
    if (!isCalling) return;

    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const languageMap = { 'EN': 'English', 'CN': 'Chinese', 'TH': 'Thai' };
    const langFull = languageMap[activeLang];
    const wsUrl = `${wsProtocol}//${location.host}/live?lang=${langFull}&clientId=${clientIdRef.current}${askWord ? `&askWord=${encodeURIComponent(askWord)}` : ''}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    activeAudioNodesRef.current = [];

    ws.onopen = () => { /* connection established */ };
    ws.onclose = () => {
      if (isCallingRef.current) {
        // Auto-reconnect to simulate "no limits / no disconnects"
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
           setReconnectTrigger(prev => prev + 1);
        }, 2000);
      }
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.audio) playAudioChunk(msg.audio);
      if (msg.type === 'board_update') {
        setBoardData(msg.data);
      }
      if (msg.type === 'doc_board_update') {
        setDocOverlayText(msg.data.overlayText || '');
        if (!isDocBoardOpen) {
          setIsDocBoardOpen(true);
        }
      }
      if (msg.type === 'error') {
        setIsCalling(false);
        isCallingRef.current = false; // Prevent auto-reconnect
        alert(msg.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
      if (msg.interrupted) {
         // Stop all active audio nodes immediately when user interrupts
         interruptedTimeRef.current = Date.now();
         activeAudioNodesRef.current.forEach(node => {
            try { node.stop(); } catch (e) {}
         });
         activeAudioNodesRef.current = [];
         if (outputAudioCtxRef.current) {
            nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
         }
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [activeLang, isCalling, reconnectTrigger]);

  // Setup Media and Audio sending
  useEffect(() => {
    if (!isCalling) {
      if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
         outputAudioCtxRef.current.close().catch(() => {});
      }
      outputAudioCtxRef.current = null;
      return;
    }

    let currentStream: MediaStream | null = null;
    let isActive = true;
    let frameInterval: any = null;

    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: facingMode } }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        if (!isActive) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        currentStream = stream;
        
        // sync video state
        currentStream.getVideoTracks().forEach(track => {
          track.enabled = isVidOn;
        });

        if (videoRef.current) videoRef.current.srcObject = currentStream;
        setStream(currentStream);

        // Pre-initialize output context and background oscillator here so they are ready
        // and keep JS alive even if AI hasn't spoken yet.
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

        // Setup audio context for sending (requires 16kHz)
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        if (!isActive) {
          audioCtx.close().catch(() => {});
          return;
        }
        inputAudioCtxRef.current = audioCtx;
        
        const source = audioCtx.createMediaStreamSource(currentStream);
        sourceRef.current = source;

        // Note: ScriptProcessor is deprecated but widely used for raw PCM access
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        // Muted gain node to prevent local echo while keeping the graph running
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        processor.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.connect(processor);

        processor.onaudioprocess = (e) => {
           // We only send audio if mic is ON, Live is connected, and WS is open
           if (!isMicOnRef.current || !isLiveConnectedRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
           
           const pcmData = e.inputBuffer.getChannelData(0);
           const base64 = pcmToBase64(pcmData);
           wsRef.current.send(JSON.stringify({ audio: base64 }));
        };

        // Frame extraction interval
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
         }, 500); // 2 frames per second for real-time feel

      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    }
    setupMedia();

    return () => {
      isActive = false;
      if (frameInterval) {
         clearInterval(frameInterval);
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
         inputAudioCtxRef.current.close().catch(() => {});
      }
      inputAudioCtxRef.current = null;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCalling, facingMode]); // Re-attach when calling state or camera direction changes

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVid = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVidOn;
      });
      setIsVidOn(!isVidOn);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const toggleScreenShare = async () => {
    if (screenStream) {
      // Stop screen sharing
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      screenStreamRef.current = null;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    } else {
      // Start screen sharing
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error("เบราว์เซอร์หรือสภาพแวดล้อมนี้ไม่รองรับการแชร์หน้าจอ (กรุณาลองเปิดแอปในแท็บใหม่)");
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        stream.getVideoTracks()[0].onended = () => {
           setScreenStream(null);
           screenStreamRef.current = null;
           if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        };
        setScreenStream(stream);
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Error sharing screen", err);
        alert("ไม่สามารถแชร์หน้าจอได้: " + (err.message || "กรุณาลองเปิดแอปในแท็บใหม่ (Open in New Tab) เพื่ออนุญาตการแชร์หน้าจอ"));
      }
    }
  };

  // --- Dynamic Canvas ---
  const renderDynamicCanvas = () => {
    if (!boardData || !boardData.items || boardData.items.length === 0) return null;
    
    return (
      <motion.div 
        key={`dynamic-${boardData.items[0].word}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-start h-full w-full p-8 overflow-y-auto"
      >
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {boardData.items.map((item, idx) => {
            const isChinese = item.word && /[\u4e00-\u9fa5]/.test(item.word);
            const showHanzi = isChinese && item.word.length <= 50; // Animate up to 50 chars

            return (
              <div key={idx} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow ${boardData.items.length === 1 ? 'col-span-1 md:col-span-2' : ''}`}>
                {item.pinyin && (
                  <div className="text-lg text-gray-500 mb-3 tracking-widest font-medium font-mono text-center">
                    {item.pinyin}
                  </div>
                )}
                
                {showHanzi ? (
                  <div className="mb-4">
                    <ChineseCharacters word={item.word} />
                  </div>
                ) : (
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight break-all text-center">
                    {item.word}
                  </div>
                )}
                
                <div className="text-xl text-indigo-700 font-semibold mb-4 bg-indigo-50 px-4 py-2 rounded-xl text-center">
                  {item.meaning}
                </div>
                
                {item.example && (
                   <div className="text-base text-gray-600 font-medium border border-gray-100 px-4 py-3 rounded-xl bg-gray-50 mt-auto">
                      {item.example}
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4 relative">
      {/* Left: User & AI Camera Column */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Cameras Wrapper: Row on mobile, Column on desktop */}
        <div className="flex flex-row md:flex-col gap-4 h-48 md:h-auto md:flex-1 shrink-0">
          {/* AI Camera / Voice Indicator */}
          <div className="flex-1 bg-gradient-to-br from-indigo-900 to-gray-900 rounded-2xl overflow-hidden relative shadow-inner border border-gray-800 flex items-center justify-center">
            {isCalling && !isLiveConnected && <Loader2 className="w-8 h-8 text-indigo-400 animate-spin absolute" />}
            
            {/* Simple AI Voice Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
               {isLiveConnected ? (
                 <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center relative">
                    {/* Pulsing rings when connected */}
                    <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-400" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
                    <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-300" animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.2 }} />
                    <Phone className="w-10 h-10 text-indigo-300" />
                 </div>
               ) : (
                 <PhoneOff className="w-12 h-12 text-gray-600" />
               )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center flex-col z-10 p-2 text-center bg-black/30 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
              <div className="text-white font-medium flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-xs md:text-sm">
                  {isCalling ? (
                     isLiveConnected ? <Loader2 size={14} className="animate-spin text-indigo-400" /> : <PhoneOff size={14} className="text-yellow-400" />
                  ) : (
                     <Settings2 size={14} className="text-gray-400" />
                  )}
                  <span className="truncate max-w-[120px] md:max-w-none shadow-md drop-shadow-md">{isCalling ? (isLiveConnected ? 'กำลังสนทนา...' : 'กำลังโทร...') : 'พร้อมสนทนา'}</span>
                </div>
              </div>
            </div>
            
            {/* Active speaking indicator */}
            <AnimatePresence>
              {isLiveConnected && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-2 left-2 flex items-center justify-center pointer-events-none z-20"
                >
                   <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                     <div className="flex gap-0.5 items-end h-3">
                       <motion.div className="w-0.5 bg-green-400" animate={{ height: ["40%", "100%", "60%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} />
                       <motion.div className="w-0.5 bg-green-400" animate={{ height: ["80%", "30%", "90%", "40%", "80%"] }} transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }} />
                       <motion.div className="w-0.5 bg-green-400" animate={{ height: ["50%", "100%", "40%", "80%", "50%"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }} />
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-white text-[10px] md:text-xs backdrop-blur-sm uppercase tracking-widest font-semibold z-20`}>
              คุณครู
            </div>
          </div>
          
          {/* User Camera and Screen Share */}
          <div className="w-1/3 md:w-full md:h-1/3 md:min-h-[160px] shrink-0 bg-black rounded-2xl overflow-hidden relative shadow-inner">
            {screenStream && (
              <video 
                 ref={screenVideoRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 className="absolute inset-0 w-full h-full object-contain bg-black z-10" 
              />
            )}
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
            {!isVidOn && !screenStream && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-0">
                <VideoOff className="text-gray-400" size={24} />
              </div>
            )}
            <div className={`absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white text-[10px] md:text-xs backdrop-blur-sm uppercase tracking-widest font-semibold ${screenStream ? 'z-20' : 'z-0'}`}>
              {screenStream ? 'แชร์หน้าจอ' : 'คุณ'}
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="bg-white p-4 rounded-2xl flex justify-center gap-4 sm:gap-6 border border-gray-200 shadow-sm shrink-0 flex-wrap">
          {isCalling ? (
             <>
                <button onClick={toggleMic} className={`p-4 rounded-full ${isMicOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'bg-red-100 hover:bg-red-200 text-red-600'} transition-colors shadow-sm`}>
                  {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button onClick={toggleVid} className={`p-4 rounded-full ${isVidOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'bg-red-100 hover:bg-red-200 text-red-600'} transition-colors shadow-sm`}>
                  {isVidOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button onClick={toggleCamera} className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors shadow-sm" title="สลับกล้อง">
                  <RefreshCcw size={24} />
                </button>
                <button onClick={toggleScreenShare} className={`p-4 rounded-full ${screenStream ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border border-indigo-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition-colors shadow-sm`} title={screenStream ? "หยุดแชร์หน้าจอ" : "แชร์หน้าจอ"}>
                  {screenStream ? <MonitorOff size={24} /> : <MonitorUp size={24} />}
                </button>
                <button onClick={() => setIsDocBoardOpen(!isDocBoardOpen)} className={`p-4 rounded-full ${isDocBoardOpen ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border border-indigo-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition-colors shadow-sm`} title={isDocBoardOpen ? "ปิดกระดานอัปโหลด" : "เปิดกระดานอัปโหลด"}>
                  {isDocBoardOpen ? <Minus size={24} /> : <Plus size={24} />}
                </button>
                <button onClick={() => { setIsCalling(false); clearAskWord?.(); }} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm min-w[64px]">
                  <PhoneOff size={24} />
                </button>
             </>
          ) : (
             <button onClick={() => setIsCalling(true)} className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-3 transition-colors shadow-sm w-full sm:w-auto justify-center">
               <Phone size={24} fill="currentColor" />
               เริ่มวิดีโอคอลกับติวเตอร์
             </button>
          )}
        </div>
      </div>

      {/* Right: Board/Canvas Wrapper */}
      <div className={`w-full ${isDocBoardOpen ? 'md:w-3/4' : 'md:w-2/3'} min-h-[400px] md:min-h-0 flex flex-col xl:flex-row gap-4`}>
        
        {/* Doc Board (Optional) */}
        {isDocBoardOpen && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative min-h-[400px]">
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                 <ImagePlus size={16} /> กระดานรูปภาพ / เอกสาร
               </div>
               <div className="flex items-center gap-1">
                 {docImageBase64 && (
                   <>
                     <label className="cursor-pointer text-indigo-500 hover:text-indigo-600 transition-colors p-1" title="เปลี่ยนภาพใหม่">
                       <ImagePlus size={16} />
                       <input type="file" accept="image/*" className="hidden" onChange={handleDocUpload} />
                     </label>
                     <button onClick={() => { setDocImageBase64(null); setDocImageObj(null); docImageRef.current = null; setDocOverlayText(''); }} className="text-red-500 hover:text-red-600 transition-colors p-1" title="ลบภาพ">
                        <Trash2 size={16} />
                     </button>
                   </>
                 )}
               </div>
            </div>
            <div className="flex-1 relative overflow-auto bg-gray-100 flex items-center justify-center p-4">
               {!docImageBase64 ? (
                 <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                   <ImagePlus size={32} className="text-gray-400 mb-2" />
                   <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</span>
                   <input type="file" accept="image/*" className="hidden" onChange={handleDocUpload} />
                 </label>
               ) : (
                 <div className="relative w-full h-full">
                    <img 
                      src={docImageBase64} 
                      alt="Uploaded Doc" 
                      className="absolute top-0 left-0 origin-top-left object-contain"
                      style={{ 
                         width: '100%', 
                         height: '100%',
                         transform: `scale(${docScale}) translate(${docPan.x}px, ${docPan.y}px)`,
                         cursor: isDraggingDoc ? 'grabbing' : 'grab'
                      }}
                      onMouseDown={(e) => {
                        setIsDraggingDoc(true);
                        setDragStart({ x: e.clientX - docPan.x, y: e.clientY - docPan.y });
                      }}
                      onMouseMove={(e) => {
                        if (!isDraggingDoc) return;
                        setDocPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                      }}
                      onMouseUp={() => setIsDraggingDoc(false)}
                      onMouseLeave={() => setIsDraggingDoc(false)}
                      onWheel={(e) => {
                        e.preventDefault();
                        const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
                        setDocScale(prev => Math.max(0.5, Math.min(prev * scaleAmount, 5)));
                      }}
                    />
                    {docOverlayText && (
                      <div className="absolute top-4 left-4 right-4 bg-yellow-50/90 backdrop-blur text-yellow-900 p-4 rounded-xl shadow border border-yellow-200 pointer-events-none z-10 whitespace-pre-wrap font-medium">
                         {docOverlayText}
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Main Board */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative h-[400px] md:h-auto">
          {/* Canvas Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Edit3 size={16} /> บอร์ดการเรียน {activeLang === 'EN' ? 'อังกฤษ' : activeLang === 'CN' ? 'จีน' : 'ไทย'}
            </div>
          </div>

        {/* Canvas Content Area */}
        <div className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/50">
          <AnimatePresence mode="wait">
             {boardData ? (
               renderDynamicCanvas()
             ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full w-full text-gray-400 p-8 text-center"
                >
                  <Edit3 size={48} className="mb-4 text-gray-300" />
                  <p className="text-xl font-medium text-gray-500">กระดานเรียน</p>
                  <p className="text-sm mt-2 max-w-sm mx-auto">รอให้ติวเตอร์นำคำศัพท์หรือตัวอย่างประโยคขึ้นหน้ากระดาน...</p>
                </motion.div>
             )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
}
