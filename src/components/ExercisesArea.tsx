import React, { useState } from 'react';
import { BookOpen, Headphones, PenTool, Mic, ChevronLeft, FileText, ArrowRight, Library, FileCheck, Layers, Bot, Download, CheckCircle2, Circle, Video, X, MessageSquare } from 'lucide-react';
import DocumentGallery from './DocumentGallery';
import FloatingVideoPlayer from './FloatingVideoPlayer';
import readingVideosData from '../data/reading_videos.json';
import { getVocabData } from '../data/mockContent';
import voaLessons from '../data/voa_lessons.json';
import listeningLessons from '../data/listening_lessons.json';
import { grammarTopics } from '../data/grammar_topics';
import AnnotatableImage from './AnnotatableImage';
import AnnotationToolbar, { AnnotationState } from './AnnotationToolbar';

interface ExercisesAreaProps {
  activeLang: 'EN' | 'CN' | 'TH';
  onAskPDF?: (url: string) => void;
}

export default function ExercisesArea({ activeLang, onAskPDF }: ExercisesAreaProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedGrammarLevel, setSelectedGrammarLevel] = useState<string | null>(null);
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState<string | null>(null);
  const [selectedGrammarSubTopic, setSelectedGrammarSubTopic] = useState<string | null>(null);
  
  const [annotationState, setAnnotationState] = useState<AnnotationState>({ activeTool: 'none', color: '#ef4444', size: 4 });
  const [clearTrigger, setClearTrigger] = useState(0);

  const [selectedReadingLevel, setSelectedReadingLevel] = useState<string | null>(null);
  const [selectedReadingType, setSelectedReadingType] = useState<'reader' | 'coursepack' | null>(null);
  
  const [selectedListeningLevel, setSelectedListeningLevel] = useState<string | null>(null);
  const [selectedListeningArticle, setSelectedListeningArticle] = useState<any>(null);
  
  // CN specific states
  const [selectedCNLevel, setSelectedCNLevel] = useState<string | null>(null);
  const [selectedCNBook, setSelectedCNBook] = useState<string | null>(null);
  const [selectedCNLesson, setSelectedCNLesson] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVOALevel, setSelectedVOALevel] = useState<string | null>(null);
  const [selectedVOAArticle, setSelectedVOAArticle] = useState<any>(null);
  
  // EN Writing & Speaking states
  const [selectedWritingLevel, setSelectedWritingLevel] = useState<'easy'|'medium'|'hard'|null>(null);
  const [selectedWritingLesson, setSelectedWritingLesson] = useState<number | null>(null);
  const [selectedSpeakingCategory, setSelectedSpeakingCategory] = useState<'conv' | 'ielts' | null>(null);
  const [selectedSpeakingLesson, setSelectedSpeakingLesson] = useState<number | null>(null);


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
    if (selectedSpeakingLesson) {
      setSelectedSpeakingLesson(null);
    } else if (selectedSpeakingCategory) {
      setSelectedSpeakingCategory(null);
    } else if (selectedWritingLesson) {
      setSelectedWritingLesson(null);
    } else if (selectedWritingLevel) {
      setSelectedWritingLevel(null);
    } else if (selectedVOAArticle) {
      setSelectedVOAArticle(null);
    } else if (selectedVOALevel) {
      setSelectedVOALevel(null);
    } else if (selectedListeningArticle) {
      setSelectedListeningArticle(null);
    } else if (selectedSkill === 'Grammar') {
      if (selectedGrammarSubTopic) {
        setSelectedGrammarSubTopic(null);
        return;
      }
      if (selectedGrammarTopic) {
        setSelectedGrammarTopic(null);
        return;
      }
      setSelectedGrammarLevel(null);
    } else if (selectedSkill === 'Reading') {
      setSelectedReadingType(null);
      setIsVideoPlayerOpen(false);
    } else if (selectedReadingLevel) {
      setSelectedReadingLevel(null);
    } else if (selectedListeningLevel) {
      setSelectedListeningLevel(null);
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
  if (selectedSkill === 'Grammar') {
    if (!selectedGrammarLevel) {
      const levels = [
        { id: 'grammar_beginner', name: 'Beginner (ระดับพื้นฐาน)' },
        { id: 'grammar_intermediate', name: 'Intermediate (ระดับกลาง)' },
        { id: 'grammar_advance', name: 'Advance (ระดับสูง)' }
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
                  <h2 className="text-2xl font-bold mb-2">เลือกระดับไวยากรณ์ (Grammar)</h2>
                  <p className="text-gray-500 text-sm">เลือกระดับไวยากรณ์ที่คุณต้องการเรียนรู้</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

    if (!selectedGrammarTopic) {
      // Show Topics Grid
      const topics = grammarTopics[selectedGrammarLevel as keyof typeof grammarTopics] || [];
      const levelTitle = selectedGrammarLevel === 'grammar_beginner' ? 'Beginner (A1-A2)' : 
                         selectedGrammarLevel === 'grammar_intermediate' ? 'Intermediate (B1-B2)' : 
                         'Advance (C1-C2)';

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-24">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">หัวข้อหลัก {levelTitle}</h2>
                  <p className="text-gray-500 text-sm">เลือกหัวข้อหลักที่คุณต้องการเรียนรู้</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((t) => (
                  <button 
                    key={t.id} 
                    onClick={() => setSelectedGrammarTopic(t.id)} 
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{t.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      );
    }

    if (!selectedGrammarSubTopic) {
      // Show Sub-Topics Grid
      const topics = grammarTopics[selectedGrammarLevel as keyof typeof grammarTopics] || [];
      const activeTopic = topics.find(t => t.id === selectedGrammarTopic);
      const subTopics = activeTopic?.subtopics || [];

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-24">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{activeTopic?.name}</h2>
                  <p className="text-gray-500 text-sm">เลือกหัวข้อย่อยที่คุณต้องการเรียนรู้</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subTopics.map((st: any) => (
                  <button 
                    key={st.id} 
                    onClick={() => setSelectedGrammarSubTopic(st.id)} 
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <FileText size={18} />
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{st.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      );
    }

    const folderName = `${selectedGrammarLevel}/${selectedGrammarTopic}/${selectedGrammarSubTopic}`;
    const activeTopic = (grammarTopics[selectedGrammarLevel as keyof typeof grammarTopics] || []).find(t => t.id === selectedGrammarTopic);
    const activeSubTopicName = activeTopic?.subtopics?.find((st: any) => st.id === selectedGrammarSubTopic)?.name || 'Grammar PDF';

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          {/* Floating Toolbar */}
          <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsFullscreen(false)} 
              title="ออกเต็มจอ"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
            >
               <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full overflow-hidden relative">
            <DocumentGallery type="courseware" folder={folderName} prefix="" enableAnnotation={true} />
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{activeSubTopicName}</h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[500px] md:h-[800px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <a href={`/downloads/grammar/${selectedGrammarTopic}/${selectedGrammarSubTopic}.pdf`} download target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors">
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
            <DocumentGallery type="courseware" folder={folderName} prefix="" enableAnnotation={true} />
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
        { id: '6', name: 'BC Reads Level 6' },
        { id: 'teacher_guide', name: "Teacher's Guide for Reading" }
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

    if (selectedReadingLevel === 'teacher_guide') {
      const pdfUrl = '/courses/reading/Guide_for_Reading.pdf';
      const folderName = 'reading_teacher_guide';
      const prefix = 'reading_teacher_guide_';

      if (isFullscreen) {
         return (
           <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
             {/* Floating Toolbar */}
             <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
               <a 
                 href={pdfUrl} download target="_blank" rel="noreferrer" title="ดาวน์โหลด PDF"
                 className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200"
               >
                 <Download size={22} />
               </a>
               <button 
                 onClick={() => setIsFullscreen(false)} title="ออกเต็มจอ"
                 className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
               >
                  <X size={24} />
               </button>
             </div>
             <div className="flex-1 w-full overflow-hidden relative">
               <DocumentGallery type="courseware" folder={folderName} prefix={prefix} enableAnnotation={true} />
             </div>
           </div>
         );
      }

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative pb-24">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Teacher's Guide for Reading</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[500px] md:h-[800px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <a href={pdfUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors">
                  <Download size={16} /> โหลดไฟล์ PDF
                </a>
                <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors">
                  ดูแบบเต็มจอ
                </button>
              </div>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-indigo-100 w-full h-full relative">
              <DocumentGallery type="courseware" folder={folderName} prefix={prefix} enableAnnotation={true} />
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

  if (selectedSkill === 'Speaking') {
    if (!selectedSpeakingCategory) {
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2">บทเรียนการพูด (Speaking Practice)</h2>
            <p className="text-gray-500 mb-8">เลือกรูปแบบการฝึกพูดของคุณ</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button 
                onClick={() => setSelectedSpeakingCategory('conv')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left flex flex-col group"
              >
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform mb-4">
                  💬
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">Conversations</h3>
                <p className="text-gray-500 text-sm">ฝึกพูดโต้ตอบในสถานการณ์จำลอง (50 บทเรียน)</p>
              </button>
              
              <button 
                disabled
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col group opacity-60 cursor-not-allowed relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Coming Soon</div>
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center shrink-0 text-3xl mb-4">
                  🎙️
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">IELTS Mock</h3>
                <p className="text-gray-400 text-sm">จำลองสอบพูด IELTS Speaking Task 1-3 (กำลังพัฒนา)</p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedSpeakingLesson) {
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare size={32} className={selectedSpeakingCategory === 'conv' ? "text-purple-500" : "text-red-500"} />
              <h2 className="text-2xl font-bold">{selectedSpeakingCategory === 'conv' ? 'Conversations (บทสนทนา)' : 'IELTS Mock (จำลองสอบพูด)'}</h2>
            </div>
            <p className="text-gray-500 mb-8">เลือกบทเรียนเพื่อเริ่มฝึกฝน</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 50 }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedSpeakingLesson(i + 1)} 
                  className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group ${selectedSpeakingCategory === 'conv' ? 'hover:border-purple-300' : 'hover:border-red-300'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${selectedSpeakingCategory === 'conv' ? 'bg-purple-50 text-purple-500' : 'bg-red-50 text-red-500'}`}>
                    <Mic size={20} />
                  </div>
                  <span className="font-bold text-gray-700">Lesson {i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedSpeakingCategory === 'conv') {
      const pdfUrl = `/en_speaking_conv/Lesson${selectedSpeakingLesson}.pdf`;
      
      if (isFullscreen) {
        return (
          <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
              <a href={pdfUrl} download target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200">
                <Download size={22} />
              </a>
              <button onClick={() => setIsFullscreen(false)} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200">
                 <X size={24} />
              </button>
            </div>
            <div className="flex-1 w-full overflow-hidden bg-gray-100 relative">
              <DocumentGallery type="courseware" folder={`en_speaking_conv/Lesson${selectedSpeakingLesson}`} prefix="" enableAnnotation={true} />
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับไปเลือกบทเรียน
          </button>
          <div className="animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '85vh' }}>
              <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-b from-purple-50/50 to-white shrink-0 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Conversation Lesson {selectedSpeakingLesson}</h1>
                <div className="flex gap-2">
                  <a href={pdfUrl} download target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-3 rounded-xl font-bold transition-colors shadow-sm border border-green-100 hover:scale-105">
                    <Download size={16} /> โหลด PDF
                  </a>
                  <button onClick={() => setIsFullscreen(true)} className="flex items-center justify-center gap-2 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm border border-purple-100 hover:scale-105">
                    ดูแบบเต็มจอ
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full overflow-hidden bg-gray-100 relative">
                <DocumentGallery type="courseware" folder={`en_speaking_conv/Lesson${selectedSpeakingLesson}`} prefix="" enableAnnotation={true} />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // IELTS Mock UI
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
        <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
          <ChevronLeft size={20} /> ย้อนกลับไปเลือกบทเรียน
        </button>
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-b from-red-50/50 to-white shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">IELTS Mock Speaking - Lesson {selectedSpeakingLesson}</h1>
              <p className="text-gray-600 mb-6">ฟังคำถามจากกรรมการในแต่ละ Task แล้วฝึกพูดตอบกลับ พร้อมใช้พื้นที่ด้านล่างจด Short Note เหมือนการสอบจริง (เวลาสอบจริง Task 2 จะมีเวลาให้จดโน้ต 1 นาที)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(taskNum => (
                  <div key={taskNum} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center gap-3">
                     <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <Headphones size={24} />
                     </div>
                     <div>
                        <p className="font-bold text-gray-800">Task {taskNum}</p>
                     </div>
                     <audio controls src={`/en_speaking_ielts_audio/Lesson${selectedSpeakingLesson}_task${taskNum}.mp3`} className="w-full h-10 mt-auto outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full bg-gray-100 relative flex flex-col">
              <div className="p-4 bg-white/90 backdrop-blur shadow-sm z-30 border-b border-gray-200 flex justify-between items-center sticky top-0">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2"><PenTool size={18} className="text-indigo-500" /> พื้นที่สำหรับ Short Note</h3>
                 <AnnotationToolbar state={annotationState} onChange={setAnnotationState} onClear={() => setClearTrigger(c => c+1)} />
              </div>
              <div className="p-6 min-h-screen">
                 <div className="max-w-4xl w-full mx-auto bg-white shadow-lg rounded-xl overflow-hidden min-h-[1000px]">
                   {/* Blank white canvas for drawing. Using a pure white SVG data URI so AnnotatableImage has a valid source with large aspect ratio */}
                   <AnnotatableImage src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='1414'><rect width='1000' height='1414' fill='white'/></svg>" alt="Short Note Canvas" annotationState={annotationState} clearTrigger={clearTrigger} isActive={true} className="w-full h-auto block" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSkill === 'Writing') {
    if (!selectedWritingLevel) {
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <PenTool size={32} className="text-amber-500" />
              <h2 className="text-2xl font-bold">บทเรียนการเขียน (Writing Practice)</h2>
            </div>
            <p className="text-gray-500 mb-8">เลือกระดับความยากที่ต้องการฝึกฝน</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => setSelectedWritingLevel('easy')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-green-300 hover:shadow-md transition-all text-left flex flex-col group"
              >
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform mb-4">
                  🌱
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2">Easy (ระดับง่าย)</h3>
                <p className="text-gray-500 text-sm">บทเรียนที่ 1 - 50</p>
              </button>
              
              <button 
                onClick={() => setSelectedWritingLevel('medium')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-300 hover:shadow-md transition-all text-left flex flex-col group"
              >
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform mb-4">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors mb-2">Medium (ระดับกลาง)</h3>
                <p className="text-gray-500 text-sm">บทเรียนที่ 51 - 100</p>
              </button>

              <button 
                onClick={() => setSelectedWritingLevel('hard')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-red-300 hover:shadow-md transition-all text-left flex flex-col group"
              >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform mb-4">
                  🎓
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors mb-2">Hard (ระดับยาก)</h3>
                <p className="text-gray-500 text-sm">บทเรียนที่ 101 - 150</p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedWritingLesson) {
      let startLesson = 1;
      let endLesson = 50;
      if (selectedWritingLevel === 'medium') {
        startLesson = 51;
        endLesson = 100;
      } else if (selectedWritingLevel === 'hard') {
        startLesson = 101;
        endLesson = 150;
      }

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={() => setSelectedWritingLevel(null)} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับไปเลือกระดับ
          </button>
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <PenTool size={32} className="text-amber-500" />
              <h2 className="text-2xl font-bold">บทเรียนการเขียน ({selectedWritingLevel.charAt(0).toUpperCase() + selectedWritingLevel.slice(1)})</h2>
            </div>
            <p className="text-gray-500 mb-8">เรียนรู้โครงสร้างไวยากรณ์และฝึกเขียนเรียงความ พร้อมคำศัพท์น่ารู้</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: endLesson - startLesson + 1 }).map((_, i) => {
                const lessonNum = startLesson + i;
                return (
                  <button 
                    key={lessonNum} 
                    onClick={() => setSelectedWritingLesson(lessonNum)} 
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                  >
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PenTool size={20} />
                    </div>
                    <span className="font-bold text-gray-700">Lesson {lessonNum}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const pdfUrl = `/en_writing/EN_Writing_Lesson_${selectedWritingLesson}.pdf`;
    
    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
            <a href={pdfUrl} download target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200">
              <Download size={22} />
            </a>
            <button onClick={() => setIsFullscreen(false)} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200">
               <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full overflow-hidden bg-gray-100 relative">
             <DocumentGallery type="courseware" folder={`en_writing/EN_Writing_Lesson_${selectedWritingLesson}`} prefix="" enableAnnotation={true} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
        <button onClick={() => setSelectedWritingLesson(null)} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
          <ChevronLeft size={20} /> ย้อนกลับไปเลือกบทเรียน
        </button>
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '85vh' }}>
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-b from-amber-50/50 to-white shrink-0 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Writing Lesson {selectedWritingLesson}</h1>
              <div className="flex gap-2">
                <a href={pdfUrl} download target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-3 rounded-xl font-bold transition-colors shadow-sm border border-green-100 hover:scale-105">
                  <Download size={16} /> โหลด PDF
                </a>
                <button onClick={() => setIsFullscreen(true)} className="flex items-center justify-center gap-2 text-sm bg-amber-50 text-amber-600 hover:bg-amber-100 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm border border-amber-100 hover:scale-105">
                  ดูแบบเต็มจอ
                </button>
              </div>
            </div>
            <div className="flex-1 w-full overflow-hidden bg-gray-100 relative">
               <DocumentGallery type="courseware" folder={`en_writing/EN_Writing_Lesson_${selectedWritingLesson}`} prefix="" enableAnnotation={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSkill === 'Listening') {
    if (!selectedListeningLevel) {
      const levels = Object.keys(listeningLessons).map(k => ({ id: k, ...listeningLessons[k as keyof typeof listeningLessons] }));
      levels.unshift({ id: 'teacher_guide', label: "Teacher's Guide for Listening", description: "เอกสารประกอบการเรียนและคู่มือการสอน", articles: [] });

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2">บทเรียนการฟัง (Listening Practice)</h2>
            <p className="text-gray-500 mb-8">เลือกระดับความยากหรือเอกสารที่เหมาะสมกับคุณ</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {levels.map((level) => (
                <button 
                  key={level.id}
                  onClick={() => setSelectedListeningLevel(level.id)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col group"
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform mb-4">
                    {level.id === 'teacher_guide' ? '📚' : level.id === 'intermediate' ? '🎧' : '🎙️'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{level.label}</h3>
                  <p className="text-gray-500 text-sm">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedListeningLevel === 'teacher_guide') {
      const pdfUrl = '/courses/listening/Guide_for_Listening.pdf';
      const folderName = 'listening_teacher_guide';
      const prefix = 'listening_teacher_guide_';

      if (isFullscreen) {
         return (
           <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
             <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
               <a href={pdfUrl} download target="_blank" rel="noreferrer" title="ดาวน์โหลด PDF" className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200">
                 <Download size={22} />
               </a>
               <button onClick={() => setIsFullscreen(false)} title="ออกเต็มจอ" className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200">
                  <X size={24} />
               </button>
             </div>
             <div className="flex-1 w-full overflow-hidden relative">
               <DocumentGallery type="courseware" folder={folderName} prefix={prefix} enableAnnotation={true} />
             </div>
           </div>
         );
      }

      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative pb-24">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Teacher's Guide for Listening</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[500px] md:h-[800px] relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">เอกสารประกอบการเรียน</h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                <a href={pdfUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors">
                  <Download size={16} /> โหลดไฟล์ PDF
                </a>
                <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors">
                  ดูแบบเต็มจอ
                </button>
              </div>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-blue-100 w-full h-full relative">
              <DocumentGallery type="courseware" folder={folderName} prefix={prefix} enableAnnotation={true} />
            </div>
          </div>
        </div>
      );
    }

    if (!selectedListeningArticle) {
      const currentLevelData = (listeningLessons as any)[selectedListeningLevel];
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับไปเลือกระดับ
          </button>
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2">{currentLevelData.label}</h2>
            <p className="text-gray-500 mb-8">{currentLevelData.description}</p>
            
            {(!currentLevelData.articles || currentLevelData.articles.length === 0) ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                ยังไม่มีบทเรียนในระดับนี้ (กำลังสร้างบทเรียน)
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {currentLevelData.articles.map((article: any, index: number) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedListeningArticle({ ...article, lessonNum: index + 1, levelKey: selectedListeningLevel })}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col md:flex-row gap-6 md:items-center group"
                  >
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform">
                      🎧
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{article.title}</h3>
                      <p className="text-gray-500 line-clamp-1">แบบทดสอบการฟัง 15 ข้อ</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                         {article.audioUrl && <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium">🔊 มีไฟล์เสียง (Audio)</span>}
                         {article.quiz?.length > 0 && <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-md font-medium">📝 มีแบบฝึกหัด (Quiz)</span>}
                      </div>
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden md:block shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    const article = selectedListeningArticle;
    const imgUrl = `/listening/${article.levelKey}/Lesson${article.lessonNum}.jpg`;

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          {/* Floating Toolbar */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 z-[60] flex items-center gap-3">
            <a 
              href={imgUrl}
              download={`Listening_Lesson_${article.lessonNum}.jpg`}
              target="_blank"
              rel="noreferrer"
              title="ดาวน์โหลด PDF/Image"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200"
            >
              <Download size={22} />
            </a>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="absolute top-4 left-4 md:top-6 md:left-8 z-[60]">
             {article.audioUrl && (
                <div className="bg-white/90 backdrop-blur p-2 rounded-2xl shadow-lg border border-gray-200 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Headphones size={20} />
                  </div>
                  <audio controls src={article.audioUrl} className="h-10 outline-none" />
                </div>
             )}
          </div>

          <div className="absolute top-20 left-0 w-full z-[40] pointer-events-none flex justify-center">
            <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-md rounded-xl">
              <AnnotationToolbar state={annotationState} onChange={setAnnotationState} onClear={() => setClearTrigger(c => c+1)} />
            </div>
          </div>
          
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar pt-32 pb-10">
            <div className="max-w-4xl w-full mx-auto bg-white shadow-2xl rounded-xl overflow-hidden min-h-screen">
              <AnnotatableImage src={imgUrl} alt={`Listening Lesson ${article.lessonNum}`} annotationState={annotationState} clearTrigger={clearTrigger} isActive={true} className="w-full h-auto block" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
        <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
          <ChevronLeft size={20} /> ย้อนกลับ
        </button>
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '85vh' }}>
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {article.audioUrl ? (
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 flex-1">
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <Headphones size={20} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 mb-1">ฝึกฟังเสียงอ่าน</p>
                        <audio controls src={article.audioUrl} className="w-full h-10 outline-none" />
                     </div>
                  </div>
                ) : <div className="flex-1" />}
                
                <div className="flex shrink-0 w-full sm:w-auto">
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="flex items-center justify-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-4 sm:py-3 rounded-xl font-bold transition-colors w-full shadow-sm border border-indigo-100 hover:scale-105"
                   >
                     ดูแบบเต็มจอ
                   </button>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full bg-gray-100 relative overflow-hidden">
              <div className="absolute top-4 left-0 w-full z-50 pointer-events-none flex justify-center">
                <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-md rounded-xl">
                  <AnnotationToolbar state={annotationState} onChange={setAnnotationState} onClear={() => setClearTrigger(c => c+1)} />
                </div>
              </div>
              <div className="w-full h-full overflow-y-auto p-4 pt-20 pb-20 custom-scrollbar">
                 <div className="max-w-4xl w-full mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
                   <AnnotatableImage src={imgUrl} alt={`Listening Lesson ${article.lessonNum}`} annotationState={annotationState} clearTrigger={clearTrigger} isActive={true} className="w-full h-auto block" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSkill === 'VOA Learning English') {
    if (!selectedVOALevel) {
      const levels = Object.keys(voaLessons).map(k => ({ id: k, ...voaLessons[k as keyof typeof voaLessons] }));
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับ
          </button>
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2">บทความข่าว (VOA News)</h2>
            <p className="text-gray-500 mb-8">เลือกระดับความยากที่เหมาะสมกับคุณ</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {levels.map((level) => (
                <button 
                  key={level.id}
                  onClick={() => setSelectedVOALevel(level.id)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col group"
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform mb-4">
                    {level.id === 'beginning' ? '🌱' : level.id === 'intermediate' ? '🚀' : '🎓'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{level.label}</h3>
                  <p className="text-gray-500 text-sm">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (!selectedVOAArticle) {
      const currentLevelData = (voaLessons as any)[selectedVOALevel];
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
            <ChevronLeft size={20} /> ย้อนกลับไปเลือกระดับ
          </button>
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2">{currentLevelData.label}</h2>
            <p className="text-gray-500 mb-8">{currentLevelData.description}</p>
            <div className="flex flex-col gap-4">
              {currentLevelData.articles.map((article: any, index: number) => (
                <button 
                  key={index}
                  onClick={() => setSelectedVOAArticle({ ...article, lessonNum: index + 1, levelKey: selectedVOALevel })}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex flex-col md:flex-row gap-6 md:items-center group"
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 text-3xl group-hover:scale-110 transition-transform">
                    📰
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{article.title}</h3>
                    <p className="text-gray-500 line-clamp-2">{article.paragraphs[0]}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                       {article.audioUrl && <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium">🔊 มีไฟล์เสียง (Audio)</span>}
                       {article.vocabList?.length > 0 && <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-medium">📚 เรียนศัพท์จากข่าว</span>}
                       {article.quiz?.length > 0 && <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-md font-medium">📝 มีแบบฝึกหัด (Quiz)</span>}
                    </div>
                  </div>
                  <ArrowRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden md:block shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const article = selectedVOAArticle;
    const imgUrl = `/voa/${article.levelKey}/Lesson${article.lessonNum}.jpg`;

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          <div className="absolute top-28 right-6 z-[60] flex flex-col items-center gap-3">
            <a 
              href={imgUrl}
              download
              target="_blank"
              rel="noreferrer"
              title="ดาวน์โหลดรูปภาพ"
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
          <div className="flex-1 w-full bg-gray-100 relative overflow-hidden">
            <div className="absolute top-4 left-0 w-full z-50 pointer-events-none flex justify-center">
              <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-md rounded-xl">
                <AnnotationToolbar state={annotationState} onChange={setAnnotationState} onClear={() => setClearTrigger(c => c+1)} />
              </div>
            </div>
            <div className="w-full h-full overflow-y-auto p-4 pt-24 pb-24 custom-scrollbar">
               <div className="max-w-5xl w-full mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
                 <AnnotatableImage src={imgUrl} alt={`Lesson ${article.lessonNum}`} annotationState={annotationState} clearTrigger={clearTrigger} isActive={true} className="w-full h-auto block" />
               </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-10">
        <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
          <ChevronLeft size={20} /> ย้อนกลับ
        </button>
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '85vh' }}>
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {article.audioUrl ? (
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 flex-1">
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <Headphones size={20} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 mb-1">ฝึกฟังเสียงอ่านข่าว</p>
                        <audio controls src={article.audioUrl} className="w-full h-10 outline-none" />
                     </div>
                  </div>
                ) : <div className="flex-1" />}
                
                <div className="flex shrink-0 w-full sm:w-auto">
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="flex items-center justify-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-4 sm:py-3 rounded-xl font-bold transition-colors w-full shadow-sm border border-indigo-100 hover:scale-105"
                   >
                     ดูแบบเต็มจอ
                   </button>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full bg-gray-100 relative overflow-hidden">
              <div className="absolute top-4 left-0 w-full z-50 pointer-events-none flex justify-center">
                <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-md rounded-xl">
                  <AnnotationToolbar state={annotationState} onChange={setAnnotationState} onClear={() => setClearTrigger(c => c+1)} />
                </div>
              </div>
              <div className="w-full h-full overflow-y-auto p-4 pt-20 pb-20 custom-scrollbar">
                 <div className="max-w-4xl w-full mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
                   <AnnotatableImage src={imgUrl} alt={`Lesson ${article.lessonNum}`} annotationState={annotationState} clearTrigger={clearTrigger} isActive={true} className="w-full h-auto block" />
                 </div>
              </div>
            </div>
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

  const skills = [
    { id: 'grammar', name: 'Grammar', icon: <Library size={32} className="text-cyan-500" />, description: 'เรียนรู้หลักไวยากรณ์ตั้งแต่พื้นฐาน (Beginner - Advanced)' },
    { id: 'reading', name: 'Reading', icon: <BookOpen size={32} className="text-emerald-500" />, description: 'ฝึกทักษะการอ่านจากบทความต่างๆ' },
    { id: 'listening', name: 'Listening', icon: <Headphones size={32} className="text-blue-500" />, description: 'ฝึกทักษะการฟังจากเจ้าของภาษา' },
    { id: 'writing', name: 'Writing', icon: <PenTool size={32} className="text-amber-500" />, description: 'ฝึกทักษะการเขียนและโครงสร้างประโยค' },
    { id: 'speaking', name: 'Speaking', icon: <MessageSquare size={32} className="text-purple-500" />, description: 'ฝึกทักษะการพูด โต้ตอบ และจำลองสอบ' },
    { id: 'voa', name: 'VOA Learning English', icon: <div className="text-3xl text-center">📰</div>, description: 'ฝึกอ่านและฟังจากข่าวจริง พร้อมเรียนรู้คำศัพท์ (Integrated)' },
  ];

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

function QuizQuestion({ questionData, index }: { questionData: any, index: number }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const isCorrect = selectedOption === questionData.answer;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h4 className="text-lg font-bold text-gray-800 mb-4">{index + 1}. {questionData.question}</h4>
      <div className="space-y-3">
        {questionData.options.map((opt: string, optIdx: number) => {
          let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
          
          if (selectedOption === null) {
             btnClass += "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
          } else {
             if (optIdx === questionData.answer) {
                btnClass += "border-green-500 bg-green-50 text-green-800 font-medium";
             } else if (optIdx === selectedOption) {
                btnClass += "border-red-300 bg-red-50 text-red-800";
             } else {
                btnClass += "border-gray-100 bg-gray-50 text-gray-400 opacity-50";
             }
          }

          return (
            <button 
              key={optIdx} 
              disabled={selectedOption !== null}
              onClick={() => setSelectedOption(optIdx)}
              className={btnClass}
            >
              {opt}
              {selectedOption !== null && optIdx === questionData.answer && (
                <CheckCircle2 size={18} className="inline-block ml-2 text-green-600" />
              )}
              {selectedOption !== null && optIdx === selectedOption && !isCorrect && (
                <X size={18} className="inline-block ml-2 text-red-500" />
              )}
            </button>
          );
        })}
      </div>
      
      {selectedOption !== null && (
        <div className={`mt-5 p-4 rounded-xl text-sm ${isCorrect ? 'bg-green-100 text-green-900' : 'bg-blue-50 text-blue-900'}`}>
          <span className="font-bold">{isCorrect ? '✅ Correct! ' : '💡 Explanation: '}</span> 
          {questionData.explanation}
        </div>
      )}
    </div>
  );
}
