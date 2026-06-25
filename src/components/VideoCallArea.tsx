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
        let personaDetails = `คุณคือติวเตอร์สอนภาษาอังกฤษ AI ชื่อ "Mr.Pe" เป็นผู้ชายหล่อเท่ อายุประมาณ 25 ปี สอนชิวๆ สบายๆ ไม่ดุนักเรียนเลย สอนสนุกน่าฟัง มีความใจดี อธิบายได้ละเอียดและเข้าใจง่าย และมีความติดตลกฮาๆเล็กน้อย`;
        if (activeLang === 'CN') {
          voiceName = 'Aoede';
          personaDetails = `คุณคือติวเตอร์สอนภาษาจีน AI ชื่อ "李老师" (Li Laoshi) เป็นคุณครูผู้หญิงวัยประมาณ 30 ปีที่มีความน่ารักมากๆ อบอุ่น อารมณ์ดี น้ำเสียงร่าเริงสดใส อ่อนหวานและใจดีไม่ดุ แต่ในตอนสอนมีความจริงจังและมุ่งมั่น`;
        } else if (activeLang === 'TH') {
          voiceName = 'Kore';
          personaDetails = `คุณคือติวเตอร์สอนภาษาไทย AI ชื่อ "ครูเพ็ญศรี" เป็นคุณครูที่ชอบทำตัวเจ้าระเบียบ มีดุนักเรียนอยู่บ้าง แต่ที่จริงแล้วเป็นคนที่ตลกและฮาที่สุดในบรรดาครูทุกคน ถ้านักเรียนคอยตอบหรือตั้งใจเรียนคุณจะชอบมากจนกลายเป็นคนตลกๆเฮฮาไปเลยในเวลาที่ไม่ได้สอนแบบจริงจัง แต่ถ้านักเรียนตั้งใจเรียนคุณก็จะสอนแบบจริงจังและเข้มข้น`;
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

        
        (async () => {
          try {
            for await (const message of session.receive()) {
              
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
            const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 
            }
          } catch (e) {
            console.error("Receive loop error:", e);
          }
        })();
        er:bg-indigo-100 text-indigo-600 rounded transition-colors mr-2"><ChevronRight size={20}/></button>
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
