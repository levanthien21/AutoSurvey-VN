'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  QrCode,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  History,
  Copy,
  Tag,
  Gift,
  Clock,
  ExternalLink,
  AlertCircle,
  Sparkles,
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
  const [loadingTx, setLoadingTx] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const packs = [
    { price: 50000, credits: 50000, bonus: '0%', popular: false },
    { price: 100000, credits: 110000, bonus: '+10%', popular: true },
    { price: 200000, credits: 240000, bonus: '+20%', popular: false },
    { price: 500000, credits: 650000, bonus: '+30%', popular: false },
  ];

  // Fetch transactions
  const loadTransactions = async () => {
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

  useEffect(() => {
    loadTransactions();
    // Auto-generate initial QR for default pack
    generateQr(100000);
  }, [user?.id]);

  const generateQr = async (amount: number) => {
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

  const handleSelectPack = (price: number) => {
    setSelectedPack(price);
    setCustomAmount('');
    generateQr(price);
  };

  const handleCustomAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customAmount);
    if (!isNaN(val) && val >= 10000) {
      setSelectedPack(val);
      generateQr(val);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Instant simulate approval for demo/testing
  const handleApproveDeposit = async () => {
    if (!pendingTx?.transaction?.id) return;
    try {
      const res = await fetch('/api/credit/deposit/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: pendingTx.transaction.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessToast(`Nạp tiền thành công! Đã cộng +${pendingTx.credits.toLocaleString()} Credits`);
        refreshUser();
        loadTransactions();
        // Generate new QR for next topup
        generateQr(selectedPack);
        setTimeout(() => setSuccessToast(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
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
          <span>Ví & Điểm thưởng</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nạp tiền & Quản lý số dư</h1>
        <p className="text-sm text-slate-500 mt-1">
          Nạp credits tự động 24/7 qua cổng VietQR để thực hiện các chiến dịch điền form và trích xuất dữ liệu.
        </p>
      </div>

      {/* Balance Banner with Brand Logo and Midnight Tech Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#071330] to-slate-950 p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md border border-slate-700 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="AutoSurvey VN" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="text-xs text-slate-400 font-bold tracking-wider uppercase flex items-center gap-2">
              <span>Số dư tài khoản AutoSurvey VN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-4xl font-black mt-1 tracking-tight text-white flex items-baseline gap-1.5 font-mono">
              {user ? user.credits.toLocaleString() : '---'}
              <span className="text-sm font-normal text-slate-400">Credits</span>
            </div>
            <div className="text-xs text-slate-300 mt-2.5 flex flex-wrap items-center gap-3">
              <span className="bg-white/10 px-2.5 py-0.5 rounded-lg font-mono text-[11px] border border-white/10">
                Thành viên: <strong className="text-white">{user ? user.username : 'Khách vãng lai'}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">1 VNĐ = 1 Credit</span>
              <span>•</span>
              <span className="text-slate-400">Tự động cộng sau 10s</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={handleApproveDeposit}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-white fill-white" />
            <span>Xác nhận nạp nhanh (Demo)</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

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
                  <span>Chọn gói này</span>
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

      {/* Banking VietQR payment Card */}
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
                <strong className="text-slate-800 text-sm">{pendingTx?.bankInfo?.bankName || 'MB Bank (Quân Đội)'}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Số tài khoản</span>
                <strong className="text-slate-800 text-sm font-mono">{pendingTx?.bankInfo?.accountNumber || '9999888888'}</strong>
              </div>
              <button
                onClick={() => copyToClipboard(pendingTx?.bankInfo?.accountNumber || '9999888888', 'stk')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Chủ tài khoản</span>
                <strong className="text-slate-800 text-sm uppercase">{pendingTx?.bankInfo?.accountName || 'AUTO SURVEY VIETNAM'}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 text-orange-950 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-orange-700 block text-[11px] font-extrabold uppercase tracking-wide">
                  Nội dung chuyển khoản (Bắt buộc chính xác)
                </span>
                <strong className="text-orange-900 text-base font-mono font-black">{pendingTx?.memo || 'NAP DEMO'}</strong>
              </div>
              <button
                onClick={() => copyToClipboard(pendingTx?.memo || 'NAP DEMO', 'memo')}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedField === 'memo' ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>
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
            onClick={() => handleRedeemCoupon('WELCOME50K')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-mono font-bold transition-colors border border-slate-200"
          >
            WELCOME50K (+50.000đ)
          </button>
          <button
            type="button"
            onClick={() => handleRedeemCoupon('NCKH2026')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-mono font-bold transition-colors border border-slate-200"
          >
            NCKH2026 (+100.000đ)
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
          <button
            onClick={loadTransactions}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Tải lại
          </button>
        </div>

        {loadingTx ? (
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
