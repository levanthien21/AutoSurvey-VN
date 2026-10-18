'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, LogOut, Wallet, ShieldAlert, LogIn, UserPlus, Zap, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, loading, logout, openAuthModal } = useAuth();

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Submitter Engine:</span>
          <strong className="text-emerald-600 font-bold">Online v2.5</strong>
        </div>

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Khu vực Quản trị Admin</span>
          </Link>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Quick action: Tạo form ngay */}
        <Link
          href="/create-form"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Tạo form mới</span>
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
        ) : user ? (
          <>
            {/* Live Credits Badge */}
            <Link
              href="/credit"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200/80 text-amber-900 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-xs group"
            >
              <div className="w-5 h-5 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-orange-600" />
              </div>
              <span className="font-mono text-sm">{user.credits.toLocaleString()}</span>
              <span className="text-[10px] uppercase font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                + Nạp
              </span>
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white font-black text-xs shadow-xs border border-white/20">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
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
                className="w-8 h-8 rounded-xl border border-slate-200/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>

            <button
              onClick={() => openAuthModal('register')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-slate-900/10"
            >
              <UserPlus className="w-3.5 h-3.5 text-orange-400" />
              <span>Đăng ký (+50K)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
