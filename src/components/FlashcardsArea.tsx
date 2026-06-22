import React, { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { EyeOff, Eye, ChevronLeft, ChevronRight, Home, Bot } from 'lucide-react';
import { mockHsk1Data } from '../data/hsk1Data';
import { hsk2Data } from '../data/hsk2Data';
import { hsk3Data } from '../data/hsk3Data';
import { hsk4Data } from '../data/hsk4Data';
import { hsk5Data } from '../data/hsk5Data';
import { hsk6Data } from '../data/hsk6Data';
import { hsk7to9Data } from '../data/hsk7to9Data';
import { cefrVocab } from '../data/cefrVocab';
import { cefrC2Vocab } from '../data/cefrC2Vocab';
import { ieltsData } from '../data/ieltsData';

const c2FlatData = Object.values(cefrC2Vocab).flat();
const ieltsKeys = Object.keys(ieltsData);
const ieltsPart1 = ieltsKeys.slice(0, 10).flatMap(key => (ieltsData as any)[key]);
const ieltsPart2 = ieltsKeys.slice(10, 20).flatMap(key => (ieltsData as any)[key]);

// HanziWordAnimation Component
function HanziWordAnimation({ word, isAnimating }: { word: string; isAnimating: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || !isAnimating) return;

    // Clear previous
    containerRef.current.innerHTML = '';
    writersRef.current = [];

    const chars = Array.from(word);
    
    chars.forEach((char) => {
      // Only animate actual Chinese characters
      if (!/[\u4e00-\u9fa5]/.test(char)) {
        const charDiv = document.createElement('div');
        charDiv.style.width = '120px';
        charDiv.style.height = '120px';
        charDiv.className = 'flex-shrink-0 flex items-center justify-center text-[80px] font-bold text-gray-900 leading-none bg-white shadow-sm border border-gray-200';
        charDiv.innerText = char;
        containerRef.current?.appendChild(charDiv);
        return;
      }

      const charDiv = document.createElement('div');
      charDiv.style.width = '120px';
      charDiv.style.height = '120px';
      charDiv.className = 'flex-shrink-0 bg-white shadow-sm border border-gray-200 relative';
      // Add red cross-dashed lines in background to look like Chinese writing paper (Tian Zi Ge)
      charDiv.style.backgroundImage = 'linear-gradient(to right, transparent 49%, #fca5a5 49%, #fca5a5 51%, transparent 51%), linear-gradient(to bottom, transparent 49%, #fca5a5 49%, #fca5a5 51%, transparent 51%)';
      
      containerRef.current?.appendChild(charDiv);

      try {
        const writer = HanziWriter.create(charDiv, char, {
          width: 120,
          height: 120,
          padding: 5,
          showOutline: true,
          showCharacter: false, // Ensure black character does not show before drawing
          outlineColor: '#e5e7eb',
          strokeColor: '#2563eb',
          radicalColor: '#166534',
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 50,
        });
        writersRef.current.push(writer);
      } catch(e) {
        console.error("Failed to render char: ", char, e);
      }
    });

    let isCancelled = false;
    const animateAll = async () => {
      while (!isCancelled) {
        for (const writer of writersRef.current) {
          if (isCancelled) break;
          // Hide character initially 
          writer.hideCharacter();
          await new Promise<void>((resolve) => {
             writer.animateCharacter({
               onComplete: () => { setTimeout(resolve, 200); }
             });
          });
        }
        if (isCancelled) break;
        await new Promise(r => setTimeout(r, 1500)); // wait before looping
      }
    };

    setTimeout(animateAll, 500);

    return () => {
      isCancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [word, isAnimating]);

  if (!isAnimating) {
    return (
      <div key="static" className="flex justify-center items-center min-h-[120px]">
         <div className="text-[100px] font-bold text-gray-900 leading-none select-text">
           {word}
         </div>
      </div>
    );
  }

  return (
    <div key="animating" ref={containerRef} className="flex flex-row flex-wrap justify-center items-center gap-2 min-h-[120px]" />
  );
}

function FlashcardPlayer({ level, vocabList, onBack, lang, onAskAI }: { level: string, vocabList: any[], onBack: () => void, lang: string, onAskAI?: (word: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hidePinyin, setHidePinyin] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [hideAnimation, setHideAnimation] = useState(false);
  const [inputValue, setInputValue] = useState("1");

  useEffect(() => {
    setInputValue((currentIndex + 1).toString());
  }, [currentIndex]);

  const currentWord = vocabList[currentIndex] || vocabList[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < vocabList.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= vocabList.length) {
      setCurrentIndex(val - 1);
    }
  };

  return (
    <div className="flex flex-col items-center h-full relative p-4 max-w-2xl mx-auto w-full">
      <div className="w-full mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-transparent shadow-sm bg-white hover:border-gray-200"
        >
          <Home size={18} /> เมนูหลัก
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">แฟลชการ์ด {level}</h2>
          <p className="text-gray-500">คำศัพท์ที่ {currentIndex + 1} / {vocabList.length}</p>
        </div>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px] relative">
        <button 
          onClick={() => onAskAI?.(currentWord.word)}
          className="absolute top-4 left-4 p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white transition-colors"
          title="ถามติวเตอร์ AI"
        >
          <Bot size={20} />
        </button>
        
        {/* Phonetic / Pinyin Section */}
        <div className="w-full relative flex justify-center mb-6 min-h-[40px]">
          {!hidePinyin ? (
            <p className="text-2xl font-medium text-indigo-600 font-mono tracking-wide">{lang === 'EN' ? currentWord.phonetic : currentWord.pinyin}</p>
          ) : (
            <div className="w-16 h-8 bg-gray-100 rounded-md"></div>
          )}
          <button 
            onClick={() => setHidePinyin(!hidePinyin)}
            className="absolute right-0 top-0 text-gray-400 hover:text-gray-600 p-1"
            title={lang === 'EN' ? "ซ่อน/แสดงคำอ่าน" : "ซ่อน/แสดงพินอิน"}
          >
            {hidePinyin ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

        {/* Word / Character Section */}
        <div className="w-full relative flex justify-center py-6 my-4 border-y border-gray-50 min-h-[160px]">
          {lang === 'CN' ? (
            <>
              <HanziWordAnimation word={currentWord.word} isAnimating={!hideAnimation} />
              <button 
                onClick={() => setHideAnimation(!hideAnimation)}
                className="absolute right-0 top-2 text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm z-10"
                title="ซ่อน/แสดงอนิเมชั่น"
              >
                 {hideAnimation ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center min-h-[120px] px-8">
              <div className="text-[60px] md:text-[80px] font-bold text-gray-900 leading-none select-text text-center break-words max-w-full">
                {currentWord.word}
              </div>
            </div>
          )}
        </div>

        {/* Translation Section */}
        <div className="w-full relative flex justify-center mt-6 min-h-[80px]">
          {!hideTranslation ? (
            <div className="text-center px-8">
              <p className="text-xl font-bold text-gray-800 mb-1">{currentWord.th}</p>
              {lang === 'EN' && currentWord.type && (
                <p className="text-sm text-indigo-500 font-medium mb-1">({currentWord.type})</p>
              )}
              {lang === 'CN' && currentWord.en && (
                <p className="text-gray-500">{currentWord.en}</p>
              )}
            </div>
          ) : (
            <div className="w-32 h-12 bg-gray-100 rounded-md"></div>
          )}
          <button 
             onClick={() => setHideTranslation(!hideTranslation)}
             className="absolute right-0 top-0 text-gray-400 hover:text-gray-600 p-1"
             title="ซ่อน/แสดงคำแปล"
          >
             {hideTranslation ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

      </div>

      {/* Navigation Controls */}
      <div className="flex flex-row items-center justify-between w-full mt-8 gap-4">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 max-w-[140px] flex items-center justify-center py-3 px-4 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-gray-50 transition-colors font-medium border border-gray-200"
        >
          <ChevronLeft size={20} className="mr-1" /> ก่อนหน้า
        </button>
        
        <div className="text-sm font-medium text-gray-500 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
          <input 
            type="number" 
            min={1} 
            max={vocabList.length}
            value={inputValue}
            onChange={handleInputChange}
            className="w-16 text-center text-gray-900 font-bold bg-transparent border-none appearance-none focus:outline-none focus:ring-0"
            style={{ MozAppearance: 'textfield' }}
          />
          <span className="text-gray-400">/</span>
          <span className="text-gray-700">{vocabList.length}</span>
        </div>

        <button 
          onClick={handleNext}
          disabled={currentIndex === vocabList.length - 1}
          className="flex-1 max-w-[140px] flex items-center justify-center py-3 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors font-bold shadow-sm"
        >
          ถัดไป <ChevronRight size={20} className="ml-1" />
        </button>
      </div>
    </div>
  );
}

export default function FlashcardsArea({ activeLang, onAskAI }: { activeLang: string, onAskAI?: (word: string) => void }) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    // Reset selected level when switching languages
    setSelectedLevel(null);
  }, [activeLang]);

  if (activeLang !== 'CN' && activeLang !== 'EN') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">แฟลชการ์ด</h2>
        <p className="text-gray-500">ระบบแฟลชการ์ดรองรับเฉพาะภาษาจีนและภาษาอังกฤษในขณะนี้</p>
      </div>
    );
  }

  let levels: { id: string, data: any[], color: string }[] = [];

  if (activeLang === 'CN') {
    levels = [
      { id: 'HSK 1', data: mockHsk1Data, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 ring-red-400' },
      { id: 'HSK 2', data: hsk2Data, color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300 ring-orange-400' },
      { id: 'HSK 3', data: hsk3Data, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 ring-amber-400' },
      { id: 'HSK 4', data: hsk4Data, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 ring-green-400' },
      { id: 'HSK 5', data: hsk5Data, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 ring-blue-400' },
      { id: 'HSK 6', data: hsk6Data, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 ring-indigo-400' },
      { id: 'HSK 7-9', data: hsk7to9Data, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300 ring-purple-400' },
    ];
  } else if (activeLang === 'EN') {
    levels = [
      { id: 'CEFR A1', data: cefrVocab['A1'] || [], color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 ring-blue-400' },
      { id: 'CEFR A2', data: cefrVocab['A2'] || [], color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 ring-green-400' },
      { id: 'CEFR B1', data: cefrVocab['B1'] || [], color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 ring-yellow-400' },
      { id: 'CEFR B2', data: cefrVocab['B2'] || [], color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300 ring-orange-400' },
      { id: 'CEFR C1', data: cefrVocab['C1'] || [], color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 ring-red-400' },
      { id: 'CEFR C2', data: c2FlatData, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300 ring-purple-400' },
      { id: 'IELTS Part 1', data: ieltsPart1, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 ring-indigo-400' },
      { id: 'IELTS Part 2', data: ieltsPart2, color: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 hover:border-pink-300 ring-pink-400' },
    ].filter(l => l.data.length > 0);
  }

  if (!selectedLevel) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-6 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-3 border-b-2 border-indigo-500 inline-block px-12">
          {activeLang === 'CN' ? 'เลือกระดับ HSK' : 'เลือกระดับ CEFR / IELTS'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
           {levels.map(level => (
             <button
               key={level.id}
               onClick={() => setSelectedLevel(level.id)}
               className={`py-8 px-4 rounded-3xl border-2 font-bold text-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-sm flex flex-col items-center justify-center ${level.color} focus:outline-none focus:ring-4`}
             >
                <span>{level.id}</span>
                <span className="text-sm font-medium mt-1 opacity-80">{level.data.length} คำศัพท์</span>
             </button>
           ))}
        </div>
      </div>
    );
  }

  const selectedLevelData = levels.find(l => l.id === selectedLevel)?.data || [];

  return (
    <FlashcardPlayer 
      lang={activeLang}
      level={selectedLevel} 
      vocabList={selectedLevelData} 
      onBack={() => setSelectedLevel(null)} 
      onAskAI={onAskAI}
    />
  );
}

