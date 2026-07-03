import React, { useState } from 'react';
import { BookOpen, Headphones, PenTool, Mic, ChevronLeft, FileText, ArrowRight, Library, FileCheck, Layers, Bot, Download, CheckCircle2, Circle, Video, X } from 'lucide-react';
import DocumentGallery from './DocumentGallery';
import FloatingVideoPlayer from './FloatingVideoPlayer';
import readingVideosData from '../data/reading_videos.json';
import { getVocabData } from '../data/mockContent';

interface ExercisesAreaProps {
  activeLang: 'EN' | 'CN' | 'TH';
  onAskPDF?: (url: string) => void;
}

export default function ExercisesArea({ activeLang, onAskPDF }: ExercisesAreaProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedGrammarLevel, setSelectedGrammarLevel] = useState<string | null>(null);
  
  const [selectedReadingLevel, setSelectedReadingLevel] = useState<string | null>(null);
  const [selectedReadingType, setSelectedReadingType] = useState<'reader' | 'coursepack' | null>(null);
  
  // CN specific states
  const [selectedCNLevel, setSelectedCNLevel] = useState<string | null>(null);
  const [selectedCNBook, setSelectedCNBook] = useState<string | null>(null);
  const [selectedCNLesson, setSelectedCNLesson] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

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
    } else if (selectedReadingType) {
      setSelectedReadingType(null);
      setIsVideoPlayerOpen(false);
    } else if (selectedReadingLevel) {
      setSelectedReadingLevel(null);
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
          <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            {/* Floating Toolbar */}
            <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
              <a 
                href={pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                title="ดาวน์โหลด PDF"
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200"
              >
                <Download size={22} />
              </a>
              <button 
                onClick={() => setIsFullscreen(false)} 
                title="ออกเต็มจอ"
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
              >
                 <X size={24} />
              </button>
            </div>
            <div className="flex-1 w-full overflow-hidden relative">
              <DocumentGallery type="courseware" folder={selectedCNBook ? `${selectedCNLevel}-${selectedCNBook}` : selectedCNLevel} prefix={`Lesson${selectedCNLesson}_`} enableAnnotation={true} />
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[500px] md:h-[800px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <a 
                  href={pdfUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download size={16} /> โหลดไฟล์ PDF
                </a>
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ดูแบบเต็มจอ
                </button>
              </div>
            </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-indigo-100 w-full h-full relative">
              <DocumentGallery type="courseware" folder={selectedCNBook ? `${selectedCNLevel}-${selectedCNBook}` : selectedCNLevel} prefix={`Lesson${selectedCNLesson}_`} enableAnnotation={true} />
            </div>
          </div>
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
            startLesson = 1;
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
      const levels = [
        { id: 'grammar_beginner', name: 'Free English Grammar (Beginner)' },
        { id: 'grammar_guide', name: 'Grammar Guide 2026' }
      ];
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
                  <h2 className="text-2xl font-bold mb-2">เลือกเอกสารไวยากรณ์ (Grammar)</h2>
                  <p className="text-gray-500 text-sm">เลือกหนังสือที่คุณต้องการเรียน</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {levels.map((l) => (
                  <button 
                    key={l.id} 
                    onClick={() => setSelectedGrammarLevel(l.id)} 
                    className="bg-white px-6 py-8 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 hover:shadow-md transition-all text-center group"
                  >
                    <Library className="w-10 h-10 mx-auto mb-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{l.name}</h3>
                  </button>
                ))}
             </div>
          </div>
        </div>
      );
    }

    const pdfUrl = `/courses/grammar/${selectedGrammarLevel}.pdf`;
    const titleStr = selectedGrammarLevel === 'grammar_beginner' ? 'Free English Grammar (Beginner)' : 'Grammar Guide 2026';

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          {/* Floating Toolbar */}
          <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
            <a 
              href={pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              title="ดาวน์โหลด PDF"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200"
            >
              <Download size={22} />
            </a>
            <button 
              onClick={() => setIsFullscreen(false)} 
              title="ออกเต็มจอ"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
            >
               <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full overflow-hidden relative">
            <DocumentGallery type="courseware" folder={selectedGrammarLevel} prefix={`${selectedGrammarLevel}_`} enableAnnotation={true} />
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
          <ChevronLeft size={20} /> ย้อนกลับ
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{titleStr}</h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[500px] md:h-[800px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <a 
                href={pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download size={16} /> โหลดไฟล์ PDF
              </a>
              <button 
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ดูแบบเต็มจอ
              </button>
            </div>
          </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-indigo-100 w-full h-full relative">
            <DocumentGallery type="courseware" folder={selectedGrammarLevel} prefix={`${selectedGrammarLevel}_`} enableAnnotation={true} />
          </div>
        </div>
      </div>
    );
  }

  if (selectedSkill === 'Reading') {
    if (!selectedReadingLevel) {
      const levels = [
        { id: '1', name: 'BC Reads Level 1' },
        { id: '2', name: 'BC Reads Level 2' },
        { id: '3', name: 'BC Reads Level 3' },
        { id: '4', name: 'BC Reads Level 4' },
        { id: '5', name: 'BC Reads Level 5' },
        { id: '6', name: 'BC Reads Level 6' }
      ];
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
                  <h2 className="text-2xl font-bold mb-2">เลือกเอกสารการอ่าน (Reading)</h2>
                  <p className="text-gray-500 text-sm">เลือกระดับที่คุณต้องการฝึกฝน</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levels.map((l) => (
                  <button 
                    key={l.id} 
                    onClick={() => setSelectedReadingLevel(l.id)} 
                    className="bg-white px-6 py-8 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100 hover:shadow-md transition-all text-center group"
                  >
                    <BookOpen className="w-10 h-10 mx-auto mb-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{l.name}</h3>
                  </button>
                ))}
             </div>
          </div>
        </div>
      );
    }

    if (!selectedReadingType) {
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
                  <h2 className="text-2xl font-bold mb-2">BC Reads Level {selectedReadingLevel}</h2>
                  <p className="text-gray-500 text-sm">เลือกประเภทของเอกสาร</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button 
                  onClick={() => setSelectedReadingType('reader')} 
                  className="bg-white px-6 py-8 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100 hover:shadow-md transition-all text-center group"
                >
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-2xl text-gray-900 mb-2">Reader</h3>
                  <p className="text-gray-500 text-sm">หนังสืออ่านประกอบเนื้อหา</p>
                </button>
                <button 
                  onClick={() => setSelectedReadingType('coursepack')} 
                  className="bg-white px-6 py-8 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-400 hover:ring-2 hover:ring-blue-100 hover:shadow-md transition-all text-center group"
                >
                  <Layers className="w-12 h-12 mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-2xl text-gray-900 mb-2">Course Pack</h3>
                  <p className="text-gray-500 text-sm">ชุดแบบฝึกหัดประกอบการเรียน</p>
                </button>
             </div>
          </div>
        </div>
      );
    }

    const pdfUrl = `/courses/reading/reading_level${selectedReadingLevel}_${selectedReadingType}.pdf`;
    const titleStr = `BC Reads Level ${selectedReadingLevel} - ${selectedReadingType === 'reader' ? 'Reader' : 'Course Pack'}`;
    const folderName = `reading_level${selectedReadingLevel}_${selectedReadingType}`;
    const levelVideos = selectedReadingType === 'reader' && selectedReadingLevel ? (readingVideosData as any)[selectedReadingLevel] || [] : [];
    const showVideoButton = selectedReadingType === 'reader' && levelVideos.length > 0;

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          {/* Floating Toolbar */}
          <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
            {showVideoButton && (
              <button 
                onClick={() => setIsVideoPlayerOpen(!isVideoPlayerOpen)} 
                title="ดูวิดีโอประกอบ"
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center border transition-colors ${
                  isVideoPlayerOpen 
                    ? 'bg-indigo-600 text-white border-indigo-700' 
                    : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                 <Video size={22} />
              </button>
            )}
            <a 
              href={pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              title="ดาวน์โหลด PDF"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200"
            >
              <Download size={22} />
            </a>
            <button 
              onClick={() => setIsFullscreen(false)} 
              title="ออกเต็มจอ"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
            >
               <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full overflow-hidden relative">
            <DocumentGallery type="courseware" folder={folderName} prefix={`${folderName}_`} enableAnnotation={true} />
            <FloatingVideoPlayer 
              videos={levelVideos} 
              isOpen={isVideoPlayerOpen} 
              onClose={() => setIsVideoPlayerOpen(false)} 
            />
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
          <ChevronLeft size={20} /> ย้อนกลับ
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{titleStr}</h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[500px] md:h-[800px] relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-emerald-500" />
              <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {showVideoButton && (
                <button 
                  onClick={() => setIsVideoPlayerOpen(!isVideoPlayerOpen)} 
                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                    isVideoPlayerOpen 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <Video size={16} /> {isVideoPlayerOpen ? 'ซ่อนวิดีโอ' : 'ดูวิดีโอประกอบ'}
                </button>
              )}
              <a 
                href={pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download size={16} /> โหลดไฟล์ PDF
              </a>
              <button 
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ดูแบบเต็มจอ
              </button>
            </div>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-emerald-100 w-full h-full relative">
            <DocumentGallery type="courseware" folder={folderName} prefix={`${folderName}_`} enableAnnotation={true} />
            <FloatingVideoPlayer 
              videos={levelVideos} 
              isOpen={isVideoPlayerOpen} 
              onClose={() => setIsVideoPlayerOpen(false)} 
            />
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
