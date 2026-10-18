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
        }, 800);
      } else {
        setFormError(res.error || 'Đăng nhập thất bại');
      }
    } else {
      const res = await register(username, email, password);
      if (res.success) {
        setFormSuccess('Đăng ký thành công! Đã cộng 50.000 Credits vào tài khoản.');
        setTimeout(() => {
          closeAuthModal();
        }, 1200);
      } else {
        setFormError(res.error || 'Đăng ký thất bại');
      }
    }
    setSubmitting(false);
  };

  const quickDemoLogin = async (acc: 'admin' | 'demo') => {
    setSubmitting(true);
    setFormError(null);
    const pass = acc === 'admin' ? 'admin123' : 'demo123';
    const res = await login(acc, pass);
    if (res.success) {
      setFormSuccess(`Đăng nhập thành công với tài khoản ${acc}!`);
      setTimeout(() => closeAuthModal(), 600);
    } else {
      setFormError(res.error || 'Lỗi đăng nhập nhanh');
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

      {/* Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative">
            {/* Header */}
            <div className="bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-800 p-6 text-white relative">
              <button
                onClick={closeAuthModal}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <span className="font-bold text-lg tracking-tight">AutoSurvey PRO</span>
              </div>
              <h2 className="text-xl font-extrabold">
                {modalTab === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản mới'}
              </h2>
              <p className="text-xs text-blue-100/90 mt-1">
                {modalTab === 'login'
                  ? 'Đăng nhập để quản lý đơn điền form và nạp credits tự động.'
                  : 'Nhận ngay 50.000 Credits miễn phí khi hoàn tất tạo tài khoản.'}
              </p>

              {/* Tabs */}
              <div className="mt-5 flex p-1 bg-black/20 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('login');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    modalTab === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:text-white'
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
                    modalTab === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Đăng ký (+50K Free)
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên đăng nhập</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: khuyen_survey"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {modalTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email liên hệ</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="ban@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <span>{modalTab === 'login' ? 'Đăng nhập ngay' : 'Đăng ký & Nhận 50.000 Credits'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick demo accounts */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium mb-2 text-center">
                  Hoặc đăng nhập nhanh bằng tài khoản có sẵn:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('demo')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-[11px] font-semibold text-slate-700 text-center transition-all"
                  >
                    Tài khoản Demo
                    <span className="block text-[10px] text-slate-400 font-normal">demo / demo123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('admin')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-[11px] font-semibold text-slate-700 text-center transition-all"
                  >
                    Tài khoản Quản trị
                    <span className="block text-[10px] text-purple-600 font-normal">admin / admin123</span>
                  </button>
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
