'use client';

import React from 'react';
import Link from 'next/link';
import { PieChart, FileSpreadsheet, Network, Bot, ArrowRight, Sparkles } from 'lucide-react';

export default function CreateFormPage() {
  const modes = [
    {
      href: '/create-form/ratio',
      icon: PieChart,
      color: 'blue',
      badge: 'Phổ biến',
      title: 'Điền theo tỉ lệ mong muốn',
      desc: 'Nhập link Google Form, hệ thống tự động bóc tách câu hỏi. Bạn tuỳ ý đặt % cho từng phương án trả lời với các presets như Phân phối chuẩn, Lệch dương, Đều nhau.',
    },
    {
      href: '/create-form/data',
      icon: FileSpreadsheet,
      color: 'indigo',
      badge: 'Excel/CSV',
      title: 'Điền data có trước',
      desc: 'Nhập trực tiếp file bảng tính số liệu sẵn có. Ánh xạ các cột vào câu hỏi Google Form và hệ thống sẽ gửi từng dòng lên Google Form tự động.',
    },
    {
      href: '/create-form/model',
      icon: Network,
      color: 'amber',
      badge: 'Khuyên dùng NCKH',
      title: 'Điền theo mô hình NCKH',
      desc: 'Dành riêng cho sinh viên, học viên cao học & giảng viên làm luận văn. Tạo số liệu chuẩn SEM/PLS-PM: Cronbach\'s Alpha >= 0.8, AVE >= 0.5, Hồi quy có ý nghĩa.',
    },
    {
      href: '/create-form/agent',
      icon: Bot,
      color: 'purple',
      badge: 'AI Thông minh',
      title: 'AI Agent điền form',
      desc: 'Mô phỏng chân thực các nhóm đối tượng khảo sát (sinh viên, nhân viên văn phòng, chuyên gia). AI suy luận và tự viết nội dung cho câu hỏi tự luận.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tạo đơn điền form Google Forms</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chọn phương thức điền form</h1>
        <p className="text-sm text-slate-500 mt-1">Chọn chế độ bạn muốn áp dụng cho khảo sát của mình</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {modes.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Link
              key={idx}
              href={m.href}
              className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {m.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{m.desc}</p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-blue-600 gap-1.5 pt-4 border-t border-slate-100">
                <span>Thiết lập đơn hàng</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
