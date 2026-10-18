'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  LogOut,
  Wallet,
  LogIn,
  UserPlus,
  Menu,
  Coins,
  Layers,
  Database,
  ClipboardList,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMobileNav } from '@/context/MobileNavContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { openMobileDrawer } = useMobileNav();

  const isNavActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 h-[70px] bg-white/85 backdrop-blur-2xl border-b border-slate-200/70 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Left: Mobile Drawer Button & Desktop Brand / Navigation Hub */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <button
          type="button"
          onClick={openMobileDrawer}
          className="lg:hidden p-2.5 rounded-2xl text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 transition-all border border-slate-200/80 shrink-0 shadow-2xs active:scale-95"
          title="Mở bảng điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand identity mark */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                AutoSurvey <span className="text-orange-500">VN</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
                AI 2.5
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Hệ thống sẵn sàng</span>
            </div>
          </div>
        </Link>

        {/* Quick Nav Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-1 pl-4 border-l border-slate-200/80">
          <Link
            href="/create-form"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isNavActive('/create-form')
                ? 'bg-blue-50 text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Chiến dịch</span>
          </Link>

          <Link
            href="/data-builder"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isNavActive('/data-builder')
                ? 'bg-blue-50 text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>SPSS Data</span>
          </Link>

          <Link
            href="/orders"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isNavActive('/orders')
                ? 'bg-blue-50 text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <span>Đơn hàng</span>
          </Link>
        </nav>
      </div>

      {/* Right: High-Converting Deposit Button, Primary Action & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* NẠP TIỀN BUTTON (BẮT BUỘC, NỔI BẬT VỚI HIỆU ỨNG FINTECH SHINE) */}
        {!user && !loading && (
          <Link
            href="/credit"
            className="group relative inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden shrink-0"
            title="Xem bảng giá dịch vụ & nạp credits"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 fill-amber-200 shrink-0" />
            <span className="tracking-tight">Nạp tiền</span>
            <span className="text-[9px] sm:text-[10px] bg-white/25 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
              +30%
            </span>
          </Link>
        )}

        {/* LOGGED IN USER BALANCE BADGE + DEPOSIT SHORTCUT */}
        {user && (
          <Link
            href="/credit"
            className="group inline-flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 hover:from-orange-100 hover:to-amber-100 border border-orange-200/90 text-orange-950 px-2.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl shadow-xs transition-all hover:scale-[1.01] shrink-0"
            title="Số dư hiện tại - Bấm để nạp thêm"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase text-orange-600 tracking-wider">
                Credits
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900">
                {user.credits.toLocaleString()}
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center text-[10px] font-extrabold text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all ml-1">
              + Nạp
            </span>
          </Link>
        )}

        {/* PRIMARY CTA: KHỞI TẠO CHIẾN DỊCH (ẨN TRÊN MOBILE VÌ ĐÃ CÓ Ở BOTTOM NAV, HIỂN THỊ TỪ TABLET/DESKTOP) */}
        <Link
          href="/create-form"
          className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
          <span>Khởi tạo chiến dịch</span>
        </Link>

        {/* USER PROFILE OR AUTH BUTTONS */}
        {loading ? (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-slate-100 animate-pulse"></div>
        ) : user ? (
          /* Logged In User Capsule */
          <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-3 border-l border-slate-200/80">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center text-white font-black text-xs shadow-xs border border-slate-700/80 shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left max-w-[120px] truncate">
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
                <span className="truncate">{user.username}</span>
                {user.role === 'admin' ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-md font-black border border-purple-200">
                    <Crown className="w-2.5 h-2.5 text-purple-600" />
                    <span>ADMIN</span>
                  </span>
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                ID: {user.id.replace('usr_', '')}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Đăng xuất khỏi hệ thống"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all ml-0.5 shrink-0"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        ) : (
          /* Guest Actions: High-contrast, bold, prominent buttons with zero mobile overflow */
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-slate-200/80">
            {/* Đăng nhập button: Solid white surface, 2px border, rich dark text, vibrant blue icon */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50/70 text-slate-900 hover:text-blue-700 text-xs font-black px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-slate-300 hover:border-blue-600 shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0"
              title="Đăng nhập tài khoản"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Đăng nhập</span>
            </Link>

            {/* Đăng ký button: Premium gradient (visible on screens >= 480px / sm) */}
            <Link
              href="/login?tab=register"
              className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black px-3.5 sm:px-4 py-2 rounded-2xl shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
              title="Đăng ký tài khoản mới"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <span>Đăng ký</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
