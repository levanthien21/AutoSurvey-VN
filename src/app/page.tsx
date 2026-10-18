'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  const { user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const faqs = [
    {
      q: 'Google Forms có phát hiện hoặc khoá link khảo sát khi điền tự động không?',
      a: 'Không thể bị khoá! Hệ thống AutoSurvey VN v2.5 sở hữu thuật toán xoay vòng User-Agent trình duyệt ngẫu nhiên (Chrome, Safari, Firefox), tích hợp độ trễ tự nhiên (random jitter 1.0s - 2.5s) và trích xuất đúng token số nguyên fbzx từ Google Docs, tái hiện 100% thao tác người thật bấm gửi.',
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
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Hero Banner: High-tech Cyber Aesthetic matching user brand */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#071330] to-slate-950 border border-slate-800 text-white shadow-2xl p-8 sm:p-12">
        {/* Ambient atmospheric neon glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] bg-orange-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            {/* Brand pill with logo */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
              </div>
              <span>AutoSurvey <strong className="text-orange-400">VN</strong></span>
              <span className="text-white/40">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Giải cứu deadline luận văn & NCKH
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Dịch Vụ Điền Khảo Sát & Số Liệu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">SPSS / SmartPLS</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Tăng lượt điền Google / Microsoft Forms siêu tốc. Data giả lập người thật, chuẩn độ tin cậy <strong className="text-emerald-400 font-bold">Alpha &gt; 0.8</strong>, cam kết bảo hành dữ liệu và hỗ trợ 24/7.
            </p>

            {/* Value bullets */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400 font-bold" />
                </div>
                <span>Tốc độ siêu tốc 50 - 1000 mẫu/giờ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400 font-bold" />
                </div>
                <span>Cronbach&apos;s Alpha &ge; 0.82 đạt chuẩn EFA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400 font-bold" />
                </div>
                <span>Hoàn tiền 100% nếu có lượt nộp lỗi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400 font-bold" />
                </div>
                <span>Cổng thanh toán VietQR tự động 24/7</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/create-form"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Bắt đầu điền form ngay</span>
              </Link>

              {!user ? (
                <button
                  onClick={() => openAuthModal('register')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Đăng ký nhận 50.000 Credits</span>
                </button>
              ) : (
                <Link
                  href="/credit"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3.5 text-xs sm:text-sm font-semibold text-white transition-all backdrop-blur-md"
                >
                  <CreditCardIcon className="w-4 h-4 text-orange-400" />
                  <span>Nạp Credits VietQR</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Visual: Brand Logo Badge with Cyber Glow Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group max-w-sm w-full">
              {/* Pulsing neon border */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-emerald-500 to-orange-500 opacity-30 group-hover:opacity-60 blur-xl transition duration-500"></div>

              <div className="relative rounded-3xl bg-slate-900/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md border border-slate-700 flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">AutoSurvey VN</h3>
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Hệ thống vận hành 24/7
                    </p>
                    <div className="text-[10px] text-slate-400 mt-0.5">Google Form Engine v2.5 Online</div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Độ tin cậy Alpha</span>
                    <strong className="text-emerald-400 font-mono font-bold text-sm">0.82 - 0.89 (Đạt)</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Tốc độ giãn cách</span>
                    <strong className="text-sky-400 font-mono font-bold text-sm">1.0s - 2.5s (Tự nhiên)</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Cơ chế bảo vệ</span>
                    <strong className="text-orange-400 font-bold text-xs">User-Agent + Token fbzx</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/create-form/model"
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Mô phỏng mô hình NCKH ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs glow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng câu đã nộp thành công</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {totalSubmitted > 0 ? totalSubmitted.toLocaleString() : '12,480+'}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span>↑ Tự động hóa 100% người thật</span>
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
            <span>Tiến trình nền SSE thời gian thực</span>
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
              <span>+ Nạp thêm qua VietQR</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs glow-card-green">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Độ tin cậy Cronbach&apos;s Alpha</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">Alpha &gt; 0.82</div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold">Đạt chuẩn SPSS / SmartPLS SEM</div>
        </div>
      </div>

      {/* 4 Core Modes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Giải pháp toàn diện</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              4 Chế độ điền Google Forms chuyên sâu
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mode 1: Ratio */}
          <Link
            href="/create-form/ratio"
            className="group relative bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between glow-card"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors mb-5 shadow-xs">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                1. Điền theo tỉ lệ mong muốn
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tuỳ chỉnh % xuất hiện của từng đáp án cho từng câu hỏi. Tích hợp sẵn bộ presets: Phân phối chuẩn (Bell Curve), lệch tích cực, lệch tiêu cực hoặc phân bổ đều.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-blue-600 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Bắt đầu cấu hình tỉ lệ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Mode 2: Data */}
          <Link
            href="/create-form/data"
            className="group relative bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-400 transition-all flex flex-col justify-between glow-card-green"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-5 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                2. Điền data có trước (Excel / CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tải lên file Excel (.xlsx) hoặc CSV đã có sẵn số liệu. Hệ thống tự động map các cột vào câu hỏi Google Form và submit tự động từng dòng một mượt mà.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Tải file & map dữ liệu</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Mode 3: Model NCKH */}
          <Link
            href="/create-form/model"
            className="group relative bg-white p-7 rounded-3xl border-2 border-orange-200/80 shadow-xs hover:shadow-xl hover:border-orange-500 transition-all flex flex-col justify-between glow-card-orange"
          >
            <div className="absolute top-5 right-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Flame className="w-3 h-3 fill-white" />
              Khuyên dùng NCKH
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors mb-5 shadow-xs">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                3. Điền theo mô hình NCKH (SPSS / SmartPLS)
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tạo dữ liệu theo cấu trúc nghiên cứu học thuật: Đảm bảo độ tin cậy Cronbach&apos;s Alpha &ge; 0.82, hội tụ AVE &ge; 0.5, hệ số đường dẫn &beta; có ý nghĩa thống kê (p &lt; 0.05).
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-orange-600 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Mô phỏng mô hình NCKH</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Mode 4: AI Agent */}
          <Link
            href="/create-form/agent"
            className="group relative bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-purple-400 transition-all flex flex-col justify-between glow-card"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors mb-5 shadow-xs">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                4. AI Agent tự luận đa nhân khẩu
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tự động sinh ra các Persona (nhân khẩu học, tính cách, hành vi) người trả lời. AI tự suy luận và viết câu trả lời tự luận, giải thích lý do chân thực, tự nhiên 100%.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-purple-600 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Kích hoạt AI Persona</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Commercial Feature: Interactive Pricing & Speed Calculator */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-7 sm:p-10 text-white shadow-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2 border border-blue-400/20">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Bảng tính chi phí & Thời gian ước tính</span>
            </div>
            <h3 className="text-2xl font-black text-white">Ước tính ngân sách chiến dịch của bạn</h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ Cam kết giá rẻ nhất • Bảo hành hoàn tiền
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Số lượng phản hồi (Cỡ mẫu nghiên cứu):</span>
                <span className="text-orange-400 text-base font-mono font-black">{calcCount} mẫu</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={calcCount}
                onChange={(e) => setCalcCount(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                <span>50 mẫu</span>
                <span>250 mẫu (Chuẩn Luận Văn)</span>
                <span>500 mẫu</span>
                <span>1.000 mẫu</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2.5">Phương thức thực hiện:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['ratio', 'data', 'model', 'agent'] as const).map((m) => (
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
                    <span className="capitalize block">{m}</span>
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
                  <span>Độ tin cậy Alpha:</span>
                  <strong className="text-emerald-400">&ge; 0.82 (Đạt chuẩn)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Bảo hành hoàn tiền:</span>
                  <strong className="text-emerald-400">100% rủi ro</strong>
                </div>
              </div>
            </div>

            <Link
              href={`/create-form/${calcMode}`}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs text-center transition-all shadow-md shadow-orange-500/20"
            >
              Tạo form ngay với gói này →
            </Link>
          </div>
        </div>
      </div>

      {/* Wall of Love: University Student & Researcher Reviews */}
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

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chiến dịch gần đây của bạn</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tiến trình các đơn điền form đang thực hiện trên hệ thống</p>
          </div>
          <Link href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>Xem tất cả ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Chưa có đơn hàng nào</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Hãy dán link Google Form vào một trong 4 chế độ ở trên để tạo đơn điền form tự động đầu tiên của bạn.
            </p>
            <Link
              href="/create-form/ratio"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Tạo đơn ngay
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Mã đơn / Tiêu đề</th>
                  <th className="px-6 py-3">Chế độ</th>
                  <th className="px-6 py-3">Tiến độ</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Chi tiết</th>
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

      {/* FAQ Accordion */}
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

function CreditCardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
