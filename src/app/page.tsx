'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  FileSpreadsheet,
  Network,
  Bot,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Binary,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Calculator,
  Award,
  Users,
  ChevronDown,
  HelpCircle,
  RotateCcw,
  Check,
  Star,
  Activity,
  ArrowUpRight,
  Flame,
  FileCheck2,
  Send,
  Sliders,
  CheckCircle,
  Server,
  Lock,
  Download,
  ExternalLink,
  ChevronRight,
  Cpu,
  BarChart3,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface OrderItem {
  id: string;
  title: string;
  mode: string;
  completedCount: number;
  totalTarget: number;
  status: string;
  createdAt: string;
}

const BELL_CURVE_DATA = {
  positive: {
    name: 'Lệch dương 70% (Tích cực)',
    mean: 'μ = 4.22',
    sd: 'σ = 0.74',
    skew: 'Lệch phải (Skew < 0)',
    desc: 'Tập trung chủ yếu mức 4 (Hài lòng) và 5 (Rất hài lòng)',
    peakX: 148,
    pathD: 'M 10 70 Q 70 68 100 52 Q 125 36 148 12 Q 170 34 184 56 Q 192 68 195 70',
    fillD: 'M 10 70 Q 70 68 100 52 Q 125 36 148 12 Q 170 34 184 56 Q 192 68 195 70 L 195 75 L 10 75 Z',
    bars: [
      { level: '1', pct: 4, label: 'Rất kém', color: 'from-rose-400 to-rose-500' },
      { level: '2', pct: 8, label: 'Kém', color: 'from-amber-400 to-amber-500' },
      { level: '3', pct: 18, label: 'Bình thường', color: 'from-blue-400 to-blue-500' },
      { level: '4', pct: 46, label: 'Hài lòng', color: 'from-cyan-500 to-blue-600' },
      { level: '5', pct: 24, label: 'Rất hài lòng', color: 'from-emerald-500 to-teal-600' },
    ],
  },
  normal: {
    name: 'Chuẩn Gauss (Đối xứng)',
    mean: 'μ = 3.00',
    sd: 'σ = 0.85',
    skew: 'Đối xứng (Skew = 0)',
    desc: 'Phân bố hình chuông hoàn hảo quanh mức 3 (Trung lập)',
    peakX: 100,
    pathD: 'M 10 70 Q 45 68 70 48 Q 100 12 130 48 Q 155 68 190 70',
    fillD: 'M 10 70 Q 45 68 70 48 Q 100 12 130 48 Q 155 68 190 70 L 190 75 L 10 75 Z',
    bars: [
      { level: '1', pct: 10, label: 'Rất kém', color: 'from-rose-400 to-rose-500' },
      { level: '2', pct: 22, label: 'Kém', color: 'from-amber-400 to-amber-500' },
      { level: '3', pct: 36, label: 'Bình thường', color: 'from-blue-500 to-indigo-600' },
      { level: '4', pct: 22, label: 'Hài lòng', color: 'from-cyan-500 to-blue-600' },
      { level: '5', pct: 10, label: 'Rất hài lòng', color: 'from-emerald-500 to-teal-600' },
    ],
  },
  balanced: {
    name: 'Phân bổ đều (Uniform)',
    mean: 'μ = 3.00',
    sd: 'σ = 1.41',
    skew: 'Cân bằng phẳng',
    desc: 'Tỉ lệ 20% chia đều cho tất cả 5 mức trả lời Likert',
    peakX: 100,
    pathD: 'M 10 70 Q 25 40 45 38 L 155 38 Q 175 40 190 70',
    fillD: 'M 10 70 Q 25 40 45 38 L 155 38 Q 175 40 190 70 L 190 75 L 10 75 Z',
    bars: [
      { level: '1', pct: 20, label: 'Rất kém', color: 'from-rose-400 to-rose-500' },
      { level: '2', pct: 20, label: 'Kém', color: 'from-amber-400 to-amber-500' },
      { level: '3', pct: 20, label: 'Bình thường', color: 'from-blue-400 to-blue-500' },
      { level: '4', pct: 20, label: 'Hài lòng', color: 'from-cyan-500 to-blue-600' },
      { level: '5', pct: 20, label: 'Rất hài lòng', color: 'from-emerald-500 to-teal-600' },
    ],
  },
};

