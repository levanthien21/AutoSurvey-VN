'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  QrCode,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  History,
  Copy,
  Gift,
  Clock,
  AlertCircle,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  credits: number;
  status: string;
  memo: string;
  createdAt: string;
}

export default function CreditPage() {
  const { user, refreshUser, openAuthModal } = useAuth();
  const [selectedPack, setSelectedPack] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const packs = [
    { price: 50000, credits: 50000, bonus: '0%', popular: false },
    { price: 100000, credits: 105000, bonus: '+5%', popular: true },
    { price: 200000, credits: 220000, bonus: '+10%', popular: false },
    { price: 500000, credits: 575000, bonus: '+15%', popular: false },
  ];

  const getPackCredits = (price: number) => {
    if (price >= 1000000) return Math.round(price * 1.20);
    if (price >= 500000) return Math.round(price * 1.15);
    if (price >= 200000) return Math.round(price * 1.10);
    if (price >= 100000) return Math.round(price * 1.05);
    return price;
  };

  // Fetch transactions for authenticated user
  const loadTransactions = async () => {
    if (!user) return;
    setLoadingTx(true);
    try {
      const res = await fetch('/api/credit/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleRefreshCredit = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadTransactions(), refreshUser()]);
      setRefreshToast('Đã làm mới số dư ví và lịch sử giao dịch thành công!');
      setTimeout(() => setRefreshToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate QR for authenticated user
  const generateQr = async (amount: number) => {
    if (!user) return;
    setLoadingDeposit(true);
    try {
      const res = await fetch('/api/credit/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingTx(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeposit(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTransactions();
      generateQr(selectedPack);
    } else {
      setPendingTx(null);
      setTransactions([]);
    }
  }, [user?.id]);

  const handleSelectPack = (price: number) => {
    setSelectedPack(price);
    setCustomAmount('');
    if (user) {
      generateQr(price);
    }
  };

  const handleCustomAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customAmount);
    if (!isNaN(val) && val >= 10000) {
      setSelectedPack(val);
      if (user) {
        generateQr(val);
      }
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Redeem coupon
  const handleRedeemCoupon = async (codeToRedeem?: string) => {
    const code = codeToRedeem || couponCode;
    if (!code) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const res = await fetch('/api/credit/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponMessage({ success: true, text: data.message });
        setCouponCode('');
        refreshUser();
        loadTransactions();
      } else {
        setCouponMessage({ success: false, text: data.error || 'Mã không hợp lệ' });
      }
    } catch (err: any) {
      setCouponMessage({ success: false, text: err.message || 'Lỗi khi áp dụng mã' });
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
          <Wallet className="w-3.5 h-3.5" />
          <span>Ví & Bảng giá Credits</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nạp tiền & Bảng giá dịch vụ</h1>
        <p className="text-sm text-slate-500 mt-1">
          Nạp credits tự động 24/7 qua cổng VietQR chuẩn NAPAS để thực hiện các chiến dịch điền form và trích xuất dữ liệu SPSS.
        </p>
      </div>

      {/* Balance Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#071330] to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="text-xs text-slate-400 font-bold tracking-wider uppercase flex items-center gap-2">
              <span>Số dư tài khoản AutoSurvey VN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-1 tracking-tight text-white flex items-baseline gap-1.5 font-mono">
              {user ? (user.role === 'admin' ? '∞ Vô hạn' : user.credits.toLocaleString()) : '0'}
              <span className="text-sm font-normal text-slate-400">Credits</span>
            </div>
            <div className="text-xs text-slate-300 mt-2.5 flex flex-wrap items-center gap-3">
              <span className="bg-white/10 px-2.5 py-0.5 rounded-lg font-mono text-[11px] border border-white/10">
                Thành viên: <strong className="text-white">{user ? (user.role === 'admin' ? `${user.username} (Quản trị viên)` : user.username) : 'Chưa đăng ký (0 Credits)'}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">1 VNĐ = 1 Credit</span>
              <span>•</span>
              <span className="text-slate-400">Tự động cộng sau 10s</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {!user ? (
            <Link
              href="/login"
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Đăng nhập để nạp tiền</span>
            </Link>
          ) : (
            <Link
              href="/create-form"
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Khởi tạo chiến dịch ngay</span>
            </Link>
          )}
        </div>
      </div>

      {/* Packs Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Chọn gói nạp credits ưu đãi</h3>
          <span className="text-xs text-emerald-600 font-semibold">Tặng thêm lên đến +30% credits</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packs.map((p, idx) => {
            const isSelected = selectedPack === p.price;
            return (
              <div
                key={idx}
                onClick={() => handleSelectPack(p.price)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/30 shadow-md shadow-blue-500/5'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-500 font-semibold">{p.price.toLocaleString()} VNĐ</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {p.credits.toLocaleString()} <span className="text-xs font-normal text-slate-500">Credits</span>
                  </div>
                  {p.bonus !== '0%' && (
                    <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 inline-block">
                      Tặng thêm {p.bonus}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>{isSelected ? 'Đang chọn' : 'Chọn gói này'}</span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Section: Conditional for Authenticated User vs Guest */}
      {!user ? (
        /* GUEST MODE: Absolutely NO bank account numbers, NO bank details, NO demo buttons. Clean conversion gate. */
        <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-950 p-6 sm:p-10 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            {/* Visual Lock / QR Icon */}
            <div className="w-48 h-48 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-6 text-center shrink-0 backdrop-blur-sm relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-3">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <span className="text-xs font-bold text-slate-300">Mã QR Định Danh</span>
              <span className="text-[10px] text-slate-400 mt-1">Cần đăng nhập tài khoản</span>
            </div>

            {/* Content & Action */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cổng nạp VietQR Tự Động 24/7</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Đăng nhập để nhận mã QR & nạp tiền ngay
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Để đảm bảo tính bảo mật và tự động cộng credits chính xác sau 10 giây, mỗi thành viên sẽ có một mã QR và cú pháp chuyển khoản riêng biệt liên kết trực tiếp với tài khoản.
                </p>
              </div>

              {/* Highlight Box with Chosen Pack */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Gói nạp bạn đang xem:</span>
                  <strong className="text-white text-sm font-mono">
                    {selectedPack.toLocaleString()} VNĐ → {getPackCredits(selectedPack).toLocaleString()} Credits
                  </strong>
                </div>
                <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tự động cộng sau 10s</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-white" />
                  <span>Đăng nhập để lấy mã QR nạp tiền</span>
                </Link>

                <Link
                  href="/login?tab=register"
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-slate-300" />
                  <span>Đăng ký tài khoản mới</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED USER: Show personalized VietQR code & bank transfer details */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-8">
          <div className="w-56 h-56 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-3 text-center shrink-0 relative overflow-hidden">
            {loadingDeposit ? (
              <div className="text-xs text-slate-400">Đang khởi tạo mã QR...</div>
            ) : pendingTx?.qrUrl ? (
              <img
                src={pendingTx.qrUrl}
                alt="VietQR Chuyển khoản"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <QrCode className="w-28 h-28 text-slate-400" />
            )}
            <span className="text-[10px] font-bold text-slate-500 mt-1">VietQR Chuẩn NAPAS 24/7</span>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <h3 className="text-base font-bold text-slate-900">Quét mã QR để hoàn tất thanh toán</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, Momo, v.v.) và quét mã bên trái.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngân hàng nhận</span>
                  <strong className="text-slate-800 text-sm">{pendingTx?.bankInfo?.bankName || 'VIETCOMBANK'}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Số tài khoản</span>
                  <strong className="text-slate-800 text-sm font-mono">{pendingTx?.bankInfo?.accountNumber || '---'}</strong>
                </div>
                {pendingTx?.bankInfo?.accountNumber && (
                  <button
                    onClick={() => copyToClipboard(pendingTx.bankInfo.accountNumber, 'stk')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Chủ tài khoản</span>
                  <strong className="text-slate-800 text-sm uppercase">{pendingTx?.bankInfo?.accountName || 'LE VAN THIEN'}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 text-orange-950 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-orange-700 block text-[11px] font-extrabold uppercase tracking-wide">
                    Nội dung chuyển khoản (Bắt buộc chính xác)
                  </span>
                  <strong className="text-orange-900 text-base font-mono font-black">{pendingTx?.memo || `NAP ${user.username.toUpperCase()}`}</strong>
                </div>
                {pendingTx?.memo && (
                  <button
                    onClick={() => copyToClipboard(pendingTx.memo, 'memo')}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedField === 'memo' ? 'Đã sao chép!' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Hệ thống kiểm tra giao dịch tự động. Tiền sẽ được cộng vào ví trong 10 - 30 giây kể từ khi chuyển khoản thành công.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Coupon & Promo Codes */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Mã quà tặng & Khuyến mãi (Voucher)</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nhập mã khuyến mãi (ví dụ: WELCOME50K, NCKH2026)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 h-11 px-4 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
          <button
            onClick={() => handleRedeemCoupon()}
            disabled={couponLoading || !couponCode.trim()}
            className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {couponLoading ? 'Đang áp dụng...' : 'Áp dụng mã'}
          </button>
        </div>

        {couponMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              couponMessage.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {couponMessage.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{couponMessage.text}</span>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Mã hot dùng thử:</span>
          <button
            type="button"
            onClick={() => handleRedeemCoupon('WELCOME10K')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-mono font-bold transition-colors border border-slate-200"
          >
            WELCOME10K (+10.000đ)
          </button>
          <button
            type="button"
            onClick={() => handleRedeemCoupon('NCKH2026')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-mono font-bold transition-colors border border-slate-200"
          >
            NCKH2026 (+20.000đ)
          </button>
          <button
            type="button"
            onClick={() => handleRedeemCoupon('PASSMON10')}
            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-mono font-bold transition-colors border border-orange-200"
          >
            PASSMON10 (+15.000đ)
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Lịch sử giao dịch ví</h3>
          </div>
          {user && (
            <button
              onClick={handleRefreshCredit}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-blue-600 hover:text-blue-700 font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
            </button>
          )}
        </div>

        {refreshToast && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{refreshToast}</span>
          </div>
        )}

        {!user ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
            <span>Vui lòng đăng nhập để xem lịch sử nạp tiền và biến động credits của bạn.</span>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-bold underline text-xs"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : loadingTx ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải lịch sử giao dịch...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Chưa có giao dịch nào được ghi nhận.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Mã GD</th>
                  <th className="py-3 px-3">Loại</th>
                  <th className="py-3 px-3">Nội dung</th>
                  <th className="py-3 px-3">Biến động</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono text-slate-500">#{tx.id}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.type === 'deposit'
                            ? 'bg-blue-50 text-blue-700'
                            : tx.type === 'bonus'
                            ? 'bg-purple-50 text-purple-700'
                            : tx.type === 'refund'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {tx.type === 'deposit'
                          ? 'Nạp tiền'
                          : tx.type === 'bonus'
                          ? 'Thưởng/Mã'
                          : tx.type === 'refund'
                          ? 'Hoàn tiền'
                          : 'Trừ đơn'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800">{tx.memo}</td>
                    <td className="py-3 px-3 font-bold font-mono">
                      <span className={tx.credits >= 0 ? 'text-emerald-600' : 'text-slate-900'}>
                        {tx.credits >= 0 ? `+${tx.credits.toLocaleString()}` : tx.credits.toLocaleString()} Credits
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          tx.status === 'completed'
                            ? 'text-emerald-600'
                            : tx.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Thành công</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Chờ xử lý</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
