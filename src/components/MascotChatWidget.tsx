'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Shield,
  FileSpreadsheet,
  BarChart3,
  ChevronDown,
} from 'lucide-react';

export function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function MascotChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showBubbleTooltip, setShowBubbleTooltip] = useState(true);

  const fanpageUrl = 'https://www.facebook.com/profile.php?id=61592111095108';

  // Automatically pulse or show tooltip after 3 seconds on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubbleTooltip(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setHasInteracted(true);
    setShowBubbleTooltip(false);
  };

  return (
    <aside
      aria-label="Trợ lý ảo AutoSurvey VN"
      className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 select-none font-sans"
    >
      {/* =========================================================================
          EXPANDED CHAT POPUP WITH 3D MASCOT & INTERACTIVE BUBBLE
      ========================================================================= */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-24px)] max-w-[340px] sm:max-w-[360px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.3)] border-2 border-blue-100 overflow-hidden animate-fadeIn flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-2xl bg-white p-0.5 shadow-sm overflow-hidden shrink-0">
                <img
                  src="/mascot.jpg"
                  alt="AutoSurvey VN Mascot"
                  className="w-full h-full object-cover object-[45%_25%]"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm tracking-tight leading-tight">
                    Trợ Lý AutoSurvey VN
                  </h3>
                  <span className="text-[9px] bg-white/20 font-bold px-1.5 py-0.2 rounded-md">
                    AI Bot
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 font-medium">
                  Khảo sát thông minh • Dữ liệu vững chắc
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Thu nhỏ trợ lý"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
            {/* Mascot Banner Illustration with Motion */}
            <div className="relative rounded-2xl overflow-hidden border border-blue-100/80 bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-indigo-50/60 p-2.5 shadow-xs">
              <div className="relative flex items-center gap-3">
                <div className="w-20 h-20 sm:w-22 sm:h-22 shrink-0 rounded-2xl overflow-hidden shadow-sm bg-white border border-blue-100 animate-mascot-float">
                  <img
                    src="/mascot.jpg"
                    alt="Robot AutoSurvey VN"
                    className="w-full h-full object-cover object-[48%_30%] hover:scale-105 transition-transform"
                  />
                </div>

                {/* Speech Bubble */}
                <div className="flex-1 bg-white p-2.5 rounded-2xl shadow-xs border border-blue-200/70 relative text-left">
                  <div className="text-[11px] font-black text-blue-900 leading-snug">
                    AutoSurvey <span className="text-orange-500">VN</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                    Bạn cần thu thập bao nhiêu mẫu khảo sát Google Form hoặc số liệu SPSS hôm nay?
                  </p>
                  {/* Speech bubble arrow pointer */}
                  <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-blue-200/70 rotate-45"></div>
                </div>
              </div>
            </div>

            {/* 3 Quick Action Pills matching the Mascot's badges */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1">
                Lựa chọn nhanh
              </div>

              {/* Action 1: Tạo khảo sát */}
              <Link
                href="/create-form"
                onClick={() => setIsOpen(false)}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Tạo khảo sát nhanh chóng
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Điền tự động Google Forms & MS Forms
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>

              {/* Action 2: Xuất dữ liệu SPSS */}
              <Link
                href="/data-builder"
                onClick={() => setIsOpen(false)}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      Xuất dữ liệu đa dạng
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Excel, SPSS .SAV, Cronbach Alpha &ge; 0.82
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </Link>

              {/* Action 3: Bảo mật tuyệt đối */}
              <Link
                href="/create-form/model"
                onClick={() => setIsOpen(false)}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/80 hover:border-purple-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                      Bảo mật tuyệt đối
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Token fbzx chống bot & ẩn danh 100%
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </Link>
            </div>

            {/* Direct Fanpage Support Button */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href={fanpageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-2xl bg-[#1877F2] hover:bg-[#0d65d9] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 hover:shadow-lg transition-all active:scale-98 group"
              >
                <FacebookIcon className="w-4 h-4 fill-white" />
                <span>Chat Trực Tiếp Fanpage 24/7</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FLOATING MASCOT TRIGGER BUTTON WITH MOVING ANIMATION
      ========================================================================= */}
      <div className="flex items-center gap-2.5">
        {/* Floating Speech Tooltip Bubble */}
        {!isOpen && showBubbleTooltip && (
          <div
            onClick={handleToggle}
            className="cursor-pointer hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-xl text-slate-800 px-3.5 py-2 rounded-2xl shadow-xl border border-blue-200/80 hover:border-blue-400 transition-all hover:scale-105 animate-fadeIn group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <div className="text-left">
              <div className="text-[11px] font-black text-blue-900 group-hover:text-blue-600 transition-colors">
                Khảo sát thông minh • Dữ liệu vững chắc
              </div>
              <div className="text-[10px] text-slate-500">
                Bấm vào đây để được hỗ trợ 24/7
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBubbleTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Floating Mascot Button */}
        <button
          type="button"
          onClick={handleToggle}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white p-1 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_14px_38px_rgba(37,99,235,0.45)] border-2 border-blue-300 hover:border-blue-500 transition-all active:scale-95 group overflow-visible animate-mascot-float"
          title={isOpen ? 'Thu nhỏ trợ lý' : 'Mở trợ lý AutoSurvey VN'}
        >
          {/* Subtle Outer Pulse Glow */}
          <span className="absolute -inset-1 rounded-3xl bg-blue-500/20 animate-ping pointer-events-none opacity-60"></span>

          {/* 3D Mascot Avatar */}
          <div className="w-full h-full rounded-[22px] overflow-hidden bg-gradient-to-tr from-blue-50 to-indigo-100 relative">
            <img
              src="/mascot.jpg"
              alt="AutoSurvey VN Mascot"
              className="w-full h-full object-cover object-[48%_28%] group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          {/* Online green indicator badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          </span>

          {/* Facebook Icon Mini Badge */}
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-[#1877F2] border-2 border-white shadow-xs flex items-center justify-center text-white">
            <FacebookIcon className="w-2.5 h-2.5 fill-white" />
          </span>
        </button>
      </div>
    </aside>
  );
}