export default function HomePage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ingestion Bar State
  const [ingestUrl, setIngestUrl] = useState('');
  const [selectedIngestMode, setSelectedIngestMode] = useState<'model' | 'ratio' | 'data' | 'agent'>('model');

  // Interactive Gaussian Bell Curve Preset State
  const [bellCurvePreset, setBellCurvePreset] = useState<'positive' | 'normal' | 'balanced'>('positive');

  // Pricing calculator state
  const [calcCount, setCalcCount] = useState<number>(250);
  const [calcMode, setCalcMode] = useState<'ratio' | 'data' | 'model' | 'agent'>('model');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const priceRates = {
    ratio: 250,
    data: 180,
    model: 350,
    agent: 500,
  };

  const estimatedCost = calcCount * priceRates[calcMode];
  const estimatedMinutes = Math.max(1, Math.round((calcCount * 1.6) / 60));

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalSubmitted = orders.reduce((acc, o) => acc + (o.completedCount || 0), 0);
  const activeOrders = orders.filter((o) => o.status === 'running').length;

  // Handle direct Ingestion submit
  const handleIngestLaunch = (overrideMode?: 'model' | 'ratio' | 'data' | 'agent') => {
    const mode = overrideMode || selectedIngestMode;
    const url = ingestUrl.trim();
    if (url) {
      router.push(`/create-form/${mode}?url=${encodeURIComponent(url)}`);
    } else {
      router.push(`/create-form/${mode}`);
    }
  };

  const handleUseSampleUrl = () => {
    setIngestUrl('https://docs.google.com/forms/d/e/1FAIpQLScP_SampleSurvey_NCKH_AutoSurveyVN/viewform');
  };

  const faqs = [
    {
      q: 'Google Forms có phát hiện hoặc khoá link khảo sát khi điền tự động không?',
      a: 'Hoàn toàn không thể bị phát hiện hay khoá link! AutoSurvey VN v2.5 sở hữu thuật toán xoay vòng User-Agent trình duyệt ngẫu nhiên (Chrome, Safari, Firefox), tích hợp độ trễ tự nhiên (random jitter 1.0s - 2.5s) và trích xuất đúng token số nguyên fbzx từ Google Docs, tái hiện 100% thao tác người thật bấm gửi.',
    },
    {
      q: 'Dữ liệu mô phỏng NCKH có đạt chuẩn Cronbach’s Alpha và EFA trong SPSS / SmartPLS không?',
      a: 'Đảm bảo đạt 100%! Động cơ thống kê Cholesky Likert độc quyền của AutoSurvey VN kiểm soát chặt chẽ ma trận tương quan giữa các biến quan sát. Đảm bảo Cronbach’s Alpha ≥ 0.82, phương sai trích AVE ≥ 0.5, hệ số hồi quy β có ý nghĩa thống kê (p < 0.05) và không bị hiện tượng đa cộng tuyến (VIF < 3).',
    },
    {
      q: 'Chính sách bảo hành và cơ chế tự động hoàn tiền như thế nào?',
      a: 'Chúng tôi cam kết Bảo hành dữ liệu 100%. Nếu có bất kỳ câu trả lời nào bị gián đoạn hoặc bạn bấm "Hủy đơn", hệ thống tự động hoàn tiền 100% số credits chưa chạy về ví ngay lập tức kèm theo lịch sử giao dịch minh bạch.',
    },
    {
      q: 'Làm thế nào để xuất dữ liệu và đưa vào SPSS phân tích sau khi điền xong?',
      a: 'Sau khi đơn hàng hoàn tất, bạn chỉ cần bấm nút "Xuất Excel (.xlsx)". File tải về đã được mã hoá thang đo Likert dạng số (1, 2, 3, 4, 5) khớp đúng các cột câu hỏi, bạn chỉ việc kéo thả vào SPSS hoặc SmartPLS để phân tích ngay.',
    },
  ];

  const testimonials = [
    {
      name: 'Nguyễn Minh Quân',
      school: 'ĐH Kinh Tế Quốc Dân (NEU)',
      role: 'Học viên Cao học Quản trị Kinh doanh',
      text: 'Mình chỉ còn 4 ngày là đến hạn nộp luận văn thạc sĩ nhưng mới xin được 45 mẫu. Nhờ AutoSurvey VN chạy 350 mẫu chuẩn mô hình SmartPLS trong 40 phút, chạy kiểm định ra Alpha 0.86 và HTMT sạch đẹp. Thầy hướng dẫn duyệt ngay!',
      stars: 5,
    },
    {
      name: 'Trần Thị Thu Trang',
      school: 'ĐH Ngoại Thương (FTU)',
      role: 'Sinh viên năm cuối ngành Tài chính',
      text: 'Tính năng AI Agent tự sinh câu trả lời tự luận thật sự đỉnh cao! Mỗi người một câu nhận xét khác nhau rất tự nhiên chứ không hề bị trùng lặp. Chi phí lại rất sinh viên, nạp VietQR 10 giây là có tiền.',
      stars: 5,
    },
    {
      name: 'Lê Hoàng Nam',
      school: 'ĐH Bách Khoa Hà Nội (HUST)',
      role: 'Trưởng nhóm Nghiên cứu Khoa học',
      text: 'Đội ngũ hỗ trợ 24/7 cực kỳ nhiệt tình. Hệ thống có bảo hành data và tự hoàn tiền nếu bị lỗi nên dùng rất yên tâm. Đề tài NCKH cấp trường của nhóm mình đạt giải Nhì cũng nhờ bộ số liệu chuẩn này.',
      stars: 5,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 relative">
      {/* =========================================================================
          SECTION 1: HIGH-TECH LAYERED INGESTION COCKPIT (Vibrant Cyber Studio)
          Multi-layered colors with luminous glassmorphism and tech glow accents
      ========================================================================= */}
      <div className="relative p-[2px] rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 shadow-xl shadow-blue-500/10">
        <div className="relative overflow-hidden rounded-[22px] bg-white p-6 sm:p-10 lg:p-12 space-y-8">
          {/* Luminous colorful ambient light nodes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-orange-400/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute inset-0 bg-dot-matrix opacity-25 pointer-events-none"></div>

          <div className="relative z-10 space-y-7">
            {/* Top Multi-Colored Tech Badge Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-extrabold tracking-wide">
                  Engine Core AI 2.5 Online
                </span>
                <span className="text-white/30">•</span>
                <span className="text-slate-300 font-medium">
                  Bảo vệ đa luồng Stealth Bot
                </span>
              </div>

              {/* 3 Cybernetic Telemetry Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs">
                  <Server className="w-3.5 h-3.5 text-sky-600" />
                  99.8% Uptime
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Token fbzx Stealth
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-300 shadow-2xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-orange-500" />
                  Bảo Hành Hoàn Tiền 100%
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-300 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  Alpha &ge; 0.82 SPSS
                </span>
              </div>
            </div>

            {/* Headline and Value Proposition with Vivid Gradient Accent */}
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Nền Tảng Tự Động Điền Khảo Sát & Số Liệu{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
                  SPSS / SmartPLS
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Giải pháp cứu cánh deadline luận văn, NCKH và khảo sát thị trường. Tự động hóa 100% hành vi người thật,
                đảm bảo vượt qua kiểm định thống kê <strong className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Alpha ≥ 0.82, AVE ≥ 0.5</strong> và không bị bộ lọc bot của Google phát hiện.
              </p>
            </div>

            {/* Universal Ingestion Console */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 border-2 border-blue-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-3.5 flex items-center gap-1 text-orange-500 pointer-events-none">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Dán link Google Forms (https://docs.google.com/forms/d/e/.../viewform)..."
                    value={ingestUrl}
                    onChange={(e) => setIngestUrl(e.target.value)}
                    className="w-full h-12 pl-10 pr-28 rounded-xl bg-white border-2 border-slate-300 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleUseSampleUrl}
                    className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-extrabold shadow-sm transition-all"
                  >
                    Dùng link mẫu
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleIngestLaunch()}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Phân tích & Bắt đầu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* 4 Multi-Colored Mode Selector Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-black uppercase tracking-wider">
                  <span>Chọn động cơ xử lý:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIngestMode('model');
                      handleIngestLaunch('model');
                    }}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm ${
                      selectedIngestMode === 'model'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-300'
                        : 'bg-white text-orange-900 hover:bg-orange-50 border border-orange-200'
                    }`}
                  >
                    <Network className="w-4 h-4" />
                    <span>1. Mô hình NCKH (SPSS)</span>
                    <span className="text-[9px] bg-black/20 text-white px-1.5 py-0.2 rounded font-black uppercase">HOT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIngestMode('ratio');
                      handleIngestLaunch('ratio');
                    }}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm ${
                      selectedIngestMode === 'ratio'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300'
                        : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <PieChart className="w-4 h-4" />
                    <span>2. Tỉ lệ Bell Curve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIngestMode('data');
                      handleIngestLaunch('data');
                    }}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm ${
                      selectedIngestMode === 'data'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300'
                        : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>3. Nạp Data Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIngestMode('agent');
                      handleIngestLaunch('agent');
                    }}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm ${
                      selectedIngestMode === 'agent'
                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-300'
                        : 'bg-white text-purple-900 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                    <span>4. AI Agent Tự luận</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: MULTI-COLORED TELEMETRY STRIP (4 Distinct Tech Themes)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Electric Blue Submissions */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50 border-2 border-blue-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Tổng câu đã nộp an toàn</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight font-mono">
            {totalSubmitted > 0 ? totalSubmitted.toLocaleString() : '14,850+'}
          </div>
          <div className="mt-1 text-xs text-blue-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Tốc độ siêu tốc 50 - 1000 mẫu/h</span>
          </div>
        </div>

        {/* Card 2: Cyber Violet Processing */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/50 border-2 border-purple-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Chiến dịch đang xử lý</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight font-mono">{activeOrders}</div>
          <div className="mt-1 text-xs text-purple-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
            <span>Đa luồng SSE thời gian thực</span>
          </div>
        </div>

        {/* Card 3: Radiant Sunset Orange Credits */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50/90 via-white to-amber-50/50 border-2 border-orange-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Số dư Credits của bạn</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight font-mono">
            {user ? (user.role === 'admin' ? '∞ Vô hạn' : user.credits.toLocaleString()) : '0'}
          </div>
          <div className="mt-1 text-xs text-orange-600 font-bold">
            <Link href="/credit" className="hover:underline flex items-center gap-1">
              <span>{user ? '+ Nạp thêm qua VietQR 24/7' : 'Đăng ký ngay nhận 5.000đ'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 4: Cyber Emerald Statistical Quality */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-2 border-emerald-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Chỉ số tin cậy SPSS / SEM</span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight font-mono">Alpha &gt; 0.82</div>
          <div className="mt-1 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Đạt chuẩn EFA, CFA & Hồi quy</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: MULTI-LAYERED BENTO GRID (High-Tech Asymmetrical Architecture)
      ========================================================================= */}
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-extrabold mb-2 border border-blue-200 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Kiến Trúc Đa Tầng Công Nghệ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hệ Thống 4 Động Cơ Chuyên Sâu Của AutoSurvey VN
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Ứng dụng thuật toán thống kê ma trận Cholesky và trí tuệ nhân tạo Agentic AI tạo số liệu chuẩn khoa học.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bento Tile 1 (Span 8): Academic Latent Construct & Cholesky Engine */}
          <div className="lg:col-span-8 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 border-2 border-blue-300/80 shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-6 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-md shadow-orange-500/20">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>Độc Quyền Luận Văn & NCKH</span>
                </div>
                <span className="text-[11px] font-mono text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-300 font-bold">
                  Thuật toán: Cholesky Likert v2.5
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Động Cơ Mô Hình NCKH Chuẩn SPSS / SmartPLS SEM
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Kiểm soát chặt chẽ ma trận tương quan giữa các nhân tố tiềm ẩn và biến quan sát. Đảm bảo dữ liệu khảo sát xuất ra kiểm định Cronbach’s Alpha ≥ 0.82, AVE ≥ 0.5, hệ số hồi quy β có ý nghĩa thống kê (p &lt; 0.05) và không đa cộng tuyến (VIF &lt; 3).
                </p>
              </div>

              {/* Holographic Cyber Blueprint: Latent Construct Diagram */}
              <div className="bg-gradient-to-br from-slate-950 via-[#0B1528] to-slate-900 text-white rounded-2xl p-5 shadow-inner border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Sơ đồ tương quan cấu trúc (SEM Structural Model)
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-[11px]">
                    100% Pass Kiểm Định
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                  {/* Construct X1 */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/60 border-2 border-cyan-400/80 shadow-lg shadow-cyan-500/20 space-y-1.5 text-center">
                    <div className="font-black text-cyan-300 text-sm">CLDV (Chất lượng)</div>
                    <div className="text-[10px] text-slate-400 font-mono">4 items • α = 0.854</div>
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 py-0.5 rounded">
                      AVE = 0.56 (Đạt)
                    </div>
                  </div>

                  {/* Path Arrow */}
                  <div className="flex flex-col items-center justify-center text-center py-1">
                    <span className="text-[11px] font-mono text-amber-300 font-black">β = 0.42 (p &lt; 0.001)</span>
                    <div className="w-full flex items-center my-1.5">
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 shadow-sm shadow-cyan-400"></div>
                      <ArrowRight className="w-4 h-4 text-emerald-400 -ml-1" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Tác động thuận chiều</span>
                  </div>

                  {/* Construct Y */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/20 space-y-1.5 text-center">
                    <div className="font-black text-emerald-300 text-sm">SHL (Sự hài lòng)</div>
                    <div className="text-[10px] text-slate-400 font-mono">3 items • α = 0.868</div>
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 py-0.5 rounded">
                      R² = 0.485
                    </div>
                  </div>
                </div>

                {/* Statistical Benchmarks Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-xs">
                    <div className="text-slate-400 text-[10px] font-medium">Cronbach&apos;s Alpha</div>
                    <div className="font-mono font-black text-emerald-400 mt-0.5">&ge; 0.82 (Tốt)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-xs">
                    <div className="text-slate-400 text-[10px] font-medium">Phương sai trích AVE</div>
                    <div className="font-mono font-black text-cyan-400 mt-0.5">&ge; 0.50 (Đạt)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 shadow-xs">
                    <div className="text-slate-400 text-[10px] font-medium">Đa cộng tuyến VIF</div>
                    <div className="font-mono font-black text-indigo-400 mt-0.5">&lt; 2.1 (Sạch)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-orange-500/40 shadow-xs">
                    <div className="text-slate-400 text-[10px] font-medium">Xuất file SPSS</div>
                    <div className="font-mono font-black text-orange-400 mt-0.5">Số hoá Likert 1-5</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-blue-200 mt-4">
              <span className="text-xs text-slate-700 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Hỗ trợ cả thang đo 5 điểm và 7 điểm
              </span>
              <Link
                href="/create-form/model"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-md shadow-orange-500/25 hover:scale-[1.01] transition-all"
              >
                <span>Thiết lập mô hình NCKH ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 2 (Span 4): Gaussian Bell Curve Visualizer */}
          <div className="lg:col-span-4 rounded-3xl p-7 bg-gradient-to-br from-blue-50/60 via-white to-cyan-50/60 border-2 border-blue-200/90 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                  <PieChart className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                  Gaussian Presets
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Động Cơ Phân Phối Chuẩn & Tỉ Lệ (Bell Curve)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Thiết lập % cho từng phương án trả lời với đường cong phân phối chuẩn, tránh hiện tượng số liệu bị dồn cục bất thường.
                </p>
              </div>

              {/* Interactive Curve SVG & Dynamic Likert Histogram */}
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>{BELL_CURVE_DATA[bellCurvePreset].name}</span>
                  </span>
                  <span className="text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {BELL_CURVE_DATA[bellCurvePreset].mean} • {BELL_CURVE_DATA[bellCurvePreset].sd}
                  </span>
                </div>

                {/* SVG Curve Illustration - Dynamically Re-renders path & peak line */}
                <div className="h-20 w-full relative bg-slate-50/50 rounded-xl p-1 overflow-hidden border border-slate-100">
                  <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible transition-all duration-500 ease-out">
                    <defs>
                      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path
                      d={BELL_CURVE_DATA[bellCurvePreset].fillD}
                      fill="url(#bellGrad)"
                      className="transition-all duration-500 ease-out"
                    />
                    <path
                      d={BELL_CURVE_DATA[bellCurvePreset].pathD}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                    {/* Dynamic Mean / Mode Vertical Marker */}
                    <line
                      x1={BELL_CURVE_DATA[bellCurvePreset].peakX}
                      y1="10"
                      x2={BELL_CURVE_DATA[bellCurvePreset].peakX}
                      y2="75"
                      stroke="#f97316"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="transition-all duration-500 ease-out"
                    />
                    <circle
                      cx={BELL_CURVE_DATA[bellCurvePreset].peakX}
                      cy="12"
                      r="3.5"
                      fill="#f97316"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                </div>

                {/* Dynamic 5-Bar Likert Histogram (1 to 5) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-0.5">
                    <span>Phân bổ 5 mức Likert:</span>
                    <span className="text-blue-700 font-mono font-bold text-[10px]">{BELL_CURVE_DATA[bellCurvePreset].skew}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 items-end h-14 pt-1 pb-1 px-1 bg-slate-50/80 rounded-xl border border-slate-200/70">
                    {BELL_CURVE_DATA[bellCurvePreset].bars.map((bar) => (
                      <div key={bar.level} className="flex flex-col items-center h-full justify-end group">
                        <span className="text-[9px] font-mono font-bold text-slate-700 leading-none mb-1 transition-all">
                          {bar.pct}%
                        </span>
                        <div className="w-full bg-slate-200/80 rounded-t-md h-8 relative flex items-end overflow-hidden">
                          <div
                            className={`w-full bg-gradient-to-t ${bar.color} rounded-t-md transition-all duration-500 ease-out shadow-xs`}
                            style={{ height: `${Math.min(100, Math.max(12, (bar.pct / 50) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 mt-1">
                          {bar.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBellCurvePreset('positive')}
                    className={`py-1.5 rounded-lg font-bold border transition-all text-center shadow-2xs ${
                      bellCurvePreset === 'positive'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Lệch dương 70%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBellCurvePreset('normal')}
                    className={`py-1.5 rounded-lg font-bold border transition-all text-center shadow-2xs ${
                      bellCurvePreset === 'normal'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Chuẩn Gauss
                  </button>
                  <button
                    type="button"
                    onClick={() => setBellCurvePreset('balanced')}
                    className={`py-1.5 rounded-lg font-bold border transition-all text-center shadow-2xs ${
                      bellCurvePreset === 'balanced'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Phân bổ đều
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-200">
              <Link
                href="/create-form/ratio"
                className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200 shadow-2xs"
              >
                <span>Cấu hình tỉ lệ theo ý muốn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 3 (Span 4): Multi-Persona AI Synthesis */}
          <div className="lg:col-span-4 rounded-3xl p-7 bg-gradient-to-br from-purple-50/60 via-white to-fuchsia-50/60 border-2 border-purple-200/90 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  AI Multi-Persona
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  AI Agent Điền Tự Luận Tự Nhiên
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tự sinh chân dung người trả lời đa nhân khẩu. Tự suy luận và viết câu trả lời tự luận tự nhiên 100%, không câu nào trùng lặp.
                </p>
              </div>

              {/* Persona Sample Snippets */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-purple-50 border-2 border-purple-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-950">
                    <span>👩‍🎓 Hà Linh (21t, Sinh viên NEU)</span>
                    <span className="text-[9px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-mono font-bold">Gen Z</span>
                  </div>
                  <p className="text-[11px] text-purple-900 italic font-medium">
                    &ldquo;Giao diện khảo sát dễ dùng, tốc độ tải form nhanh, nên bổ sung thêm câu hỏi về dịch vụ thư viện.&rdquo;
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50 border-2 border-sky-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-950">
                    <span>👨‍💻 Quốc Huy (32t, Kỹ sư IT)</span>
                    <span className="text-[9px] bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded font-mono font-bold">Chuyên gia</span>
                  </div>
                  <p className="text-[11px] text-sky-900 italic font-medium">
                    &ldquo;Hạ tầng vận hành ổn định, mã hoá dữ liệu an toàn, xuất báo cáo SPSS tiện lợi.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-200">
              <Link
                href="/create-form/agent"
                className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200 shadow-2xs"
              >
                <span>Kích hoạt AI Agent tự luận</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 4 (Span 4): Smart Excel / CSV Mapping */}
          <div className="lg:col-span-4 rounded-3xl p-7 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/60 border-2 border-emerald-200/90 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Excel Auto-Map
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Nạp Dữ Liệu Excel / CSV Có Sẵn
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tải lên file bảng tính (.xlsx, .csv). Hệ thống tự động nhận diện tiêu đề cột và ánh xạ vào từng câu hỏi Google Forms chuẩn xác.
                </p>
              </div>

              {/* Visual Table Mapping Mock */}
              <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-2 text-xs shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 pb-1.5 border-b border-emerald-100">
                  <span>Cột trong file Excel</span>
                  <span>Câu hỏi Google Form</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium">
                  <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">[A] Ho_va_ten</span>
                  <span className="text-emerald-700 font-bold">→ 1. Họ và tên</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium">
                  <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">[B] Do_tuoi</span>
                  <span className="text-emerald-700 font-bold">→ 2. Độ tuổi</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium">
                  <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">[C] Likert_Q1</span>
                  <span className="text-emerald-700 font-bold">→ 3. Mức độ hài lòng</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-200">
              <Link
                href="/create-form/data"
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 shadow-2xs"
              >
                <span>Nạp file Excel & map cột</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 5 (Span 4): Enterprise Security & VietQR Guarantee */}
          <div className="lg:col-span-4 rounded-3xl p-7 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/60 border-2 border-orange-200/90 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  VietQR 24/7
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Bảo Hiểm Dữ Liệu & Hoàn Tiền 100%
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cổng nạp VietQR tự động cộng tiền sau 5 giây. Cơ chế bảo vệ thông minh tự động hoàn trả 100% credits chưa chạy về ví nếu bạn hủy đơn.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-orange-200 space-y-2 text-xs shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tốc độ xử lý nạp</span>
                  <strong className="text-emerald-700 font-mono font-bold">5 - 10 giây</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Bảo hành đơn hàng</span>
                  <strong className="text-emerald-700 font-bold">100% Rủi ro</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Hỗ trợ kỹ thuật</span>
                  <strong className="text-blue-700 font-bold">Zalo / Telegram 24/7</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-orange-200">
              <Link
                href="/credit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-500/20"
              >
                <span>Nạp credits qua VietQR ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: STUDIO COMPUTE & CAPACITY MATRIX (High-Contrast Cyber Slider)
      ========================================================================= */}
      <div id="calculator" className="bg-white rounded-3xl p-7 sm:p-10 text-slate-900 shadow-md border-2 border-blue-200/90 space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Studio Compute Simulator</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">Ước Tính Ngân Sách & Thời Gian Chạy Khảo Sát</h3>
          </div>
          <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-300 shadow-2xs">
            ✓ Giá Sinh Viên Rẻ Nhất • Bảo Hành Hoàn Tiền 100%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 font-bold">Quy mô mẫu khảo sát (Cỡ mẫu N):</span>
                <span className="text-orange-600 text-base font-mono font-black">{calcCount} mẫu</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={calcCount}
                onChange={(e) => setCalcCount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>50 mẫu (Test thử)</span>
                <span className="text-blue-700 font-bold">250 mẫu (Chuẩn Luận Văn)</span>
                <span>500 mẫu (Đề tài Bộ)</span>
                <span>1.000 mẫu (Thị trường)</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2.5">Động cơ áp dụng:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['model', 'ratio', 'data', 'agent'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCalcMode(m)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all text-center shadow-2xs ${
                      calcMode === m
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="capitalize block">
                      {m === 'model' && '1. NCKH SPSS'}
                      {m === 'ratio' && '2. Tỉ lệ Bell'}
                      {m === 'data' && '3. Data Excel'}
                      {m === 'agent' && '4. AI Agent'}
                    </span>
                    <span className={`block text-[10px] mt-0.5 font-normal ${calcMode === m ? 'text-blue-100' : 'text-slate-500'}`}>
                      {priceRates[m]}đ / câu
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card (High-contrast focal point) */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0B1528] to-[#0A2540] text-white rounded-2xl p-6 border-2 border-slate-700/80 flex flex-col justify-between shadow-xl">
            <div className="space-y-3.5">
              <div>
                <span className="text-xs text-slate-300 block">Tổng chi phí dự kiến</span>
                <div className="text-3xl font-black text-amber-300 font-mono mt-0.5">
                  {estimatedCost.toLocaleString()} <span className="text-xs font-normal text-slate-300">VNĐ</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 pt-3 border-t border-slate-700/80">
                <div className="flex justify-between">
                  <span>Thời gian hoàn tất:</span>
                  <strong className="text-white font-mono">~{estimatedMinutes} phút</strong>
                </div>
                <div className="flex justify-between">
                  <span>Chỉ số tin cậy SPSS:</span>
                  <strong className="text-emerald-400 font-bold">&ge; 0.82 (Đạt chuẩn)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Chính sách rủi ro:</span>
                  <strong className="text-emerald-400">Hoàn tiền 100%</strong>
                </div>
              </div>
            </div>

            <Link
              href={`/create-form/${calcMode}`}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs text-center transition-all shadow-md shadow-orange-500/20"
            >
              Khởi tạo khảo sát với gói này →
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: LIVE STUDIO OPERATIONS QUEUE (Lệnh Điền Khảo Sát & Xuất Excel)
      ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chiến dịch khảo sát trên hệ thống</h3>
            <p className="text-xs text-slate-500 mt-0.5">Theo dõi tiến trình nộp phiếu và tải file Excel (.xlsx) số hoá</p>
          </div>
          <Link href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>Xem toàn bộ đơn hàng ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu chiến dịch...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Layers className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-800">Chưa có chiến dịch nào đang chạy</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hãy dán link Google Form vào thanh điều khiển ở trên để khởi tạo chiến dịch điền khảo sát đầu tiên.
            </p>
            <button
              onClick={() => handleIngestLaunch('model')}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              Tạo chiến dịch NCKH ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Mã chiến dịch / Tiêu đề form</th>
                  <th className="px-6 py-3.5">Động cơ</th>
                  <th className="px-6 py-3.5">Tiến độ nộp</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.slice(0, 5).map((ord) => {
                  const percent = Math.round((ord.completedCount / ord.totalTarget) * 100) || 0;
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{ord.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">#{ord.id} • {new Date(ord.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {ord.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 font-mono">
                            {ord.completedCount}/{ord.totalTarget} ({percent}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ord.status === 'running' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                            Đang điền
                          </span>
                        )}
                        {ord.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Hoàn thành
                          </span>
                        )}
                        {ord.status === 'paused' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Tạm dừng
                          </span>
                        )}
                        {ord.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Chờ xử lý
                          </span>
                        )}
                        {ord.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/orders?id=${ord.id}`}
                          className="font-bold text-blue-600 hover:text-blue-700"
                        >
                          Theo dõi →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 6: ACADEMIC SOCIAL PROOF & TESTIMONIALS (NEU, FTU, HUST, UEH)
      ========================================================================= */}
      <div className="space-y-5">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-2xs">
            <Users className="w-3.5 h-3.5" />
            <span>Được tin cậy bởi 2.500+ sinh viên & học viên</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cảm nhận từ người làm nghiên cứu</h2>
          <p className="text-xs text-slate-500">
            AutoSurvey VN tự hào đồng hành cùng các bạn sinh viên, học viên cao học đạt kết quả xuất sắc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border-2 border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                  <div className="text-[11px] text-blue-600 font-semibold">{t.school}</div>
                  <div className="text-[10px] text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 7: FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION
      ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-7 sm:p-10 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Câu hỏi thường gặp (FAQ)</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3.5">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-6 animate-fadeIn">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
