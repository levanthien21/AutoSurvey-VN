'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Network,
  Plus,
  Trash2,
  Search,
  Sparkles,
  ArrowRight,
  Send,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ParsedGoogleForm, FormQuestion } from '@/lib/googleFormParser';
import { LatentConstruct, StructuralPath, ModelConfig, StatisticalSummary } from '@/lib/statisticsEngine';
import StatisticalReport from '@/components/StatisticalReport';
import { useAuth } from '@/context/AuthContext';

export default function CreateFormModelPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [formUrl, setFormUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ParsedGoogleForm | null>(null);

  // Model Definition
  const [constructs, setConstructs] = useState<LatentConstruct[]>([
    { name: 'CLDV', label: 'Chất lượng dịch vụ', items: ['CLDV1', 'CLDV2', 'CLDV3'] },
    { name: 'GTCN', label: 'Giá trị cảm nhận', items: ['GTCN1', 'GTCN2', 'GTCN3'] },
    { name: 'SHL', label: 'Sự hài lòng', items: ['SHL1', 'SHL2', 'SHL3'] },
  ]);

  const [paths, setPaths] = useState<StructuralPath[]>([
    { from: 'CLDV', to: 'SHL', beta: 0.42 },
    { from: 'GTCN', to: 'SHL', beta: 0.38 },
  ]);

  const [sampleSize, setSampleSize] = useState<number>(250);
  const [scale, setScale] = useState<5 | 7>(5);

  // Simulation Results
  const [simulatedData, setSimulatedData] = useState<{ [item: string]: number[] } | null>(null);
  const [summary, setSummary] = useState<StatisticalSummary | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const url = params.get('url');
      if (url) {
        setFormUrl(url);
      }
    }
  }, []);

  // Parse Form
  const handleParseForm = async () => {
    if (!formUrl.trim()) {
      setError('Vui lòng nhập đường dẫn Google Form hoặc Microsoft Form.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/forms/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm(data.form);
    } catch (err: any) {
      setError(err.message || 'Lỗi bóc tách Form');
    } finally {
      setLoading(false);
    }
  };

  // Add Construct
  const handleAddConstruct = () => {
    const num = constructs.length + 1;
    const name = `NT${num}`;
    setConstructs([...constructs, { name, label: `Nhân tố ${num}`, items: [`${name}_1`, `${name}_2`, `${name}_3`] }]);
  };

  // Remove Construct
  const handleRemoveConstruct = (idx: number) => {
    const updated = constructs.filter((_, i) => i !== idx);
    setConstructs(updated);
  };

  // Add Path
  const handleAddPath = () => {
    if (constructs.length < 2) return;
    setPaths([...paths, { from: constructs[0].name, to: constructs[1].name, beta: 0.35 }]);
  };

  // Run Simulation
  const handleSimulate = async () => {
    setSimulating(true);
    setError('');

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

      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);

      setSimulatedData(resData.result.data);
      setSummary(resData.result.summary);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi mô phỏng số liệu');
    } finally {
      setSimulating(false);
    }
  };

  // Submit to Form
  const handleStartSubmit = async () => {
    if (!form || !simulatedData) return;
    setSubmitting(true);
    setError('');

    try {
      const itemKeys = Object.keys(simulatedData);
      const queue: Record<string, any>[] = [];

      for (let i = 0; i < sampleSize; i++) {
        const payload: Record<string, any> = {};
        // Map available items to form questions
        form.questions.forEach((q, qIdx) => {
          const itemKey = itemKeys[qIdx % itemKeys.length];
          const val = simulatedData[itemKey][i];
          payload[q.id] = String(val);
        });
        queue.push(payload);
      }

      if (!user) {
        openAuthModal('login');
        setError('Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu chạy đơn. Tài khoản chưa đăng ký sẽ có 0 Credits.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `NCKH SmartPLS/SPSS - ${form.title}`,
          formUrl,
          submitUrl: form.submitUrl,
          platform: form.platform,
          antiForgeryToken: form.antiForgeryToken,
          serverSessionId: form.serverSessionId,
          pageHistory: form.pageHistory,
          mode: 'model',
          totalTarget: queue.length,
          delayMin: 1.0,
          delayMax: 2.5,
          responsesQueue: queue,
          fbzx: form.fbzx,
          autoStart: true,
        }),
      });

      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);

      router.push(`/orders?id=${resData.order.id}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo đơn');
      setSubmitting(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (!simulatedData) return;
    try {
      const res = await fetch('/api/data-builder/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: simulatedData,
          filename: `NCKH_Model_Data_${new Date().toISOString().slice(0, 10)}.xlsx`,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NCKH_Data_SPSS_${sampleSize}_mau.xlsx`;
      a.click();
    } catch (err: any) {
      alert('Lỗi xuất file: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
          <Network className="w-3.5 h-3.5" />
          <span>Chế độ 3 (Chuẩn NCKH)</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Điền theo mô hình NCKH</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tạo bộ dữ liệu chuẩn học thuật (SPSS, SmartPLS): Đảm bảo Cronbach&apos;s Alpha &ge; 0.8, AVE &ge; 0.5, Hồi quy có ý nghĩa p &lt; 0.05.
        </p>
      </div>

      {/* Step 1: Input URL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-sm font-bold text-slate-900">1. Nhập đường dẫn Google Form hoặc Microsoft Form</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://docs.google.com/forms/d/e/.../viewform hoặc https://forms.cloud.microsoft/..."
            className="flex-1 h-11 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleParseForm}
            disabled={loading || !formUrl}
            className="h-11 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Bóc tách Form</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Step 2: Define Model */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Thiết lập mô hình nghiên cứu (SEM / SPSS)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Khai báo các nhân tố tiềm ẩn và các biến quan sát thang đo Likert</p>
          </div>
          <button
            onClick={handleAddConstruct}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm nhân tố</span>
          </button>
        </div>

        {/* Constructs List */}
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
                    className="w-24 h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white uppercase"
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
                    className="flex-1 h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
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
                  Các biến quan sát (cách nhau bởi dấu phẩy):
                </label>
                <input
                  type="text"
                  value={c.items.join(', ')}
                  onChange={(e) => {
                    const updated = [...constructs];
                    updated[idx].items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    setConstructs(updated);
                  }}
                  className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Structural Paths */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mũi tên tác động / Giả thuyết nghiên cứu (Hệ số đường dẫn &beta;)
            </h4>
            <button
              onClick={handleAddPath}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              + Thêm mối quan hệ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paths.map((p, pIdx) => (
              <div
                key={pIdx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{p.from}</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="font-bold text-slate-900">{p.to}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">&beta;:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="0.8"
                    value={p.beta}
                    onChange={(e) => {
                      const updated = [...paths];
                      updated[pIdx].beta = Number(e.target.value) || 0.3;
                      setPaths(updated);
                    }}
                    className="w-16 h-7 text-center font-bold rounded border border-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scale & Sample Size */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cỡ mẫu nghiên cứu (N)</label>
            <input
              type="number"
              min="50"
              max="2000"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value) || 100)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thang đo Likert</label>
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value) as 5 | 7)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value={5}>Thang đo 5 điểm (1: Rất không đồng ý &rarr; 5: Rất đồng ý)</option>
              <option value={7}>Thang đo 7 điểm (1: Rất không đồng ý &rarr; 7: Rất đồng ý)</option>
            </select>
          </div>
        </div>

        {/* Simulate Action Button */}
        <div className="pt-2">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Mô phỏng dữ liệu & Kiểm định NCKH</span>
          </button>
        </div>
      </div>

      {/* Step 3: Statistical Summary & Output Actions */}
      {summary && (
        <div className="space-y-6">
          <StatisticalReport summary={summary} />

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Bộ dữ liệu đã sẵn sàng ({sampleSize} mẫu)</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các chỉ số Cronbach&apos;s Alpha &gt; 0.8 và Hồi quy đều đã đạt tiêu chuẩn kiểm định khoa học.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-initial h-11 px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Tải file Excel (SPSS)</span>
                </button>

                {form && (
                  <button
                    onClick={handleStartSubmit}
                    disabled={submitting}
                    className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Nộp vào biểu mẫu khảo sát</span>
                  </button>
                )}
              </div>
            </div>

            {/* Commercial billing info */}
            {form && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Chi phí nộp tự động: </span>
                  <strong className="text-amber-700 font-bold">{(sampleSize * 350).toLocaleString()} Credits</strong>
                  <span className="text-slate-400"> (350đ / mẫu chuẩn NCKH)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số dư hiện tại: </span>
                  <strong className="text-slate-900 font-mono font-bold">
                    {user ? (user.role === 'admin' ? '∞ Vô hạn (Admin)' : ` Credits`) : '0 Credits (Chưa đăng nhập)'}
                  </strong>
                  {user && user.role !== 'admin' && user.credits < sampleSize * 350 && (
                    <a
                      href="/credit"
                      className="text-blue-600 font-bold underline hover:text-blue-700 ml-1"
                    >
                      + Nạp thêm
                    </a>
                  )}
                  {!user && (
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="text-blue-600 font-bold underline hover:text-blue-700 ml-1"
                    >
                      Đăng nhập
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
