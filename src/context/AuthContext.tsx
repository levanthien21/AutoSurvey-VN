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
  LogIn,
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
const ADMIN_EMAILS_PRESET = ['levanthien21052004@gmail.com', 'thienlv.bbh@gmail.com', 'admin@autosurvey.vn', 'levanthien21@gmail.com'];

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
      const fbRes = await signInWithGoogleFirebase();
      if (fbRes.success && fbRes.user) {
        await loginWithGoogle({
          email: fbRes.user.email,
          name: fbRes.user.displayName,
          avatar: fbRes.user.photoURL,
          googleId: fbRes.user.uid,
        });
        setFormSuccess('Đăng nhập Google thành công! Đang chuyển tiếp...');
        setTimeout(() => {
          closeAuthModal();
        }, 600);
        return;
      } else {
        setFormError(fbRes.error || 'Đăng nhập Google không thành công.');
      }
    } catch (fbErr: any) {
      console.warn('Firebase Google Auth error:', fbErr);
      setFormError(fbErr.message || 'Lỗi khi kết nối máy chủ Google.');
    } finally {
      setSubmitting(false);
    }
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

      {/* Pixel-Perfect Clean Auth Modal matching uploaded design */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div
            style={{ maxWidth: '450px' }}
            className="w-full my-auto bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden relative transition-all max-h-[92vh] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors z-20 active:scale-95"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Body Container */}
            <div className="overflow-y-auto p-6 sm:p-8 flex-1">
              <div className="text-left">
                {/* Title & Subtitle */}
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                    {modalTab === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                    {modalTab === 'login'
                      ? 'Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ'
                      : 'Vui lòng điền thông tin để tạo tài khoản mới'}
                  </p>
                </div>

                  {/* Smart Not Registered Helper Card */}
                  {notRegisteredPrompt && modalTab === 'login' && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tài khoản này chưa tồn tại!</span>
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
                    <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {/* Main Form Inputs */}
                  <form onSubmit={handleModalSubmit} className="space-y-4">
                    {/* Register Name */}
                    {modalTab === 'register' && (
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                        <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Họ và tên hoặc Tên hiển thị"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full h-12 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Email / Username */}
                    <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={modalTab === 'register' ? 'email' : 'text'}
                        required
                        placeholder={modalTab === 'login' ? 'Email hoặc số điện thoại' : 'Email của bạn'}
                        value={modalTab === 'register' ? email : username}
                        onChange={(e) => {
                          if (modalTab === 'register') {
                            setEmail(e.target.value);
                          } else {
                            setUsername(e.target.value);
                          }
                        }}
                        className="w-full h-12 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Confirm Password (Register Only) */}
                    {modalTab === 'register' && (
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Xác nhận mật khẩu"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-12 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Remember me & Forgot Password */}
                    {modalTab === 'login' && (
                      <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Ghi nhớ đăng nhập</span>
                        </label>

                        <a
                          href="/login"
                          onClick={() => closeAuthModal()}
                          className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                    )}

                    {/* Primary Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all mt-1"
                    >
                      {submitting ? (
                        <span>Đang xử lý...</span>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          <span>{modalTab === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</span>
                        </>
                      )}
                    </button>

                    {/* Divider: "Hoặc" */}
                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-3 text-xs text-slate-400 font-normal absolute">
                        Hoặc
                      </span>
                    </div>

                    {/* Google Login Button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleGoogleClick}
                      className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 flex items-center justify-center gap-3 text-sm font-medium text-slate-700 shadow-xs transition-all active:scale-[0.99]"
                    >
                      <GoogleIcon className="w-5 h-5 shrink-0" />
                      <span>{modalTab === 'login' ? 'Đăng nhập bằng Google' : 'Đăng ký nhanh bằng Google'}</span>
                    </button>

                    {/* Switcher */}
                    <div className="pt-2 text-center text-xs sm:text-sm text-slate-500">
                      {modalTab === 'login' ? (
                        <p>
                          Chưa có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalTab('register');
                              setFormError(null);
                              setNotRegisteredPrompt(false);
                            }}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Đăng ký ngay
                          </button>
                        </p>
                      ) : (
                        <p>
                          Đã có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalTab('login');
                              setFormError(null);
                              setNotRegisteredPrompt(false);
                            }}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Đăng nhập ngay
                          </button>
                        </p>
                      )}
                    </div>
                  </form>
                </div>
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
