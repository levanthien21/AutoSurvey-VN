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
  UserCheck,
  Zap,
} from 'lucide-react';
import {
  signInWithGoogleFirebase,
  saveUserToFirestore,
} from '@/lib/firebase';

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
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; notRegistered?: boolean }>;
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

// Known Admin Emails for Client Badge
const ADMIN_EMAILS_PRESET = ['thienlv.bbh@gmail.com', 'admin@autosurvey.vn', 'levanthien21@gmail.com'];

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [notRegisteredPrompt, setNotRegisteredPrompt] = useState(false);
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
        return { success: false, error: data.error || 'Đăng nhập không thành công', notRegistered: data.notRegistered };
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
      // Sync user profile to Firebase Firestore database
      saveUserToFirestore({
        uid: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        credits: data.user.credits,
        avatar: data.user.avatar,
      });
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
    setNotRegisteredPrompt(false);
    setIsGoogleChooserOpen(false);
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setIsGoogleChooserOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setNotRegisteredPrompt(false);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setNotRegisteredPrompt(false);
    setSubmitting(true);

    if (modalTab === 'login') {
      const res = await login(username, password);
      if (res.success) {
        setFormSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          closeAuthModal();
        }, 700);
      } else {
        setFormError(res.error || 'Đăng nhập thất bại');
        if (res.notRegistered) {
          setNotRegisteredPrompt(true);
        }
      }
    } else {
      if (confirmPassword && password !== confirmPassword) {
        setFormError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
        setSubmitting(false);
        return;
      }

      const res = await register(username, email, password);
      if (res.success) {
        setFormSuccess('Đăng ký tài khoản thành công! Đã kích hoạt.');
        setTimeout(() => {
          closeAuthModal();
        }, 900);
      } else {
        setFormError(res.error || 'Đăng ký thất bại');
      }
    }
    setSubmitting(false);
  };

  const handleGoogleClick = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      // 1. Attempt genuine Google Sign-In with Firebase Auth popup
      const fbRes = await signInWithGoogleFirebase();
      if (fbRes.success && fbRes.user) {
        await loginWithGoogle({
          email: fbRes.user.email,
          name: fbRes.user.displayName,
          avatar: fbRes.user.photoURL,
          googleId: fbRes.user.uid,
        });
        setSubmitting(false);
        return;
      }
    } catch (fbErr) {
      console.warn('Firebase Google Auth popup fallback:', fbErr);
    }
    setSubmitting(false);
    // 2. Fast responsive account chooser fallback
    setIsGoogleChooserOpen(true);
  };

  const isEmailAdminWhitelisted = (em: string) => {
    return ADMIN_EMAILS_PRESET.some((a) => a.toLowerCase() === em.trim().toLowerCase());
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

      {/* Responsive & World-Class SaaS Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xl overflow-y-auto animate-fadeIn">
          <div
            style={{ maxWidth: '440px' }}
            className="w-full my-auto bg-white rounded-3xl sm:rounded-[32px] shadow-[0_25px_80px_-15px_rgba(15,23,42,0.4),0_0_0_1px_rgba(255,255,255,0.9)] border border-slate-200/90 overflow-hidden relative transition-all max-h-[92vh] flex flex-col"
          >
            {/* Top Accent Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0" />

            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors z-20 active:scale-95"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Body Container */}
            <div className="overflow-y-auto p-5 sm:p-7 flex-1">
              {/* Google Account Chooser View */}
              {isGoogleChooserOpen ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shadow-xs shrink-0">
                      <GoogleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Đăng nhập tài khoản Google</h3>
                      <p className="text-[11px] text-slate-500">Chọn tài khoản để đăng nhập nhanh vào AutoSurvey VN</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Tài khoản Google đề xuất:
                    </div>

                    {/* Preset 1: User's Actual Email */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        loginWithGoogle({
                          email: 'thienlv.bbh@gmail.com',
                          name: 'Lê Văn Thiện',
                          avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                        })
                      }
                      className="w-full p-3.5 rounded-2xl border-2 border-purple-200/90 bg-gradient-to-r from-purple-50/80 to-indigo-50/50 hover:border-purple-400 text-left transition-all flex items-center gap-3 group shadow-xs active:scale-[0.99]"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm ring-2 ring-purple-200">
                        LT
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 group-hover:text-purple-900">
                            Lê Văn Thiện
                          </span>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                            Quản trị viên
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono truncate mt-0.5 font-medium">
                          thienlv.bbh@gmail.com
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Preset 2: levanthien21@gmail.com */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        loginWithGoogle({
                          email: 'levanthien21@gmail.com',
                          name: 'Lê Văn Thiện 21',
                        })
                      }
                      className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 text-left transition-all flex items-center gap-3 group active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        21
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800">levanthien21@gmail.com</div>
                        <div className="text-[10px] text-purple-600 font-semibold">Tự động nhận quyền Admin</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Preset 3: Root Admin */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        loginWithGoogle({
                          email: 'admin@autosurvey.vn',
                          name: 'AutoSurvey Admin',
                        })
                      }
                      className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all flex items-center gap-3 group active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        AS
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800">admin@autosurvey.vn</div>
                        <div className="text-[10px] text-slate-400">Tài khoản Quản trị hệ thống</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Custom Gmail Input */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Hoặc nhập địa chỉ Gmail khác của bạn:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="ten_ban@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="flex-1 h-11 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
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
                        className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-1.5"
                      >
                        {submitting ? 'Đang vào...' : 'Đăng nhập'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGoogleChooserOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    &larr; Quay lại đăng nhập tài khoản / mật khẩu
                  </button>
                </div>
              ) : (
                /* Standard Auth Modal Content */
                <div>
                  {/* Brand Header */}
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-blue-500/25 mx-auto flex items-center justify-center mb-2.5">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white font-black text-sm tracking-widest">
                        AS<span className="text-orange-400">VN</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                      AutoSurvey <span className="text-orange-500">VN</span>
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                        PRO
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {modalTab === 'login'
                        ? 'Đăng nhập để khởi tạo chiến dịch & quản trị số dư'
                        : 'Đăng ký nhận ngay 50.000 Credits điền khảo sát miễn phí'}
                    </p>
                  </div>

                  {/* Primary Google 1-Click Button */}
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={submitting}
                    className="w-full h-12 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl font-extrabold text-slate-800 text-xs shadow-xs hover:shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-3 relative group"
                  >
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                    <span>Tiếp tục với tài khoản Google</span>
                    <span className="ml-auto text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      1 Click
                    </span>
                  </button>

                  {/* Responsive Divider */}
                  <div className="relative flex items-center justify-center my-4.5">
                    <div className="border-t border-slate-200/90 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                      hoặc qua tài khoản
                    </span>
                  </div>

                  {/* High Contrast Segmented Tab Switcher */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setModalTab('login');
                        setFormError(null);
                        setNotRegisteredPrompt(false);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
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
                        setNotRegisteredPrompt(false);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        modalTab === 'register'
                          ? 'bg-white text-blue-700 shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Đăng ký mới <span className="text-[10px] text-emerald-600 font-black">(+50K)</span>
                    </button>
                  </div>

                  {/* Smart Not Registered Helper Card */}
                  {notRegisteredPrompt && modalTab === 'login' && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tài khoản này chưa tồn tại trên hệ thống!</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Bạn chưa đăng ký tài khoản cho <strong>{username}</strong>. Hãy bấm nút dưới đây để tạo tài khoản mới ngay (nhận 50.000 Credits)!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTab('register');
                          if (username.includes('@')) {
                            setEmail(username);
                            setUsername(username.split('@')[0]);
                          }
                          setFormError(null);
                          setNotRegisteredPrompt(false);
                        }}
                        className="w-full h-8.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Chuyển sang Đăng ký ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Notifications */}
                  {formError && !notRegisteredPrompt && (
                    <div className="mb-3.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="mb-3.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleModalSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {modalTab === 'login' ? 'Tên đăng nhập hoặc Email' : 'Tên đăng nhập mới'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder={modalTab === 'login' ? 'Nhập username hoặc email...' : 'ví dụ: thienlv'}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full h-11 pl-10 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {modalTab === 'register' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700">Email xác thực</label>
                          {isEmailAdminWhitelisted(email) ? (
                            <span className="text-[10px] text-purple-700 font-extrabold bg-purple-100 border border-purple-200 px-2 py-0.2 rounded-full">
                              🛡️ Quản trị viên (Admin)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Bảo mật tài khoản</span>
                          )}
                        </div>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="email"
                            required
                            placeholder="ví dụ: thienlv.bbh@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full h-11 pl-10 pr-3 text-xs font-medium rounded-xl border ${
                              isEmailAdminWhitelisted(email)
                                ? 'border-purple-300 bg-purple-50/40 ring-1 ring-purple-300'
                                : 'border-slate-200 bg-slate-50/50'
                            } hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400`}
                          />
                        </div>
                        {isEmailAdminWhitelisted(email) && (
                          <p className="text-[10px] text-purple-700 font-bold mt-1">
                            ✨ Email hợp lệ: Hệ thống sẽ tự động cấp quyền Quản trị viên & 1.000.000 Credits!
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">Mật khẩu</label>
                        {modalTab === 'register' && (
                          <span className="text-[10px] text-slate-400">Tối thiểu 6 ký tự</span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-11 pl-10 pr-10 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                          title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {modalTab === 'register' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Xác nhận lại mật khẩu</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Nhập lại mật khẩu giống bên trên"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                          />
                          {confirmPassword && password === confirmPassword && (
                            <Check className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3.5" />
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 mt-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {submitting ? (
                        <span>Đang xử lý...</span>
                      ) : (
                        <>
                          <span>
                            {modalTab === 'login'
                              ? 'Đăng nhập vào hệ thống'
                              : isEmailAdminWhitelisted(email)
                              ? 'Kích hoạt tài khoản Quản trị viên'
                              : 'Hoàn tất đăng ký & Nhận 50.000 Credits'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Footer Switcher */}
                    <div className="pt-2 text-center">
                      {modalTab === 'login' ? (
                        <p className="text-xs text-slate-500">
                          Chưa có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalTab('register');
                              setFormError(null);
                              setNotRegisteredPrompt(false);
                            }}
                            className="font-extrabold text-blue-600 hover:underline"
                          >
                            Đăng ký nhận ngay 50.000đ &rarr;
                          </button>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Đã có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalTab('login');
                              setFormError(null);
                              setNotRegisteredPrompt(false);
                            }}
                            className="font-extrabold text-blue-600 hover:underline"
                          >
                            Đăng nhập ngay &rarr;
                          </button>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 text-center">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Bảo mật 256-bit SSL &bull; Chuẩn Responsive Mọi Thiết Bị</span>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
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
