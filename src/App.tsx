import { useState } from 'react';
import { BookOpen, Video, Pencil, Layers, FileSignature, UserCircle, Download } from 'lucide-react';
import LoginArea, { UserProfile } from './components/LoginArea';
import LessonsArea from './components/LessonsArea';
import VideoCallArea from './components/VideoCallArea';
import ExercisesArea from './components/ExercisesArea';
import FlashcardsArea from './components/FlashcardsArea';
import ExamsArea from './components/ExamsArea';
import DownloadsArea from './components/DownloadsArea';

export default function App() {
  const [activeTab, setActiveTab] = useState('vocab');
  const [activeLang, setActiveLang] = useState<'EN' | 'CN' | 'TH'>('EN');
  const [askWord, setAskWord] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleAskAI = (word: string) => {
    setAskWord(word);
    setActiveTab('call');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full shrink-0">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <span>Polyglot AI</span>
        </h1>
        <div className="flex gap-2 items-center">
          {currentUser ? (
            <button 
              onClick={() => setCurrentUser(null)}
              className="text-sm font-medium px-3 py-1.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors mr-2 flex items-center gap-2"
            >
              <UserCircle size={16} /> {currentUser.name}
            </button>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="text-sm font-medium px-4 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors mr-2 shadow-sm"
            >
              เข้าสู่ระบบ
            </button>
          )}
          <button 
            onClick={() => setActiveTab('downloads')}
            className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors mr-2 flex items-center gap-2 shadow-sm ${activeTab === 'downloads' ? 'bg-green-600 text-white' : 'bg-gray-100 text-green-700 hover:bg-green-100'}`}
            title="หน้าดาวน์โหลด"
          >
            <Download size={16} /> หน้าดาวน์โหลด
          </button>
          <button 
            onClick={() => setActiveLang('TH')}
            className={`text-sm font-medium px-2 py-1 rounded transition-colors ${activeLang === 'TH' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >🇹🇭 TH</button>
          <button 
            onClick={() => setActiveLang('EN')}
            className={`text-sm font-medium px-2 py-1 rounded transition-colors ${activeLang === 'EN' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >🇬🇧 EN</button>
          <button 
            onClick={() => setActiveLang('CN')}
            className={`text-sm font-medium px-2 py-1 rounded transition-colors ${activeLang === 'CN' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >🇨🇳 CN</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0 relative">
        <div className="max-w-5xl mx-auto p-4 md:p-6 w-full flex flex-col min-h-full">
          {activeTab === 'vocab' && <LessonsArea activeLang={activeLang} onAskAI={handleAskAI} />}
          {activeTab === 'exercises' && <ExercisesArea activeLang={activeLang} />}
          {activeTab === 'exams' && <ExamsArea activeLang={activeLang} onAskAI={handleAskAI} />}
          {activeTab === 'flashcards' && <FlashcardsArea activeLang={activeLang} onAskAI={handleAskAI} />}
          {activeTab === 'downloads' && <DownloadsArea />}
          
          {/* Always keep VideoCallArea mounted so the connection doesn't drop */}
          <div className={activeTab === 'call' ? 'flex-1 h-full block' : 'hidden'}>
            <VideoCallArea activeLang={activeLang} askWord={askWord} clearAskWord={() => setAskWord(null)} />
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile / Side Nav for Desktop */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-20 md:static md:w-auto h-16 shrink-0 flex items-center justify-center">
        <div className="flex max-w-sm w-full justify-around md:gap-8">
          <button 
            onClick={() => setActiveTab('vocab')}
            className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'vocab' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BookOpen size={24} strokeWidth={activeTab === 'vocab' ? 2.5 : 2} />
            <span className="text-[11px] font-bold mt-1 tracking-wide">คลังคำศัพท์</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'exercises' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Pencil size={24} strokeWidth={activeTab === 'exercises' ? 2.5 : 2} />
            <span className="text-[11px] font-bold mt-1 tracking-wide">บทเรียน</span>
          </button>

          <button 
            onClick={() => setActiveTab('exams')}
            className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'exams' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FileSignature size={24} strokeWidth={activeTab === 'exams' ? 2.5 : 2} />
            <span className="text-[11px] font-bold mt-1 tracking-wide">ตัวอย่างข้อสอบ</span>
          </button>

          <button 
            onClick={() => setActiveTab('flashcards')}
            className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'flashcards' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Layers size={24} strokeWidth={activeTab === 'flashcards' ? 2.5 : 2} />
            <span className="text-[11px] font-bold mt-1 tracking-wide">แฟลชการ์ด</span>
          </button>

          <button 
            onClick={() => setActiveTab('call')}
            className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'call' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Video size={24} strokeWidth={activeTab === 'call' ? 2.5 : 2} />
            <span className="text-[11px] font-bold mt-1 tracking-wide">วิดีโอคอล</span>
          </button>
        </div>
      </nav>

      {showLogin && (
        <LoginArea 
          onLogin={(user) => {
            setCurrentUser(user);
            setShowLogin(false);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
