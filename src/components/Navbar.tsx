'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  LogOut,
  Wallet,
  ShieldAlert,
  LogIn,
  UserPlus,
  Search,
  Command,
  ArrowRight,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (searchQuery.includes('docs.google.com') || searchQuery.includes('forms.gle')) {
      router.push(`/create-form/model?url=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/orders?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Command Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Dán link Google Forms hoặc tìm mã đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-16 text-xs rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-2.5 top-2.5 hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono shadow-2xs">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </form>

        {/* Telemetry Radar Pill */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Engine v2.5:</span>
          <strong className="text-emerald-600 font-bold">Online</strong>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Quick Launch Studio Button */}
        <Link
          href="/create-form"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Khởi tạo chiến dịch</span>
          <span className="sm:hidden">Tạo form</span>
        </Link>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
        ) : user ? (
          <>
            {/* Live Credits Badge */}
            <Link
              href="/credit"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/80 text-orange-950 text-xs font-black px-3 py-1.5 rounded-xl transition-all shadow-xs group"
            >
              <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-3 h-3" />
              </div>
              <span className="font-mono text-sm">{user.credits.toLocaleString()}</span>
              <span className="text-[10px] uppercase font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                + Nạp
              </span>
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
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
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-slate-900/10"
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
