'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PieChart,
  FileSpreadsheet,
  Network,
  Bot,
  Database,
  Binary,
  ClipboardList,
  Wallet,
  Settings,
  HelpCircle,
  ShieldAlert,
  LogIn,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-68 bg-white text-slate-700 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none border-r border-slate-200/90 shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0 group hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="AutoSurvey VN"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-slate-900 tracking-tight">
                AutoSurvey <span className="text-orange-500">VN</span>
              </span>
              <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              Dịch Vụ Khảo Sát & Số Liệu SPSS
            </p>
          </div>
        </div>

        {/* Workspace Switcher Badge */}
        <div className="mt-3.5 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700 truncate">
              {user ? `Không gian: ${user.username}` : 'Chế độ: Khách dùng thử'}
            </span>
          </div>
          <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded text-slate-600 font-mono font-bold">
            v2.5
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 text-xs">
        {/* Hub 1: Bảng điều khiển */}
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all relative ${
              isActive('/') && pathname === '/'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${isActive('/') && pathname === '/' ? 'text-white' : 'text-blue-600'}`} />
            <span>Bảng điều khiển trung tâm</span>
          </Link>
        </div>

        {/* Hub 2: Studio Khảo Sát (Form Filling Engines) */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Studio Điền Khảo Sát</span>
            <span className="text-[9px] text-slate-500 font-mono font-bold">4 CHẾ ĐỘ</span>
          </div>

          <Link
            href="/create-form/model"
            className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all ${
              pathname === '/create-form/model'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Network className={`w-4 h-4 ${pathname === '/create-form/model' ? 'text-white' : 'text-orange-500'}`} />
              <span>Mô hình NCKH (SPSS/PLS)</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase border ${
              pathname === '/create-form/model'
                ? 'bg-orange-600/80 text-white border-white/20'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              HOT
            </span>
          </Link>

          <Link
            href="/create-form/ratio"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              pathname === '/create-form/ratio'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PieChart className={`w-4 h-4 ${pathname === '/create-form/ratio' ? 'text-white' : 'text-blue-600'}`} />
            <span>Tỉ lệ & Phân phối Bell Curve</span>
          </Link>

          <Link
            href="/create-form/data"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              pathname === '/create-form/data'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${pathname === '/create-form/data' ? 'text-white' : 'text-emerald-600'}`} />
            <span>Nạp Data có sẵn (Excel/CSV)</span>
          </Link>

          <Link
            href="/create-form/agent"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              pathname === '/create-form/agent'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bot className={`w-4 h-4 ${pathname === '/create-form/agent' ? 'text-white' : 'text-purple-600'}`} />
            <span>AI Agent tự luận đa nhân khẩu</span>
          </Link>
        </div>

        {/* Hub 3: Phòng Lab Dữ Liệu SPSS */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Phòng Lab Dữ Liệu
          </div>

          <Link
            href="/data-builder"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              isActive('/data-builder')
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className={`w-4 h-4 ${isActive('/data-builder') ? 'text-white' : 'text-emerald-600'}`} />
            <span>Bộ tổng hợp dữ liệu sạch</span>
          </Link>

          <Link
            href="/data-encode"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              isActive('/data-encode')
                ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Binary className={`w-4 h-4 ${isActive('/data-encode') ? 'text-white' : 'text-amber-600'}`} />
            <span>Mã hoá thang đo Likert</span>
          </Link>
        </div>

        {/* Hub 4: Quản lý & Vận hành */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Vận Hành & Tài Chính
          </div>

          <Link
            href="/orders"
            className={`flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              isActive('/orders')
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ClipboardList className={`w-4 h-4 ${isActive('/orders') ? 'text-white' : 'text-blue-600'}`} />
              <span>Tiến trình & Báo cáo Excel</span>
            </div>
          </Link>

          <Link
            href="/credit"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              isActive('/credit')
                ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Wallet className={`w-4 h-4 ${isActive('/credit') ? 'text-white' : 'text-orange-500'}`} />
            <span>Nạp tiền VietQR 24/7</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all ${
              isActive('/settings')
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-4 h-4 ${isActive('/settings') ? 'text-white' : 'text-slate-500'}`} />
            <span>Cài đặt & Bot Protection</span>
          </Link>

          {/* Admin link */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all mt-2 ${
                isActive('/admin')
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Quản trị Hệ thống Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Credit Pass Widget at Bottom */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/80">
        {user ? (
          <div className="rounded-2xl bg-white p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Ví AutoSurvey</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sẵn sàng
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {user.credits.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">Credits</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 truncate max-w-[100px] font-medium">
                {user.username}
              </span>
              <Link
                href="/credit"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                <span>+ Nạp VietQR</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 p-3.5 border border-blue-200 text-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Chưa đăng nhập</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Tạo tài khoản để nhận ngay <strong className="text-orange-600 font-bold">50.000 Credits</strong> chạy thử nghiệm!
            </p>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng ký nhận 50K Free</span>
            </button>
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Hỗ trợ SPSS / SmartPLS</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-1 rounded">24/7</span>
        </div>
      </div>
    </aside>
  );
}
