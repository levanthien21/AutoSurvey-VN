'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Wallet,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Settings,
  Clock,
  Sparkles,
  CreditCard,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Building2,
  Save,
  AlertTriangle,
  Trash2,
  Loader2,
  Crown,
  X,
  Info,
  Eye,
  Activity,
  Smartphone,
  Monitor,
  Globe,
  BarChart3,
  ArrowUpRight,
  Radio,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VisitorStats {
  todayUnique: number;
  todayViews: number;
  activeNow: number;
  totalAllTimeViews: number;
  totalAllTimeUnique: number;
  hourly: number[];
  topPages: { path: string; count: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  recentVisits: {
    id: string;
    visitorId: string;
    path: string;
    device: string;
    time: string;
  }[];
}

interface AdminMetrics {
  totalUsers: number;
  totalRevenue: number;
  totalCreditsInCirculation: number;
  totalOrders: number;
  totalSubmitted: number;
  pendingDepositsCount: number;
  totalReferredUsers?: number;
  totalAffiliateCommissions?: number;
}

export default function AdminPage() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'users' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [showTrafficModal, setShowTrafficModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Settings & Email Management States
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmailError, setAdminEmailError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  // Credit adjust modal
  const [adjustModalUser, setAdjustModalUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50000);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustMemo, setAdjustMemo] = useState<string>('');

  // User search filter
  const [searchUser, setSearchUser] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setUsersList(data.users || []);
        setPendingDeposits(data.pendingDeposits || []);
        setSettings(data.settings);
        if (data.visitorStats) {
          setVisitorStats(data.visitorStats);
        }
      }

      // Also load all transactions
      const txRes = await fetch('/api/credit/transactions');
      const txData = await txRes.json();
      if (txData.success) {
        setAllTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated interactive refresh handler with animation and explicit toast
  const handleRefreshAdmin = async () => {
    setIsRefreshing(true);
    try {
      await loadAdminData();
      showToast('success', 'Đã làm mới dữ liệu hệ thống thành công!');
    } catch (err: any) {
      showToast('error', 'Lỗi khi làm mới dữ liệu: ' + (err.message || ''));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user?.role]);

  // Giả lập lượt truy cập cho Quản trị viên kiểm tra tức thì
  const handleSimulateVisit = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/analytics/track?simulate=true&path=/');
      const data = await res.json();
      if (data.success && data.stats) {
        setVisitorStats(data.stats);
        showToast('success', '+1 lượt truy cập thực tế đã được ghi nhận vào hệ thống!');
      }
    } catch (err: any) {
      showToast('error', 'Lỗi giả lập lượt truy cập: ' + (err.message || ''));
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle deposit approval
  const handleApproveTx = async (txId: string) => {
    try {
      const res = await fetch('/api/credit/deposit/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        loadAdminData();
      } else {
        showToast('error', data.error || 'Lỗi duyệt giao dịch');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handle manual credit adjustment
  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser) return;

    const delta = adjustType === 'add' ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustModalUser.id,
          deltaCredits: delta,
          memo: adjustMemo || (delta > 0 ? 'Admin thưởng credits' : 'Admin trừ credits'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setAdjustModalUser(null);
        setAdjustMemo('');
        loadAdminData();
      } else {
        showToast('error', data.error || 'Lỗi thao tác');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Admin Email Whitelist: Add Email
  const handleAddAdminEmail = () => {
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setAdminEmailError('Email không hợp lệ. Vui lòng nhập đúng định dạng (Ví dụ: admin@gmail.com)');
      return;
    }
    const currentEmails: string[] = settings?.adminEmails || [];
    if (currentEmails.some((e: string) => e.toLowerCase() === clean)) {
      setAdminEmailError('Email này đã tồn tại trong danh sách Quản trị viên!');
      return;
    }
    setSettings({
      ...settings,
      adminEmails: [...currentEmails, clean],
    });
    setNewAdminEmail('');
    setAdminEmailError(null);
    showToast('success', `Đã thêm ${clean}. Bấm "Lưu tất cả thay đổi" để áp dụng lên hệ thống.`);
  };

  // Admin Email Whitelist: Remove individual email
  const handleRemoveAdminEmail = (emailToRemove: string) => {
    const currentEmails: string[] = settings?.adminEmails || [];
    if (currentEmails.length <= 1) {
      showToast('error', 'Cần giữ lại ít nhất 1 Email Quản trị viên để đăng nhập!');
      return;
    }
    const updated = currentEmails.filter((e: string) => e.toLowerCase() !== emailToRemove.toLowerCase());
    setSettings({
      ...settings,
      adminEmails: updated,
    });
    showToast('success', `Đã xóa ${emailToRemove}. Bấm "Lưu tất cả thay đổi" để áp dụng.`);
  };

  // Admin Email Whitelist: Purge demo emails
  const handlePurgeDemoEmails = () => {
    const currentEmails: string[] = settings?.adminEmails || [];
    const demoList = ['admin@autosurvey.vn', 'levanthien21@gmail.com', 'thienlv.bbh@gmail.com'];
    const filtered = currentEmails.filter((e: string) => !demoList.includes(e.toLowerCase()));
    if (filtered.length === 0) {
      filtered.push('levanthien21052004@gmail.com');
    }
    setSettings({
      ...settings,
      adminEmails: filtered,
    });
    showToast('success', 'Đã xóa tất cả các email demo. Bấm "Lưu tất cả thay đổi" để hoàn tất.');
  };

  // Handle settings update with strict validation and explicit error reporting
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback(null);

    // Validation
    const errors: string[] = [];
    const prices = settings?.pricePerResponse || {};
    if (prices.ratio === undefined || isNaN(Number(prices.ratio)) || Number(prices.ratio) < 0) {
      errors.push('Đơn giá chế độ Tỉ lệ (Ratio) phải là số không âm.');
    }
    if (prices.data === undefined || isNaN(Number(prices.data)) || Number(prices.data) < 0) {
      errors.push('Đơn giá chế độ Data có sẵn phải là số không âm.');
    }
    if (prices.model === undefined || isNaN(Number(prices.model)) || Number(prices.model) < 0) {
      errors.push('Đơn giá chế độ Mô hình NCKH phải là số không âm.');
    }
    if (prices.agent === undefined || isNaN(Number(prices.agent)) || Number(prices.agent) < 0) {
      errors.push('Đơn giá chế độ AI Agent phải là số không âm.');
    }

    const bank = settings?.bankInfo || {};
    if (!bank.bankName || typeof bank.bankName !== 'string' || !bank.bankName.trim()) {
      errors.push('Tên ngân hàng không được để trống.');
    }
    if (!bank.bankCode || typeof bank.bankCode !== 'string' || !bank.bankCode.trim()) {
      errors.push('Mã ngân hàng (BankCode) không được để trống.');
    }
    if (!bank.accountNumber || typeof bank.accountNumber !== 'string' || !bank.accountNumber.trim()) {
      errors.push('Số tài khoản ngân hàng không được để trống.');
    }
    if (!bank.accountName || typeof bank.accountName !== 'string' || !bank.accountName.trim()) {
      errors.push('Tên chủ tài khoản không được để trống.');
    }

    const adminEmails = settings?.adminEmails || [];
    if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
      errors.push('Danh sách Email Quản trị viên phải có ít nhất 1 email hợp lệ.');
    }

    if (errors.length > 0) {
      setSaveFeedback({
        type: 'error',
        message: 'Không thể lưu cài đặt do phát hiện các lỗi sau:',
        details: errors,
      });
      showToast('error', 'Có lỗi trong dữ liệu nhập. Vui lòng kiểm tra thông báo bên dưới.');
      return;
    }

    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveFeedback({
          type: 'success',
          message: 'Lưu tất cả thay đổi thành công!',
          details: [
            `Bảng giá mới: Ratio (${prices.ratio}đ) • Data (${prices.data}đ) • Model (${prices.model}đ) • Agent (${prices.agent}đ)`,
            `Tài khoản thụ hưởng: ${bank.bankName} - ${bank.accountNumber} (${bank.accountName})`,
            `Whitelist Admin: ${adminEmails.length} Email được cấp quyền Quản trị & Credits vô hạn`,
          ],
        });
        showToast('success', 'Đã lưu thành công bảng giá, tài khoản và danh sách Admin!');
        loadAdminData();
      } else {
        setSaveFeedback({
          type: 'error',
          message: data.error || 'Máy chủ trả về lỗi khi lưu cấu hình.',
        });
        showToast('error', data.error || 'Lỗi lưu cấu hình');
      }
    } catch (err: any) {
      setSaveFeedback({
        type: 'error',
        message: 'Lỗi kết nối mạng: ' + (err.message || 'Không thể gửi dữ liệu lên máy chủ.'),
      });
      showToast('error', err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Khu vực dành riêng cho Quản trị viên</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tài khoản hiện tại của bạn không có đặc quyền Admin. Vui lòng đăng nhập bằng Email được cấp quyền Quản trị viên để truy cập hệ thống.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
        >
          Đăng nhập tài khoản Quản trị
        </button>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.id.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Trung tâm Quản trị SaaS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản trị Hệ thống AutoSurvey PRO</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý doanh thu, duyệt giao dịch nạp tiền VietQR, phân bổ credits và cấu hình bảng giá.
          </p>
        </div>

        <button
          onClick={handleRefreshAdmin}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
          <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
        </button>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Tổng quan kinh doanh
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'deposits'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Duyệt nạp VietQR</span>
          {pendingDeposits.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingDeposits.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Quản lý người dùng ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Bảng giá & Cấu hình SaaS
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* CARD 1: CON MẮT LƯỢT TRUY CẬP HÔM NAY */}
            <div className="bg-gradient-to-br from-indigo-900 via-[#0c1638] to-slate-950 text-white p-5 rounded-2xl border border-indigo-700/50 shadow-md relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/25 transition-all"></div>
              <div>
                <div className="flex items-center justify-between text-xs text-indigo-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Truy cập hôm nay
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/40 text-cyan-300 flex items-center justify-center border border-indigo-400/30 shadow-xs">
                    <Eye className="w-4 h-4 text-cyan-300 animate-pulse" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {(visitorStats?.todayUnique ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-indigo-300 font-medium">khách</span>
                </div>
                <div className="text-[11px] text-cyan-300/90 font-medium mt-1 flex items-center gap-2">
                  <span>{(visitorStats?.todayViews ?? 0).toLocaleString()} lượt xem trang</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{visitorStats?.activeNow || 1} online</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-indigo-800/60 flex items-center justify-between">
                <span className="text-[10px] text-indigo-300/80">Con mắt Live 24/7</span>
                <button
                  type="button"
                  onClick={() => setShowTrafficModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-white transition-colors"
                >
                  <span>Chi tiết</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Doanh thu VietQR thực tế</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                {metrics.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-500">VNĐ</span>
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 font-semibold">↑ Thanh toán tự động 24/7</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Tổng số tài khoản</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">{metrics.totalUsers}</div>
              <div className="mt-1 text-[11px] text-slate-400 font-medium">Thành viên hệ thống</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Credits đang lưu hành</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                {metrics.totalCreditsInCirculation.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-amber-600 font-medium">Trong ví người dùng</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Phản hồi đã submit</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                {metrics.totalSubmitted.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-purple-600 font-medium">Trên {metrics.totalOrders} chiến dịch</div>
            </div>

            {/* CARD 6: ĐỐI TÁC AFFILIATE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Đối tác Affiliate</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                {(metrics.totalReferredUsers ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">bạn bè</span>
              </div>
              <div className="mt-1 text-[11px] text-orange-600 font-semibold">
                +{(metrics.totalAffiliateCommissions ?? 0).toLocaleString()} Credits hoa hồng
              </div>
            </div>
          </div>

          {/* LIVE TRAFFIC ANALYTICS PANEL (TÍNH NĂNG CON MẮT CHI TIẾT) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Eye className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      Hệ Thống Giám Sát Lưu Lượng Truy Cập Trực Tuyến
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      {visitorStats?.activeNow || 1} Đang Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thống kê tự động theo thời gian thực (Giờ Việt Nam GMT+7). Cập nhật lượt xem trang và số khách duy nhất mỗi ngày.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSimulateVisit}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Nhấn để kiểm tra và tăng ngay 1 lượt truy cập vào hệ thống"
                >
                  <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Đang gửi...' : '⚡ Test +1 Lượt xem'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTrafficModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Xem báo cáo chi tiết</span>
                </button>
              </div>
            </div>

            {/* Quick Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Biểu đồ 24h thu gọn */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    Mật độ phân bổ truy cập 24 Giờ hôm nay
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Cao điểm: {Math.max(...(visitorStats?.hourly || [0]))} lượt/giờ
                  </span>
                </div>

                {/* 24-Hour Bar Chart */}
                <div className="h-20 flex items-end gap-1 sm:gap-1.5 pt-2 pb-1 border-b border-slate-200">
                  {(visitorStats?.hourly || Array(24).fill(0)).map((val, h) => {
                    const maxVal = Math.max(1, ...(visitorStats?.hourly || [1]));
                    const heightPercent = Math.max(8, Math.round((val / maxVal) * 100));
                    const isPeak = val === maxVal && val > 0;
                    return (
                      <div
                        key={h}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                      >
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] rounded font-mono pointer-events-none whitespace-nowrap z-10 shadow-xs">
                          {h}h: {val} lượt
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isPeak
                              ? 'bg-indigo-600 group-hover:bg-indigo-700'
                              : val > 0
                              ? 'bg-blue-400/80 group-hover:bg-blue-500'
                              : 'bg-slate-200 group-hover:bg-slate-300'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 px-0.5">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:59</span>
                </div>
              </div>

              {/* 2. Top trang được xem nhiều nhất */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Trang xem nhiều nhất
                  </span>
                  <span className="text-[10px] text-slate-400">Hôm nay</span>
                </div>

                <div className="space-y-1.5">
                  {(visitorStats?.topPages && visitorStats.topPages.length > 0
                    ? visitorStats.topPages.slice(0, 4)
                    : [
                        { path: '/', count: 24 },
                        { path: '/credit', count: 8 },
                        { path: '/create-form/model', count: 6 },
                        { path: '/orders', count: 4 },
                      ]
                  ).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100 shadow-2xs"
                    >
                      <span className="font-mono text-slate-700 font-semibold truncate max-w-[150px]">
                        {p.path}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 text-[11px] shrink-0">
                        {p.count} views
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Thiết bị:</span>
                  <span className="font-semibold text-slate-600">
                    💻 {visitorStats?.deviceBreakdown?.desktop || 0} PC • 📱 {visitorStats?.deviceBreakdown?.mobile || 0} Mobile
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending approval alert */}
          {pendingDeposits.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold">Có {pendingDeposits.length} giao dịch nạp tiền đang chờ duyệt!</h4>
                  <p className="text-[11px] text-amber-700">Khách hàng đã chuyển khoản và đang đợi cộng credits.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('deposits')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Xem và duyệt ngay
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPOSITS APPROVAL */}
      {activeTab === 'deposits' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Danh sách giao dịch nạp tiền VietQR</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phê duyệt hoặc kiểm tra lịch sử nạp tiền của tất cả khách hàng trên nền tảng.
            </p>
          </div>

          {/* Pending table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Đang chờ xác nhận ({pendingDeposits.length})
            </h4>

            {pendingDeposits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Không có giao dịch nào đang chờ duyệt.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Mã GD</th>
                      <th className="py-3 px-3">Người dùng</th>
                      <th className="py-3 px-3">Số tiền</th>
                      <th className="py-3 px-3">Credits</th>
                      <th className="py-3 px-3">Cú pháp CK</th>
                      <th className="py-3 px-3">Thời gian</th>
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {pendingDeposits.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono text-slate-500">#{tx.id}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{tx.username}</td>
                        <td className="py-3 px-3 font-bold text-blue-700 font-mono">
                          {tx.amount.toLocaleString()} VNĐ
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700 font-mono">
                          +{tx.credits.toLocaleString()} Credits
                        </td>
                        <td className="py-3 px-3 font-mono bg-blue-50/50 text-blue-900">{tx.memo}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleApproveTx(tx.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                          >
                            Duyệt nạp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USERS MANAGER */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh sách người dùng hệ thống</h3>
              <p className="text-xs text-slate-500 mt-0.5">Xem số dư, lịch sử và cộng/trừ credits trực tiếp.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm username, email, ID..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Mã ID</th>
                  <th className="py-3 px-3">Tên đăng nhập</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Vai trò</th>
                  <th className="py-3 px-3">Mã Affiliate</th>
                  <th className="py-3 px-3">Số dư Credits</th>
                  <th className="py-3 px-3">Ngày đăng ký</th>
                  <th className="py-3 px-3 text-right">Điều chỉnh ví</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono text-slate-400">#{u.id.replace('usr_', '')}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{u.username}</td>
                    <td className="py-3 px-3 text-slate-600">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.referralCode ? (
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] inline-block w-fit border border-amber-200">
                            {u.referralCode}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {u.referralCount ? `${u.referralCount} bạn bè (+${(u.affiliateEarnings || 0).toLocaleString()}đ)` : 'Chưa giới thiệu'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold font-mono">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 text-[11px]">
                          <Crown className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>∞ Vô hạn (Admin)</span>
                        </span>
                      ) : (
                        <span className="text-blue-700 font-bold">{u.credits.toLocaleString()} Credits</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setAdjustModalUser(u);
                          setAdjustAmount(50000);
                          setAdjustType('add');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold text-[11px] transition-colors"
                      >
                        Nạp / Trừ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & PRICING */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Pricing settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Cấu hình đơn giá dịch vụ (Credits / Câu trả lời)</h3>
            <p className="text-xs text-slate-500">
              Đơn giá này được tự động tính khi khách hàng tạo đơn điền form và trừ trực tiếp vào số dư ví.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Theo tỉ lệ mong muốn (Ratio)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.pricePerResponse.ratio}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricePerResponse: { ...settings.pricePerResponse, ratio: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-10 px-3 font-bold text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">đ/câu</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Điền data có sẵn (CSV/Excel)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.pricePerResponse.data}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricePerResponse: { ...settings.pricePerResponse, data: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-10 px-3 font-bold text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">đ/câu</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Mô hình NCKH (SPSS/PLS)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.pricePerResponse.model}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricePerResponse: { ...settings.pricePerResponse, model: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-10 px-3 font-bold text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">đ/câu</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">AI Agent điền form tự luận</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.pricePerResponse.agent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricePerResponse: { ...settings.pricePerResponse, agent: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full h-10 px-3 font-bold text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">đ/câu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thông tin Ngân hàng VietQR nhận tiền</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên ngân hàng</label>
                <input
                  type="text"
                  value={settings.bankInfo.bankName}
                  onChange={(e) =>
                    setSettings({ ...settings, bankInfo: { ...settings.bankInfo, bankName: e.target.value } })
                  }
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã ngân hàng VietQR (BankCode)</label>
                <input
                  type="text"
                  value={settings.bankInfo.bankCode}
                  onChange={(e) =>
                    setSettings({ ...settings, bankInfo: { ...settings.bankInfo, bankCode: e.target.value } })
                  }
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số tài khoản</label>
                <input
                  type="text"
                  value={settings.bankInfo.accountNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, bankInfo: { ...settings.bankInfo, accountNumber: e.target.value } })
                  }
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chủ tài khoản (In hoa)</label>
                <input
                  type="text"
                  value={settings.bankInfo.accountName}
                  onChange={(e) =>
                    setSettings({ ...settings, bankInfo: { ...settings.bankInfo, accountName: e.target.value } })
                  }
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Admin Email Whitelist */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span>Danh sách Email Quản trị viên (Admin Whitelist)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tài khoản đăng ký bằng các Email này sẽ được tự động kích hoạt vai trò <strong className="text-purple-700">Quản trị viên</strong> và sở hữu <strong className="text-emerald-600">Credits không giới hạn (∞ Vô hạn)</strong>.
                </p>
              </div>

              {/* Quick purge demo emails if present */}
              {(settings.adminEmails || []).some((e: string) =>
                ['admin@autosurvey.vn', 'levanthien21@gmail.com', 'thienlv.bbh@gmail.com'].includes(e.toLowerCase())
              ) && (
                <button
                  type="button"
                  onClick={handlePurgeDemoEmails}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa các email demo mẫu</span>
                </button>
              )}
            </div>

            {/* Existing Admin Emails Badge List with individual Delete buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Các Email Quản trị viên hiện hành ({settings.adminEmails?.length || 0}):
              </label>

              {(!settings.adminEmails || settings.adminEmails.length === 0) ? (
                <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
                  Chưa có email quản trị viên nào. Vui lòng thêm ít nhất 1 email để bảo vệ quyền truy cập.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {settings.adminEmails.map((em: string) => {
                    const isPrimary = em.toLowerCase() === 'levanthien21052004@gmail.com';
                    return (
                      <div
                        key={em}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-purple-50 to-indigo-50/70 text-purple-900 border border-purple-200 shadow-2xs group hover:border-purple-300 transition-all"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{em}</span>
                        {isPrimary && (
                          <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-sans font-extrabold uppercase">
                            Chủ sở hữu
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAdminEmail(em)}
                          title={`Xóa ${em} khỏi danh sách Admin`}
                          className="w-5 h-5 rounded-lg bg-white/80 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition-all ml-1 shadow-2xs border border-purple-200 hover:border-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input to Add New Admin Email */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Thêm Email Quản trị viên mới:
              </label>
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => {
                    setNewAdminEmail(e.target.value);
                    if (adminEmailError) setAdminEmailError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAdminEmail();
                    }
                  }}
                  placeholder="nhập email mới (ví dụ: partner@gmail.com)..."
                  className="flex-1 h-10 px-3.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={handleAddAdminEmail}
                  className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Email Admin</span>
                </button>
              </div>

              {adminEmailError && (
                <div className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{adminEmailError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Explicit Error / Success Notification directly adjacent to the Save button */}
          {saveFeedback && (
            <div
              className={`p-5 rounded-2xl text-xs font-medium border animate-fadeIn transition-all ${
                saveFeedback.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {saveFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-sm tracking-tight">{saveFeedback.message}</div>
                  {saveFeedback.details && saveFeedback.details.length > 0 && (
                    <ul className="space-y-1 mt-1 pl-1 list-none font-sans text-xs">
                      {saveFeedback.details.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${saveFeedback.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="h-11 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu tất cả thay đổi...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu tất cả thay đổi</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400">
              * Mọi thay đổi về đơn giá và thông tin tài khoản ngân hàng sẽ có hiệu lực ngay lập tức sau khi lưu.
            </span>
          </div>
        </form>
      )}

      {/* Credit Adjustment Modal */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Điều chỉnh Credits</h3>
              <button
                onClick={() => setAdjustModalUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Người dùng: <strong className="text-slate-900">{adjustModalUser.username}</strong>
              <div className="text-slate-400 mt-0.5">
                Số dư hiện tại: {adjustModalUser.credits.toLocaleString()} Credits
              </div>
            </div>

            <form onSubmit={handleCreditAdjustment} className="space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    adjustType === 'add' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cộng thêm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    adjustType === 'deduct' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Khấu trừ</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng Credits</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú (Memo)</label>
                <input
                  type="text"
                  placeholder="ví dụ: Hỗ trợ sinh viên NCKH, Hoàn tiền..."
                  value={adjustMemo}
                  onChange={(e) => setAdjustMemo(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Xác nhận thực hiện
              </button>
            </form>
          </div>
        </div>
      )}
      {/* TRAFFIC DETAILS MODAL (POPUP CHI TIẾT CON MẮT & LƯU LƯỢNG) */}
      {showTrafficModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-[#0a1435] to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-cyan-300 border border-indigo-400/30 flex items-center justify-center shadow-xs">
                  <Eye className="w-5 h-5 text-cyan-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base tracking-tight text-white">
                      Báo Cáo Chi Tiết Lưu Lượng (Con Mắt)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hôm nay: <strong className="text-white">{(visitorStats?.todayUnique || 0).toLocaleString()}</strong> khách duy nhất • <strong className="text-white">{(visitorStats?.todayViews || 0).toLocaleString()}</strong> lượt xem trang
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTrafficModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* 4 Summary Stat Mini-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                  <span className="text-[11px] text-indigo-600 font-semibold block">Khách hôm nay</span>
                  <strong className="text-xl font-black text-indigo-950 font-mono mt-0.5 block">
                    {(visitorStats?.todayUnique || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <span className="text-[11px] text-blue-600 font-semibold block">Lượt xem hôm nay</span>
                  <strong className="text-xl font-black text-blue-950 font-mono mt-0.5 block">
                    {(visitorStats?.todayViews || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <span className="text-[11px] text-emerald-600 font-semibold block">Đang online</span>
                  <strong className="text-xl font-black text-emerald-700 font-mono mt-0.5 block flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {(visitorStats?.activeNow || 1).toLocaleString()}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Toàn thời gian</span>
                  <strong className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {(visitorStats?.totalAllTimeViews || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* 24-Hour Graph in Modal */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Biểu đồ lưu lượng 24 tiếng trong ngày
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Múi giờ Việt Nam (UTC+7)</span>
                </div>

                <div className="h-28 flex items-end gap-1.5 pt-3 pb-1 border-b border-slate-200">
                  {(visitorStats?.hourly || Array(24).fill(0)).map((val, h) => {
                    const maxVal = Math.max(1, ...(visitorStats?.hourly || [1]));
                    const heightPercent = Math.max(6, Math.round((val / maxVal) * 100));
                    const isPeak = val === maxVal && val > 0;
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] rounded font-mono pointer-events-none whitespace-nowrap z-10 shadow-xs">
                          {h}h: {val} lượt
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all ${
                            isPeak ? 'bg-indigo-600' : val > 0 ? 'bg-blue-500' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>23:59</span>
                </div>
              </div>

              {/* Top Pages Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Các trang được truy cập nhiều nhất hôm nay
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {(visitorStats?.topPages && visitorStats.topPages.length > 0
                    ? visitorStats.topPages
                    : [
                        { path: '/', count: 24 },
                        { path: '/credit', count: 8 },
                        { path: '/create-form/model', count: 6 },
                        { path: '/orders', count: 4 },
                      ]
                  ).map((p, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-slate-800 font-semibold">{p.path}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {p.count.toLocaleString()} lượt xem
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Visit Stream Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Nhật ký các lượt truy cập gần đây nhất
                  </h4>
                  <span className="text-[10px] text-slate-400">Thời gian thực</span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs max-h-48 overflow-y-auto">
                  {(visitorStats?.recentVisits && visitorStats.recentVisits.length > 0
                    ? visitorStats.recentVisits
                    : [
                        { id: 'v1', visitorId: 'vid_93a***bf2', path: '/', device: 'desktop', time: '17:15:20' },
                        { id: 'v2', visitorId: 'vid_41c***77a', path: '/credit', device: 'mobile', time: '17:12:44' },
                        { id: 'v3', visitorId: 'vid_88e***02b', path: '/create-form/model', device: 'desktop', time: '17:08:11' },
                      ]
                  ).map((v) => (
                    <div key={v.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-600">{v.visitorId}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                          {v.device === 'mobile' ? '📱 Mobile' : '💻 PC'}
                        </span>
                        <span className="font-mono text-slate-800 text-[11px] truncate max-w-[180px]">{v.path}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{v.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                AutoSurvey PRO Analytics Engine • Giám sát 24/7
              </span>
              <button
                type="button"
                onClick={() => setShowTrafficModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng bảng báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
