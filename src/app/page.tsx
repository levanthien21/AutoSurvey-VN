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
  const [calcCount, setCalcCount] = useState<number>(200);
  const [calcMode, setCalcMode] = useState<'ratio' | 'data' | 'model' | 'agent'>('model');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const priceRates = {
    ratio: 100,
    data: 80,
    model: 150,
    agent: 200,
  };

  const estimatedCost = calcCount * priceRates[calcMode];
  const estimatedMinutes = Math.round((calcCount * 1.8) / 60);

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
      a: 'Không. Hệ thống AutoSurvey v2.5 sử dụng cơ chế xoay vòng User-Agent trình duyệt ngẫu nhiên, sinh độ trễ tự nhiên (jitter 1.0s - 2.5s) và token bảo mật fbzx chính xác, tạo lưu lượng gửi giống 100% người thật bấm nộp bài.',
    },
    {
      q: 'Dữ liệu mô phỏng NCKH có đạt chuẩn Cronbach’s Alpha và EFA trong SPSS / SmartPLS không?',
      a: 'Hoàn toàn đạt chuẩn. Động cơ thống kê Cholesky Likert của chúng tôi kiểm soát ma trận tương quan nội tại, bảo đảm độ tin cậy thang đo Alpha ≥ 0.8, phương sai trích AVE ≥ 0.5 và không xảy ra hiện tượng đa cộng tuyến (VIF < 3).',
    },
    {
      q: 'Nếu quá trình nộp có câu bị lỗi hoặc tôi hủy đơn thì có mất tiền không?',
      a: 'Bạn được bảo vệ 100%. Hệ thống có cơ chế Tự động hoàn tiền: Bất kỳ câu trả lời nào bị Google từ chối hoặc các câu chưa chạy khi bạn nhấn Hủy đơn sẽ được hoàn tiền 100% về ví Credits ngay lập tức.',
    },
    {
      q: 'Làm thế nào để xuất dữ liệu sau khi khảo sát hoàn tất?',
      a: 'Bạn chỉ cần vào mục "Đơn hàng của bạn" và nhấn nút "Xuất Excel (.xlsx)". Hệ thống sẽ đóng gói toàn bộ bảng phản hồi và báo cáo tổng quan thành file Excel tương thích SPSS và Excel.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Nền tảng Tự động hóa Khảo sát & Xử lý Số liệu NCKH Số 1
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white leading-tight">
            Điền Google Forms tự động & Hoàn thành số liệu nghiên cứu nhanh gấp 10 lần
          </h1>
          <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Hỗ trợ 4 chế độ chuyên sâu: Điền theo tỉ lệ phân phối chuẩn, nạp file data có sẵn, mô phỏng mô hình cấu trúc SPSS / SmartPLS và tạo câu trả lời tự luận bằng AI.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/create-form"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-blue-700 shadow-md hover:bg-blue-50 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Bắt đầu tạo form ngay
            </Link>
            {!user && (
              <button
                onClick={() => openAuthModal('register')}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-800/80 hover:bg-blue-800 px-5 py-3 text-xs sm:text-sm font-semibold text-white border border-white/20 backdrop-blur-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Đăng ký nhận 50.000 Credits Free
              </button>
            )}
            <Link
              href="/data-builder"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-5 py-3 text-xs sm:text-sm font-semibold text-white border border-white/10 backdrop-blur-md transition-all"
            >
              <Database className="w-4 h-4" />
              Build dữ liệu đẹp (SPSS/PLS)
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute right-20 top-0 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none"></div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng câu trả lời đã gửi</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalSubmitted.toLocaleString()}</div>
          <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
            <span>↑ Tự động hóa 100%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Đơn đang chạy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{activeOrders}</div>
          <div className="mt-1 text-xs text-slate-500">
            <span>Tiến trình nền ổn định</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Số dư Credits của bạn</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {user ? user.credits.toLocaleString() : '50.000'}
          </div>
          <div className="mt-1 text-xs text-blue-600 font-medium">
            <Link href="/credit">Nạp thêm ngay →</Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Chuẩn NCKH</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">Alpha &gt; 0.8</div>
          <div className="mt-1 text-xs text-emerald-600">Đạt EFA, PLS-SEM</div>
        </div>
      </div>

      {/* 4 Core Modes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">4 Chế độ điền form Google Forms</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chọn phương thức phù hợp với mục đích nghiên cứu của bạn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mode 1: Ratio */}
          <Link
            href="/create-form/ratio"
            className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                1. Điền theo tỉ lệ mong muốn
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tuỳ chỉnh % xuất hiện của từng đáp án cho từng câu hỏi. Hỗ trợ presets: Phân phối chuẩn (Bell Curve), lệch tích cực, lệch tiêu cực hoặc phân bổ đều.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-blue-600 gap-1.5">
              <span>Bắt đầu cấu hình tỉ lệ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 2: Data */}
          <Link
            href="/create-form/data"
            className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                2. Điền data có trước
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tải lên file Excel (.xlsx) hoặc CSV đã có sẵn số liệu. Hệ thống tự động map các cột vào câu hỏi Google Form và submit tự động từng dòng một.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-indigo-600 gap-1.5">
              <span>Tải file & map dữ liệu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 3: Model NCKH */}
          <Link
            href="/create-form/model"
            className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between"
          >
            <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Khuyên dùng
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors mb-4">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                3. Điền theo mô hình NCKH
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tạo dữ liệu theo cấu trúc nghiên cứu học thuật: Đảm bảo độ tin cậy Cronbach&apos;s Alpha &ge; 0.8, hội tụ AVE &ge; 0.5, hệ số đường dẫn &beta; có ý nghĩa thống kê (p &lt; 0.05).
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-amber-700 gap-1.5">
              <span>Mô phỏng mô hình NCKH</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Mode 4: AI Agent */}
          <Link
            href="/create-form/agent"
            className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                4. AI Agent điền form
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tự động sinh ra các Persona (nhân khẩu học, tính cách, hành vi) người trả lời. AI tự suy luận và viết câu trả lời tự luận, giải thích lý do chân thực, tự nhiên 100%.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-purple-600 gap-1.5">
              <span>Kích hoạt AI Persona</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Commercial Feature: Interactive Pricing & Speed Calculator */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Bảng tính chi phí & Thời gian dự kiến</span>
            </div>
            <h3 className="text-xl font-extrabold text-white">Ước tính ngân sách chiến dịch của bạn</h3>
          </div>
          <span className="text-xs text-slate-400">Cam kết giá rẻ nhất thị trường • Hoàn tiền nếu lỗi</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Số lượng phản hồi (Mẫu khảo sát):</span>
                <span className="text-blue-400 text-sm font-mono">{calcCount} câu trả lời</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={calcCount}
                onChange={(e) => setCalcCount(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>50 câu</span>
                <span>250 câu (Chuẩn NCKH)</span>
                <span>500 câu</span>
                <span>1.000 câu</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">Phương thức điền:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['ratio', 'data', 'model', 'agent'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCalcMode(m)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      calcMode === m
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="capitalize">{m}</span>
                    <span className="block text-[10px] text-slate-300 font-normal">{priceRates[m]}đ/câu</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-300 block">Tổng chi phí dự tính</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-0.5">
                  {estimatedCost.toLocaleString()} <span className="text-sm font-normal text-slate-300">VNĐ</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/10">
                <div className="flex justify-between">
                  <span>Thời gian hoàn thành:</span>
                  <strong className="text-white">~{estimatedMinutes} phút</strong>
                </div>
                <div className="flex justify-between">
                  <span>Độ tin cậy Alpha:</span>
                  <strong className="text-emerald-400">≥ 0.82 (Đạt chuẩn)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Chống bot Google:</span>
                  <strong className="text-emerald-400">An toàn 100%</strong>
                </div>
              </div>
            </div>

            <Link
              href={`/create-form/${calcMode}`}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-all shadow-md"
            >
              Tạo form với cấu hình này →
            </Link>
          </div>
        </div>
      </div>

      {/* Commercial Value Props & Proof */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Hoàn tiền 100% nếu có lỗi</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống tự động phát hiện câu lỗi do Google throttle và hoàn tiền ngay lập tức vào số dư ví của bạn.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Chuẩn hóa cho Khóa luận & NCKH</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Được tin dùng bởi hơn 2.500+ sinh viên và học viên cao học từ NEU, FTU, UEH, HUST, RMIT cho các đề tài nghiên cứu.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Xuất file Excel tương thích SPSS</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            1-click tải file kết quả đã được mã hóa thang đo Likert chuẩn, sẵn sàng đưa vào SPSS / SmartPLS phân tích ngay.
          </p>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chiến dịch gần đây của bạn</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tiến trình các đơn điền form đang thực hiện trên hệ thống</p>
          </div>
          <Link href="/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Xem tất cả ({orders.length}) →
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
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
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
                        <div className="font-semibold text-slate-900">{ord.title}</div>
                        <div className="text-[11px] text-slate-400">{ord.id} • {new Date(ord.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {ord.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">
                            {ord.completedCount}/{ord.totalTarget} ({percent}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ord.status === 'running' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                            Đang điền
                          </span>
                        )}
                        {ord.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Hoàn thành
                          </span>
                        )}
                        {ord.status === 'paused' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Tạm dừng
                          </span>
                        )}
                        {ord.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Chờ xử lý
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/orders?id=${ord.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
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

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Câu hỏi thường gặp (FAQ)</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed pr-4 animate-fadeIn">
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
