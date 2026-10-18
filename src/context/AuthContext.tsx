'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sparkles, X, User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
  createdAt: string;
}

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'register'>('login');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch (err) {
      console.error('Failed to fetch current user', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (usernameInput: string, passwordInput: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Đăng nhập không thành công' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi kết nối máy chủ' };
    }
  };

  const register = async (usernameInput: string, emailInput: string, passwordInput: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, email: emailInput, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Đăng ký không thành công' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi kết nối máy chủ' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setModalTab(tab);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

  // Shield against third-party browser extension errors (e.g. IDM / autofill 'M_ID' errors)
  useEffect(() => {
    const handleErr = (e: ErrorEvent) => {
      const msg = e?.message || e?.error?.message || '';
      const file = e?.filename || '';
      if (
        (typeof msg === 'string' && (msg.includes('M_ID') || msg.includes('chrome-extension://') || msg.includes('moz-extension://'))) ||
        (typeof file === 'string' && (file.includes('chrome-extension://') || file.includes('moz-extension://')))
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return true;
      }
    };

    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = e?.reason?.message || String(e?.reason || '');
      if (typeof msg === 'string' && (msg.includes('M_ID') || msg.includes('chrome-extension://') || msg.includes('moz-extension://'))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return true;
      }
    };

    window.addEventListener('error', handleErr, true);
    window.addEventListener('unhandledrejection', handleRejection, true);
    return () => {
      window.removeEventListener('error', handleErr, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    if (modalTab === 'login') {
      const res = await login(username, password);
      if (res.success) {
        setFormSuccess('Đăng nhập thành công!');
        setTimeout(() => {
          closeAuthModal();
        }, 700);
      } else {
        setFormError(res.error || 'Đăng nhập thất bại');
      }
    } else {
      const res = await register(username, email, password);
      if (res.success) {
        setFormSuccess('Đăng ký thành công! Đã kích hoạt tài khoản.');
        setTimeout(() => {
          closeAuthModal();
        }, 900);
      } else {
        setFormError(res.error || 'Đăng ký thất bại');
      }
    }
    setSubmitting(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}

      {/* Compact Aesthetic Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div
            style={{ maxWidth: '375px' }}
            className="w-full bg-white rounded-[26px] shadow-[0_20px_50px_rgba(15,23,42,0.35)] border border-slate-100 overflow-hidden relative animate-scaleUp"
          >
            {/* Top Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors z-10"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header */}
            <div className="pt-6 px-6 pb-2 text-center">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-900 p-1.5 shadow-md shadow-blue-900/20 mx-auto flex items-center justify-center border border-white/20 mb-2.5">
                <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
              </div>

              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {modalTab === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {modalTab === 'login'
                  ? 'Nhập thông tin để quản trị khảo sát & nạp credits'
                  : 'Đăng ký ngay để nhận 50.000 Credits trải nghiệm'}
              </p>

              {/* Segmented Pill Switcher */}
              <div className="mt-4 flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('login');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    modalTab === 'login'
                      ? 'bg-white text-blue-700 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('register');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    modalTab === 'register'
                      ? 'bg-white text-blue-700 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Đăng ký <span className="text-[10px] text-emerald-600 font-black">(+50K)</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="p-6 pt-3 space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {modalTab === 'login' ? 'Tài khoản hoặc Email' : 'Tên đăng nhập'}
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={modalTab === 'login' ? 'Tên đăng nhập hoặc email...' : 'ví dụ: khuyen_survey'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {modalTab === 'register' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">Email xác thực</label>
                    <span className="text-[10px] text-purple-600 font-semibold">Phân quyền Admin</span>
                  </div>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="ban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Email trong whitelist Admin sẽ tự động nhận quyền Quản trị.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                {submitting ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <span>{modalTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản & Nhận 50K'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Bảo mật 256-bit &bull; Phân quyền Admin qua Email</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
