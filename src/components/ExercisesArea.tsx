import React, { useState } from 'react';
import { BookOpen, Headphones, PenTool, Mic, ChevronLeft, FileText, ArrowRight, Library } from 'lucide-react';
import { getVocabData } from '../data/mockContent';

export default function ExercisesArea({ activeLang }: { activeLang: 'EN' | 'CN' | 'TH' }) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedGrammarLevel, setSelectedGrammarLevel] = useState<string | null>(null);

  if (activeLang !== 'EN') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">บทเรียน</h2>
        <p className="text-gray-500">ฟีเจอร์นี้กำลังพัฒนาสำหรับภาษานี้</p>
      </div>
    );
  }

  const skills = [
    { id: 'grammar', name: 'Grammar', icon: <Library size={32} className="text-cyan-500" />, description: 'เรียนรู้ไวยากรณ์ภาษาอังกฤษ (Beginner - Advanced)' },
    { id: 'reading', name: 'Reading', icon: <BookOpen size={32} className="text-emerald-500" />, description: 'พัฒนาทักษะการอ่านทำความเข้าใจ' },
    { id: 'listening', name: 'Listening', icon: <Headphones size={32} className="text-blue-500" />, description: 'ฝึกทักษะการฟังจากเจ้าของภาษา' },
    { id: 'writing', name: 'Writing', icon: <PenTool size={32} className="text-amber-500" />, description: 'ฝึกฝนการเขียนและการใช้ไวยากรณ์' },
    { id: 'speaking', name: 'Speaking', icon: <Mic size={32} className="text-purple-500" />, description: 'ฝึกการพูดโต้ตอบและออกเสียง' },
  ];

  const handleBack = () => {
    if (selectedGrammarLevel) {
      setSelectedGrammarLevel(null);
    } else {
      setSelectedSkill(null);
    }
  };

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
