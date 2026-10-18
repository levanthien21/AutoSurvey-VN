'use client';

import React, { useState } from 'react';
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
  Calculator,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMobileNav } from '@/context/MobileNavContext';
import CostEstimatorModal from '@/components/CostEstimatorModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { openMobileDrawer } = useMobileNav();
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);

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

        {/* Brand identity mark (visible ONLY on mobile/tablet when sidebar is hidden - avoids desktop duplicate) */}
        <Link href="/" className="flex lg:hidden items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              AutoSurvey <span className="text-orange-500">VN</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
              AI 2.5
            </span>
          </div>
        </Link>

        {/* Quick Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs">
          {/* Ước tính ngân sách & TG Button */}
          <button
            type="button"
            onClick={() => setIsEstimatorOpen(true)}
            className="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 shadow-2xs active:scale-95 group shrink-0"
            title="Ước tính ngân sách & thời gian chạy khảo sát"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Ước tính ngân sách & TG</span>
          </button>

          <Link
            href="/create-form"
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              isNavActive('/create-form')
                ? 'bg-blue-50 text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Chiến dịch</span>
          </Link>

          <Link
            href="/data-builder"
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              isNavActive('/data-builder')
                ? 'bg-blue-50 text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>SPSS Data</span>
          </Link>

          <Link
            href="/orders"
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              isNavActive('/orders')
                ? 'bg-blue-50 text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <span>Đơn hàng</span>
          </Link>
        </nav>
      </div>

      {/* Right: Harmonious, Clean & Balanced Action Header */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Mobile / Tablet Estimator Button (lg:hidden) */}
        <button
          type="button"
          onClick={() => setIsEstimatorOpen(true)}
          className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200/90 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0"
          title="Ước tính ngân sách & thời gian chạy khảo sát"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden sm:inline">Ước tính</span>
        </button>

        {/* Facebook Fanpage Pill (Sleek, subtle - shown on large screens) */}
        <a
          href="https://www.facebook.com/profile.php?id=61592111095108"
          target="_blank"
          rel="noopener noreferrer"
          title="Truy cập Fanpage AutoSurvey VN"
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 hover:border-blue-300 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-2xs transition-all active:scale-95 shrink-0"
        >
          <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Fanpage</span>
        </a>

        {/* Nạp tiền button (Guest) */}
        {!user && !loading && (
          <Link
            href="/credit"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
            title="Bảng giá nạp credits"
          >
            <Coins className="w-3.5 h-3.5 text-amber-100" />
            <span>Nạp tiền</span>
            <span className="text-[9px] bg-white/25 px-1 py-0.2 rounded font-extrabold uppercase">
              +15%
            </span>
          </Link>
        )}

        {/* Logged-in User Balance Pill */}
        {user && (
          <Link
            href="/credit"
            className="inline-flex items-center gap-2 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200 text-orange-950 px-2.5 py-1 rounded-xl shadow-2xs transition-all shrink-0"
            title="Số dư hiện tại - Bấm để nạp thêm"
          >
            <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Wallet className="w-3 h-3" />
            </div>
            <div className="flex items-baseline gap-1 text-left leading-tight">
              <span className="font-mono text-xs font-black text-slate-900">
                {user.role === 'admin' ? '∞ Vô hạn' : user.credits.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-orange-600">Credits</span>
            </div>
          </Link>
        )}

        {/* Primary CTA: Khởi tạo (shown on medium+ screens) */}
        <Link
          href="/create-form"
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all active:scale-95 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Khởi tạo</span>
        </Link>

        {/* Subtle Vertical Divider */}
        <div className="h-5 w-px bg-slate-200/90 mx-0.5 hidden sm:block"></div>

        {/* User Profile or Auth Group */}
        {loading ? (
          <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse"></div>
        ) : user ? (
          /* Logged In User Pill */
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-950 flex items-center justify-center text-white font-black text-xs shadow-xs border border-slate-700/80 shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left max-w-[110px] truncate">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1 truncate">
                <span className="truncate">{user.username}</span>
                {user.role === 'admin' && (
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-black border border-purple-200">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Clean, Balanced Guest Auth Group */
          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/login?tab=register"
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all active:scale-95"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>

      <CostEstimatorModal
        isOpen={isEstimatorOpen}
        onClose={() => setIsEstimatorOpen(false)}
      />
    </header>
  );
}
