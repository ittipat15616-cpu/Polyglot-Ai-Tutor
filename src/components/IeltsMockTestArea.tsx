import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock, FileText, Headphones, Edit3, Mic, CheckCircle, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import { getFirebaseStorageUrl } from '../utils/firebaseStorage';
import DocumentGallery from './DocumentGallery';
import IeltsAnswerSheet from './IeltsAnswerSheet';
import IeltsMockTestResult from './IeltsMockTestResult';
import { gradeIeltsExam, IeltsGradeResult } from '../utils/ieltsGrading';
import { gradeWritingTask, gradeSpeaking, AiGradingResult } from '../utils/AiGradingService';

interface IeltsMockTestAreaProps {
  examId: string; // e.g. "IELTS_Mock_1"
  initialSkill?: Skill;
  onBack: () => void;
}

type Skill = 'listening' | 'reading' | 'writing' | 'speaking';

const SPEAKING_TRACKS = [
  { p: 1, q: 1 }, { p: 1, q: 2 }, { p: 1, q: 3 }, { p: 1, q: 4 },
  { p: 2, q: 1 },
  { p: 3, q: 1 }, { p: 3, q: 2 }, { p: 3, q: 3 }, { p: 3, q: 4 }
];

export default function IeltsMockTestArea({ examId, initialSkill, onBack }: IeltsMockTestAreaProps) {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [speakingTrackIdx, setSpeakingTrackIdx] = useState(0);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IeltsGradeResult | AiGradingResult | null>(null);
  const answersRef = useRef(answers);

  // Normalize examId from "IELTS_Mock_1" to "IELTS_Mock_Test_1"
  const normalizedExamId = examId.replace('IELTS_Mock_', 'IELTS_Mock_Test_');
  const isSet1 = normalizedExamId === 'IELTS_Mock_Test_1';

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (initialSkill && !activeSkill) {
      startSkill(initialSkill);
    }
  }, [initialSkill]);

  useEffect(() => {
    let timer: any;
    if (activeSkill && timeLeft > 0 && hasStarted && !isSubmitting && !result) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSkill, timeLeft, hasStarted, isSubmitting, result]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startSkill = (skill: Skill) => {
    setActiveSkill(skill);
    setSpeakingTrackIdx(0);
    setHasStarted(false); // Reset so they have to click Start
    setResult(null);
    setAnswers({});
    
    if (skill === 'reading' || skill === 'writing') setTimeLeft(60 * 60);
    if (skill === 'listening') setTimeLeft(40 * 60);
    if (skill === 'speaking') setTimeLeft(15 * 60);
  };

  const handleAnswerChange = (qNum: string, ans: string) => {
    setAnswers(prev => ({ ...prev, [qNum]: ans }));
  };

  const handleSubmit = async () => {
    if (!activeSkill) return;
    setIsSubmitting(true);

    try {
      let finalResult;
      if (activeSkill === 'listening' || activeSkill === 'reading') {
        finalResult = await gradeIeltsExam(normalizedExamId, activeSkill, answersRef.current);
      } else if (activeSkill === 'writing') {
        finalResult = await gradeWritingTask(answersRef.current['task1'] || '', answersRef.current['task2'] || '');
      } else if (activeSkill === 'speaking') {
        finalResult = await gradeSpeaking(new Blob()); // Mock blob for now
      }
      setResult(finalResult as any);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการตรวจข้อสอบ (อาจยังไม่มีเฉลยชุดนี้) กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการส่งข้อสอบ?')) {
      handleSubmit();
    }
  };

  if (!activeSkill) {
    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto pb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mb-6 self-start">
          <ChevronLeft size={20} /> ย้อนกลับไปหน้ารวมข้อสอบ
        </button>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{normalizedExamId.replace(/_/g, ' ')}</h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">ยินดีต้อนรับเข้าสู่ระบบจำลองสอบ IELTS แบบ Computer-based โปรดเลือกทักษะที่ต้องการเริ่มต้นสอบ</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => startSkill('listening')} className="p-6 rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Headphones size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Listening</h3>
              <p className="text-sm text-gray-500">40 Questions • 40 Mins</p>
            </button>

            <button onClick={() => startSkill('reading')} className="p-6 rounded-2xl border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reading</h3>
              <p className="text-sm text-gray-500">40 Questions • 60 Mins</p>
            </button>

            <button onClick={() => startSkill('writing')} className="p-6 rounded-2xl border-2 border-amber-100 hover:border-amber-500 hover:bg-amber-50 transition-all group flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Edit3 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Writing</h3>
              <p className="text-sm text-gray-500">2 Tasks • 60 Mins</p>
            </button>

            <button onClick={() => startSkill('speaking')} className="p-6 rounded-2xl border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 transition-all group flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Speaking</h3>
              <p className="text-sm text-gray-500">3 Parts • 15 Mins</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Start Exam Overlay (Early Return to avoid scrolling)
  if (!hasStarted && !isSubmitting && !result) {
    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto pb-10 items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">พร้อมทำข้อสอบหรือยัง?</h2>
          <p className="text-gray-500 mb-8">
            เมื่อกดเริ่มทำข้อสอบ {activeSkill.toUpperCase()} ระบบจะเริ่มจับเวลา คุณจะไม่สามารถหยุดเวลาได้จนกว่าจะส่งข้อสอบ
          </p>
          <button
            onClick={() => setHasStarted(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105"
          >
            เริ่มทำข้อสอบทันที
          </button>
          <button
            onClick={() => setActiveSkill(null)}
            className="mt-4 text-gray-400 hover:text-gray-600 font-medium"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return <IeltsMockTestResult examId={normalizedExamId} skill={activeSkill} resultData={result} onClose={() => setActiveSkill(null)} />;
  }

  // Audio configuration
  let currentAudioUrl = '';
  let audioLabel = '';
  const hasAudio = activeSkill === 'listening' || activeSkill === 'speaking';

  if (activeSkill === 'listening') {
    currentAudioUrl = getFirebaseStorageUrl(`IELTS_Mock_Tests/${normalizedExamId}/Listening_Full_Audio.mp3`);
    audioLabel = 'Listening Audio';
  } else if (activeSkill === 'speaking') {
    const track = SPEAKING_TRACKS[speakingTrackIdx];
    const fileName = isSet1 
      ? `Speaking_Part${track.p}_Q${track.q}.mp3` 
      : `speaking_part${track.p}_q${track.q}.mp3`;
    currentAudioUrl = getFirebaseStorageUrl(`IELTS_Mock_Tests/${normalizedExamId}/${fileName}`);
    audioLabel = `Speaking Part ${track.p} - Q${track.q}`;
  }

  const handleNextSpeakingTrack = () => {
    if (speakingTrackIdx < SPEAKING_TRACKS.length - 1) {
      setSpeakingTrackIdx(speakingTrackIdx + 1);
    }
  };

  const handlePrevSpeakingTrack = () => {
    if (speakingTrackIdx > 0) {
      setSpeakingTrackIdx(speakingTrackIdx - 1);
    }
  };

  const isLowTime = timeLeft < 300; // less than 5 minutes

  // Determine how many pages to hide for Listening/Reading (hiding answer keys at the end)
  const pagesToHide = activeSkill === 'listening' ? 12 : 0;
  const maxPages = activeSkill === 'writing' ? 6 : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-7xl mx-auto relative bg-white">
      
      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800">กำลังตรวจข้อสอบ...</h2>
          <p className="text-gray-500 mt-2">อาจใช้เวลาสักครู่ กรุณารอสักนิดครับ</p>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-t-2xl border-b border-gray-200 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveSkill(null)} 
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{normalizedExamId.replace(/_/g, ' ')} - {activeSkill}</h2>
        </div>
        
        {hasAudio && activeSkill === 'listening' && (
          <div className="flex items-center gap-4 bg-indigo-50 px-4 py-2 rounded-full shadow-inner flex-1 max-w-2xl justify-center">
            <span className="text-sm font-bold text-indigo-900 whitespace-nowrap">{audioLabel}</span>
            <audio 
              controls 
              className="w-full max-w-[300px] h-8 outline-none" 
              src={currentAudioUrl}
              key={currentAudioUrl}
            />
          </div>
        )}

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${isLowTime ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
            <Clock size={24} />
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={confirmSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <Send size={18} /> ส่งข้อสอบ
          </button>
        </div>
      </div>

      {/* Speaking specific layout */}
      {activeSkill === 'speaking' ? (
        <div className="flex-1 bg-white rounded-b-2xl border-x border-b border-gray-200 flex flex-col items-center justify-center p-8">
           <div className="max-w-xl w-full bg-rose-50 border border-rose-100 rounded-3xl p-10 flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold text-rose-900 mb-6">{audioLabel}</h3>
              <p className="text-rose-700 mb-8">Listen to the examiner and then record your answer.</p>
              
              <div className="w-full mb-10">
                <audio 
                  controls 
                  className="w-full outline-none" 
                  src={currentAudioUrl}
                  key={currentAudioUrl}
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <button className="w-24 h-24 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 hover:scale-105 transition-all shadow-lg active:scale-95">
                  <Mic size={48} />
                </button>
                <span className="text-rose-600 font-bold">Hold to Record</span>
              </div>

              <div className="flex items-center gap-4 mt-12">
                {speakingTrackIdx > 0 && (
                  <button
                    onClick={handlePrevSpeakingTrack}
                    className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-800 transition-colors bg-white px-6 py-2 rounded-full shadow-sm border border-rose-100"
                  >
                    <ChevronLeft size={20} /> ย้อนกลับ
                  </button>
                )}
                {speakingTrackIdx < SPEAKING_TRACKS.length - 1 && (
                  <button
                    onClick={handleNextSpeakingTrack}
                    className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-800 transition-colors bg-white px-6 py-2 rounded-full shadow-sm border border-rose-100"
                  >
                    Next Question <ChevronRight size={20} />
                  </button>
                )}
              </div>
           </div>
        </div>
      ) : (
        /* Split Content for Listening/Reading/Writing */
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-gray-50 rounded-b-2xl border-x border-b border-gray-200">
          {/* Left Side: Document */}
          <div className="w-full md:w-1/2 flex-1 md:flex-none md:h-full border-b md:border-b-0 md:border-r border-gray-200 bg-gray-100 flex flex-col overflow-hidden relative">
            <div className="h-full bg-white relative">
              <DocumentGallery 
                type="ielts" 
                folder={`${normalizedExamId}/${activeSkill.charAt(0).toUpperCase() + activeSkill.slice(1).toLowerCase()}_Full`}
                prefix="page" 
                hideLastNPages={pagesToHide}
                maxPagesToShow={maxPages}
                enableAnnotation={false}
                hideDownload={true}
              />
            </div>
          </div>

          {/* Right Side: Answer Sheet */}
          <div className="w-full md:w-1/2 flex-1 md:flex-none md:h-full p-6 overflow-y-auto custom-scrollbar bg-white shadow-inner">
            <h3 className="text-lg font-bold text-indigo-900 border-b pb-2 mb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 flex items-center gap-2">
              <Edit3 size={20} /> กระดาษคำตอบ
            </h3>
            <IeltsAnswerSheet skill={activeSkill} answers={answers} onAnswerChange={handleAnswerChange} />
          </div>
        </div>
      )}
    </div>
  );
}
