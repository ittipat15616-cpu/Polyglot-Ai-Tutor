import { GoogleGenerativeAI } from '@google/generative-ai';
import React, { useState, useEffect, useRef } from 'react';
import { FileSignature, Play, Settings, ArrowRight, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { allCNVocab, allENVocab, VocabWord } from '../data/vocabData';
import AnnotationToolbar, { AnnotationState } from './AnnotationToolbar';
import AnnotatableArea from './AnnotatableArea';

interface VocabExamAreaProps {
  activeLang: 'EN' | 'CN' | 'TH';
  onAskAI?: (prompt: string) => void;
}

type ExamState = 'SETUP' | 'TESTING' | 'RESULT';

interface Answer {
  wordId: string;
  userWord: string;
  userTranslation: string;
  isWordCorrect?: boolean;
  isTranslationCorrect?: boolean;
}

export default function VocabExamArea({ activeLang }: VocabExamAreaProps) {
  const [examState, setExamState] = useState<ExamState>('SETUP');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [scopeRange, setScopeRange] = useState('1-20');
  
  const [examWords, setExamWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [annotationState, setAnnotationState] = useState<AnnotationState>({
    activeTool: 'none',
    color: '#3b82f6',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif'
  });
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isAIGrading, setIsAIGrading] = useState(false);

  const lang = activeLang === 'CN' ? 'CN' : 'EN';
  const fullVocab = lang === 'CN' ? allCNVocab : allENVocab;
  const levels = ['ALL', ...Array.from(new Set(fullVocab.map(v => v.level)))];

  // Ref for timer
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakWord = async (wordText: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: wordText, lang: lang === 'CN' ? 'CN' : 'EN' })
      });
      const data = await response.json();
      if (data.audio) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        audio.play();
      }
    } catch (e) {
      console.error('TTS error', e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(wordText);
        utterance.lang = lang === 'CN' ? 'zh-CN' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const startExam = () => {
    // Filter by level
    const filtered = levelFilter === 'ALL' ? fullVocab : fullVocab.filter(v => v.level === levelFilter);
    
    // Parse scope (e.g. 1-20)
    let start = 0, end = 20;
    try {
      const parts = scopeRange.split('-');
      start = Math.max(0, parseInt(parts[0]) - 1);
      end = parseInt(parts[1]);
    } catch(e) {}
    
    let scopeWords = filtered.slice(start, end);
    // Randomize
    scopeWords = scopeWords.sort(() => Math.random() - 0.5);
    // Take max 20
    const finalWords = scopeWords.slice(0, 20);

    if (finalWords.length === 0) {
      alert("ไม่มีคำศัพท์ในช่วงที่เลือกครับ");
      return;
    }

    if (window.confirm(`เริ่มสอบคำศัพท์จำนวน ${finalWords.length} คำ ระบบจะจับเวลา 30 วินาทีต่อคำ พร้อมแล้วกด OK เลยครับ!`)) {
      setExamWords(finalWords);
      setCurrentIndex(0);
      setAnswers({});
      setExamState('TESTING');
      
      // Start first word
      speakWord(finalWords[0].word);
      setTimeLeft(30);
    }
  };

  // Timer effect
  useEffect(() => {
    if (examState === 'TESTING') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextWord();
            return 30; // reset for next word
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [examState, currentIndex]);

  const handleNextWord = () => {
    if (currentIndex < examWords.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setTimeLeft(30);
      speakWord(examWords[nextIdx].word);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    clearInterval(timerRef.current);
    
    const preliminaryAnswers: Record<string, Answer> = {};
    const apiPayload: any[] = [];
    
    examWords.forEach(word => {
      const userAns = answers[word.id] || { wordId: word.id, userWord: '', userTranslation: '' };
      const isWordCorrect = userAns.userWord.trim().toLowerCase() === word.word.trim().toLowerCase();
      
      preliminaryAnswers[word.id] = {
        ...userAns,
        isWordCorrect,
        isTranslationCorrect: false
      };

      if (userAns.userTranslation.trim() !== '') {
        apiPayload.push({
          wordId: word.id,
          targetWord: word.word,
          officialTranslations: word.translations,
          userTranslation: userAns.userTranslation.trim()
        });
      }
    });
    
    setAnswers(preliminaryAnswers);
    setIsAIGrading(true);

    try {
      if (apiPayload.length > 0) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Missing API Key");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
You are a very lenient language evaluator for ${lang === 'CN' ? 'Chinese' : 'English'} to Thai translations.
I will provide a list of vocabulary words, their official Thai translations, and the user's typed Thai translation.
Your task is to determine if the user's translation has the correct meaning.

**CRITICAL RULES:**
- Be EXTREMELY lenient. If the user's translation is a synonym, has a close meaning, is a slightly different phrasing, or an informal variation, mark it as CORRECT ("isTranslationCorrect": true).
- If the user types a correct meaning that is not in the official list but is still a valid translation of the source word in Thai, mark it as CORRECT.
- Do NOT be strict about exact matching. As long as the core meaning is right, it is correct.
- Only mark as false if the meaning is completely wrong, unrelated, or blank.

Here are the words to grade:
${JSON.stringify(apiPayload, null, 2)}

Return a strict JSON array matching this format exactly:
[
  {
    "wordId": "string",
    "isTranslationCorrect": true
  }
]
`;

        const aiResult = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        });
        const responseText = aiResult.response.text();
        const aiResults = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        
        const finalAnswers = { ...preliminaryAnswers };
        if (Array.isArray(aiResults)) {
          aiResults.forEach((res: any) => {
            if (finalAnswers[res.wordId]) {
              finalAnswers[res.wordId].isTranslationCorrect = res.isTranslationCorrect;
            }
          });
        }
        setAnswers(finalAnswers);
      }
    } catch (e: any) {
      console.error("AI grading failed", e);
      alert("AI Grading Error: " + (e.message || String(e)));
      const fallbackAnswers = { ...preliminaryAnswers };
      examWords.forEach(w => {
         const userT = fallbackAnswers[w.id].userTranslation.trim().toLowerCase();
         if (userT) {
           fallbackAnswers[w.id].isTranslationCorrect = w.translations.some(t => {
             const official = t.trim().toLowerCase();
             return official === userT || official.includes(userT) || userT.includes(official);
           });
         }
      });
      setAnswers(fallbackAnswers);
    } finally {
      setIsAIGrading(false);
      setExamState('RESULT');
    }
  };

  const currentWordObj = examWords[currentIndex];
  const currentAnswer = currentWordObj ? (answers[currentWordObj.id] || { wordId: currentWordObj.id, userWord: '', userTranslation: '' }) : null;

  const handleAnswerChange = (field: 'userWord' | 'userTranslation', value: string) => {
    if (!currentWordObj) return;
    setAnswers({
      ...answers,
      [currentWordObj.id]: {
        ...(answers[currentWordObj.id] || { wordId: currentWordObj.id, userWord: '', userTranslation: '' }),
        [field]: value
      }
    });
  };

  // Calculate scores for Result page
  const totalQuestions = examWords.length;
  let correctWords = 0;
  let correctTrans = 0;
  
  if (examState === 'RESULT') {
    examWords.forEach(word => {
      if (answers[word.id]?.isWordCorrect) correctWords++;
      if (answers[word.id]?.isTranslationCorrect) correctTrans++;
    });
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      
      <div className="absolute top-4 left-0 w-full z-50 pointer-events-none flex justify-center">
        <div className="pointer-events-auto">
          <AnnotationToolbar
            state={annotationState}
            onChange={setAnnotationState}
            onClear={() => setClearTrigger(prev => prev + 1)}
            showEraserWarning={false}
            disableFontFamily={true}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-24 px-4 pb-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
          
          {/* Sidebar */}
          {examState === 'SETUP' && (
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/50">
                <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold">
                  <Settings size={20} />
                  <h3>ตั้งค่าการสอบ</h3>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">ระดับคำศัพท์</label>
                  <select 
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {levels.map(l => (
                      <option key={l} value={l}>{l === 'ALL' ? 'ทั้งหมด' : l}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">ช่วงคำที่สอบ (เช่น 1-20)</label>
                  <input 
                    type="text" 
                    value={scopeRange}
                    onChange={(e) => setScopeRange(e.target.value)}
                    placeholder="1-20"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button 
                  onClick={startExam}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  <Play size={18} /> เริ่มสอบ (ทีละ 20 คำ)
                </button>
              </div>
            </div>
          )}

          {/* Main Area */}
          <div className="flex-1 flex flex-col h-full min-h-[400px]">
            {isAIGrading && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 md:p-12 relative">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
                 <h2 className="text-2xl font-bold text-indigo-700">กำลังให้ AI ตรวจคำแปล...</h2>
                 <p className="text-gray-500 mt-2">โปรดรอสักครู่ ระบบกำลังพิจารณาความหมาย</p>
              </div>
            )}

            {!isAIGrading && examState === 'SETUP' && (
              <AnnotatableArea
                id={`vocab_exam_scratchpad_${lang}`}
                annotationState={annotationState}
                clearTrigger={clearTrigger}
                isActive={annotationState.activeTool !== 'none'}
                className="w-full h-full min-h-[500px] bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 flex flex-col"
              >
                <div className="p-8 h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
                  <FileSignature size={64} className="text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-500 mb-2">กระดานทด (Scratchpad)</h2>
                  <p className="max-w-md">พื้นที่นี้ให้คุณสามารถใช้แถบเครื่องมือด้านบนเพื่อวาดเขียน พิมพ์ หรือทดเลขได้อย่างอิสระ เมื่อพร้อมแล้ว กด "เริ่มสอบ" ที่เมนูด้านซ้ายได้เลยครับ</p>
                </div>
              </AnnotatableArea>
            )}

            {!isAIGrading && examState === 'TESTING' && currentWordObj && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 md:p-12 relative">
                
                {/* Timer & Progress */}
                <div className="absolute top-6 left-6 text-sm font-medium text-gray-500">
                  ข้อ {currentIndex + 1} / {examWords.length}
                </div>
                <div className={`absolute top-6 right-6 text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                  00:{timeLeft.toString().padStart(2, '0')}
                </div>

                <div className="w-full max-w-lg">
                  <button 
                    onClick={() => speakWord(currentWordObj.word)}
                    className="mx-auto flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors mb-8 shadow-sm"
                  >
                    <Play size={32} className="ml-1" />
                  </button>
                  
                  <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg border border-yellow-200 mb-6 text-center">
                    <b>หมายเหตุ:</b> หากคำศัพท์มีคำแปลหลายคำ ให้เขียนคำแปลอันไหนก็ได้มา 1 อันเท่านั้น
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">คำศัพท์</label>
                      <input 
                        type="text"
                        value={currentAnswer?.userWord || ''}
                        onChange={(e) => handleAnswerChange('userWord', e.target.value)}
                        placeholder={lang === 'CN' ? 'พิมพ์ตัวจีน...' : 'Type English word...'}
                        className="w-full text-xl p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">คำแปล</label>
                      <input 
                        type="text"
                        value={currentAnswer?.userTranslation || ''}
                        onChange={(e) => handleAnswerChange('userTranslation', e.target.value)}
                        placeholder="พิมพ์คำแปลภาษาไทย..."
                        className="w-full text-xl p-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleNextWord}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                    >
                      {currentIndex === examWords.length - 1 ? 'ส่งคำตอบ' : 'ข้อถัดไป'} <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isAIGrading && examState === 'RESULT' && (
              <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 md:p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">สรุปผลการสอบ</h2>
                  <div className="flex justify-center gap-8 mt-6">
                    <div className="bg-green-50 text-green-700 px-6 py-4 rounded-2xl border border-green-200 flex flex-col items-center">
                      <span className="text-sm font-medium mb-1">ศัพท์ถูก</span>
                      <span className="text-4xl font-black">{correctWords}<span className="text-lg text-green-600/70">/{totalQuestions}</span></span>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-6 py-4 rounded-2xl border border-blue-200 flex flex-col items-center">
                      <span className="text-sm font-medium mb-1">แปลถูก</span>
                      <span className="text-4xl font-black">{correctTrans}<span className="text-lg text-blue-600/70">/{totalQuestions}</span></span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setExamState('SETUP')}
                    className="mt-8 mx-auto flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    <RotateCcw size={18} /> สอบใหม่อีกครั้ง
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {examWords.map((word, i) => {
                    const userAns = answers[word.id];
                    return (
                      <div key={word.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-4 min-w-[200px]">
                           <span className="text-gray-400 font-bold w-6 text-right">{i+1}.</span>
                           <div>
                             <div className="text-xl font-bold text-gray-800">{word.word}</div>
                             <div className="text-sm text-gray-500">{lang === 'CN' ? word.pinyin : word.phonetic}</div>
                           </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-4">
                           {/* Word checking */}
                           <div className={`p-3 rounded-lg border ${userAns?.isWordCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="text-xs text-gray-500 mb-1">คำตอบ (ศัพท์)</div>
                              <div className="flex items-center justify-between">
                                 <span className={!userAns?.userWord ? 'text-gray-400 italic' : 'text-gray-800 font-medium'}>
                                   {userAns?.userWord || 'ไม่ได้ตอบ'}
                                 </span>
                                 {userAns?.isWordCorrect ? <CheckCircle size={18} className="text-green-500"/> : <XCircle size={18} className="text-red-500"/>}
                              </div>
                           </div>

                           {/* Translation checking */}
                           <div className={`p-3 rounded-lg border ${userAns?.isTranslationCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="text-xs text-gray-500 mb-1">คำตอบ (แปล)</div>
                              <div className="flex items-center justify-between">
                                 <span className={!userAns?.userTranslation ? 'text-gray-400 italic' : 'text-gray-800 font-medium'}>
                                   {userAns?.userTranslation || 'ไม่ได้ตอบ'}
                                 </span>
                                 {userAns?.isTranslationCorrect ? <CheckCircle size={18} className="text-green-500"/> : <XCircle size={18} className="text-red-500"/>}
                              </div>
                              {!userAns?.isTranslationCorrect && (
                                <div className="text-xs text-green-600 mt-2">
                                  เฉลย: {word.translations.join(', ')}
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
