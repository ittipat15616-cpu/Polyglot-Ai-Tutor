import React, { useState, useCallback } from 'react';
import { 
  ChevronLeft, BookOpen, GraduationCap, ArrowRight, Volume2, Bot
} from 'lucide-react';
import { getVocabData } from '../data/mockContent';

interface NavNode {
  id: string;
  title: string;
  data?: any;
}

export default function LessonsArea({ activeLang, onAskAI }: { activeLang: 'EN' | 'CN' | 'TH', onAskAI?: (word: string) => void }) {
  const getInitialStack = (lang: 'EN' | 'CN' | 'TH'): NavNode[] => {
    if (lang === 'EN') return [{ id: 'EN_OPTIONS', title: 'English' }];
    if (lang === 'CN') return [{ id: 'CN', title: '中文' }];
    return [{ id: 'TH', title: 'ภาษาไทย' }];
  };

  const [stack, setStack] = useState<NavNode[]>(getInitialStack(activeLang));
  const current = stack[stack.length - 1];

  React.useEffect(() => {
    setStack(getInitialStack(activeLang));
  }, [activeLang]);

  const push = (node: NavNode) => setStack((prev) => [...prev, node]);
  const pop = () => setStack((prev) => prev.length > 1 ? prev.slice(0, -1) : prev);
  const goToStart = () => setStack(getInitialStack(activeLang));

  // Determine current language from stack
  const langNode = stack.find(n => n.id === 'EN' || n.id === 'EN_CEFR' || n.id === 'CN' || n.id === 'TH' || n.id === 'EN_GRAMMAR');
  const langKey = langNode ? langNode.id : activeLang; // fallback to activeLang

  const [isPlayingAI, setIsPlayingAI] = useState(false);

  const playAudio = useCallback(async (text: string, forceLang?: string) => {
    if (!text) return;
    const langToUse = forceLang || langKey;
    
    if (langToUse === 'EN' || langToUse === 'EN_CEFR' || langToUse === 'EN_GRAMMAR' || langToUse === 'CN' || langToUse === 'TH') {
      // ⚡ Play instantly with Speech Synthesis first (zero delay)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const quickUtterance = new SpeechSynthesisUtterance(text);
        if (langToUse === 'CN') { quickUtterance.lang = 'zh-CN'; quickUtterance.rate = 0.85; }
        else if (langToUse === 'TH') { quickUtterance.lang = 'th-TH'; quickUtterance.rate = 0.9; }
        else { quickUtterance.lang = 'en-US'; quickUtterance.rate = 0.9; }
        window.speechSynthesis.speak(quickUtterance);
      }
      setIsPlayingAI(true);
      
      try {
        const actualTTSLang = langToUse === 'EN_GRAMMAR' ? 'EN' : langToUse;
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang: actualTTSLang })
        });
        const data = await res.json();
        
        if (data.audio) {
          // Cancel quick speech synthesis and play high-quality server audio
          window.speechSynthesis?.cancel();
          if ((window as any).currentEdgeAudio) {
            (window as any).currentEdgeAudio.pause();
            (window as any).currentEdgeAudio.currentTime = 0;
          }
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          (window as any).currentEdgeAudio = audio;
          audio.onended = () => setIsPlayingAI(false);
          audio.onerror = () => setIsPlayingAI(false);
          audio.play().catch(() => setIsPlayingAI(false));
          return;
        }
      } catch (err) {
        console.error('TTS server error, using Speech Synthesis', err);
      }
      setIsPlayingAI(false);
      return;
    }


    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (langToUse === 'EN' || langToUse === 'EN_CEFR' || langToUse === 'EN_GRAMMAR') {
        utterance.lang = 'en-US';
    } else if (langToUse === 'CN') {
        utterance.lang = 'zh-CN';
    } else {
        utterance.lang = 'th-TH';
    }
    
    window.speechSynthesis.speak(utterance);
  }, [langKey]);

  // --- Views ---

  const renderEnglishOptions = () => (
    <div className="animate-in fade-in duration-300">
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold mb-3">เลือกหลักสูตรที่ต้องการ</h2>
        <p className="text-gray-500 mb-10">เลือกมาตรฐาน หรือระดับทักษะภาษาอังกฤษที่คุณสนใจ</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button onClick={() => push({ id: 'EN', title: 'English IELTS' })} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group text-left">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">🇬🇧</div>
            <h3 className="text-2xl font-bold mb-2">English (IELTS)</h3>
            <p className="text-gray-500 text-sm">บทเรียนคำศัพท์ IELTS 1000 คำ (บทละ 50 คำ)</p>
          </button>

          <button onClick={() => push({ id: 'EN_CEFR', title: 'English CEFR' })} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group text-left">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">🌍</div>
            <h3 className="text-2xl font-bold mb-2">English (CEFR)</h3>
            <p className="text-gray-500 text-sm">อิงตามมาตรฐานยุโรป (A1 - C2)</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCourseLevels = () => {
    let levels: string[] = [];

    if (langKey === 'EN') {
      levels = Array.from({ length: 20 }, (_, i) => `IELTS Lesson ${i + 1}`);
    } else if (langKey === 'EN_CEFR') {
      levels = ['CEFR Level A1', 'CEFR Level A2', 'CEFR Level B1', 'CEFR Level B2', 'CEFR Level C1', 'CEFR Level C2'];
    } else if (langKey === 'EN_GRAMMAR') {
      levels = ['Basic Grammar', 'Intermediate Grammar', 'Advanced Grammar'];
    } else if (langKey === 'CN') {
      levels = Array.from({ length: 6 }, (_, i) => `HSK Level ${i + 1}`);
      levels.push('HSK Level 7-9');
    } else {
      levels = Array.from({ length: 5 }, (_, i) => `ศัพท์ระดับ ${i + 1}`);
    }

    return (
      <div className="animate-in fade-in duration-300">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">เลือกระดับความยาก</h2>
              <p className="text-gray-500 text-sm">อิงตามมาตรฐานการวัดระดับทางภาษา</p>
            </div>
            <span className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-full font-medium shadow-sm inline-flex items-center justify-center">
              สลับระดับได้ตลอดเวลา 🔄
            </span>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {levels.map((l) => (
              <button 
                key={l} 
                onClick={() => {
                  if (langKey === 'EN_GRAMMAR') {
                    push({ id: 'vocab_list', title: l, data: { level: l, lesson: 1 } });
                  } else if (langKey === 'EN') {
                    push({ id: 'vocab_list', title: l, data: { level: l, lesson: 1 } });
                  } else {
                    push({ id: 'course_lessons', title: l, data: { level: l } });
                  }
                }} 
                className="bg-white px-6 py-8 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 hover:shadow-md transition-all font-semibold text-lg text-center text-gray-800"
              >
                {l}
              </button>
            ))}
         </div>
      </div>
    );
  };

  const renderCourseLessons = () => {
    const levelName = current.data?.level || '';
    
    let isC2 = levelName === 'CEFR Level C2';
    
    const c2Categories = [
      'โลกธุรกิจ',
      'โลกแห่งการเมือง',
      'การจ้างงาน',
      'อาชญากรรมและการลงโทษ',
      'ลักษณะของผู้คน',
      'ความยากจนและปัญหาสังคม',
      'อาหาร การเดินทาง และวันหยุด',
      'ปัญหาที่คนหนุ่มสาวต้องเผชิญ',
      'วงการบันเทิงและสื่อมวลชน',
      'ปัญหาสิ่งแวดล้อมและธรรมชาติ'
    ];
    
    let numLessons = 10;
    if (levelName === 'HSK Level 7-9') {
      numLessons = 57;
    }
    const lessons = isC2 ? c2Categories : Array.from({ length: numLessons }, (_, i) => String(i + 1));
    const queryLang = langKey === 'EN_CEFR' ? 'EN' : (langKey || 'EN');

    return (
      <div className="animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold mb-2">บทย่อยสำหรับ {levelName}</h2>
        <p className="text-gray-500 mb-8">{isC2 ? 'คลิกเข้าหมวดหมู่พื่อศึกษาคำศัพท์เฉพาะทาง' : 'คลิกเข้าบทย่อยเพื่อศึกษาคำศัพท์'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((item, index) => {
            const displayNum = index + 1;
            const title = isC2 ? `${item}` : `บทที่ ${item}`;
            const vocabCount = getVocabData(queryLang, levelName, item).length;
            
            return (
              <button 
                key={index} 
                onClick={() => push({ id: 'vocab_list', title: title, data: { ...current.data, lesson: item, isC2 } })} 
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between group gap-3"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xl border border-indigo-100">
                    {displayNum}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate w-full pr-2" title={title}>{title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">รวมคำศัพท์ {vocabCount} คำ</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all hidden lg:block" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVocabList = () => {
    const isEn = langKey === 'EN' || langKey === 'EN_CEFR' || langKey === 'EN_GRAMMAR';
    const isCn = langKey === 'CN';
    
    let listTitle = current.title;
    let listCategory = current.title;
    let lessonNum = 1;
    
    if (current.data?.level) {
        listCategory = `${current.data.level}`;
        lessonNum = current.data.lesson || 1;
    }

    let queryLang = langKey === 'EN_CEFR' ? 'EN' : (langKey || 'EN');
    const items = getVocabData(queryLang, listCategory, lessonNum);

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{listCategory === listTitle ? listCategory : `${listCategory} - ${listTitle}`}</h2>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-indigo-100">
                {items.length} คำ
              </div>
            </div>
            <p className="text-gray-500 mb-8">เรียนรู้คำศัพท์ จำความหมาย และตัวอย่างการนำไปใช้</p>
            
            {items.length === 0 ? (
              <div className="bg-white flex flex-col items-center justify-center py-20 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">กำลังรอข้อมูลคำศัพท์</h3>
                <p className="text-gray-500 max-w-sm">โปรดอัปโหลดหรือเพิ่มไฟล์คำศัพท์ผ่านแชท ข้อมูลจะแสดงที่นี่เมื่อพร้อม</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                  {items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-4">
                          <div>
                              <div className="flex items-center gap-3 mb-2">
                                  <span className={`text-3xl font-bold text-gray-900 ${isCn ? 'font-serif' : ''}`}>{item.word}</span>
                                  <button 
                                    onClick={() => playAudio(item.word)}
                                    className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-600 hover:text-white transition-colors"
                                    title="ฟังเสียงคำศัพท์"
                                  >
                                      <Volume2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => onAskAI?.(item.word)}
                                    className="w-8 h-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0 hover:bg-purple-600 hover:text-white transition-colors"
                                    title="ถามติวเตอร์ AI"
                                  >
                                      <Bot size={16} />
                                  </button>
                                  {isEn && item.type && <span className="text-indigo-500 font-medium">{item.type}</span>}
                                  {isEn && item.phonetic && <span className="text-gray-400 font-mono text-sm">{item.phonetic}</span>}
                                  {isCn && item.pinyin && <span className="text-gray-400 font-mono text-sm">{item.pinyin}</span>}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">🇹🇭 {item.th}</span>
                                  {isEn && item.cn && <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium">🇨🇳 {item.cn}</span>}
                                  {isCn && item.en && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">🇬🇧 {item.en}</span>}
                              </div>
                              {item.example && (
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                      <div className="flex gap-4 items-start justify-between">
                                          <div className="flex-1">
                                              <div className="text-gray-800 text-lg mb-1 leading-relaxed">
                                                  {item.example}
                                              </div>
                                              {(item.exampleTh || item.example_th) && (
                                                  <div className="text-gray-500 text-sm">
                                                      แปล: {item.exampleTh || item.example_th}
                                                  </div>
                                              )}
                                          </div>
                                          <button 
                                            onClick={() => playAudio(item.example)}
                                            className="shrink-0 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                                            title="ฟังเสียงประโยค"
                                          >
                                              <Volume2 size={16} />
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full h-full relative">
      {/* Dynamic Breadcrumbs & Controls */}
      {stack.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-2 border-b border-gray-200/50">
          <button onClick={goToStart} className="text-gray-500 hover:text-indigo-600 font-medium transition-colors">
            หน้าแรก
          </button>
          
          {stack.slice(1).map((node, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <React.Fragment key={node.id + i}>
                <ChevronLeft size={14} className="text-gray-400 rotate-180 shrink-0" />
                <button 
                  onClick={() => isLast ? null : setStack(stack.slice(0, i + 2))}
                  className={`font-medium transition-colors truncate max-w-[150px] sm:max-w-[200px] ${isLast ? 'text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md' : 'text-gray-500 hover:text-indigo-600'}`}
                  disabled={isLast}
                >
                  {node.title}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* View Router */}
      <div className="pb-10">
        {current.id === 'EN_OPTIONS' && renderEnglishOptions()}
        {(current.id === 'EN' || current.id === 'EN_CEFR' || current.id === 'CN' || current.id === 'TH') && renderCourseLevels()}
        {current.id === 'course_lessons' && renderCourseLessons()}
        {current.id === 'vocab_list' && renderVocabList()}
      </div>
    </div>
  );
}


