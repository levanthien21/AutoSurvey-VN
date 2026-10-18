'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, User, ShieldCheck, LogOut, Wallet, ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, loading, logout, openAuthModal } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Form Engine: <strong className="text-emerald-600 font-semibold">Online v2.5</strong></span>
        </div>
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold hover:bg-purple-200 transition-colors"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Khu vực Quản trị (Admin)</span>
          </Link>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3.5">
        {/* Quick action: Điền form ngay */}
        <Link
          href="/create-form"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tạo form mới</span>
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
        ) : user ? (
          <>
            {/* Live Credits badge */}
            <Link
              href="/credit"
              className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>{user.credits.toLocaleString()}</span>
              <span className="text-[10px] text-amber-600 font-semibold">Credits</span>
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                  {user.username}
                  {user.role === 'admin' ? (
                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">ADMIN</span>
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
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>

            <button
              onClick={() => openAuthModal('register')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>Đăng ký (+50K)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
