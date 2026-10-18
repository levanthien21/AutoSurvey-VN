'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  PieChart,
  FileSpreadsheet,
  Network,
  Bot,
  Database,
  Binary,
  ClipboardList,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  ShieldAlert,
  LogIn,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const [createFormOpen, setCreateFormOpen] = useState(true);
  const { user, openAuthModal } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none shadow-[2px_0_15px_rgba(0,0,0,0.02)]">
      {/* Brand Header with Official Logo */}
      <div className="h-20 flex items-center px-5 border-b border-slate-100 gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-sm flex items-center justify-center shrink-0 group hover:scale-105 transition-transform">
          <img
            src="/logo.png"
            alt="AutoSurvey VN"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base text-slate-900 tracking-tight">
              AutoSurvey <span className="text-orange-500">VN</span>
            </span>
            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
            Khảo Sát & Số Liệu SPSS
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 text-sm">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all relative ${
            isActive('/') && pathname === '/'
              ? 'bg-blue-50 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
          }`}
        >
          {isActive('/') && pathname === '/' && (
            <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full"></span>
          )}
          <LayoutDashboard className="w-4 h-4 text-blue-600" />
          <span>Bảng điều khiển</span>
        </Link>

        {/* Tạo form ngay (Collapsible) */}
        <div className="pt-1">
          <button
            onClick={() => setCreateFormOpen(!createFormOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
              pathname.startsWith('/create-form')
                ? 'text-blue-700 bg-blue-50/50'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FilePlus2 className="w-4 h-4 text-indigo-600" />
              <span>Tạo form ngay</span>
            </div>
            {createFormOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {createFormOpen && (
            <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5">
              <Link
                href="/create-form/ratio"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/create-form/ratio'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-blue-600" />
                <span>Theo tỉ lệ mong muốn</span>
              </Link>

              <Link
                href="/create-form/data"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/create-form/data'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Điền data có trước</span>
              </Link>

              <Link
                href="/create-form/model"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/create-form/model'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Network className="w-3.5 h-3.5 text-orange-500" />
                  <span>Theo mô hình NCKH</span>
                </div>
                <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                  HOT
                </span>
              </Link>

              <Link
                href="/create-form/agent"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/create-form/agent'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Agent tự luận</span>
              </Link>
            </div>
          )}
        </div>

        {/* Data Services Section */}
        <div className="pt-2">
          <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Dịch vụ dữ liệu SPSS/PLS
          </div>

          <Link
            href="/data-builder"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              isActive('/data-builder')
                ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Build dữ liệu đẹp</span>
          </Link>

          <Link
            href="/data-encode"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              isActive('/data-encode')
                ? 'bg-amber-50 text-amber-800 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <Binary className="w-4 h-4 text-amber-600" />
            <span>Mã hoá data</span>
          </Link>
        </div>

        {/* Orders & Finance */}
        <div className="pt-2">
          <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Quản lý & Tài chính
          </div>

          <Link
            href="/orders"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              isActive('/orders')
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Đơn hàng của bạn</span>
            </div>
          </Link>

          <Link
            href="/credit"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              isActive('/credit')
                ? 'bg-amber-50 text-amber-800 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-orange-500" />
            <span>Nạp tiền / Số dư</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              isActive('/settings')
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Cài đặt hệ thống</span>
          </Link>

          {/* Admin link for admins */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all mt-2 ${
                isActive('/admin')
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Quản trị Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* User Balance Card with Premium Midnight Gradient */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        {user ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-lg border border-slate-800/80 mb-2.5">
            {/* Subtle glow orb */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/20 blur-xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Số dư khả dụng</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  24/7
                </span>
              </div>
              <div className="text-xl font-black mt-1 tracking-tight text-white flex items-baseline gap-1">
                {user.credits.toLocaleString()}
                <span className="text-[11px] font-normal text-slate-400">Credits</span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                  {user.username}
                </span>
                <Link
                  href="/credit"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <span>+ Nạp ngay</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-3.5 text-white shadow-md shadow-blue-500/10 mb-2.5">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chưa đăng nhập</span>
            </div>
            <p className="text-[10px] text-blue-100/90 mt-1">Đăng ký để nhận ngay 50.000 Credits miễn phí!</p>
            <button
              onClick={() => openAuthModal('login')}
              className="mt-2.5 w-full py-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1 hover:text-slate-800 transition-colors cursor-pointer">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px]">Hỗ trợ kỹ thuật 24/7</span>
        </div>
      </div>
    </aside>
  );
}
