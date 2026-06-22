import React, { useState } from 'react';
import { BookOpen, Headphones, PenTool, Mic, ChevronLeft, FileText, PlayCircle, MessageCircleQuestion, ArrowRight } from 'lucide-react';

const hskExamsData: Record<string, { id: string, name: string, videoId: string }[]> = {
  HSK1: [
    { id: 'H10901', name: 'ข้อสอบ HSK1 ชุด H10901', videoId: '' },
    { id: 'H10902', name: 'ข้อสอบ HSK1 ชุด H10902', videoId: '' },
    { id: 'H11003', name: 'ข้อสอบ HSK1 ชุด H11003', videoId: '' },
    { id: 'H11004', name: 'ข้อสอบ HSK1 ชุด H11004', videoId: '' },
    { id: 'H11005', name: 'ข้อสอบ HSK1 ชุด H11005', videoId: '' },
    { id: 'H11329', name: 'ข้อสอบ HSK1 ชุด H11329', videoId: '' },
    { id: 'H11330', name: 'ข้อสอบ HSK1 ชุด H11330', videoId: '' },
    { id: 'H11331', name: 'ข้อสอบ HSK1 ชุด H11331', videoId: '' },
    { id: 'H11332', name: 'ข้อสอบ HSK1 ชุด H11332', videoId: '' },
    { id: 'H11334', name: 'ข้อสอบ HSK1 ชุด H11334', videoId: '' },
  ],
  HSK2: [
    { id: 'H20901', name: 'ข้อสอบ HSK2 ชุด H20901', videoId: '' },
    { id: 'H20902', name: 'ข้อสอบ HSK2 ชุด H20902', videoId: '' },
    { id: 'H21003', name: 'ข้อสอบ HSK2 ชุด H21003', videoId: '' },
    { id: 'H21004', name: 'ข้อสอบ HSK2 ชุด H21004', videoId: '' },
    { id: 'H21005', name: 'ข้อสอบ HSK2 ชุด H21005', videoId: '' },
    { id: 'H21329', name: 'ข้อสอบ HSK2 ชุด H21329', videoId: '' },
    { id: 'H21330', name: 'ข้อสอบ HSK2 ชุด H21330', videoId: '' },
    { id: 'H21331', name: 'ข้อสอบ HSK2 ชุด H21331', videoId: '' },
    { id: 'H21332', name: 'ข้อสอบ HSK2 ชุด H21332', videoId: '' },
    { id: 'H21334', name: 'ข้อสอบ HSK2 ชุด H21334', videoId: '' },
  ],
  HSK3: [
    { id: 'H31001', name: 'ข้อสอบ HSK3 ชุด H31001', videoId: '' },
    { id: 'H31002', name: 'ข้อสอบ HSK3 ชุด H31002', videoId: '' },
    { id: 'H31003', name: 'ข้อสอบ HSK3 ชุด H31003', videoId: '' },
    { id: 'H31004', name: 'ข้อสอบ HSK3 ชุด H31004', videoId: '' },
    { id: 'H31005', name: 'ข้อสอบ HSK3 ชุด H31005', videoId: '' },
    { id: 'H31327', name: 'ข้อสอบ HSK3 ชุด H31327', videoId: '' },
    { id: 'H31328', name: 'ข้อสอบ HSK3 ชุด H31328', videoId: '' },
    { id: 'H31329', name: 'ข้อสอบ HSK3 ชุด H31329', videoId: '' },
    { id: 'H31330', name: 'ข้อสอบ HSK3 ชุด H31330', videoId: '' },
    { id: 'H31332', name: 'ข้อสอบ HSK3 ชุด H31332', videoId: '' },
  ],
  HSK4: [
    { id: 'H41001', name: 'ข้อสอบ HSK4 ชุด H41001', videoId: '' },
    { id: 'H41002', name: 'ข้อสอบ HSK4 ชุด H41002', videoId: '' },
    { id: 'H41003', name: 'ข้อสอบ HSK4 ชุด H41003', videoId: '' },
    { id: 'H41004', name: 'ข้อสอบ HSK4 ชุด H41004', videoId: '' },
    { id: 'H41005', name: 'ข้อสอบ HSK4 ชุด H41005', videoId: '' },
    { id: 'H41006', name: 'ข้อสอบ HSK4 ชุด H41006', videoId: '' },
    { id: 'H41007', name: 'ข้อสอบ HSK4 ชุด H41007', videoId: '' },
    { id: 'H41008', name: 'ข้อสอบ HSK4 ชุด H41008', videoId: '' },
    { id: 'H41009', name: 'ข้อสอบ HSK4 ชุด H41009', videoId: '' },
    { id: 'H41218', name: 'ข้อสอบ HSK4 ชุด H41218', videoId: '' },
    { id: 'H41219', name: 'ข้อสอบ HSK4 ชุด H41219', videoId: '' },
    { id: 'H41220', name: 'ข้อสอบ HSK4 ชุด H41220', videoId: '' },
    { id: 'H41221', name: 'ข้อสอบ HSK4 ชุด H41221', videoId: '' },
    { id: 'H41327', name: 'ข้อสอบ HSK4 ชุด H41327', videoId: '' },
    { id: 'H41328', name: 'ข้อสอบ HSK4 ชุด H41328', videoId: '' },
    { id: 'H41329', name: 'ข้อสอบ HSK4 ชุด H41329', videoId: '' },
    { id: 'H41330', name: 'ข้อสอบ HSK4 ชุด H41330', videoId: '' },
    { id: 'H41332', name: 'ข้อสอบ HSK4 ชุด H41332', videoId: '' },
  ],
  HSK5: [
    { id: 'H51001', name: 'ข้อสอบ HSK5 ชุด H51001', videoId: '' },
    { id: 'H51002', name: 'ข้อสอบ HSK5 ชุด H51002', videoId: '' },
    { id: 'H51003', name: 'ข้อสอบ HSK5 ชุด H51003', videoId: '' },
    { id: 'H51004', name: 'ข้อสอบ HSK5 ชุด H51004', videoId: '' },
    { id: 'H51005', name: 'ข้อสอบ HSK5 ชุด H51005', videoId: '' },
    { id: 'H51327', name: 'ข้อสอบ HSK5 ชุด H51327', videoId: '' },
    { id: 'H51328', name: 'ข้อสอบ HSK5 ชุด H51328', videoId: '' },
    { id: 'H51329', name: 'ข้อสอบ HSK5 ชุด H51329', videoId: '' },
    { id: 'H51330', name: 'ข้อสอบ HSK5 ชุด H51330', videoId: '' },
    { id: 'H51332', name: 'ข้อสอบ HSK5 ชุด H51332', videoId: '' },
  ],
  HSK6: [
    { id: 'H61001', name: 'ข้อสอบ HSK6 ชุด H61001', videoId: '' },
    { id: 'H61002', name: 'ข้อสอบ HSK6 ชุด H61002', videoId: '' },
    { id: 'H61003', name: 'ข้อสอบ HSK6 ชุด H61003', videoId: '' },
    { id: 'H61004', name: 'ข้อสอบ HSK6 ชุด H61004', videoId: '' },
    { id: 'H61005', name: 'ข้อสอบ HSK6 ชุด H61005', videoId: '' },
    { id: 'H61327', name: 'ข้อสอบ HSK6 ชุด H61327', videoId: '' },
    { id: 'H61328', name: 'ข้อสอบ HSK6 ชุด H61328', videoId: '' },
    { id: 'H61329', name: 'ข้อสอบ HSK6 ชุด H61329', videoId: '' },
    { id: 'H61330', name: 'ข้อสอบ HSK6 ชุด H61330', videoId: '' },
    { id: 'H61332', name: 'ข้อสอบ HSK6 ชุด H61332', videoId: '' },
  ]
};

