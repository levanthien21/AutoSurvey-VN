'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  X,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface CostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CostEstimatorModal({ isOpen, onClose }: CostEstimatorModalProps) {
  const router = useRouter();
  const [sampleCount, setSampleCount] = useState<number>(250);
  const [engineMode, setEngineMode] = useState<'model' | 'ratio' | 'data' | 'agent'>('model');

  if (!isOpen) return null;

  const priceRates = {
    data: 180,
    ratio: 250,
    model: 350,
    agent: 500,
  };

  const estimatedCost = sampleCount * priceRates[engineMode];
  const estimatedMinutes = Math.max(1, Math.round((sampleCount * 1.5) / 60));
  const estimatedHours = (estimatedMinutes / 60).toFixed(1);

  const handleLaunch = () => {
    onClose();
    router.push(`/create-form/${engineMode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-blue-100 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs shrink-0">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight leading-tight">
                  Ước Tính Ngân Sách & Thời Gian
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Live Sim
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Mô phỏng chính xác chi phí & tiến độ hoàn thành khảo sát
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all shrink-0"
            title="Đóng bảng ước tính"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* 1. Quy mô mẫu khảo sát (Slider) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                1. Chọn quy mô cỡ mẫu (N):
              </span>
              <span className="text-xl font-black text-orange-600 font-mono bg-orange-50 border border-orange-200 px-3 py-0.5 rounded-xl">
                {sampleCount.toLocaleString()} mẫu
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="1500"
              step="10"
              value={sampleCount}
              onChange={(e) => setSampleCount(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
            />

            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { count: 50, label: '50 (Test)' },
                { count: 250, label: '250 (Khóa luận)' },
                { count: 400, label: '400 (Luận văn)' },
                { count: 1000, label: '1.000 (Bộ/Brand)' },
              ].map((p) => (
                <button
                  key={p.count}
                  type="button"
                  onClick={() => setSampleCount(p.count)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    sampleCount === p.count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Động cơ tính năng */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 block">
              2. Chọn động cơ chạy khảo sát:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                {
                  id: 'data' as const,
                  title: '1. File Excel / CSV',
                  price: '180đ / câu',
                  desc: 'Điền theo data có sẵn',
                },
                {
                  id: 'ratio' as const,
                  title: '2. Tỉ Lệ Bell Curve',
                  price: '250đ / câu',
                  desc: 'Chuẩn phân phối Gauss',
                },
                {
                  id: 'model' as const,
                  title: '3. NCKH SPSS / SEM',
                  price: '350đ / câu',
                  desc: 'Cholesky Alpha ≥ 0.82',
                },
                {
                  id: 'agent' as const,
                  title: '4. AI Agent Tự Luận',
                  price: '500đ / câu',
                  desc: 'Sinh văn bản tự nhiên 100%',
                },
              ].map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => setEngineMode(engine.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    engineMode === engine.id
                      ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-black text-slate-900">{engine.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{engine.desc}</div>
                  </div>
                  <div
                    className={`mt-2 font-mono font-extrabold text-[11px] ${
                      engineMode === engine.id ? 'text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {engine.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Bảng Kết Quả Dự Tính */}
          <div className="bg-gradient-to-br from-slate-950 via-[#071330] to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Tổng ngân sách dự tính</span>
                <div className="text-3xl font-black text-amber-300 font-mono mt-0.5 tracking-tight">
                  {estimatedCost.toLocaleString()} <span className="text-sm font-normal text-slate-300">VNĐ</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Thời gian hoàn thành</span>
                <div className="text-xl font-black text-cyan-300 font-mono mt-0.5 flex items-center justify-end gap-1">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>
                    {estimatedMinutes < 60
                      ? `~${estimatedMinutes} phút`
                      : `~${estimatedHours} giờ`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Kiểm định Alpha &ge; 0.82</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Bảo mật token fbzx chống bot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tốc độ 50 - 1.000 mẫu/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Bảo hành hoàn tiền 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 hover:shadow-lg transition-all"
          >
            <span>Tạo khảo sát với cấu hình này</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
