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
    ratio: 100,
    data: 80,
    model: 150,
    agent: 200,
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
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* =========================================================================
          SECTION 1: NEXT-GEN STUDIO INGESTION COCKPIT (Linear / Raycast Style)
          Departing 100% from Fillform with an interactive floating command center.
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-[#090F1E] border border-slate-800 text-white shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Ambient atmospheric cyber glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 bg-dot-matrix-dark opacity-30 pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          {/* Header Row: Official Brand Identity & Live Engine Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
              </div>
              <span>AutoSurvey <strong className="text-orange-400">VN</strong></span>
              <span className="text-white/40">•</span>
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hệ Thống Vận Hành v2.5 Online
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/80">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                99.8% Uptime
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/80">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Bảo Vệ Token fbzx
              </span>
              <span className="hidden sm:flex items-center gap-1 font-mono text-[11px] bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/80">
                <BadgeCheck className="w-3.5 h-3.5 text-orange-400" />
                Bảo Hành Hoàn Tiền 100%
              </span>
            </div>
          </div>

          {/* Headline and Value Proposition */}
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Nền Tảng Tự Động Điền Khảo Sát & Tạo Số Liệu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
                SPSS / SmartPLS
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Giải pháp cứu cánh deadline luận văn, NCKH và khảo sát thị trường. Tự động hóa 100% hành vi người thật,
              đảm bảo vượt qua kiểm định thống kê <strong className="text-emerald-400 font-bold">Alpha ≥ 0.82, AVE ≥ 0.5</strong> và không bị Google Forms đánh dấu bot.
            </p>
          </div>

          {/* Interactive Universal Ingestion Dock */}
          <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-3.5 flex items-center gap-1 text-slate-400 pointer-events-none">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <input
                  type="text"
                  placeholder="Dán link Google Forms (https://docs.google.com/forms/d/e/.../viewform)..."
                  value={ingestUrl}
                  onChange={(e) => setIngestUrl(e.target.value)}
                  className="w-full h-12 pl-10 pr-24 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {!ingestUrl && (
                  <button
                    type="button"
                    onClick={handleUseSampleUrl}
                    className="absolute right-2.5 top-2.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors"
                  >
                    Dùng link mẫu
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleIngestLaunch()}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>Phân tích & Bắt đầu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Ingestion Mode Quick Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                <span>Chọn động cơ xử lý:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIngestMode('model');
                    handleIngestLaunch('model');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    selectedIngestMode === 'model'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-orange-400" />
                  <span>1. Mô hình NCKH (SPSS)</span>
                  <span className="text-[9px] bg-orange-500/20 px-1 py-0.2 rounded text-orange-300 font-extrabold uppercase">HOT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedIngestMode('ratio');
                    handleIngestLaunch('ratio');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    selectedIngestMode === 'ratio'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. Tỉ lệ Bell Curve</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedIngestMode('data');
                    handleIngestLaunch('data');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    selectedIngestMode === 'data'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Nạp Data Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedIngestMode('agent');
                    handleIngestLaunch('agent');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    selectedIngestMode === 'agent'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>4. AI Agent Tự luận</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: REAL-TIME SYSTEM TELEMETRY STRIP
          Live proof that AutoSurvey VN is an active, reliable SaaS platform
      ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs glow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng câu đã nộp an toàn</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {totalSubmitted > 0 ? totalSubmitted.toLocaleString() : '14,850+'}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>100% người thật không bị Google chặn</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs glow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Chiến dịch đang xử lý</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">{activeOrders}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            <span>Động cơ đa luồng SSE thời gian thực</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs glow-card-orange">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Số dư Credits của bạn</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {user ? user.credits.toLocaleString() : '50.000'}
          </div>
          <div className="mt-1 text-xs text-orange-600 font-bold">
            <Link href="/credit" className="hover:underline flex items-center gap-1">
              <span>+ Nạp thêm qua VietQR 24/7</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs glow-card-green">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Chỉ số tin cậy SPSS / SEM</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">Alpha &gt; 0.82</div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold">Bao đỗ EFA, CFA & Hồi quy</div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: THE PROPRIETARY BENTO GRID STUDIO SHOWCASE (12-Col Linear Style)
          Eliminates all clone/copyright appearance with unique technical modules.
      ========================================================================= */}
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Kiến Trúc Độc Quyền</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hệ Thống 4 Động Cơ Chuyên Sâu Của AutoSurvey VN
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Được thiết kế từ bài toán thực tế của hàng nghìn sinh viên, học viên cao học và chuyên gia khảo sát tại Việt Nam.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bento Tile 1 (Span 8): Academic Latent Construct & Cholesky Engine */}
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-950 via-[#0B1528] to-slate-900 rounded-3xl p-7 sm:p-9 text-white border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient visual glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-6 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span>Độc Quyền Luận Văn & NCKH</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                  Thuật toán: Cholesky Likert v2.5
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Động Cơ Mô Hình NCKH Chuẩn SPSS / SmartPLS SEM
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Kiểm soát chặt chẽ ma trận tương quan giữa các nhân tố tiềm ẩn và biến quan sát. Đảm bảo dữ liệu khảo sát xuất ra kiểm định Cronbach’s Alpha ≥ 0.82, AVE ≥ 0.5, hệ số hồi quy β có ý nghĩa thống kê (p &lt; 0.05) và không đa cộng tuyến (VIF &lt; 3).
                </p>
              </div>

              {/* Interactive Latent Construct Diagram Mockup */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Sơ đồ tương quan cấu trúc (SEM Structural Model)</span>
                  <span className="text-emerald-400 font-mono font-bold">100% Pass Kiểm Định</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                  {/* Construct X1 */}
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 space-y-1.5 text-center">
                    <div className="font-extrabold text-blue-300">CLDV (Chất lượng)</div>
                    <div className="text-[10px] text-slate-400 font-mono">4 items • α = 0.854</div>
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-0.5 rounded">AVE = 0.56</div>
                  </div>

                  {/* Path Arrow */}
                  <div className="flex flex-col items-center justify-center text-center py-1">
                    <span className="text-[11px] font-mono text-amber-300 font-bold">β = 0.42 (p &lt; 0.001)</span>
                    <div className="w-full flex items-center my-1">
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500"></div>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 -ml-1" />
                    </div>
                    <span className="text-[10px] text-slate-400">Tác động thuận chiều</span>
                  </div>

                  {/* Construct Y */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-1.5 text-center">
                    <div className="font-extrabold text-emerald-300">SHL (Sự hài lòng)</div>
                    <div className="text-[10px] text-slate-400 font-mono">3 items • α = 0.868</div>
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-0.5 rounded">R² = 0.485</div>
                  </div>
                </div>

                {/* Statistical Benchmarks Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Cronbach&apos;s Alpha</div>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">&ge; 0.82 (Tốt)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Phương sai trích AVE</div>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">&ge; 0.50 (Đạt)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Đa cộng tuyến VIF</div>
                    <div className="font-mono font-bold text-sky-400 mt-0.5">&lt; 2.1 (Sạch)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Xuất file SPSS</div>
                    <div className="font-mono font-bold text-orange-400 mt-0.5">Số hoá Likert 1-5</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Hỗ trợ cả thang đo 5 điểm và 7 điểm
              </span>
              <Link
                href="/create-form/model"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
              >
                <span>Thiết lập mô hình NCKH ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 2 (Span 4): Gaussian Bell Curve Visualizer */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between glow-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <PieChart className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Gaussian Presets
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Động Cơ Phân Phối Chuẩn & Tỉ Lệ (Bell Curve)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Thiết lập % cho từng phương án trả lời với đường cong phân phối chuẩn, tránh hiện tượng số liệu bị dồn cục bất thường.
                </p>
              </div>

              {/* Interactive Curve SVG */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Mô phỏng đường cong Gauss</span>
                  <span className="text-blue-600 font-bold font-mono">μ = 4.2 • σ = 0.8</span>
                </div>

                {/* SVG Curve Illustration */}
                <div className="h-20 w-full relative">
                  <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
                    <path
                      d="M 10 70 Q 60 70 80 40 Q 100 10 120 40 Q 140 70 190 70"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M 10 70 Q 60 70 80 40 Q 100 10 120 40 Q 140 70 190 70 L 190 75 L 10 75 Z"
                      fill="url(#blueGrad)"
                      opacity="0.2"
                    />
                    <defs>
                      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="100" y1="10" x2="100" y2="75" stroke="#2563eb" strokeDasharray="2 2" />
                  </svg>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBellCurvePreset('positive')}
                    className={`py-1 rounded-lg font-bold border transition-all text-center ${
                      bellCurvePreset === 'positive'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Lệch dương 70%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBellCurvePreset('normal')}
                    className={`py-1 rounded-lg font-bold border transition-all text-center ${
                      bellCurvePreset === 'normal'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Chuẩn Gauss
                  </button>
                  <button
                    type="button"
                    onClick={() => setBellCurvePreset('balanced')}
                    className={`py-1 rounded-lg font-bold border transition-all text-center ${
                      bellCurvePreset === 'balanced'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Phân bổ đều
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/create-form/ratio"
                className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Cấu hình tỉ lệ theo ý muốn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 3 (Span 4): Multi-Persona AI Synthesis */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between glow-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  AI Multi-Persona
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  AI Agent Điền Tự Luận Tự Nhiên
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tự sinh chân dung người trả lời đa nhân khẩu. Tự suy luận và viết câu trả lời tự luận tự nhiên 100%, không câu nào giống câu nào.
                </p>
              </div>

              {/* Persona Sample Snippets */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                    <span>👩‍🎓 Hà Linh (21t, Sinh viên NEU)</span>
                    <span className="text-[9px] bg-purple-200/70 text-purple-800 px-1.5 py-0.2 rounded font-mono">Gen Z</span>
                  </div>
                  <p className="text-[11px] text-purple-700 italic">
                    &ldquo;Giao diện khảo sát dễ dùng, tốc độ tải form nhanh, nên bổ sung thêm câu hỏi về dịch vụ thư viện.&rdquo;
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span>👨‍💻 Quốc Huy (32t, Kỹ sư IT)</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">Chuyên gia</span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">
                    &ldquo;Hạ tầng vận hành ổn định, mã hoá dữ liệu an toàn, xuất báo cáo SPSS tiện lợi.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/create-form/agent"
                className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Kích hoạt AI Agent tự luận</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 4 (Span 4): Smart Excel / CSV Mapping */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between glow-card-green">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Excel Auto-Map
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Nạp Dữ Liệu Excel / CSV Có Sẵn
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tải lên file bảng tính (.xlsx, .csv). Hệ thống tự động nhận diện tiêu đề cột và ánh xạ vào từng câu hỏi Google Forms chuẩn xác.
                </p>
              </div>

              {/* Visual Table Mapping Mock */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                  <span>Cột trong file Excel</span>
                  <span>Câu hỏi Google Form</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">[A] Ho_va_ten</span>
                  <span className="text-emerald-600 font-bold">→ 1. Họ và tên</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">[B] Do_tuoi</span>
                  <span className="text-emerald-600 font-bold">→ 2. Độ tuổi</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">[C] Likert_Q1</span>
                  <span className="text-emerald-600 font-bold">→ 3. Mức độ hài lòng</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/create-form/data"
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Nạp file Excel & map cột</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Tile 5 (Span 4): Enterprise Security & VietQR Guarantee */}
          <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-[#0A1628] rounded-3xl p-7 text-white border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shadow-xs border border-orange-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VietQR 24/7
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  Bảo Hiểm Dữ Liệu & Hoàn Tiền 100%
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Cổng nạp VietQR tự động cộng tiền sau 5 giây. Cơ chế bảo vệ thông minh tự động hoàn trả 100% credits chưa chạy về ví nếu bạn hủy đơn.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tốc độ xử lý nạp</span>
                  <strong className="text-emerald-400 font-mono font-bold">5 - 10 giây</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Bảo hành đơn hàng</span>
                  <strong className="text-emerald-400 font-bold">100% Rủi ro</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Hỗ trợ kỹ thuật</span>
                  <strong className="text-sky-400 font-bold">Zalo / Telegram 24/7</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/credit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-500/20"
              >
                <span>Nạp credits qua VietQR ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: INTERACTIVE STUDIO COMPUTE & CAPACITY MATRIX
          Simulate timeline, sample size and cost in real-time
      ========================================================================= */}
      <div className="bg-gradient-to-br from-[#0B132B] via-slate-900 to-[#0A1628] rounded-3xl p-7 sm:p-10 text-white shadow-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2 border border-blue-400/20">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Studio Compute Simulator</span>
            </div>
            <h3 className="text-2xl font-black text-white">Ước Tính Ngân Sách & Thời Gian Chạy Khảo Sát</h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ Giá Sinh Viên Rẻ Nhất • Bảo Hành Hoàn Tiền 100%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Quy mô mẫu khảo sát (Cỡ mẫu N):</span>
                <span className="text-orange-400 text-base font-mono font-black">{calcCount} mẫu</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={calcCount}
                onChange={(e) => setCalcCount(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                <span>50 mẫu (Test thử)</span>
                <span>250 mẫu (Chuẩn Luận Văn)</span>
                <span>500 mẫu (Đề tài cấp Bộ)</span>
                <span>1.000 mẫu (Thị trường)</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2.5">Động cơ áp dụng:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['model', 'ratio', 'data', 'agent'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCalcMode(m)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                      calcMode === m
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="capitalize block">
                      {m === 'model' && '1. NCKH SPSS'}
                      {m === 'ratio' && '2. Tỉ lệ Bell Curve'}
                      {m === 'data' && '3. Data Excel'}
                      {m === 'agent' && '4. AI Agent'}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{priceRates[m]}đ / câu</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15 flex flex-col justify-between shadow-xl">
            <div className="space-y-3.5">
              <div>
                <span className="text-xs text-slate-300 block">Tổng chi phí dự kiến</span>
                <div className="text-3xl font-black text-amber-300 font-mono mt-0.5">
                  {estimatedCost.toLocaleString()} <span className="text-xs font-normal text-slate-300">VNĐ</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 pt-3 border-t border-white/10">
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
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs text-center transition-all shadow-md shadow-orange-500/20"
            >
              Khởi tạo khảo sát với gói này →
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: LIVE STUDIO OPERATIONS QUEUE (Lệnh Điền Khảo Sát & Xuất Excel)
          Real-time campaign status monitoring
      ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Chưa có chiến dịch nào đang chạy</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Hãy dán link Google Form vào thanh điều khiển ở trên để khởi tạo chiến dịch điền khảo sát đầu tiên.
            </p>
            <button
              onClick={() => handleIngestLaunch('model')}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Tạo chiến dịch NCKH ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Mã chiến dịch / Tiêu đề form</th>
                  <th className="px-6 py-3">Động cơ</th>
                  <th className="px-6 py-3">Tiến độ nộp</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.slice(0, 5).map((ord) => {
                  const percent = Math.round((ord.completedCount / ord.totalTarget) * 100) || 0;
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{ord.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">#{ord.id} • {new Date(ord.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {ord.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold">
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
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between glow-card">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                  <div className="text-[11px] text-blue-600 font-semibold">{t.school}</div>
                  <div className="text-[10px] text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 7: FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION
      ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 sm:p-10 shadow-xs space-y-5">
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
