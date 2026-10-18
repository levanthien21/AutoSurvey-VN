'use client';

import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Sparkles,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Table,
  Loader2,
  Sliders,
} from 'lucide-react';
import { LatentConstruct, StructuralPath, ModelConfig, StatisticalSummary } from '@/lib/statisticsEngine';
import StatisticalReport from '@/components/StatisticalReport';

export default function DataBuilderPage() {
  const [constructs, setConstructs] = useState<LatentConstruct[]>([
    { name: 'CLDV', label: 'Chất lượng dịch vụ', items: ['CLDV1', 'CLDV2', 'CLDV3', 'CLDV4'] },
    { name: 'GC', label: 'Giá cả cảm nhận', items: ['GC1', 'GC2', 'GC3'] },
    { name: 'SHL', label: 'Sự hài lòng', items: ['SHL1', 'SHL2', 'SHL3'] },
    { name: 'TT', label: 'Lòng trung thành', items: ['TT1', 'TT2', 'TT3'] },
  ]);

  const [paths, setPaths] = useState<StructuralPath[]>([
    { from: 'CLDV', to: 'SHL', beta: 0.45 },
    { from: 'GC', to: 'SHL', beta: 0.32 },
    { from: 'SHL', to: 'TT', beta: 0.58 },
  ]);

  const [sampleSize, setSampleSize] = useState<number>(300);
  const [scale, setScale] = useState<5 | 7>(5);

  const [simulatedData, setSimulatedData] = useState<{ [item: string]: number[] } | null>(null);
  const [summary, setSummary] = useState<StatisticalSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddConstruct = () => {
    const num = constructs.length + 1;
    const name = `NT${num}`;
    setConstructs([
      ...constructs,
      { name, label: `Nhân tố ${num}`, items: [`${name}1`, `${name}2`, `${name}3`] },
    ]);
  };

  const handleRemoveConstruct = (idx: number) => {
    setConstructs(constructs.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const config: ModelConfig = {
        constructs,
        paths,
        sampleSize,
        scale,
      };

      const res = await fetch('/api/data-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSimulatedData(data.result.data);
      setSummary(data.result.summary);
    } catch (err: any) {
      alert('Lỗi tạo dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!simulatedData) return;
    try {
      const res = await fetch('/api/data-builder/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: simulatedData,
          filename: `Du_lieu_NCKH_SPSS_${sampleSize}_mau.xlsx`,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Du_lieu_NCKH_SPSS_${sampleSize}_mau.xlsx`;
      a.click();
    } catch (err: any) {
      alert('Lỗi xuất file: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Dịch vụ dữ liệu học thuật</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Build dữ liệu đẹp (SPSS / SmartPLS)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tạo bộ dữ liệu thô phục vụ nghiên cứu khoa học, khóa luận tốt nghiệp đảm bảo 100% đạt các kiểm định Cronbach&apos;s Alpha, EFA, hồi quy tuyến tính.
        </p>
      </div>

      {/* Model Definition Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Thiết lập danh sách nhân tố & biến quan sát</h3>
            <p className="text-xs text-slate-500 mt-0.5">Mỗi nhân tố nên có từ 3 đến 5 câu hỏi thang đo Likert</p>
          </div>
          <button
            onClick={handleAddConstruct}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm nhân tố</span>
          </button>
        </div>

        {/* Constructs */}
        <div className="space-y-3">
          {constructs.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...constructs];
                      updated[idx].name = e.target.value;
                      setConstructs(updated);
                    }}
                    placeholder="Mã (CLDV)"
                    className="w-24 h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white uppercase"
                  />
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) => {
                      const updated = [...constructs];
                      updated[idx].label = e.target.value;
                      setConstructs(updated);
                    }}
                    placeholder="Tên nhân tố (Chất lượng dịch vụ)"
                    className="flex-1 h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
                {constructs.length > 1 && (
                  <button
                    onClick={() => handleRemoveConstruct(idx)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Mã các câu hỏi / biến quan sát (cách nhau bằng dấu phẩy):
                </label>
                <input
                  type="text"
                  value={c.items.join(', ')}
                  onChange={(e) => {
                    const updated = [...constructs];
                    updated[idx].items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    setConstructs(updated);
                  }}
                  className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Structural Paths */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các đường dẫn tác động (Hồi quy / SEM Beta &beta;)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {paths.map((p, pIdx) => (
              <div
                key={pIdx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span>{p.from}</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span>{p.to}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">&beta;:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={p.beta}
                    onChange={(e) => {
                      const updated = [...paths];
                      updated[pIdx].beta = Number(e.target.value) || 0.3;
                      setPaths(updated);
                    }}
                    className="w-14 h-6 text-center font-bold rounded border border-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Params & Action */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cỡ mẫu nghiên cứu (N)</label>
            <input
              type="number"
              min="50"
              max="2000"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value) || 100)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thang đo Likert</label>
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value) as 5 | 7)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value={5}>Thang đo Likert 5 điểm (1 - 5)</option>
              <option value={7}>Thang đo Likert 7 điểm (1 - 7)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Sinh dữ liệu chuẩn khoa học ngay</span>
        </button>
      </div>

      {/* Results & Tables */}
      {summary && simulatedData && (
        <div className="space-y-6">
          <StatisticalReport summary={summary} />

          {/* Sample Data Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Xem trước dữ liệu thô (10 dòng đầu tiên)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tổng số mẫu đã sinh: {sampleSize} bản ghi</p>
              </div>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Xuất file Excel (.xlsx)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">#ID</th>
                    {Object.keys(simulatedData).map((col) => (
                      <th key={col} className="px-3 py-2">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {Array.from({ length: Math.min(10, sampleSize) }).map((_, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-left font-sans font-bold text-slate-400">#{rIdx + 1}</td>
                      {Object.keys(simulatedData).map((col) => (
                        <td key={col} className="px-3 py-2 font-bold text-slate-800">
                          {simulatedData[col][rIdx]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
