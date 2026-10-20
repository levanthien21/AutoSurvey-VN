'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Wallet,
  Sparkles,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Edit2,
  HelpCircle,
  ExternalLink,
  LogIn,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReferralFriend {
  id: string;
  name: string;
  signupDate: string;
  signupBonus: number;
  depositCommissions: number;
  totalGenerated: number;
}

interface AffiliateData {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferred: number;
    totalEarnings: number;
    commissionRate: string;
    friendBonus: number;
    signupReward: number;
  };
  referrals: ReferralFriend[];
}

export default function AffiliatePage() {
  const { user, openAuthModal } = useAuth();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Custom code edit state
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [customCodeError, setCustomCodeError] = useState<string | null>(null);
  const [customCodeSuccess, setCustomCodeSuccess] = useState<string | null>(null);

  const fetchAffiliateData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/affiliate');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://autosurvey.vn';
          const code = json.referralCode || json.stats?.referralCode || user?.username?.toUpperCase() || 'ASV';
          const dynamicLink = `${origin}/login?ref=${encodeURIComponent(code)}`;
          setData({
            referralCode: code,
            referralLink: dynamicLink,
            stats: {
              totalReferred: json.stats?.totalReferred ?? json.stats?.referralCount ?? 0,
              totalEarnings: json.stats?.totalEarnings ?? json.stats?.affiliateEarnings ?? 0,
              commissionRate: json.stats?.commissionRate || '10%',
              friendBonus: json.stats?.friendBonus || 10000,
              signupReward: json.stats?.signupReward || 5000,
            },
            referrals: json.referrals || json.stats?.referrals || [],
          });
          setCustomCodeInput(code);
        }
      }
    } catch (err) {
      console.error('Failed to load affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, [user]);

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomCodeError(null);
    setCustomCodeSuccess(null);
    const cleaned = customCodeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleaned.length < 3 || cleaned.length > 20) {
      setCustomCodeError('Mã giới thiệu cần có từ 3 đến 20 ký tự (chữ hoặc số).');
      return;
    }

    setSavingCode(true);
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCode: cleaned }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setCustomCodeSuccess('Cập nhật mã giới thiệu thành công!');
        setIsEditingCode(false);
        fetchAffiliateData();
      } else {
        setCustomCodeError(resData.error || 'Mã đã được người khác sử dụng.');
      }
    } catch {
      setCustomCodeError('Lỗi kết nối máy chủ khi lưu mã.');
    } finally {
      setSavingCode(false);
    }
  };

  const shareOnFacebook = () => {
    if (!data) return;
    const shareUrl = encodeURIComponent(data.referralLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
  };

  const shareOnZalo = () => {
    if (!data) return;
    const shareUrl = encodeURIComponent(data.referralLink);
    window.open(`https://zalo.me/share?url=${shareUrl}`, '_blank');
  };

  // If user is not logged in, show Guest Teaser Banner
  if (!user) {
    return (
      <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-center animate-fadeIn">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>Chương Trình Đối Tác AutoSurvey VN</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Giới thiệu bạn bè <br />
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              Nhận ngay 10% hoa hồng trọn đời
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Mỗi khi bạn bè đăng ký qua link của bạn, họ nhận ngay <strong className="text-slate-900">10.000 Credits</strong>. Bạn nhận ngay <strong className="text-slate-900">5.000 Credits</strong> và <strong className="text-amber-600 font-black">10% Credits vĩnh viễn</strong> trên mọi đơn nạp tiền của bạn bè!
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              <span>Đăng ký tham gia ngay</span>
            </button>
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập nhận link</span>
            </button>
          </div>

          {/* 3 Steps Preview */}
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Chia sẻ link đối tác</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhận liên kết giới thiệu độc quyền và chia sẻ tới bạn bè, sinh viên cùng lớp, nhóm nghiên cứu.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Bạn bè nhận 10.000 Credits</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Người được giới thiệu nhận ngay 10.000 Credits dùng thử (gấp đôi bình thường). Bạn nhận 5.000 Credits ngay khi họ đăng ký.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Hoa hồng 10% trọn đời</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mỗi khi bạn bè nạp tiền vào hệ thống, 10% giá trị nạp bằng Credits được tự động chuyển vào ví của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-700/60">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chương Trình Đối Tác & Giới Thiệu Bạn Bè</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
              Kiếm thêm Credits <br className="hidden sm:block" />
              <span className="text-amber-400">cùng AutoSurvey VN</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Tặng bạn bè <span className="text-amber-300 font-bold">10.000 Credits</span> khi đăng ký. Nhận ngay <span className="text-amber-300 font-bold">5.000 Credits</span> cho mỗi lượt mở tài khoản và <span className="text-emerald-400 font-bold">10% hoa hồng trọn đời</span> mỗi khi bạn bè nạp tiền!
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left min-w-[200px]">
              <div className="text-[11px] text-slate-300 font-medium">Hoa hồng nạp tiền</div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">10%</div>
              <div className="text-[10px] text-slate-400 mt-1">Cộng tự động trọn đời</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left min-w-[200px]">
              <div className="text-[11px] text-slate-300 font-medium">Quà bạn bè nhận</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">10.000</div>
              <div className="text-[10px] text-slate-400 mt-1">Credits chào mừng</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2 text-left">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tổng hoa hồng nhận</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {(data?.stats?.totalEarnings ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Credits khả dụng trong ví</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2 text-left">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Bạn bè đã tham gia</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {(data?.stats?.totalReferred ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Tài khoản đăng ký thành công</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2 text-left">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tỷ lệ hoa hồng</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 font-mono">
            10%
          </div>
          <div className="text-[11px] text-slate-400">Trên mọi đơn nạp VietQR</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2 text-left">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Thưởng mở tài khoản</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            +5.000
          </div>
          <div className="text-[11px] text-slate-400">Credits/bạn bè đăng ký</div>
        </div>
      </div>

      {/* Main Action Block: Referral Link & Sharing Tools */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 text-left">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <span>Liên kết giới thiệu độc quyền của bạn</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gửi liên kết này cho bạn bè hoặc nhóm học tập. Khi họ bấm vào liên kết, hệ thống sẽ tự động áp dụng mã giới thiệu của bạn trong 30 ngày.
          </p>
        </div>

        {/* Link & Code Box */}
        <div className="space-y-4">
          {/* 1. Referral Link Input with Copy */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Đường dẫn mời trực tiếp (Khuyên dùng)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={data ? data.referralLink : 'Đang tải link...'}
                  className="w-full h-12 pl-4 pr-10 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => data && copyToClipboard(data.referralLink, 'link')}
                className={`h-12 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="h-12 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Hiển thị mã QR"
              >
                <QrCode className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Mã QR</span>
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          {showQr && data && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-6 animate-fadeIn">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.referralLink)}`}
                  alt="QR Code Giới thiệu"
                  width={180}
                  height={180}
                  className="w-36 h-36 rounded-xl"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="font-extrabold text-slate-900 text-sm">Mã QR Giới Thiệu Của Bạn</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                  Bạn bè có thể mở máy ảnh trên điện thoại để quét mã QR và đăng ký tài khoản ngay tức thì.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data.referralLink)}`}
                    download="AutoSurvey-Referral-QR.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                  >
                    <span>Tải ảnh QR về máy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 2. Referral Code Input + Custom Code Editor */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Mã giới thiệu ngắn:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl tracking-wider border border-slate-200">
                      {data ? data.referralCode : '...'}
                    </span>
                    <button
                      type="button"
                      onClick={() => data && copyToClipboard(data.referralCode, 'code')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Sao chép mã"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {!isEditingCode ? (
                <button
                  type="button"
                  onClick={() => setIsEditingCode(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Đổi mã theo ý muốn (VD: KHOALUAN26)</span>
                </button>
              ) : (
                <form onSubmit={handleSaveCustomCode} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nhập mã mới"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                    className="h-10 px-3 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={20}
                  />
                  <button
                    type="submit"
                    disabled={savingCode}
                    className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs disabled:opacity-60"
                  >
                    {savingCode ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCode(false);
                      setCustomCodeError(null);
                    }}
                    className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs"
                  >
                    Hủy
                  </button>
                </form>
              )}
            </div>

            {customCodeError && (
              <p className="text-xs text-rose-600 font-medium mt-2">{customCodeError}</p>
            )}
            {customCodeSuccess && (
              <p className="text-xs text-emerald-600 font-medium mt-2">{customCodeSuccess}</p>
            )}
          </div>

          {/* 3. Quick Social Share Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-slate-500 font-semibold mr-1">Chia sẻ nhanh:</span>
            <button
              type="button"
              onClick={shareOnFacebook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Chia sẻ Facebook</span>
            </button>

            <button
              type="button"
              onClick={shareOnZalo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <span className="font-black text-xs">Zalo</span>
              <span>Chia sẻ Zalo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Danh sách bạn bè đã giới thiệu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chi tiết các lượt đăng ký và hoa hồng phát sinh từ tài khoản được bạn giới thiệu.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAffiliateData}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {data && data.referrals && data.referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Tài khoản bạn bè</th>
                  <th className="pb-3 px-3">Ngày đăng ký</th>
                  <th className="pb-3 px-3">Thưởng đăng ký</th>
                  <th className="pb-3 px-3">Hoa hồng nạp 10%</th>
                  <th className="pb-3 px-3 text-right">Tổng nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.referrals.map((friend) => (
                  <tr key={friend.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                        {(friend?.name || 'U').charAt(0)}
                      </div>
                      <span>{friend?.name || 'Bạn bè'}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {friend?.signupDate ? new Date(friend.signupDate).toLocaleDateString('vi-VN') : 'Mới'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                      +{(friend?.signupBonus ?? 5000).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-600">
                      +{(friend?.depositCommissions ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-right">
                      +{(friend?.totalGenerated ?? 5000).toLocaleString()} Credits
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Chưa có bạn bè nào đăng ký</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hãy sao chép liên kết giới thiệu phía trên và gửi cho bạn bè ngay hôm nay để nhận 5.000 Credits đầu tiên!
            </p>
          </div>
        )}
      </div>

      {/* Rules & Policy FAQ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 text-left">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Quy chế & Chính sách chương trình Affiliate</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/60 space-y-1.5">
            <h5 className="font-bold text-slate-800">1. Quyền lợi người giới thiệu (Affiliate)</h5>
            <p className="leading-relaxed">
              Bạn nhận được <strong className="text-slate-900">5.000 Credits</strong> ngay sau khi bạn bè tạo tài khoản và <strong className="text-amber-700">10% tổng giá trị nạp tiền</strong> (tính bằng Credits) trên mọi giao dịch VietQR hợp lệ của người đó.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/60 space-y-1.5">
            <h5 className="font-bold text-slate-800">2. Quyền lợi người được giới thiệu</h5>
            <p className="leading-relaxed">
              Bạn bè của bạn khi đăng ký qua link giới thiệu sẽ được nhận ngay <strong className="text-emerald-700">10.000 Credits</strong> (thay vì 5.000 Credits mặc định) để trải nghiệm toàn bộ tính năng điền form & số liệu SPSS.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/60 space-y-1.5">
            <h5 className="font-bold text-slate-800">3. Thời gian ghi nhận hoa hồng</h5>
            <p className="leading-relaxed">
              Hoa hồng 10% được cộng tự động và trực tiếp vào số dư ví Credits của bạn ngay khi giao dịch nạp tiền của bạn bè được hệ thống phê duyệt thành công.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/60 space-y-1.5">
            <h5 className="font-bold text-slate-800">4. Cookie & Thời hạn ghi nhớ</h5>
            <p className="leading-relaxed">
              Khi bạn bè bấm vào liên kết, trình duyệt sẽ lưu mã giới thiệu trong vòng <strong className="text-slate-900">30 ngày</strong>. Dù bạn bè không đăng ký ngay lúc đó, khi quay lại vẫn sẽ được tính cho bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
