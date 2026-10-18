'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  LogOut,
  Wallet,
  LogIn,
  UserPlus,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMobileNav } from '@/context/MobileNavContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { openMobileDrawer } = useMobileNav();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Drawer Button & Platform Brand Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={openMobileDrawer}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80 shrink-0"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-slate-700">
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">Hệ thống</span>
            <span className="text-xs font-black text-slate-900 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              AutoSurvey VN
            </span>
          </div>
          <div className="sm:hidden font-black text-xs text-slate-800">
            AutoSurvey VN
          </div>
        </div>
      </div>

      {/* Right Actions: Deposit Button, Create Campaign, and Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prominent "Nạp tiền" button (visible for both guests and members) */}
        {!user && !loading && (
          <Link
            href="/credit"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black px-3 sm:px-3.5 py-2 rounded-xl shadow-md shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Xem bảng giá & Nạp tiền Credits"
          >
            <Wallet className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Nạp tiền</span>
            <span className="hidden md:inline text-[9px] bg-white/25 px-1.5 py-0.5 rounded font-extrabold uppercase">
              Ưu đãi
            </span>
          </Link>
        )}

        {user && (
          <Link
            href="/credit"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/80 text-orange-950 text-xs font-black px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs group"
            title="Xem số dư & Nạp tiền"
          >
            <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-3 h-3" />
            </div>
            <span className="font-mono text-xs sm:text-sm">{user.credits.toLocaleString()}</span>
            <span className="text-[10px] uppercase font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform hidden sm:inline">
              + Nạp tiền
            </span>
          </Link>
        )}

        {/* Quick Launch Studio Button */}
        <Link
          href="/create-form"
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold px-3 sm:px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">Khởi tạo chiến dịch</span>
          <span className="sm:hidden">Tạo form</span>
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
        ) : user ? (
          /* User Profile */
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-950 flex items-center justify-center text-white font-black text-xs shadow-xs border border-slate-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <span>{user.username}</span>
                {user.role === 'admin' ? (
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-extrabold">ADMIN</span>
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">ID: {user.id.replace('usr_', '')}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Đăng xuất"
              className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Guest Auth Actions */
          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-slate-200">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 px-2 sm:px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </Link>

            <Link
              href="/login?tab=register"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Đăng ký</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
