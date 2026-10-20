'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Send,
  Wand2,
  HelpCircle,
  Loader2,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import { ParsedGoogleForm, FormQuestion } from '@/lib/googleFormParser';
import { useAuth } from '@/context/AuthContext';

interface OptionPercentage {
  [optionValue: string]: number; // percentage, e.g. 40
}

interface QuestionConfig {
  [questionId: string]: OptionPercentage;
}

interface TextAnswersConfig {
  [questionId: string]: string[]; // list of sample text answers to randomly pick
}

export default function CreateFormRatioPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [formUrl, setFormUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ParsedGoogleForm | null>(null);

  // Configuration state
  const [config, setConfig] = useState<QuestionConfig>({});
  const [textAnswers, setTextAnswers] = useState<TextAnswersConfig>({});
  const [targetCount, setTargetCount] = useState<number>(100);
  const [delayMin, setDelayMin] = useState<number>(1.0);
  const [delayMax, setDelayMax] = useState<number>(2.5);
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

  // Parse Form Handler
  const handleParseForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formUrl.trim()) {
      setError('Vui lòng nhập đường dẫn Google Form hợp lệ.');
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
      if (!data.success) {
        throw new Error(data.error || 'Không thể đọc cấu trúc form');
      }

      setForm(data.form);

      // Initialize default percentages (Uniform distribution)
      const initialConfig: QuestionConfig = {};
      const initialText: TextAnswersConfig = {};

      data.form.questions.forEach((q: FormQuestion) => {
        if (q.options && q.options.length > 0) {
          const perOpt = Math.floor(100 / q.options.length);
          const remainder = 100 - perOpt * q.options.length;
          const optMap: OptionPercentage = {};
          q.options.forEach((opt, idx) => {
            optMap[opt.value] = idx === 0 ? perOpt + remainder : perOpt;
          });
          initialConfig[q.id] = optMap;
        } else if (q.type === 'text' || q.type === 'paragraph') {
          initialText[q.id] = q.defaultSampleAnswers && q.defaultSampleAnswers.length > 0
            ? q.defaultSampleAnswers
            : [
                'Rất hài lòng với chất lượng dịch vụ.',
                'Cần cải thiện thêm thời gian xử lý.',
                'Trải nghiệm nhìn chung tốt, sẽ tiếp tục ủng hộ.',
                'Sản phẩm đáp ứng đúng nhu cầu.',
              ];
        }
      });

      setConfig(initialConfig);
      setTextAnswers(initialText);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải Google Form');
    } finally {
      setLoading(false);
    }
  };

  // Preset distributions
  const applyPreset = (qId: string, options: any[], preset: 'uniform' | 'normal' | 'high' | 'low') => {
    const n = options.length;
    if (n === 0) return;
    const newMap: OptionPercentage = {};

    if (preset === 'uniform') {
      const per = Math.floor(100 / n);
      const rem = 100 - per * n;
      options.forEach((opt, idx) => {
        newMap[opt.value] = idx === 0 ? per + rem : per;
      });
    } else if (preset === 'normal') {
      // Bell curve: peak at middle
      const weights = options.map((_, i) => {
        const mid = (n - 1) / 2;
        const dist = Math.abs(i - mid);
        return Math.max(1, Math.round(10 * Math.exp(-0.8 * dist * dist)));
      });
      const sumWeight = weights.reduce((a, b) => a + b, 0);
      let runningSum = 0;
      weights.forEach((w, i) => {
        const pct = Math.round((w / sumWeight) * 100);
        newMap[options[i].value] = pct;
        runningSum += pct;
      });
      // Adjust to 100%
      const diff = 100 - runningSum;
      const midIdx = Math.floor(n / 2);
      newMap[options[midIdx].value] += diff;
    } else if (preset === 'high') {
      // Skewed high (favorable, high satisfaction)
      const weights = options.map((_, i) => (i + 1) * (i + 1));
      const sumWeight = weights.reduce((a, b) => a + b, 0);
      let runningSum = 0;
      weights.forEach((w, i) => {
        const pct = Math.round((w / sumWeight) * 100);
        newMap[options[i].value] = pct;
        runningSum += pct;
      });
      newMap[options[n - 1].value] += 100 - runningSum;
    } else if (preset === 'low') {
      // Skewed low
      const weights = options.map((_, i) => (n - i) * (n - i));
      const sumWeight = weights.reduce((a, b) => a + b, 0);
      let runningSum = 0;
      weights.forEach((w, i) => {
        const pct = Math.round((w / sumWeight) * 100);
        newMap[options[i].value] = pct;
        runningSum += pct;
      });
      newMap[options[0].value] += 100 - runningSum;
    }

    setConfig((prev) => ({ ...prev, [qId]: newMap }));
  };

  const handlePercentageChange = (qId: string, optVal: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        [optVal]: value,
      },
    }));
  };

  // Submit Order Creation
  const handleStartOrder = async () => {
    if (!form) return;
    setSubmitting(true);
    setError('');

    try {
      // Build responses queue according to percentages
      const queue: Record<string, any>[] = [];

      // Pre-generate response items
      for (let i = 0; i < targetCount; i++) {
        const responseItem: Record<string, any> = {};

        form.questions.forEach((q) => {
          if (q.options && q.options.length > 0) {
            const optMap = config[q.id] || {};
            // Weighted random selection
            const rand = Math.random() * 100;
            let current = 0;
            let chosen = q.options[0].value;
            for (const opt of q.options) {
              current += optMap[opt.value] || 0;
              if (rand <= current) {
                chosen = opt.value;
                break;
              }
            }
            responseItem[q.id] = chosen;
          } else if (q.type === 'text' || q.type === 'paragraph') {
            const answers = textAnswers[q.id] || ['Không có ý kiến thêm'];
            const randIdx = Math.floor(Math.random() * answers.length);
            responseItem[q.id] = answers[randIdx];
          }
        });

        queue.push(responseItem);
      }

      if (!user) {
        openAuthModal('login');
        setError('Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu chạy đơn. Tài khoản chưa đăng ký sẽ có 0 Credits.');
        setSubmitting(false);
        return;
      }

      // Create order in backend
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Điền theo tỉ lệ - ${form.title}`,
          formUrl,
          submitUrl: form.submitUrl,
          mode: 'ratio',
          totalTarget: targetCount,
          delayMin,
          delayMax,
          responsesQueue: queue,
          fbzx: form.fbzx,
          autoStart: true,
        }),
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Không thể tạo đơn điền form');
      }

      // Redirect to orders page
      router.push(`/orders?id=${resData.order.id}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi bắt đầu đơn điền form');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <PieChart className="w-3.5 h-3.5" />
          <span>Chế độ 1</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Điền theo tỉ lệ mong muốn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bóc tách toàn bộ câu hỏi của Google Form và tuỳ biến tỉ lệ phần trăm xuất hiện của từng đáp án.
        </p>
      </div>

      {/* Step 1: Input URL Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-sm font-bold text-slate-900">
          Nhập đường dẫn Google Form (URL hoặc forms.gle)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/e/.../viewform hoặc https://forms.gle/..."
              className="w-full h-11 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleParseForm}
            disabled={loading || !formUrl}
            className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Bóc tách câu hỏi</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Hỗ trợ mọi định dạng form mở công khai (không yêu cầu đăng nhập tài khoản Google).</span>
        </div>
      </div>

      {/* Step 2: Form Questions Configuration */}
      {form && (
        <div className="space-y-6">
          {/* Form Overview Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-5 rounded-2xl border border-blue-100 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Thông tin Form đã nhận diện</div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{form.title}</h2>
              {form.description && <p className="text-xs text-slate-600 mt-1">{form.description}</p>}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>Số câu hỏi: <strong className="text-slate-800">{form.questions.length}</strong></span>
                <span>Mã Form: <strong className="text-slate-800">{form.formId}</strong></span>
              </div>
            </div>
            <a
              href={formUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-xs"
            >
              <span>Mở form</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cấu hình tỉ lệ từng câu hỏi</h3>

            {form.questions.map((q, qIndex) => {
              const optMap = config[q.id] || {};
              const currentSum = Object.values(optMap).reduce((a, b) => a + (Number(b) || 0), 0);
              const isValidSum = currentSum === 100;

              return (
                <div key={q.id || qIndex} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-xs font-bold text-blue-600">
                          Câu {qIndex + 1} {q.required && <span className="text-rose-500">* Bắt buộc</span>}
                        </div>
                        {q.subType === 'name' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Họ và tên</span>
                        )}
                        {q.subType === 'phone' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Số điện thoại chuẩn</span>
                        )}
                        {q.subType === 'email' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Email chuẩn</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{q.title}</h4>
                      {q.description && <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>}
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="shrink-0">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isValidSum
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          Tổng: {currentSum}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Options Configuration */}
                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      {/* Presets Bar */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Gợi ý tỉ lệ:</span>
                        <button
                          type="button"
                          onClick={() => applyPreset(q.id, q.options, 'uniform')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Đều nhau
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(q.id, q.options, 'normal')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Phân phối chuẩn (Chuông)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(q.id, q.options, 'high')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Lệch cao (Hài lòng)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(q.id, q.options, 'low')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Lệch thấp
                        </button>
                      </div>

                      {/* Options input grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const pct = optMap[opt.value] ?? 0;
                          return (
                            <div
                              key={optIdx}
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                            >
                              <span className="text-xs font-medium text-slate-800 pr-2 truncate">
                                {opt.label || opt.value}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={pct}
                                  onChange={(e) =>
                                    handlePercentageChange(q.id, opt.value, Number(e.target.value) || 0)
                                  }
                                  className="w-16 h-8 text-center text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                                <span className="text-xs font-bold text-slate-500">%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Text input answers */
                    <div className="space-y-2 pt-1">
                      <div className="text-xs text-slate-500 font-medium">
                        Danh sách câu trả lời mẫu (mỗi dòng 1 câu, hệ thống sẽ bốc ngẫu nhiên):
                      </div>
                      <textarea
                        rows={3}
                        value={(textAnswers[q.id] || []).join('\n')}
                        onChange={(e) =>
                          setTextAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                          }))
                        }
                        className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="Nhập các câu trả lời tự luận..."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission Parameters Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900">Cấu hình tiến trình nộp đơn</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số lượng câu trả lời cần điền
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value) || 1)}
                  className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Ví dụ: 100, 250 hoặc 500 mẫu</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giãn cách tối thiểu (giây)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={delayMin}
                  onChange={(e) => setDelayMin(Number(e.target.value) || 1)}
                  className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Chống chặn Google Bot</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giãn cách tối đa (giây)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={delayMax}
                  onChange={(e) => setDelayMax(Number(e.target.value) || 2.5)}
                  className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Ngẫu nhiên hóa thời gian</span>
              </div>
            </div>
 
            {/* Commercial billing card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500">Chi phí dự tính: </span>
                <strong className="text-blue-700 font-bold">{(targetCount * 250).toLocaleString()} Credits</strong>
                <span className="text-slate-400"> (250đ / câu)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Số dư hiện tại: </span>
                <strong className="text-slate-900 font-mono font-bold">
                  {user ? (user.role === 'admin' ? '∞ Vô hạn (Admin)' : ` Credits`) : '0 Credits (Chưa đăng nhập)'}
                </strong>
                {user && user.role !== 'admin' && user.credits < targetCount * 250 && (
                  <a
                    href="/credit"
                    className="text-amber-700 font-bold underline hover:text-amber-800 ml-1"
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Ước tính thời gian: <strong className="text-slate-800">~{Math.round((targetCount * ((delayMin + delayMax) / 2)) / 60)} phút</strong>
              </div>

              <button
                type="button"
                onClick={handleStartOrder}
                disabled={submitting}
                className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Bắt đầu điền form ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
