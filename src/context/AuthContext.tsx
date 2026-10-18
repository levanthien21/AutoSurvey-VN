'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Sparkles,
  X,
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  Globe,
} from 'lucide-react';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleData: { email: string; name?: string; avatar?: string; googleId?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google 4-Color SVG Icon
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'register'>('login');
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
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

  const loginWithGoogle = async (googleData: { email: string; name?: string; avatar?: string; googleId?: string }) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Xác thực Google thất bại');
        return { success: false, error: data.error };
      }
      setUser(data.user);
      setFormSuccess(data.message || 'Đăng nhập Google thành công!');
      setTimeout(() => {
        closeAuthModal();
      }, 700);
      return { success: true };
    } catch (err: any) {
      const errMsg = err.message || 'Lỗi kết nối máy chủ Google';
      setFormError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setSubmitting(false);
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
    setIsGoogleChooserOpen(false);
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setIsGoogleChooserOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

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

  // Google Sign-In Trigger
  const handleGoogleClick = () => {
    setFormError(null);
    setIsGoogleChooserOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}

      {/* World-Class SaaS Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xl animate-fadeIn">
          <div
            style={{ maxWidth: '420px' }}
            className="w-full bg-white rounded-[28px] shadow-[0_25px_70px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.8)] border border-slate-200/90 overflow-hidden relative transition-all"
          >
            {/* Top Glowing Gradient Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            {/* Top Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors z-20"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Account Picker View */}
            {isGoogleChooserOpen ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-center shadow-2xs">
                    <GoogleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Đăng nhập với Google</h3>
                    <p className="text-[11px] text-slate-500">để tiếp tục tới AutoSurvey VN</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Chọn tài khoản Google nhanh:
                  </div>

                  {/* Quick Preset 1: Admin Account */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      loginWithGoogle({
                        email: 'levanthien21@gmail.com',
                        name: 'Lê Văn Thiện',
                        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                      })
                    }
                    className="w-full p-3 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      LT
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-purple-900">
                          Lê Văn Thiện
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-800">
                          Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">levanthien21@gmail.com</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Quick Preset 2: Admin System */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      loginWithGoogle({
                        email: 'admin@autosurvey.vn',
                        name: 'AutoSurvey Admin',
                        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                      })
                    }
                    className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-300 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      AS
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-900">
                          AutoSurvey Admin
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                          Root
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">admin@autosurvey.vn</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Custom Gmail Input */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5">Hoặc nhập địa chỉ Gmail của bạn:</div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="tenban@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="flex-1 h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      disabled={!customGoogleEmail.includes('@') || submitting}
                      onClick={() =>
                        loginWithGoogle({
                          email: customGoogleEmail,
                          name: customGoogleEmail.split('@')[0],
                        })
                      }
                      className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      {submitting ? '...' : 'Đăng nhập'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGoogleChooserOpen(false)}
                  className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  &larr; Quay lại các hình thức đăng nhập khác
                </button>
              </div>
            ) : (
              /* Standard Auth View */
              <div className="p-6 sm:p-7">
                {/* Brand Header */}
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-blue-500/25 mx-auto flex items-center justify-center mb-3">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1.5">
                      <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                    AutoSurvey <span className="text-orange-500">VN</span>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                      PRO
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {modalTab === 'login'
                      ? 'Đăng nhập để khởi tạo chiến dịch & quản trị số dư'
                      : 'Đăng ký nhận ngay 50.000 Credits chạy khảo sát'}
                  </p>
                </div>

                {/* Primary Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={submitting}
                  className="w-full h-11 px-4 bg-white hover:bg-slate-50/90 active:bg-slate-100 border border-slate-200/90 hover:border-slate-300 rounded-xl font-bold text-slate-700 text-xs shadow-xs hover:shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-3 relative group"
                >
                  <GoogleIcon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">Tiếp tục với Google</span>
                  <span className="ml-auto text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                    1 Click
                  </span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-4.5">
                  <div className="border-t border-slate-200/80 w-full" />
                  <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                    hoặc qua tài khoản
                  </span>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 mb-4">
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

                {/* Form Notifications */}
                {formError && (
                  <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Traditional Form */}
                <form onSubmit={handleModalSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {modalTab === 'login' ? 'Tài khoản hoặc Email' : 'Tên đăng nhập'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder={modalTab === 'login' ? 'Tên đăng nhập hoặc email...' : 'ví dụ: khuyen_survey'}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-10 pl-10 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {modalTab === 'register' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">Email liên kết</label>
                        <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          Phân quyền Admin
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="ban@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-10 pl-10 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        * Email thuộc whitelist Admin sẽ tự động kích hoạt quyền Quản trị.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Tối thiểu 6 ký tự"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-10 pl-10 pr-10 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <span>Đang xử lý...</span>
                    ) : (
                      <>
                        <span>{modalTab === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản & Nhận 50.000đ'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Bảo mật 256-bit SSL &bull; Hỗ trợ Google One-Tap &bull; Phân quyền Email Admin</span>
                    </div>
                  </div>
                </form>
              </div>
            )}
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
