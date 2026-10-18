'use client';

import React, { useState } from 'react';

export function FacebookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function FloatingFanpageWidget() {
  const [hovered, setHovered] = useState(false);
  const fanpageUrl = 'https://www.facebook.com/profile.php?id=61592111095108';

  return (
    <aside
      aria-label="Kênh hỗ trợ Facebook Fanpage"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip Pill */}
      <a
        href={fanpageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold shadow-xl border border-slate-700 transition-all duration-300 ${
          hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Hỗ trợ Fanpage 24/7</span>
      </a>

      {/* Main Floating Facebook Button */}
      <a
        href={fanpageUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Truy cập Fanpage AutoSurvey VN trên Facebook"
        className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-[#1877F2] to-[#0d65d9] hover:from-[#0d65d9] hover:to-[#094bb5] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(24,119,242,0.45)] hover:shadow-[0_12px_28px_rgba(24,119,242,0.6)] hover:scale-105 active:scale-95 transition-all"
      >
        {/* Soft Radar Pulse Ring */}
        <span className="absolute -inset-1 rounded-2xl bg-[#1877F2]/30 animate-ping pointer-events-none opacity-60"></span>

        <FacebookIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white relative z-10" />

        {/* Online Indicator Badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></span>
      </a>
    </aside>
  );
}
