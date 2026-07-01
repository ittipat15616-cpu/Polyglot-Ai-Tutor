import React, { useState } from 'react';
import { BookOpen, Headphones, PenTool, Mic, ChevronLeft, FileText, ArrowRight, Library, FileCheck, Layers, Bot } from 'lucide-react';
import DocumentGallery from './DocumentGallery';
import { getVocabData } from '../data/mockContent';

interface ExercisesAreaProps {
  activeLang: 'EN' | 'CN' | 'TH';
  onAskPDF?: (url: string) => void;
}

export default function ExercisesArea({ activeLang, onAskPDF }: ExercisesAreaProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedGrammarLevel, setSelectedGrammarLevel] = useState<string | null>(null);
  
  // CN specific states
  const [selectedCNLevel, setSelectedCNLevel] = useState<string | null>(null);
  const [selectedCNBook, setSelectedCNBook] = useState<string | null>(null);
  const [selectedCNLesson, setSelectedCNLesson] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (activeLang === 'TH') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">บทเรียน</h2>
        <p className="text-gray-500">ฟีเจอร์นี้กำลังพัฒนาสำหรับภาษานี้</p>
      </div>
    );
  }

  const handleBack = () => {
    if (activeLang === 'CN') {
      if (selectedCNLesson) {
        setSelectedCNLesson(null);
      } else if (selectedCNBook) {
        setSelectedCNBook(null);
      } else if (selectedCNLevel) {
        setSelectedCNLevel(null);
      }
      return;
    }

    // EN logic
    if (selectedGrammarLevel) {
      setSelectedGrammarLevel(null);
    } else {
      setSelectedSkill(null);
    }
  };

  if (activeLang === 'CN') {
    // 3. Lesson View
    if (selectedCNLesson && selectedCNLevel) {
      const pdfUrl = selectedCNBook 
        ? `/courses/${selectedCNLevel}-${selectedCNBook}/Lesson${selectedCNLesson}.pdf`
        : `/courses/${selectedCNLevel}/Lesson${selectedCNLesson}.pdf`;
      const titleStr = selectedCNBook 
        ? `${selectedCNLevel} เล่ม ${selectedCNBook} - บทที่ ${selectedCNLesson}`
        : `${selectedCNLevel} - บทที่ ${selectedCNLesson}`;

      if (isFullscreen) {
        return (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Full Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-100 bg-white shadow-sm shrink-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                  <FileText size={16} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 truncate max-w-xs">{titleStr}</h3>
              </div>
              <div className="flex items-center gap-2">
                {onAskPDF && (
                  <button
                    onClick={() => onAskPDF(pdfUrl)}
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 2px 10px rgba(124,58,237,0.35)' }}
                  >
                    <Bot size={16} /> ถาม AI Tutor
                  </button>
                )}
                <button onClick={() => setIsFullscreen(false)} className="flex items-center gap-2 text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl border border-red-200 transition-colors">
                   <ChevronLeft size={16} /> ออกเต็มจอ
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-gray-50 overflow-hidden relative">
              <DocumentGallery type="courseware" folder={selectedCNBook ? `${selectedCNLevel}-${selectedCNBook}` : selectedCNLevel} prefix={`Lesson${selectedCNLesson}_`} />
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative pb-24">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> ย้อนกลับไปเลือกบทเรียน
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">{titleStr}</h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[800px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
              </div>
              <div className="flex gap-3">
                {onAskPDF && (
                  <button 
                    onClick={() => onAskPDF(pdfUrl)}
                    className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-opacity shadow-sm"
                  >
                    <Bot size={18} /> ถาม AI Tutor ถึงบทเรียนนี้
                  </button>
                )}
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ดูแบบเต็มจอ
                </button>
              </div>
            </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-indigo-100 w-full h-full relative">
              <DocumentGallery type="courseware" folder={selectedCNBook ? `${selectedCNLevel}-${selectedCNBook}` : selectedCNLevel} prefix={`Lesson${selectedCNLesson}_`} />
            </div>
          </div>

          {/* Floating Ask AI Button — same as Exams page */}
          {onAskPDF && (
            <button onClick={() => onAskPDF(pdfUrl)} className="fab-ai">
              <Bot size={22} />
              <span className="hidden sm:inline">ถาม AI Tutor</span>
            </button>
          )}
        </div>
      );
    }

    // 2. Book Selection View for HSK 4-6
    if (selectedCNLevel && ['HSK4', 'HSK5', 'HSK6'].includes(selectedCNLevel) && !selectedCNBook) {
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> ย้อนกลับไประดับ HSK
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCNLevel} (มี 2 เล่ม)</h2>
          <p className="text-gray-500 mb-8">กรุณาเลือกเล่มที่ต้องการเรียนรู้</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <button
              onClick={() => setSelectedCNBook('1')}
              className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-red-500 hover:shadow-lg transition-all text-center group"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={40} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCNLevel} - เล่ม 1 (Part 1)</h3>
                <p className="text-gray-500">บทเรียนครึ่งแรกของระดับนี้</p>
              </div>
            </button>
            <button
              onClick={() => setSelectedCNBook('2')}
              className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-red-500 hover:shadow-lg transition-all text-center group"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={40} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCNLevel} - เล่ม 2 (Part 2)</h3>
                <p className="text-gray-500">บทเรียนครึ่งหลังของระดับนี้</p>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // 2. Lesson Selection View
    if (selectedCNLevel && (selectedCNBook || !['HSK4', 'HSK5', 'HSK6'].includes(selectedCNLevel))) {
      let numLessons = 0;
      let startLesson = 1;
      
      if (selectedCNLevel === 'HSK1' || selectedCNLevel === 'HSK2') numLessons = 15;
      else if (selectedCNLevel === 'HSK3') numLessons = 20;
      else if (['HSK4', 'HSK5', 'HSK6'].includes(selectedCNLevel) && selectedCNBook) {
        if (selectedCNLevel === 'HSK4') {
          if (selectedCNBook === '1') {
            startLesson = 1;
            numLessons = 10; 
          } else if (selectedCNBook === '2') {
            startLesson = 11;
            numLessons = 10;
          }
        } else if (selectedCNLevel === 'HSK5') {
          if (selectedCNBook === '1') {
            startLesson = 1;
            numLessons = 18; 
          } else if (selectedCNBook === '2') {
            startLesson = 19;
            numLessons = 18;
          }
        } else {
          // Placeholder values for HSK6
          if (selectedCNBook === '1') {
            startLesson = 1;
            numLessons = 20; 
          } else if (selectedCNBook === '2') {
            startLesson = 21;
            numLessons = 20;
          }
        }
      }

      const lessons = Array.from({ length: numLessons }, (_, i) => startLesson + i);
      const titleStr = selectedCNBook ? `${selectedCNLevel} เล่ม ${selectedCNBook}` : selectedCNLevel;

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2">{titleStr}</h2>
            <p className="text-gray-500 mb-8">เลือกบทเรียนที่ต้องการศึกษา</p>

            {lessons.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
                <FileCheck size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีเอกสารสำหรับ {titleStr}</h3>
                <p>ไฟล์เอกสารบทเรียนกำลังอยู่ในระหว่างการจัดทำหรืออัปโหลดเข้าสู่ระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {lessons.map((lessonNum) => (
                  <button 
                    key={lessonNum}
                    onClick={() => setSelectedCNLesson(lessonNum)}
                    className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition-all group"
                  >
                    <BookOpen size={28} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="font-semibold text-gray-800">บทที่ {lessonNum}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 1. Level Selection View
    const hskLevels = [
      { id: 'HSK1', name: 'HSK 1', desc: 'บทเรียนภาษาจีนระดับเริ่มต้น' },
      { id: 'HSK2', name: 'HSK 2', desc: 'บทเรียนภาษาจีนระดับต้น' },
      { id: 'HSK3', name: 'HSK 3', desc: 'บทเรียนภาษาจีนระดับกลางตอนต้น' },
      { id: 'HSK4', name: 'HSK 4', desc: 'บทเรียนภาษาจีนระดับกลาง (2 เล่ม)' },
      { id: 'HSK5', name: 'HSK 5', desc: 'บทเรียนภาษาจีนระดับสูงตอนต้น (2 เล่ม)' },
      { id: 'HSK6', name: 'HSK 6', desc: 'บทเรียนภาษาจีนระดับสูง (2 เล่ม)' },
    ];

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">บทเรียนภาษาจีน (Chinese Lessons)</h2>
        <p className="text-gray-500 mb-8">เลือกระดับ HSK ที่ต้องการเรียนรู้</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {hskLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedCNLevel(level.id)}
              className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col items-start gap-4 hover:border-red-500 hover:shadow-lg transition-all text-left"
            >
              <div className={`w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2`}>
                <BookOpen size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{level.name}</h3>
                <p className="text-gray-600 text-sm">{level.desc}</p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-red-600 font-semibold uppercase tracking-wide text-sm">
                เข้าสู่บทเรียน <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // EN Logic below
  const skills = [
    { id: 'grammar', name: 'Grammar', icon: <Library size={32} className="text-cyan-500" />, description: 'เรียนรู้ไวยากรณ์ภาษาอังกฤษ (Beginner - Advanced)' },
    { id: 'reading', name: 'Reading', icon: <BookOpen size={32} className="text-emerald-500" />, description: 'พัฒนาทักษะการอ่านทำความเข้าใจ' },
    { id: 'listening', name: 'Listening', icon: <Headphones size={32} className="text-blue-500" />, description: 'ฝึกทักษะการฟังจากเจ้าของภาษา' },
    { id: 'writing', name: 'Writing', icon: <PenTool size={32} className="text-amber-500" />, description: 'ฝึกฝนการเขียนและการใช้ไวยากรณ์' },
    { id: 'speaking', name: 'Speaking', icon: <Mic size={32} className="text-purple-500" />, description: 'ฝึกการพูดโต้ตอบและออกเสียง' },
  ];

  if (selectedSkill === 'Grammar') {
    if (!selectedGrammarLevel) {
      const levels = ['Basic Grammar', 'Intermediate Grammar', 'Advanced Grammar'];
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">เลือกระดับไวยากรณ์ (Grammar Level)</h2>
                  <p className="text-gray-500 text-sm">เลือกระดับความยากที่คุณต้องการเรียน</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {levels.map((l) => (
                  <button 
                    key={l} 
                    onClick={() => setSelectedGrammarLevel(l)} 
                    className="bg-white px-6 py-8 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 hover:shadow-md transition-all text-center group"
                  >
                    <Library className="w-10 h-10 mx-auto mb-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{l}</h3>
                  </button>
                ))}
             </div>
          </div>
        </div>
      );
    }

    const items = getVocabData('EN_GRAMMAR', selectedGrammarLevel, 1);

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
        >
          <ChevronLeft size={20} /> ย้อนกลับ
        </button>
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{selectedGrammarLevel}</h2>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-indigo-100">
                {items.length} บท
              </div>
            </div>
            <p className="text-gray-500 mb-8">เรียนรู้หลักไวยากรณ์และความหมาย</p>
            
            <div className="flex flex-col gap-4">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl font-bold text-gray-900">{item.word}</span>
                                {item.type && <span className="text-indigo-500 font-medium text-sm bg-indigo-50 px-2 py-1 rounded-md">{item.type}</span>}
                            </div>
                            <div className="mb-4">
                                <span className="text-gray-700 font-medium leading-relaxed">{item.th}</span>
                            </div>
                            {item.example && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex-1">
                                        <div className="text-gray-800 text-lg mb-1 leading-relaxed font-serif italic">
                                            "{item.example}"
                                        </div>
                                        {(item.exampleTh || item.example_th) && (
                                            <div className="text-gray-500 text-sm">
                                                แปล: {item.exampleTh || item.example_th}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (selectedSkill) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
        >
          <ChevronLeft size={20} /> ย้อนกลับ
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
          <FileText size={48} className="text-indigo-200 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">บทเรียน - {selectedSkill}</h2>
          <p className="text-gray-500 text-center max-w-md">
            (ส่วนเนื้อหา/วิดีโอ/ไฟล์เสียงของบทเรียน {selectedSkill} จะแสดงที่นี่)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">บทเรียนภาษาอังกฤษ (English Lessons)</h2>
      <p className="text-gray-500 mb-8">เลือกทักษะที่คุณต้องการเรียนรู้และฝึกฝน</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <button
            key={skill.id}
            onClick={() => setSelectedSkill(skill.name)}
            className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col items-start gap-4 hover:border-indigo-500 hover:shadow-lg transition-all text-left"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-2`}>
              {skill.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{skill.name}</h3>
              <p className="text-gray-600 text-sm">{skill.description}</p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wide text-sm">
              เข้าสู่บทเรียน <ArrowRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
