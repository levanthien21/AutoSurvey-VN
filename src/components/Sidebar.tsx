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
  Sparkles,
  ShieldAlert,
  LogIn,
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
            AutoSurvey
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">PRO</span>
          </span>
          <p className="text-[11px] text-slate-500 -mt-0.5">Điền form chuẩn NCKH</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 text-sm">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
            isActive('/') && pathname === '/'
              ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Bảng điều khiển</span>
        </Link>

        {/* Tạo form ngay (Collapsible) */}
        <div>
          <button
            onClick={() => setCreateFormOpen(!createFormOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
              pathname.startsWith('/create-form')
                ? 'text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FilePlus2 className="w-4 h-4 text-blue-600" />
              <span>Tạo form ngay</span>
            </div>
            {createFormOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {createFormOpen && (
            <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 space-y-1">
              <Link
                href="/create-form/ratio"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/create-form/ratio'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Theo tỉ lệ mong muốn</span>
              </Link>

              <Link
                href="/create-form/data"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/create-form/data'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Điền data có trước</span>
              </Link>

              <Link
                href="/create-form/model"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/create-form/model'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-indigo-500" />
                <span className="flex items-center gap-1.5">
                  Theo mô hình NCKH
                  <span className="bg-amber-100 text-amber-700 text-[9px] px-1 py-0.2 rounded font-bold">HOT</span>
                </span>
              </Link>

              <Link
                href="/create-form/agent"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/create-form/agent'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Agent điền form</span>
              </Link>
            </div>
          )}
        </div>

        {/* Data Services Section */}
        <div className="pt-2">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Dịch vụ dữ liệu
          </div>

          <Link
            href="/data-builder"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/data-builder')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Build dữ liệu đẹp</span>
          </Link>

          <Link
            href="/data-encode"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/data-encode')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Binary className="w-4 h-4 text-amber-600" />
            <span>Mã hoá data</span>
          </Link>
        </div>

        {/* Orders & Finance */}
        <div className="pt-2">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quản lý & Tài chính
          </div>

          <Link
            href="/orders"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/orders')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Đơn hàng của bạn</span>
            </div>
          </Link>

          <Link
            href="/credit"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/credit')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-500" />
            <span>Nạp tiền / Số dư</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài đặt hệ thống</span>
          </Link>

          {/* Admin link for admins */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors mt-2 ${
                isActive('/admin')
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Quản trị Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* User Balance Card & Help */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        {user ? (
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs mb-3">
            <div className="text-xs text-slate-500 font-medium">Số dư khả dụng</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {user.credits.toLocaleString()} <span className="text-xs font-medium text-slate-500">Credits</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sẵn sàng
              </span>
              <Link href="/credit" className="text-blue-600 hover:text-blue-700 font-semibold">
                + Nạp thêm
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5 rounded-xl border border-blue-200/60 shadow-xs mb-3">
            <div className="text-xs text-blue-900 font-bold">Chưa đăng nhập</div>
            <p className="text-[11px] text-blue-700 mt-0.5">Đăng ký ngay để nhận 50.000 Credits miễn phí!</p>
            <button
              onClick={() => openAuthModal('login')}
              className="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 px-1 hover:text-slate-800 transition-colors cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          <span>Trung tâm hỗ trợ 24/7</span>
        </div>
      </div>
    </aside>
  );
}
