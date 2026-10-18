'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  FileSpreadsheet,
  Network,
  Bot,
  ArrowRight,
  Sparkles,
  Flame,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function CreateFormPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  const modes = [
    {
      href: '/create-form/model',
      icon: Network,
      color: 'orange',
      badge: 'Khuyên Dùng NCKH',
      badgeColor: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      title: '1. Điền theo mô hình NCKH (SPSS / SmartPLS)',
      desc: 'Dành riêng cho sinh viên, học viên cao học & nghiên cứu sinh. Tạo số liệu chuẩn SEM/PLS-PM: Cronbach\'s Alpha ≥ 0.82, AVE ≥ 0.5, hệ số hồi quy β có ý nghĩa thống kê.',
      features: ['Ma trận Cholesky Likert', 'Kiểm định EFA, CFA & Hồi quy', 'Xuất file SPSS số hoá 1-5'],
    },
    {
      href: '/create-form/ratio',
      icon: PieChart,
      color: 'blue',
      badge: 'Gaussian Presets',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      title: '2. Điền theo tỉ lệ mong muốn (Bell Curve)',
      desc: 'Tự động bóc tách câu hỏi và phương án từ link Google Form. Tuỳ ý đặt % cho từng câu với bộ presets chuẩn: Phân phối chuẩn Gauss, Lệch tích cực, Đều nhau.',
      features: ['Preset Bell Curve chuẩn', 'Tùy chỉnh % từng đáp án', 'Chống dồn số liệu bất thường'],
    },
    {
      href: '/create-form/data',
      icon: FileSpreadsheet,
      color: 'emerald',
      badge: 'Excel / CSV',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      title: '3. Điền data có trước từ bảng tính',
      desc: 'Tải trực tiếp file bảng tính (.xlsx, .csv) đã chuẩn bị sẵn. Hệ thống tự động nhận diện tiêu đề cột và gửi từng dòng lên Google Form tự động.',
      features: ['Nhận diện cột thông minh', 'Hỗ trợ file Excel không giới hạn', 'Tốc độ 1.000 dòng/phút'],
    },
    {
      href: '/create-form/agent',
      icon: Bot,
      color: 'purple',
      badge: 'AI Multi-Persona',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      title: '4. AI Agent tự luận đa nhân khẩu',
      desc: 'Mô phỏng chân thực các nhóm đối tượng khảo sát (Gen Z, dân văn phòng, chuyên gia, quản lý). AI tự suy luận và viết nội dung câu hỏi tự luận chân thực 100%.',
      features: ['Không trùng lặp câu chữ', 'Đa dạng giọng điệu tự nhiên', 'Nhân khẩu học chân thực'],
    },
  ];

  const handleLaunch = (baseHref: string) => {
    if (url.trim()) {
      router.push(`${baseHref}?url=${encodeURIComponent(url.trim())}`);
    } else {
      router.push(baseHref);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Studio Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#090F1E] border border-slate-800 text-white p-7 sm:p-10 shadow-xl space-y-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Studio Khởi Tạo Chiến Dịch Khảo Sát</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Chọn Động Cơ Điền Form Cho Khảo Sát Của Bạn
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Dán link Google Forms trước hoặc chọn một trong 4 phương thức chuyên biệt bên dưới để bắt đầu cấu hình chiến dịch.
          </p>
        </div>

        {/* Quick URL Input Bar */}
        <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Dán link Google Form (https://docs.google.com/forms/d/e/.../viewform) nếu đã có..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="button"
            onClick={() => handleLaunch('/create-form/model')}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 shrink-0 transition-all"
          >
            <span>Áp dụng vào Mô hình NCKH</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Specialized Studio Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modes.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              onClick={() => handleLaunch(m.href)}
              className="cursor-pointer group bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between glow-card"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                    m.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                    m.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                    m.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                    'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {m.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-bold text-blue-600 pt-4 border-t border-slate-100 group-hover:translate-x-1 transition-transform">
                <span>Khởi tạo cấu hình</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
