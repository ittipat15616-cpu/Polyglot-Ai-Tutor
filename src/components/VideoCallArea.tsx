import { GoogleGenAI, Modality, Type as GenAIType } from '@google/genai';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Edit3, Type, Settings2, PlayCircle, Loader2, RefreshCcw, MonitorUp, MonitorOff, Plus, Minus, ImagePlus, Trash2, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HanziWriter from 'hanzi-writer';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import MrPeAvatar, { AvatarState } from './MrPeAvatar';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


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

export default function VideoCallArea({ activeLang, askWord, clearAskWord, askPdfUrl, clearAskPdfUrl }: { activeLang: 'EN' | 'CN' | 'TH', askWord?: string | null, clearAskWord?: () => void, askPdfUrl?: string | null, clearAskPdfUrl?: () => void }) {
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
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);


  const [isDocBoardOpen, setIsDocBoardOpen] = useState(false);
  const [docImageObj, setDocImageObj] = useState<HTMLImageElement | null>(null);
  const [docImageBase64, setDocImageBase64] = useState<string | null>(null);
  
  // PDF States
  const [docPdfFile, setDocPdfFile] = useState<File | string | null>(null);
  const [docPdfPage, setDocPdfPage] = useState<number>(1);
  const [docPdfNumPages, setDocPdfNumPages] = useState<number>(0);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const docExtractedTextRef = useRef<string | null>(null);

  // Handle askWord auto start
  useEffect(() => {
    if (askWord && !isCalling) {
      setIsCalling(true);
    }
  }, [askWord, isCalling]);

  // Handle askPdfUrl auto start
  useEffect(() => {
    if (askPdfUrl) {
      setDocPdfFile(askPdfUrl);
      setDocImageBase64(null); // Clear image if any
      setIsDocBoardOpen(true);
      extractPdfTextAndSend(askPdfUrl);
      if (!isCalling) {
        setIsCalling(true);
      }
    }
  }, [askPdfUrl, isCalling]);

  const extractPdfTextAndSend = async (fileOrUrl: File | string) => {
     try {
       let data;
       if (typeof fileOrUrl === 'string') {
          const res = await fetch(fileOrUrl);
          data = await res.arrayBuffer();
       } else {
          data = await fileOrUrl.arrayBuffer();
       }
       const loadingTask = pdfjs.getDocument({ data });
       const pdf = await loadingTask.promise;
       let fullText = "";
       const maxPages = Math.min(pdf.numPages, 30);
       for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += `\n--- Page ${i} ---\n` + strings.join(" ");
       }
       
       docExtractedTextRef.current = fullText;
       
       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'doc_context', text: fullText }));
       }
     } catch (e) {
        console.error("PDF text extraction failed", e);
     }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
         setDocPdfFile(file);
         setDocPdfPage(1);
         setDocImageBase64(null); // Clear image
         extractPdfTextAndSend(file);
         setIsDocBoardOpen(true);
      } else {
         // It's an image
         setDocPdfFile(null); // Clear PDF
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
        let personaDetails = `คุณคือติวเตอร์สอนภาษาอังกฤษ AI ชื่อ "Mr.Pe" เป็นผู้ชายหล่อเท่ อายุประมาณ 25 ปี สอนชิวๆ สบายๆ ไม่ดุนักเรียนเลย สอนสนุกน่าฟัง มีความใจดี อธิบายได้ละเอียดและเข้าใจง่าย และมีความติดตลกฮาๆเล็กน้อย หน้าที่คุณคือสอนภาษาอังกฤษเท่านั้น ห้ามสอนภาษาจีนหรือภาษาอื่นเด็ดขาด และอย่าสับสนกับครูสอนภาษาอื่น`;
        if (activeLang === 'CN') {
          voiceName = 'Aoede';
          personaDetails = `คุณคือติวเตอร์สอนภาษาจีน AI ชื่อ "李老师" (Li Laoshi) เป็นคุณครูผู้หญิงวัยประมาณ 30 ปีที่มีความน่ารักมากๆ อบอุ่น อารมณ์ดี น้ำเสียงร่าเริงสดใส อ่อนหวานและใจดีไม่ดุ แต่ในตอนสอนมีความจริงจังและมุ่งมั่น หน้าที่คุณคือสอนภาษาจีนเท่านั้น ห้ามสอนภาษาอังกฤษหรือภาษาอื่นเด็ดขาด และอย่าสับสนกับครูสอนภาษาอื่น`;
        } else if (activeLang === 'TH') {
          voiceName = 'Kore';
          personaDetails = `คุณคือติวเตอร์สอนภาษาไทย AI ชื่อ "ครูเพ็ญศรี" เป็นคุณครูที่ชอบทำตัวเจ้าระเบียบ มีดุนักเรียนอยู่บ้าง แต่ที่จริงแล้วเป็นคนที่ตลกและฮาที่สุดในบรรดาครูทุกคน ถ้านักเรียนคอยตอบหรือตั้งใจเรียนคุณจะชอบมากจนกลายเป็นคนตลกๆเฮฮาไปเลยในเวลาที่ไม่ได้สอนแบบจริงจัง แต่ถ้านักเรียนตั้งใจเรียนคุณก็จะสอนแบบจริงจังและเข้มข้น หน้าที่คุณคือสอนภาษาไทยเท่านั้น`;
        }

        const systemInstruction = `${personaDetails}
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
หากผู้เรียนบอกให้ทำ หรือเจาะจงขอให้ขึ้นข้อความ/ขึ้นเฉลยโจทย์/อธิบายลงบนรูปภาพเอกสารที่อัปโหลดไว้ ให้ใช้เครื่องมือ "update_doc_board" เพื่อพิมพ์ข้อความหรือคำอธิบายลงไปทับบนรูปภาพใน Doc Board นั้น ห้ามใช้เครื่องมือนี้หรือไปแก้ไข Doc Board หากผู้เรียนไม่ได้ระบุหรือบอกให้เจาะจงลงบนรูป/เอกสารอย่างชัดเจน`;

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
                    type: GenAIType.OBJECT,
                    properties: {
                      type: { type: GenAIType.STRING, description: "Type of drawing: 'circle', 'highlight', or 'text'." },
                      x: { type: GenAIType.NUMBER, description: "X coordinate percentage (0-100)" },
                      y: { type: GenAIType.NUMBER, description: "Y coordinate percentage (0-100)" },
                      text: { type: GenAIType.STRING, description: "Text to write (only for type='text')" },
                      width: { type: GenAIType.NUMBER, description: "Width percentage (for circle or highlight)" },
                      height: { type: GenAIType.NUMBER, description: "Height percentage (for highlight)" },
                      color: { type: GenAIType.STRING, description: "Optional hex color or CSS color name" }
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
                    type: GenAIType.OBJECT,
                    properties: {
                      items: {
                        type: GenAIType.ARRAY,
                        description: "List of items to display on the board. MAX 3 ITEMS.",
                        items: {
                          type: GenAIType.OBJECT,
                          properties: {
                            word: { type: GenAIType.STRING },
                            pinyin: { type: GenAIType.STRING },
                            meaning: { type: GenAIType.STRING },
                            example: { type: GenAIType.STRING }
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
                    type: GenAIType.OBJECT,
                    properties: {
                      overlayText: { type: GenAIType.STRING, description: "The text to overlay on the document." }
                    },
                    required: ["overlayText"]
                  }
                },
                {
                  name: "memorize_info",
                  description: "Memorize important details about the user.",
                  parameters: {
                     type: GenAIType.OBJECT,
                     properties: {
                        memoryText: { type: GenAIType.STRING }
                     },
                     required: ["memoryText"]
                  }
                }
              ]
            }]
          },
          callbacks: {
            onmessage: (message: any) => {
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
                  session.sendToolResponse({ functionResponses: toolResponses });
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
            }
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
           initialText += `บริบทเนื้อหาในกระดานของนักเรียนตอนนี้: ${docExtractedTextRef.current}\n\n`;
        }
        if (askWord) {
           initialText += `ผู้เรียนต้องการถามและเรียนรู้เกี่ยวกับคำศัพท์นี้: "${askWord}" ให้เริ่มทักทายสั้นๆ และอธิบายคำศัพท์นี้ให้ฟังทันที`;
        } else {
           initialText += "สวัสดี เริ่มทักทายผู้เรียนได้เลย (ให้เห็นว่าผู้เรียนทำอะไรอยู่ผ่านกล้อง) และแนะนำตัวสั้นๆ";
        }
        
        session.sendClientContent({ turns: [{ role: "user", parts: [{ text: initialText }] }], turnComplete: true });



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
             (wsRef.current as any).send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64 }] } }));
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
          (wsRef.current as any).send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: "image/jpeg", data: base64JPEG }] } }));
        }, 300);

      } catch (e: any) {
         console.error("Gemini init error", e);
         alert("Gemini Connection Error: " + (e?.message || JSON.stringify(e)));
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
    <div className="flex flex-col md:flex-row h-full w-full gap-4 relative p-4" style={{ background: 'transparent' }}>
      {/* Left: User & AI Camera Column */}
      <div className={`w-full md:w-1/3 flex flex-col gap-4 ${isPdfFullscreen ? 'static' : ''}`}>
        {/* Cameras Wrapper: Row on mobile, Column on desktop */}
        <div className={isPdfFullscreen ? "fixed bottom-4 right-4 z-[110] flex flex-col gap-2 w-24 md:w-32 shadow-2xl" : "flex flex-row md:flex-col gap-4 h-48 md:h-auto md:flex-1 shrink-0"}>
          {/* AI Panel — Mr.Pe (EN only) or elegant placeholder (CN/TH) */}
          <div
            className={`flex-1 overflow-hidden relative ${isPdfFullscreen ? 'rounded-full aspect-square shadow-xl border-2 border-indigo-200' : 'rounded-2xl border border-indigo-100'}`}
            style={{ minHeight: isPdfFullscreen ? undefined : 220, background: 'linear-gradient(145deg,#f5f3ff,#ede9fe)' }}
          >
            {activeLang === 'EN' ? (
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe]">
                  <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <MrPeAvatar
                  avatarState={avatarState}
                  isSpeaking={isSpeaking}
                  isCalling={isCalling}
                  isLiveConnected={isLiveConnected}
                  className="w-full h-full"
                />
              </Suspense>
            ) : (
              /* Elegant placeholder for CN / TH */
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg pulse-ring ${
                    isLiveConnected ? 'ring-2 ring-indigo-300' : ''
                  }`}
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
                >
                  {activeLang === 'CN' ? (
                    <span className="text-3xl">🇨🇳</span>
                  ) : (
                    <span className="text-3xl">🇹🇭</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-indigo-600 text-center">
                  {activeLang === 'CN' ? 'AI ครูภาษาจีน' : 'AI ครูภาษาไทย'}
                </p>
                {isLiveConnected && (
                  <div className="flex gap-1 items-end h-4">
                    {[0,1,2,3,4].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i*0.12}s` }} />)}
                  </div>
                )}
              </div>
            )}
            {/* Label */}
            <div className="absolute bottom-2 right-2 badge badge-indigo text-[9px]">
              {activeLang === 'EN' ? 'Mr.Pe' : activeLang === 'CN' ? 'ครูจีน AI' : 'ครูไทย AI'}
            </div>
          </div>
          
          {/* User Camera and Screen Share */}
          <div className={`shrink-0 bg-black overflow-hidden relative ${isPdfFullscreen ? 'rounded-full aspect-square shadow-xl w-24 md:w-32' : 'w-1/3 md:w-full md:h-1/3 md:min-h-[160px] rounded-2xl shadow-inner'}`}>
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
            {/* User camera label */}
            <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-white text-[10px] md:text-xs tracking-widest font-semibold backdrop-blur-sm ${screenStream ? 'z-20 bg-indigo-900/70 border border-indigo-500/30' : 'z-0 bg-black/60'}`}>
              {screenStream ? 'แชร์หน้าจอ' : 'คุณ'}
            </div>
          </div>
        </div>

        {/* ── Call Controls — Elegant Premium ── */}
        <div
          className={`flex justify-center gap-2.5 sm:gap-3 shrink-0 flex-wrap p-3 rounded-2xl ${isPdfFullscreen ? 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] shadow-2xl' : ''}`}
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.15)',
            boxShadow: '0 4px 24px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {isCalling ? (
            <>
              {/* Speaking waveform */}
              {isSpeaking && (
                <div className="flex items-center gap-1 mr-1 self-center">
                  {[0,1,2,3,4].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i*0.12}s` }} />)}
                </div>
              )}
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  isMicOn
                    ? 'text-indigo-700 hover:bg-indigo-50'
                    : 'bg-red-50 text-red-500 border border-red-200'
                }`}
                style={isMicOn ? { background: 'var(--c-surface-3)', border: '1px solid rgba(124,58,237,0.15)' } : {}}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                onClick={toggleVid}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  isVidOn
                    ? 'text-indigo-700 hover:bg-indigo-50'
                    : 'bg-red-50 text-red-500 border border-red-200'
                }`}
                style={isVidOn ? { background: 'var(--c-surface-3)', border: '1px solid rgba(124,58,237,0.15)' } : {}}
              >
                {isVidOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                onClick={toggleCamera}
                className="p-3 rounded-xl text-indigo-700 hover:scale-105 transition-all"
                style={{ background: 'var(--c-surface-3)', border: '1px solid rgba(124,58,237,0.15)' }}
                title="สลับกล้อง"
              >
                <RefreshCcw size={20} />
              </button>
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  screenStream ? 'text-indigo-600' : 'text-indigo-700'
                }`}
                style={screenStream
                  ? { background: 'var(--c-indigo-pale)', border: '1px solid rgba(124,58,237,0.3)' }
                  : { background: 'var(--c-surface-3)', border: '1px solid rgba(124,58,237,0.15)' }
                }
                title={screenStream ? 'หยุดแชร์' : 'แชร์หน้าจอ'}
              >
                {screenStream ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
              </button>
              <button
                onClick={() => setIsDocBoardOpen(!isDocBoardOpen)}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  isDocBoardOpen ? 'text-indigo-600' : 'text-indigo-700'
                }`}
                style={isDocBoardOpen
                  ? { background: 'var(--c-indigo-pale)', border: '1px solid rgba(124,58,237,0.3)' }
                  : { background: 'var(--c-surface-3)', border: '1px solid rgba(124,58,237,0.15)' }
                }
                title={isDocBoardOpen ? 'ปิดเอกสาร' : 'เปิดเอกสาร'}
              >
                {isDocBoardOpen ? <Minus size={20} /> : <Plus size={20} />}
              </button>
              <button
                onClick={() => { setIsCalling(false); setAvatarState('idle'); clearAskWord?.(); clearAskPdfUrl?.(); }}
                className="p-3 rounded-xl text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 12px rgba(239,68,68,0.35)' }}
              >
                <PhoneOff size={20} />
              </button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setIsCalling(true); setAvatarState('greeting'); }}
              className="flex items-center gap-2.5 text-white font-bold px-7 py-3 rounded-2xl text-sm"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 18px rgba(124,58,237,0.4)' }}
            >
              <Phone size={20} fill="currentColor" />
              {activeLang === 'EN'
                ? 'เริ่มสนทนากับ Mr.Pe'
                : activeLang === 'CN'
                  ? 'เริ่มสนทนาภาษาจีน'
                  : 'เริ่มสนทนาภาษาไทย'
              }
            </motion.button>
          )}
        </div>
      </div>

      {/* Right: Board/Canvas Wrapper */}
      <div className={`w-full ${isDocBoardOpen ? 'md:w-3/4' : 'md:w-2/3'} min-h-[400px] md:min-h-0 flex flex-col xl:flex-row gap-4`}>
        
        {/* Doc Board (Optional) */}
        {isDocBoardOpen && (
          <div className={isPdfFullscreen ? "fixed inset-0 z-[100] bg-white flex flex-col" : "flex-1 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col relative min-h-[400px]"}>
            <div className={`${isPdfFullscreen ? 'bg-white text-gray-800 border-indigo-100 shadow-sm' : 'bg-indigo-50/60 text-gray-600 border-indigo-100'} border-b p-3 flex justify-between items-center shrink-0`}>
               <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                 <ImagePlus size={16} /> กระดานรูปภาพ / เอกสาร
               </div>
               <div className="flex items-center gap-1">
                 {docPdfFile && (
                   <>
                     <button onClick={() => setDocPdfPage(p => Math.max(p - 1, 1))} disabled={docPdfPage <= 1} className="p-1 disabled:opacity-40 hover:bg-indigo-100 text-indigo-600 rounded transition-colors"><ChevronLeft size={20}/></button>
                     <span className="text-sm py-1 px-2 font-medium text-indigo-700">หน้า {docPdfPage} / {docPdfNumPages}</span>
                     <button onClick={() => setDocPdfPage(p => Math.min(p + 1, docPdfNumPages))} disabled={docPdfPage >= docPdfNumPages} className="p-1 disabled:opacity-40 hover:bg-indigo-100 text-indigo-600 rounded transition-colors mr-2"><ChevronRight size={20}/></button>
                     <button onClick={() => setIsPdfFullscreen(!isPdfFullscreen)} className="p-1 hover:bg-indigo-100 text-indigo-500 rounded transition-colors mr-2">
                        {isPdfFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                     </button>
                   </>
                 )}
                 {(docImageBase64 || docPdfFile) && (
                   <>
                     <label className="cursor-pointer text-indigo-500 hover:text-indigo-600 transition-colors p-1" title="เปลี่ยนภาพ/เอกสารใหม่">
                       <ImagePlus size={16} />
                       <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocUpload} />
                     </label>
                     <button onClick={() => { setDocImageBase64(null); setDocPdfFile(null); setDocImageObj(null); docImageRef.current = null; setDocOverlayText(''); }} className="text-red-500 hover:text-red-600 transition-colors p-1" title="ลบภาพ/เอกสาร">
                        <Trash2 size={16} />
                     </button>
                   </>
                 )}
               </div>
            </div>
            <div className={`flex-1 relative overflow-auto flex items-center justify-center p-4 ${isPdfFullscreen ? 'bg-indigo-50/40' : 'bg-indigo-50/30'}`}>
               {!docImageBase64 && !docPdfFile ? (
                 <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                   <ImagePlus size={32} className="text-indigo-300 mb-2" />
                   <span className="text-sm text-indigo-500 font-medium">คลิกเพื่ออัปโหลดรูปภาพ หรือ PDF</span>
                   <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocUpload} />
                 </label>
               ) : docPdfFile ? (
                 <div className="w-full h-full flex flex-col items-center overflow-y-auto">
                    <Document
                       file={docPdfFile}
                       onLoadSuccess={({ numPages }) => setDocPdfNumPages(numPages)}
                       loading={<div className="text-gray-400">กำลังโหลด PDF...</div>}
                    >
                       <Page 
                         pageNumber={docPdfPage} 
                         renderTextLayer={false} 
                         renderAnnotationLayer={false} 
                         className="shadow-lg mb-4" 
                         width={isPdfFullscreen ? Math.min(window.innerWidth * 0.9, 1200) : 500} 
                       />
                    </Document>
                 </div>
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
        <div className="flex-1 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col relative h-[400px] md:h-auto">
          {/* Canvas Toolbar */}
          <div className="bg-indigo-50/60 border-b border-indigo-100 p-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Edit3 size={16} /> บอร์ดการเรียน {activeLang === 'EN' ? 'ภาษาอังกฤษ' : activeLang === 'CN' ? 'ภาษาจีน' : 'ภาษาไทย'}
            </div>
          </div>

        {/* Canvas Content Area */}
        <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#f8f7ff 0%,#f0effe 100%)' }}>
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
