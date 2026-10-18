'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Wallet,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 h-16 px-2 flex items-center justify-around shadow-lg safe-bottom">
      {/* 1. Trang chủ */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
          isActive('/') && pathname === '/' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Trang chủ</span>
      </Link>

      {/* 2. Điền form */}
      <Link
        href="/create-form"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
          isActive('/create-form') ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <div className="relative">
          <Sparkles className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
        </div>
        <span className="text-[10px]">Tạo đơn</span>
      </Link>

      {/* 3. Lịch sử đơn */}
      <Link
        href="/orders"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
          isActive('/orders') ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <ClipboardList className="w-5 h-5" />
        <span className="text-[10px]">Lịch sử</span>
      </Link>

      {/* 4. Nạp tiền */}
      <Link
        href="/credit"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
          isActive('/credit') ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <Wallet className="w-5 h-5" />
        <span className="text-[10px]">Nạp Credits</span>
      </Link>

      {/* 5. Tài khoản / Admin */}
      {user ? (
        user.role === 'admin' ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
              isActive('/admin') ? 'text-purple-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span className="text-[10px] text-purple-700 font-bold">Admin</span>
          </Link>
        ) : (
          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
              isActive('/settings') ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] truncate max-w-[50px]">{user.username}</span>
          </Link>
        )
      ) : (
        <Link
          href="/login"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            pathname === '/login' ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px]">Đăng nhập</span>
        </Link>
      )}
    </nav>
  );
}
