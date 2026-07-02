import { useState, useEffect } from 'react';
import { BookOpen, Video, Pencil, Layers, FileSignature, UserCircle, Sparkles, Clock, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginArea, { UserProfile } from './components/LoginArea';
import LessonsArea from './components/LessonsArea';
import VideoCallArea from './components/VideoCallArea';
import ExercisesArea from './components/ExercisesArea';
import FlashcardsArea from './components/FlashcardsArea';
import ExamsArea from './components/ExamsArea';
import MockTestsTabArea from './components/MockTestsTabArea';
import ContactArea from './components/ContactArea';

const NAV_ITEMS = [
  { id: 'exercises',  icon: Pencil,         label: 'บทเรียน'      },
  { id: 'exams',      icon: FileSignature,  label: 'ข้อสอบ'       },
  { id: 'mocktests',  icon: Clock,          label: 'จำลองสอบ'     },
  { id: 'contact',    icon: Phone,          label: 'ติดต่อเรา'     },
];

function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const thDate = time.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const thTime = time.toLocaleTimeString('th-TH');

  return (
    <div className="hidden lg:flex items-center gap-1.5 ml-3 px-3 py-1 bg-indigo-50/80 border border-indigo-100 rounded-lg shadow-sm text-xs text-indigo-700 font-medium whitespace-nowrap">
      <Clock size={12} className="text-indigo-500" />
      <span>{thDate} เวลา {thTime}</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('exercises');
  const [activeLang, setActiveLang] = useState<'EN' | 'CN' | 'TH'>('EN');
  const [askWord, setAskWord] = useState<string | null>(null);
  const [askPdfUrl, setAskPdfUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleAskAI = (word: string) => { setAskWord(word); setActiveTab('call'); };
  const handleAskPDF = (url: string)  => { setAskPdfUrl(url); setActiveTab('call'); };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pattern">

      {/* ── HEADER ── */}
      <header
        className="relative z-10 shrink-0 flex items-center justify-between px-5 md:px-8 glass"
        style={{ height: 64, borderBottom: '1px solid rgba(124,58,237,0.12)', borderRadius: 0 }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 cursor-default select-none"
          whileHover={{ scale: 1.02 }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight hidden sm:inline">Polyglot AI</span>
          <span className="badge badge-gold hidden md:inline-flex">Beta</span>
          <RealtimeClock />
        </motion.div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* External AI Tutor Link */}
          <a
            href="https://polyglot-ai-tutor-739782438298.asia-southeast1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all hover:scale-105"
            title="ไปสู่หน้าคลังคำศัพท์และ ai tutor"
          >
            <span className="hidden sm:inline">AI Tutor</span> ➡️
          </a>
          
          {/* Language selector */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border-soft)' }}>
            {[
              { code: 'EN', flag: '🇬🇧' },
              { code: 'CN', flag: '🇨🇳' },
            ].map(({ code, flag }) => (
              <button
                key={code}
                onClick={() => setActiveLang(code as any)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                style={activeLang === code
                  ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }
                  : { color: 'var(--c-text-muted)' }
                }
              >
                {flag} {code}
              </button>
            ))}
          </div>

          {/* Auth */}
          {currentUser ? (
            <button
              onClick={() => setCurrentUser(null)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all btn-ghost"
            >
              <UserCircle size={14} /> {currentUser.name}
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowLogin(true)}
              className="btn-primary text-sm !px-4 !py-2 !rounded-xl"
            >
              เข้าสู่ระบบ
            </motion.button>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-0 flex-1 overflow-y-auto w-full pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-6 w-full flex flex-col min-h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'exercises' && (
              <motion.div key="exercises" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                <ExercisesArea activeLang={activeLang} onAskPDF={handleAskPDF} />
              </motion.div>
            )}
            {activeTab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                <ExamsArea activeLang={activeLang} onAskAI={handleAskAI} />
              </motion.div>
            )}
            {activeTab === 'mocktests' && (
              <motion.div key="mocktests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="h-full">
                <MockTestsTabArea 
                  onAskAI={(msg) => {
                    setAskWord(msg);
                    setActiveTab('call');
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="h-full">
                <ContactArea />
              </motion.div>
            )}
          </AnimatePresence>

          {/* VideoCallArea: always mounted */}
          <div className={activeTab === 'call' ? 'flex-1 h-full block' : 'hidden'}>
            <VideoCallArea
              activeLang={activeLang}
              askWord={askWord}
              clearAskWord={() => setAskWord(null)}
              askPdfUrl={askPdfUrl}
              clearAskPdfUrl={() => setAskPdfUrl(null)}
            />
          </div>
        </div>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav
        className="relative z-10 fixed bottom-0 w-full md:static md:w-auto shrink-0 flex items-center justify-center glass"
        style={{
          height: 68,
          borderTop: '1px solid rgba(124,58,237,0.12)',
          borderRadius: 0,
        }}
      >
        <div className="flex max-w-sm w-full justify-around md:gap-8 px-2">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl min-w-[60px] transition-all duration-200 relative ${active ? 'nav-tab-active' : ''}`}
                style={active
                  ? { color: 'var(--c-indigo-mid)' }
                  : { color: 'var(--c-text-subtle)' }
                }
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--c-indigo-pale)' }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  />
                )}
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} className="relative z-10" />
                <span className="text-[10px] font-bold tracking-wide relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
        
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <LoginArea
          onLogin={(user) => { setCurrentUser(user); setShowLogin(false); }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
