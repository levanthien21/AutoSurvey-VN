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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminMetrics {
  totalUsers: number;
  totalRevenue: number;
  totalCreditsInCirculation: number;
  totalOrders: number;
  totalSubmitted: number;
  pendingDepositsCount: number;
}

export default function AdminPage() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'users' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user?.role]);

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

  // Handle settings update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Đã lưu thành công bảng giá và thông tin ngân hàng!');
      } else {
        showToast('error', data.error || 'Lỗi lưu cấu hình');
      }
    } catch (err: any) {
      showToast('error', err.message);
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
          onClick={loadAdminData}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới dữ liệu</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <td className="py-3 px-3 font-bold font-mono text-blue-700">
                      {u.credits.toLocaleString()} Credits
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
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh sách Email Quản trị viên (Admin Whitelist)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các tài khoản đăng ký với Email trong danh sách này sẽ tự động được cấp quyền Admin và 1.000.000 Credits.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Danh sách Email Admin (cách nhau bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={(settings.adminEmails || []).join(', ')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    adminEmails: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="admin@autosurvey.vn, levanthien21@gmail.com"
                className="w-full h-11 px-4 text-xs font-mono font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(settings.adminEmails || []).map((em: string) => (
                  <span
                    key={em}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    {em}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="h-11 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thay đổi</span>
          </button>
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
    </div>
  );
}
