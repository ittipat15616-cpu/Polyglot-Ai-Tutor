import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, X, UserCircle } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  isSubscribed: boolean;
}

interface LoginAreaProps {
  onLogin: (user: UserProfile) => void;
  onClose: () => void;
}

export default function LoginArea({ onLogin, onClose }: LoginAreaProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock Authentication Logic
    if (email && password) {
      onLogin({
        name: isLogin ? (email.split('@')[0] || 'User') : name,
        email: email,
        isSubscribed: false, // Default to false
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'ยินดีต้อนรับกลับมา!' : 'สร้างบัญชีใหม่'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'เข้าสู่ระบบเพื่อเรียนต่อและใช้งานฟีเจอร์พรีเมียม' : 'ลงทะเบียนเพื่อเก็บประวัติการเรียนของคุณ'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อของคุณ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-200"
            >
              {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            {isLogin ? 'ยังไม่มีบัญชีใช่ไหม? ' : 'มีบัญชีอยู่แล้ว? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
