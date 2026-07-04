import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { allCNVocab, allENVocab, VocabWord } from '../data/vocabData';
import AnnotationToolbar, { AnnotationState } from './AnnotationToolbar';
import AnnotatableArea from './AnnotatableArea';
import HanziWriter from 'hanzi-writer';

interface VocabAreaProps {
  activeLang: 'EN' | 'CN' | 'TH';
  onAskAI?: (prompt: string) => void;
}

const ITEMS_PER_PAGE = 5;

// Component to render a single HanziWriter instance
const HanziBox = ({ character, size = 60, playAnimationId }: { character: string, size?: number, playAnimationId?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Clear previous
    containerRef.current.innerHTML = '';
    
    writerRef.current = HanziWriter.create(containerRef.current, character, {
      width: size,
      height: size,
      padding: 5,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 50,
      showOutline: true,
    });
  }, [character, size]);

  useEffect(() => {
    if (playAnimationId && writerRef.current) {
      writerRef.current.animateCharacter();
    }
  }, [playAnimationId]);

  return <div ref={containerRef} className="flex items-center justify-center border border-dashed border-gray-300 bg-white" style={{ width: size, height: size }}></div>;
};

const CharacterRow = ({ char, hideWord, playAnimId, setClearRegion }: any) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative z-10 shrink-0">
        {!hideWord ? (
           <HanziBox character={char} playAnimationId={playAnimId} />
        ) : (
           <div className="w-[60px] h-[60px] bg-gray-100 border border-dashed border-gray-300 rounded-sm"></div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex gap-2 vocab-row-container">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="w-[60px] h-[60px] shrink-0 border border-dashed border-gray-300 bg-white/50 rounded-sm relative pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                 <div className="w-full h-[1px] bg-red-400 absolute"></div>
                 <div className="w-[1px] h-full bg-red-400 absolute"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button 
        onClick={(e) => {
          const rowEl = (e.currentTarget as HTMLElement).closest('.vocab-row-container');
          const areaEl = document.getElementById('vocab-annotatable-area');
          if (rowEl && areaEl) {
            const rowRect = rowEl.getBoundingClientRect();
            const areaRect = areaEl.getBoundingClientRect();
            setClearRegion({ 
              top: rowRect.top - areaRect.top - 10, 
              bottom: rowRect.bottom - areaRect.top + 10, 
              t: Date.now() 
            });
          }
        }} 
        className="p-2 text-gray-400 hover:text-red-500 shrink-0 relative z-20 pointer-events-auto" 
        title="ลบลายเส้นบรรทัดนี้"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

const FullWordRow = ({ chars, hideWord, playAnimId, setClearRegion }: any) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2 shrink-0 z-10">
        {chars.map((char: string, charIdx: number) => (
           <div key={`full-anim-${charIdx}`} className="relative">
             {!hideWord ? (
               <HanziBox character={char} playAnimationId={playAnimId} />
             ) : (
               <div className="w-[60px] h-[60px] bg-gray-100 border border-dashed border-gray-300 rounded-sm"></div>
             )}
           </div>
        ))}
      </div>
      <div className="flex-1">
        <div className="flex gap-2 vocab-row-container">
          {Array.from({ length: 12 - chars.length }).map((_, i) => (
             <div key={`full-empty-${i}`} className="w-[60px] h-[60px] shrink-0 border border-dashed border-gray-300 bg-white/50 rounded-sm relative pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                   <div className="w-full h-[1px] bg-red-400 absolute"></div>
                   <div className="w-[1px] h-full bg-red-400 absolute"></div>
                </div>
             </div>
          ))}
        </div>
      </div>
      <button 
        onClick={(e) => {
          const rowEl = (e.currentTarget as HTMLElement).closest('.vocab-row-container');
          const areaEl = document.getElementById('vocab-annotatable-area');
          if (rowEl && areaEl) {
            const rowRect = rowEl.getBoundingClientRect();
            const areaRect = areaEl.getBoundingClientRect();
            setClearRegion({ 
              top: rowRect.top - areaRect.top - 10, 
              bottom: rowRect.bottom - areaRect.top + 10, 
              t: Date.now() 
            });
          }
        }} 
        className="p-2 text-gray-400 hover:text-red-500 shrink-0 relative z-20 pointer-events-auto" 
        title="ลบลายเส้นบรรทัดนี้"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

const EnglishLineRow = ({ word, rowIdx, hideWord, setClearRegion }: any) => {
  return (
    <div className="flex items-end gap-2 relative group w-full">
      <div className="w-32 shrink-0 pb-1 border-b-2 border-gray-400 text-xl font-medium text-gray-700 font-serif">
        {rowIdx === 0 && !hideWord ? word.word : ''}
      </div>
      <div className="flex-1 h-12 vocab-row-container pointer-events-none">
         <div className="w-full h-full border-b-2 border-dashed border-gray-300"></div>
      </div>
      <button 
        onClick={(e) => {
          const rowEl = (e.currentTarget as HTMLElement).closest('.vocab-row-container');
          const areaEl = document.getElementById('vocab-annotatable-area');
          if (rowEl && areaEl) {
            const rowRect = rowEl.getBoundingClientRect();
            const areaRect = areaEl.getBoundingClientRect();
            setClearRegion({ 
              top: rowRect.top - areaRect.top - 10, 
              bottom: rowRect.bottom - areaRect.top + 10, 
              t: Date.now() 
            });
          }
        }} 
        className="p-2 text-gray-400 hover:text-red-500 shrink-0 mb-1 relative z-20 pointer-events-auto" 
        title="ลบลายเส้นบรรทัดนี้"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

const VocabWordBlock = ({ word, lang, setClearRegion }: { word: VocabWord, lang: 'CN'|'EN', setClearRegion: any }) => {
  const [hideWord, setHideWord] = useState(false);
  const [hideReading, setHideReading] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [playAnimId, setPlayAnimId] = useState(0);

  const isCN = lang === 'CN';
  const chars = Array.from(word.word);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 mb-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex-1 grid grid-cols-3 gap-4 text-center">
          {/* Word */}
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-500 font-medium mb-1">
              คำศัพท์
              <button onClick={() => setHideWord(!hideWord)} className="ml-2 text-gray-400 hover:text-indigo-500"><EyeOff size={14}/></button>
            </div>
            <div className={`text-4xl font-bold text-gray-800 transition-opacity ${hideWord ? 'opacity-0' : 'opacity-100'}`}>
              {word.word}
            </div>
          </div>
          {/* Reading */}
          <div className="flex flex-col items-center border-l border-r border-gray-200/50">
            <div className="text-sm text-gray-500 font-medium mb-1">
              คำอ่าน
              <button onClick={() => setHideReading(!hideReading)} className="ml-2 text-gray-400 hover:text-indigo-500"><EyeOff size={14}/></button>
            </div>
            <div className={`text-xl font-medium text-indigo-600 transition-opacity ${hideReading ? 'opacity-0' : 'opacity-100'}`}>
              {isCN ? word.pinyin : word.phonetic}
            </div>
          </div>
          {/* Translation */}
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-500 font-medium mb-1">
              คำแปล
              <button onClick={() => setHideTranslation(!hideTranslation)} className="ml-2 text-gray-400 hover:text-indigo-500"><EyeOff size={14}/></button>
            </div>
            <div className={`text-lg text-gray-700 transition-opacity ${hideTranslation ? 'opacity-0' : 'opacity-100'}`}>
              {word.translations.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Tracing Area */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          {isCN ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm font-semibold text-gray-500">พื้นที่คัดอักษร (12 ช่อง)</span>
                <button 
                  onClick={() => setPlayAnimId(prev => prev + 1)}
                  className="flex items-center gap-1 text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-200 transition-colors"
                >
                  <Play size={12} /> เล่นแอนิเมชันทั้งหมด
                </button>
              </div>
              {/* Individual Characters */}
              {chars.map((char, charIdx) => (
                <CharacterRow 
                  key={charIdx} 
                  char={char} 
                  hideWord={hideWord} 
                  playAnimId={playAnimId} 
                  setClearRegion={setClearRegion}
                />
              ))}

              {/* Full Word Practice (if > 1 char) */}
              {chars.length > 1 && (
                <>
                  <div className="mt-4 mb-1 px-2 text-sm font-semibold text-gray-500">ฝึกคัดเต็มคำ (2 บรรทัด)</div>
                  {Array.from({ length: 2 }).map((_, rowIdx) => (
                    <FullWordRow 
                      key={`full-${rowIdx}`}
                      chars={chars}
                      hideWord={hideWord}
                      playAnimId={playAnimId}
                      setClearRegion={setClearRegion}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            /* English Layout */
            <div className="flex flex-col gap-6 mt-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm font-semibold text-gray-500">พื้นที่คัดลายมือ</span>
              </div>
              {Array.from({ length: 4 }).map((_, rowIdx) => (
                <EnglishLineRow 
                  key={rowIdx}
                  word={word}
                  rowIdx={rowIdx}
                  hideWord={hideWord}
                  setClearRegion={setClearRegion}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function VocabArea({ activeLang }: VocabAreaProps) {
  const [annotationState, setAnnotationState] = useState<AnnotationState>({
    activeTool: 'none',
    color: '#3b82f6',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif'
  });
  
  const [clearTrigger, setClearTrigger] = useState(0);
  const [clearRegion, setClearRegion] = useState<{top: number, bottom: number, t: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState('ALL');

  const lang = activeLang === 'CN' ? 'CN' : 'EN';
  const fullVocab = lang === 'CN' ? allCNVocab : allENVocab;
  
  const filteredVocab = levelFilter === 'ALL' 
    ? fullVocab 
    : fullVocab.filter(v => v.level === levelFilter);
    
  const totalPages = Math.ceil(filteredVocab.length / ITEMS_PER_PAGE);
  const currentVocab = filteredVocab.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Available levels for filter
  const levels = ['ALL', ...Array.from(new Set(fullVocab.map(v => v.level)))];

  return (
    <div className="flex flex-col h-full w-full relative">
      
      {/* Floating Annotation Toolbar */}
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

      {/* Main Content with Padding for Toolbar */}
      <div className="flex-1 overflow-y-auto pt-24 px-4 pb-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
          
          {/* Sidebar / Filters */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/50">
              <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold">
                <BookOpen size={20} />
                <h3>ตั้งค่าการคัดศัพท์</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">ระดับศัพท์</label>
                <select 
                  value={levelFilter}
                  onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {levels.map(l => (
                    <option key={l} value={l}>{l === 'ALL' ? 'ทั้งหมด' : l}</option>
                  ))}
                </select>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-sm text-indigo-800">
                <p>💡 <b>เคล็ดลับ:</b> ลองเปิดเครื่องมือปากกาด้านบน แล้วคัดตามเส้นแอนิเมชันดูสิ!</p>
              </div>
            </div>
          </div>

          {/* Vocabulary List wrapping with Canvas */}
          <div className="flex-1 min-w-0 relative">
             <div id="vocab-annotatable-area" className="w-full h-full">
               <AnnotatableArea
                  id={`vocab-page-${levelFilter}-${currentPage}`}
                  annotationState={annotationState}
                  clearTrigger={clearTrigger}
                  clearRegion={clearRegion}
                  isActive={annotationState.activeTool !== 'none'}
                  className="w-full h-full"
               >
                 {currentVocab.length > 0 ? (
                   currentVocab.map((word) => (
                     <VocabWordBlock key={word.id} word={word} lang={lang} setClearRegion={setClearRegion} />
                   ))
                 ) : (
                   <div className="text-center py-20 text-gray-500 bg-white/50 rounded-2xl">
                     ไม่มีคำศัพท์ในหมวดหมู่นี้
                   </div>
                 )}
               </AnnotatableArea>
             </div>

               {/* Pagination */}
               {totalPages > 1 && (
                 <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                   <button 
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-2 rounded-xl bg-white shadow-sm disabled:opacity-50"
                   >
                     <ChevronLeft size={20} />
                   </button>
                   <span className="font-medium text-gray-600">หน้า {currentPage} / {totalPages}</span>
                   <button 
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className="p-2 rounded-xl bg-white shadow-sm disabled:opacity-50"
                   >
                     <ChevronRight size={20} />
                   </button>
                 </div>
               )}
          </div>
        </div>
      </div>
    </div>
  );
}
