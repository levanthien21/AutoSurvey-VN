'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  Shield,
  Headphones,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  X,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  signInWithGoogleFirebase,
  handleGoogleRedirectResult,
  isFirebaseConfigured,
  saveUserToFirestore,
  sendPasswordResetEmailFirebase,
} from '@/lib/firebase';

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

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const { user, login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

  // Forgot Password Detailed Flow States
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'google'>('request');
  const [forgotOtp, setForgotOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [googleInfoMsg, setGoogleInfoMsg] = useState<string | null>(null);

  // Firebase Official Config Setup Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cfgApiKey, setCfgApiKey] = useState('');
  const [cfgProjectId, setCfgProjectId] = useState('');
  const [cfgAuthDomain, setCfgAuthDomain] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Check redirect result on mount (for mobile flow)
  useEffect(() => {
    handleGoogleRedirectResult().then(async (res) => {
      if (res.success && res.user) {
        await loginWithGoogle({
          email: res.user.email,
          name: res.user.displayName,
          avatar: res.user.photoURL,
          googleId: res.user.uid,
        });
        router.push('/');
      }
    });
  }, [loginWithGoogle, router]);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setNotRegistered(false);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(username, password);
      if (res.success) {
        setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          router.push('/');
        }, 600);
      } else {
        setErrorMsg(res.error || 'Đăng nhập không thành công');
        if (res.notRegistered) {
          setNotRegistered(true);
        }
      }
    } else if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không khớp');
        setLoading(false);
        return;
      }
      const registerEmail = email.trim() || (username.includes('@') ? username : `${username}@autosurvey.vn`);
      const res = await register(username, registerEmail, password);
      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Tặng ngay 50.000 Credits.');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else {
        setErrorMsg(res.error || 'Đăng ký không thành công');
      }
    } else if (mode === 'forgot') {
      if (forgotStep === 'request') {
        const targetAccount = (email || username).trim();
        if (!targetAccount) {
          setErrorMsg('Vui lòng nhập Email hoặc Tên đăng nhập của bạn.');
          setLoading(false);
          return;
        }

        try {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account: targetAccount }),
          });
          const data = await res.json();

          if (!data.success) {
            setErrorMsg(data.error || 'Không tìm thấy tài khoản tương ứng.');
            setLoading(false);
            return;
          }

          if (data.isGoogle) {
            setGoogleInfoMsg(data.message);
            setForgotStep('google');
            setLoading(false);
            return;
          }

          // If target is email, also trigger Firebase reset email if possible
          if (targetAccount.includes('@')) {
            sendPasswordResetEmailFirebase(targetAccount).catch(() => {});
          }

          // Has OTP
          setForgotOtp(data.otp);
          setEnteredOtp(data.otp);
          setSuccessMsg(
            `Hệ thống đã tạo mã xác thực khôi phục mật khẩu cho tài khoản ${data.username || targetAccount}!`
          );
          setForgotStep('verify');
        } catch (err: any) {
          setErrorMsg(err.message || 'Lỗi khi gửi yêu cầu khôi phục mật khẩu.');
        }
      } else if (forgotStep === 'verify') {
        if (!enteredOtp.trim()) {
          setErrorMsg('Vui lòng nhập mã xác thực OTP 6 số.');
          setLoading(false);
          return;
        }
        if (!newPassword || newPassword.length < 6) {
          setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setErrorMsg('Mật khẩu xác nhận không khớp.');
          setLoading(false);
          return;
        }

        try {
          const targetAccount = (email || username).trim();
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              account: targetAccount,
              otp: enteredOtp,
              newPassword,
            }),
          });
          const data = await res.json();

          if (!data.success) {
            setErrorMsg(data.error || 'Cập nhật mật khẩu thất bại.');
            setLoading(false);
            return;
          }

          setSuccessMsg('Đổi mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
          setTimeout(() => {
            setMode('login');
            setForgotStep('request');
            setPassword('');
            setConfirmPassword('');
            if (data.username) {
              setUsername(data.username);
            }
          }, 1200);
        } catch (err: any) {
          setErrorMsg(err.message || 'Lỗi khi cập nhật mật khẩu mới.');
        }
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const fbRes = await signInWithGoogleFirebase();
      if (fbRes.success && fbRes.user) {
        await loginWithGoogle({
          email: fbRes.user.email,
          name: fbRes.user.displayName,
          avatar: fbRes.user.photoURL,
          googleId: fbRes.user.uid,
        });
        setSuccessMsg('Đăng nhập Google thành công! Đang chuyển tiếp...');
        setTimeout(() => {
          router.push('/');
        }, 600);
        return;
      }

      if (fbRes.needConfig) {
        // Need official Firebase Project config from user
        setShowConfigModal(true);
      } else {
        setErrorMsg(fbRes.error || 'Đăng nhập Google không thành công.');
      }
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      setErrorMsg(err.message || 'Lỗi khi kết nối máy chủ Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgApiKey.trim()) {
      setErrorMsg('Vui lòng nhập Firebase API Key.');
      return;
    }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/firebase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cfgApiKey.trim(),
          projectId: cfgProjectId.trim() || 'autosurvey-vn',
          authDomain: cfgAuthDomain.trim() || `${cfgProjectId.trim() || 'autosurvey-vn'}.firebaseapp.com`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfigModal(false);
        setSuccessMsg('Đã lưu cấu hình Firebase chính thức! Đang mở cửa sổ Google...');
        // Immediately trigger genuine Google login
        setTimeout(() => {
          handleGoogleSignIn();
        }, 800);
      } else {
        setErrorMsg(data.error || 'Lỗi khi lưu cấu hình');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Soft Curved Vector Waves at bottom left */}
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] pointer-events-none opacity-40 z-0">
        <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-blue-100">
          <path
            d="M-50 400 C 120 480, 280 340, 420 440 C 480 480, 520 520, 500 600 L -50 600 Z"
            fill="currentColor"
          />
          <path
            d="M-80 320 C 80 400, 220 260, 380 360 C 440 400, 480 460, 460 550 L -80 550 Z"
            fill="#dbeafe"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 z-10 my-auto">
        {/* =========================================================================
            LEFT COLUMN: BRANDING & VALUE PROPOSITIONS (Matching Screenshot 100%)
        ========================================================================= */}
        <div className="w-full lg:w-1/2 space-y-8 lg:pr-6 text-left">
          {/* Brand Logo & Title */}
          <Link href="/" className="inline-flex items-center gap-3.5 group">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="AutoSurvey VN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl sm:text-[26px] text-slate-900 tracking-tight">
                  AutoSurvey <span className="text-blue-600">VN</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-normal mt-0.5">
                Dịch Vụ Điền Khảo Sát & Số Liệu SPSS
              </p>
            </div>
          </Link>

          {/* Hero Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.18] text-slate-900">
              Dữ liệu chính xác <br />
              <span className="text-blue-600">Kiến tạo giá trị</span>
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed font-normal pt-2 max-w-lg">
              Giải cứu deadline luận văn! Dịch vụ tăng lượt điền khảo sát Google/MS Form siêu tốc. Data giả lập người thật, chuẩn SPSS (Alpha &gt; 0.8). Hỗ trợ 24/7 - Uy tín - Bảo hành data.
            </p>
          </div>

          {/* 3 Value Badges (Nhanh chóng | Chính xác | Hỗ trợ 24/7) */}
          <div className="pt-2">
            <div className="grid grid-cols-3 divide-x divide-slate-200/90 max-w-lg items-center">
              {/* Badge 1: Nhanh chóng */}
              <div className="pr-3 sm:pr-4 flex flex-col items-start text-left">
                <div className="w-11 h-11 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-2.5">
                  <Zap className="w-5 h-5 fill-blue-600 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Nhanh chóng</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Hoàn thành đúng hạn</p>
              </div>

              {/* Badge 2: Chính xác */}
              <div className="px-3 sm:px-4 flex flex-col items-start text-left">
                <div className="w-11 h-11 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-2.5">
                  <Shield className="w-5 h-5 fill-blue-600 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Chính xác</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Dữ liệu chất lượng cao</p>
              </div>

              {/* Badge 3: Hỗ trợ 24/7 */}
              <div className="pl-3 sm:pl-4 flex flex-col items-start text-left">
                <div className="w-11 h-11 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-2.5 relative">
                  <Headphones className="w-5 h-5 text-blue-600" />
                  <span className="absolute text-[8px] font-black text-blue-700 bg-white rounded-full px-1 shadow-2xs -bottom-1 -right-1 border border-blue-200">
                    24
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Hỗ trợ 24/7</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Luôn sẵn sàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: THE AUTH CARD (Matching Screenshot 100%)
        ========================================================================= */}
        <div className="w-full lg:w-[460px] shrink-0">
          <div className="bg-white rounded-3xl sm:rounded-[32px] shadow-[0_15px_50px_-10px_rgba(0,0,0,0.06),0_0_0_1px_rgba(241,245,249,0.9)] p-7 sm:p-10 border border-slate-100 transition-all">
            {/* Standard Auth Card Content */}
            <div className="text-left">
              {/* Card Title & Subtitle */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                  {mode === 'login'
                    ? 'Đăng nhập'
                    : mode === 'register'
                    ? 'Đăng ký tài khoản'
                    : forgotStep === 'verify'
                    ? 'Đặt lại mật khẩu'
                    : forgotStep === 'google'
                    ? 'Tài khoản Google'
                    : 'Khôi phục mật khẩu'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                  {mode === 'login'
                    ? 'Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ'
                    : mode === 'register'
                    ? 'Vui lòng điền thông tin để tạo tài khoản mới'
                    : forgotStep === 'verify'
                    ? 'Nhập mã xác thực OTP 6 số và đặt mật khẩu mới cho tài khoản'
                    : forgotStep === 'google'
                    ? 'Tài khoản này được xác thực trực tiếp qua Google'
                    : 'Nhập email hoặc tên đăng nhập để nhận thông báo và mã khôi phục'}
                </p>
              </div>

              {/* Notifications */}
              {errorMsg && !notRegistered && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Unregistered Helper */}
              {notRegistered && mode === 'login' && (
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-fadeIn text-left">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Tài khoản chưa tồn tại!</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bạn chưa đăng ký tài khoản cho <strong>{username}</strong>. Hãy bấm nút dưới đây để tạo tài khoản mới ngay (nhận 50.000 Credits)!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      if (username.includes('@')) {
                        setEmail(username);
                        setUsername(username.split('@')[0]);
                      }
                      setErrorMsg(null);
                      setNotRegistered(false);
                    }}
                    className="w-full h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Chuyển sang Đăng ký ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* FORGOT PASSWORD: STEP GOOGLE */}
              {mode === 'forgot' && forgotStep === 'google' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <GoogleIcon className="w-5 h-5 shrink-0" />
                      <span>Tài khoản liên kết Google</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {googleInfoMsg ||
                        'Tài khoản này đã được liên kết với Google. Bạn có thể đăng nhập ngay mà không cần mật khẩu.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-3 text-sm font-semibold text-slate-800 shadow-xs transition-all"
                  >
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                    <span>Đăng nhập tiếp tục với Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotStep('request');
                      setErrorMsg(null);
                    }}
                    className="w-full h-10 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    ← Quay lại trang Đăng nhập
                  </button>
                </div>
              ) : mode === 'forgot' && forgotStep === 'verify' ? (
                /* FORGOT PASSWORD: STEP VERIFY OTP & SET NEW PASSWORD */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 uppercase tracking-wide text-[10px]">
                        Mã xác thực OTP của bạn
                      </span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        Có hiệu lực 15 phút
                      </span>
                    </div>
                    <div className="text-xl font-mono font-black text-amber-900 tracking-wider">
                      {forgotOtp}
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Hệ thống đã tự động điền mã bảo mật. Vui lòng nhập mật khẩu mới bên dưới:
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Mã xác thực OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  {/* New Password */}
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Confirm New Password */}
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Xác nhận mật khẩu mới"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
                  >
                    {loading ? <span>Đang xử lý...</span> : <span>Cập nhật mật khẩu mới</span>}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                      ← Gửi lại mã hoặc đổi tài khoản
                    </button>
                  </div>
                </form>
              ) : (
                /* MAIN FORM: LOGIN / REGISTER / FORGOT REQUEST */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Register Name Field */}
                  {mode === 'register' && (
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

                  {/* Email / Username / Phone Field */}
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={mode === 'forgot' ? 'text' : mode === 'register' ? 'email' : 'text'}
                      required
                      placeholder={
                        mode === 'login'
                          ? 'Email hoặc tên đăng nhập'
                          : mode === 'register'
                          ? 'Email của bạn'
                          : 'Nhập email hoặc tên đăng nhập tài khoản'
                      }
                      value={mode === 'register' ? email : username}
                      onChange={(e) => {
                        if (mode === 'register') {
                          setEmail(e.target.value);
                        } else {
                          setUsername(e.target.value);
                          setEmail(e.target.value);
                        }
                      }}
                      className="w-full h-12 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Password Field */}
                  {mode !== 'forgot' && (
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
                  )}

                  {/* Confirm Password Field (Register Only) */}
                  {mode === 'register' && (
                    <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Xác nhận mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  )}

                  {/* Remember Me & Forgot Password Row */}
                  {mode === 'login' && (
                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Ghi nhớ đăng nhập</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setForgotStep('request');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all mt-2"
                  >
                    {loading ? (
                      <span>Đang xử lý...</span>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>
                          {mode === 'login'
                            ? 'Đăng nhập'
                            : mode === 'register'
                            ? 'Đăng ký tài khoản'
                            : 'Gửi yêu cầu khôi phục'}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Divider: "Hoặc" */}
                  {mode !== 'forgot' && (
                    <div className="relative flex items-center justify-center my-5">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-3 text-xs text-slate-400 font-normal absolute">
                        Hoặc
                      </span>
                    </div>
                  )}

                  {/* Genuine Google Login Button */}
                  {mode !== 'forgot' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleGoogleSignIn}
                      className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 flex items-center justify-center gap-3 text-sm font-medium text-slate-700 shadow-xs transition-all active:scale-[0.99]"
                    >
                      <GoogleIcon className="w-5 h-5 shrink-0" />
                      <span>
                        {mode === 'login'
                          ? 'Đăng nhập bằng Google'
                          : 'Đăng ký nhanh bằng Google'}
                      </span>
                    </button>
                  )}

                  {/* Bottom Switcher */}
                  <div className="pt-3 text-center text-xs sm:text-sm text-slate-500">
                    {mode === 'login' ? (
                      <p>
                        Chưa có tài khoản?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('register');
                            setErrorMsg(null);
                            setNotRegistered(false);
                          }}
                          className="text-blue-600 font-semibold hover:underline transition-colors"
                        >
                          Đăng ký ngay
                        </button>
                      </p>
                    ) : mode === 'register' ? (
                      <p>
                        Đã có tài khoản?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setErrorMsg(null);
                            setNotRegistered(false);
                          }}
                          className="text-blue-600 font-semibold hover:underline transition-colors"
                        >
                          Đăng nhập ngay
                        </button>
                      </p>
                    ) : (
                      <p>
                        Nhớ mật khẩu rồi?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setForgotStep('request');
                            setErrorMsg(null);
                          }}
                          className="text-blue-600 font-semibold hover:underline transition-colors"
                        >
                          Quay lại Đăng nhập
                        </button>
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Firebase / Google Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-left relative animate-slideRight">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <GoogleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Kết nối Google Authentication</h3>
                <p className="text-xs text-slate-500">Kích hoạt đăng nhập qua accounts.google.com</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Để trình duyệt mở popup đăng nhập chính thống từ Google, hệ thống cần khóa API từ Firebase Project của bạn (chỉ cần nhập 1 lần):
            </p>

            <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Firebase Web API Key: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={cfgApiKey}
                  onChange={(e) => setCfgApiKey(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Firebase Project ID:
                </label>
                <input
                  type="text"
                  placeholder="autosurvey-vn"
                  value={cfgProjectId}
                  onChange={(e) => setCfgProjectId(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Auth Domain:
                </label>
                <input
                  type="text"
                  placeholder="autosurvey-vn.firebaseapp.com"
                  value={cfgAuthDomain}
                  onChange={(e) => setCfgAuthDomain(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{savingConfig ? 'Đang lưu...' : 'Lưu & Đăng nhập Google ngay'}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                >
                  <span>Mở Firebase Console lấy API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding Bar */}
      <footer className="w-full py-4 px-6 border-t border-slate-200/60 text-center text-xs text-slate-400 z-10 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} AutoSurvey VN. Chuẩn số liệu SPSS/SmartPLS.</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <span>&bull;</span>
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Điều khoản dịch vụ</span>
          <span>&bull;</span>
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Bảo mật</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