export default function ExamsArea({ activeLang, onAskAI }: { activeLang: 'EN' | 'CN' | 'TH', onAskAI?: (word: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedExamSet, setSelectedExamSet] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (activeLang === 'TH') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ตัวอย่างข้อสอบ</h2>
        <p className="text-gray-500">ฟีเจอร์นี้กำลังพัฒนาสำหรับภาษานี้</p>
      </div>
    );
  }

  // IELTS Options
  const ieltsSkills = [
    { id: 'listening', name: 'Listening', icon: <Headphones size={24} className="text-blue-500" /> },
    { id: 'reading', name: 'Reading', icon: <BookOpen size={24} className="text-emerald-500" /> },
    { id: 'writing', name: 'Writing', icon: <PenTool size={24} className="text-amber-500" /> },
    { id: 'speaking', name: 'Speaking', icon: <Mic size={24} className="text-purple-500" /> },
  ];

  // CEFR Options
  const cefrSkills = [
    { id: 'listening', name: 'Listening', icon: <Headphones size={24} className="text-blue-500" /> },
    { id: 'reading', name: 'Reading', icon: <BookOpen size={24} className="text-emerald-500" /> },
  ];

  const handleCategorySelect = (category: 'IELTS' | 'CEFR') => {
    setSelectedCategory(category);
    setSelectedSkill(null);
    setSelectedExamSet(null);
  };

  const handleBack = () => {
    if (selectedExamSet) {
      setSelectedExamSet(null);
      return;
    }
    if (selectedSkill) {
      if (selectedCategory && selectedCategory.startsWith('HSK')) {
        setSelectedCategory(null);
        setSelectedSkill(null);
      } else {
        setSelectedSkill(null);
      }
    } else {
      setSelectedCategory(null);
    }
  };

  // View: Specific Exam Details
  if (selectedExamSet && selectedCategory) {
    const examsList = hskExamsData[selectedCategory] || [];
    const examData = examsList.find(e => e.id === selectedExamSet);
    const folderName = selectedCategory.toLowerCase(); // hsk1, hsk2, etc.
    const pdfUrl = `/hsk/${folderName}/${selectedExamSet}.pdf`;

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-800 text-white shadow-md z-20">
            <h3 className="font-semibold text-lg">เอกสารข้อสอบ - {selectedExamSet}</h3>
            <button onClick={() => setIsFullscreen(false)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
               <ChevronLeft size={18} /> ปิดโหมดเต็มจอ
            </button>
          </div>
          <div className="flex-1 w-full bg-gray-200 relative">
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              className="w-full h-full border-0"
              title={`ข้อสอบ ${selectedExamSet}`}
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
          <ChevronLeft size={20} /> ย้อนกลับไปเลือกชุดข้อสอบ
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedCategory} - {selectedExamSet}</h2>

        {/* Video Embed Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <PlayCircle size={24} className="text-rose-500" />
            <h3 className="text-xl font-semibold text-gray-800">พาร์ทฟัง (Listening)</h3>
          </div>
          
          {examData?.videoId ? (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-md max-w-3xl">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${examData.videoId}`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="w-full aspect-video rounded-xl bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 max-w-3xl">
              <PlayCircle size={48} className="text-gray-300 mb-2" />
              <p className="text-gray-500">วิดีโอตัวอย่างข้อสอบจะแสดงตรงนี้</p>
              <p className="text-sm text-gray-400 mt-1">(รอเพิ่มลิงก์ YouTube)</p>
            </div>
          )}
        </div>

        {/* PDF Viewer Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[800px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-800">เอกสารข้อสอบ</h3>
            </div>
            <button 
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ดูแบบเต็มจอ
            </button>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
            <object 
              data={pdfUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              className="w-full h-full"
            >
              <div className="flex items-center justify-center h-full p-4 text-center text-gray-500">
                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดงผล PDF กรุณาดาวน์โหลดไฟล์เพื่อเปิดอ่าน</p>
              </div>
            </object>
          </div>
        </div>

        {/* Floating Ask AI Button */}
        <button
          onClick={() => onAskAI?.(`ฉันกำลังทำข้อสอบ ${selectedCategory} ชุด ${selectedExamSet} ช่วยอธิบายโจทย์และสอนเพิ่มเติมหน่อยได้ไหม?`)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group z-30"
        >
          <MessageCircleQuestion size={28} />
          <span className="font-bold pr-2 hidden md:block">ถาม AI Tutor</span>
        </button>
      </div>
    );
  }

  // View: HSK Exam Sets List
  if (selectedCategory && selectedCategory.startsWith('HSK') && selectedSkill) {
    const examsList = hskExamsData[selectedCategory] || [];
    
    if (examsList.length === 0) {
      return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
          >
            <ChevronLeft size={20} /> กลับไประดับ HSK
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
            <FileText size={48} className="text-rose-200 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ข้อสอบ {selectedCategory}</h2>
            <p className="text-gray-500 text-center max-w-md">
              ระบบยังไม่มีไฟล์ตัวอย่างข้อสอบสำหรับระดับนี้ กรุณาอัปเดตระบบในภายหลัง
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
        >
          <ChevronLeft size={20} /> กลับไประดับ HSK
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ข้อสอบ {selectedCategory}</h2>
        <p className="text-gray-500 mb-8">เลือกชุดข้อสอบที่คุณต้องการฝึกทำ</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {examsList.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedExamSet(exam.id)}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-start gap-3 hover:border-rose-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold group-hover:scale-110 transition-transform shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.id}</h3>
                <p className="text-gray-500 text-sm">{exam.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // General Skill Selection for non-HSK categories
  if (selectedSkill && selectedCategory) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCategory} - {selectedSkill} (ตัวอย่างข้อสอบ)</h2>
          <p className="text-gray-500 text-center max-w-md">
            (ส่วนรับรองการอัปโหลดไฟล์/วิดีโอตัวอย่างข้อสอบจะอยู่ตรงนี้)
          </p>
        </div>
      </div>
    );
  }

  if (selectedCategory && !selectedCategory.startsWith('HSK')) {
    const skills = selectedCategory === 'IELTS' ? ieltsSkills : cefrSkills;
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
         <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start"
        >
          <ChevronLeft size={20} /> กลับไปเลือกหมวดหมู่
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">เลือกทักษะข้อสอบ ({selectedCategory})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(skill.name)}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="p-4 rounded-full bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                {skill.icon}
              </div>
              <span className="text-lg font-semibold text-gray-800">{skill.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeLang === 'CN') {
    const hskLevels = [
      { id: 'HSK1', name: 'HSK 1', desc: 'การวัดระดับภาษาจีนระดับเริ่มต้น' },
      { id: 'HSK2', name: 'HSK 2', desc: 'การวัดระดับภาษาจีนระดับต้น' },
      { id: 'HSK3', name: 'HSK 3', desc: 'การวัดระดับภาษาจีนระดับกลางตอนต้น' },
      { id: 'HSK4', name: 'HSK 4', desc: 'การวัดระดับภาษาจีนระดับกลาง' },
      { id: 'HSK5', name: 'HSK 5', desc: 'การวัดระดับภาษาจีนระดับสูงตอนต้น' },
      { id: 'HSK6', name: 'HSK 6', desc: 'การวัดระดับภาษาจีนระดับสูง' },
    ];
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ตัวอย่างข้อสอบ (Chinese)</h2>
        <p className="text-gray-500 mb-8">เลือกระดับ HSK ที่ต้องการทดสอบ</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hskLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => { setSelectedCategory(level.id); setSelectedSkill('รวมทักษะ'); }}
              className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col items-start gap-4 hover:border-rose-500 hover:shadow-lg transition-all text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xl mb-2">
                {level.name}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{level.name} Practice Tests</h3>
                <p className="text-gray-600 text-sm">{level.desc}</p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-rose-600 font-semibold uppercase tracking-wide text-sm">
                ดูตัวอย่างข้อสอบ <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">ตัวอย่างข้อสอบ (English)</h2>
      <p className="text-gray-500 mb-8">เลือกระบบการประเมินที่คุณต้องการทดสอบ</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleCategorySelect('IELTS')}
          className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-start gap-4 hover:border-indigo-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl mb-2">
            IELTS
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">IELTS Practice Tests</h3>
            <p className="text-gray-600">ตัวอย่างข้อสอบ IELTS ครบทั้ง 4 ทักษะ: Listening, Reading, Writing, และ Speaking</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-wide text-sm">
            ดูตัวอย่างข้อสอบ <ArrowRight size={16} />
          </div>
        </button>

        <button
          onClick={() => handleCategorySelect('CEFR')}
          className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-start gap-4 hover:border-emerald-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xl mb-2">
            CEFR
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">CEFR Practice Tests</h3>
            <p className="text-gray-600">ตัวอย่างข้อสอบภาษาอังกฤษตามมาตรฐานยุโรป (ทักษะ Listening และ Reading)</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-semibold uppercase tracking-wide text-sm">
            ดูตัวอย่างข้อสอบ <ArrowRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
}
