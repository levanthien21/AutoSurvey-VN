'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Coins,
  Gift,
  Shield,
  Crown,
  Ban,
  CheckCircle2,
  KeyRound,
  FileText,
  ExternalLink,
  Terminal,
  Zap,
  Loader2,
  History,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import {
  AdminUserItem,
  AdminOrderItem,
  AdminTransactionItem,
  AdminLoginEvent,
} from './types';

// 1. Credit Adjust Modal
export function CreditAdjustModal({
  targetUser,
  onClose,
  onSubmit,
  processing,
}: {
  targetUser: AdminUserItem | null;
  onClose: () => void;
  onSubmit: (userId: string, delta: number, memo: string) => Promise<void>;
  processing: boolean;
}) {
  const [deltaStr, setDeltaStr] = useState('20000');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (targetUser) {
      setDeltaStr('20000');
      setMemo('');
    }
  }, [targetUser]);

  if (!targetUser) return null;

  const presets = [5000, 10000, 20000, 50000, 100000, 500000, -10000, -50000];

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(deltaStr);
    if (!num || isNaN(num)) return;
    await onSubmit(targetUser.id, num, memo);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Điều chỉnh Số dư Credits</h3>
              <p className="text-xs text-slate-500">
                Tài khoản: <strong className="text-slate-800">{targetUser.username}</strong> (
                {targetUser.role === 'admin' ? '∞' : targetUser.credits.toLocaleString()} Credits)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleForm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Chọn nhanh mức cộng / trừ
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDeltaStr(String(val))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    Number(deltaStr) === val
                      ? val > 0
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-rose-600 text-white border-rose-600'
                      : val > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số Credits thay đổi (Số dương = Cộng, Số âm = Trừ)
            </label>
            <input
              type="number"
              value={deltaStr}
              onChange={(e) => setDeltaStr(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung / Lý do ghi sổ giao dịch
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="VD: Thưởng nạp VIP / Hỗ trợ bù đơn khảo sát..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={processing || !Number(deltaStr)}
              className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                Number(deltaStr) >= 0
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {Number(deltaStr) >= 0 ? 'Xác nhận Cộng Credits' : 'Xác nhận Trừ Credits'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Create User Modal
export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  processing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    status: 'active' | 'vip';
    initialCredits: number;
    note: string;
  }) => Promise<void>;
  processing: boolean;
}) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [status, setStatus] = useState<'active' | 'vip'>('active');
  const [initialCredits, setInitialCredits] = useState(5000);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ username, email, password, role, status, initialCredits, note });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Tạo Tài khoản Khách hàng Mới</h3>
              <p className="text-xs text-slate-500">Khởi tạo nhanh tài khoản & cấp sẵn số dư Credits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleForm} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="khachhang01"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="khachhang@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu đăng nhập * (≥ 6 ký tự)
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu cấp cho khách"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số dư Credits ban đầu</label>
              <input
                type="number"
                min={0}
                value={initialCredits}
                onChange={(e) => setInitialCredits(Number(e.target.value))}
                disabled={role === 'admin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="user">Khách hàng (User)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hạng tài khoản</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'vip')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Tiêu chuẩn (Active)</option>
                <option value="vip">Khách hàng VIP ⭐</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú CRM nội bộ (Chỉ Admin thấy)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách đối tác đại học Kinh Tế - gói 500 mẫu..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Tạo Tài khoản Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Bulk Credit Gift Modal
export function BulkGiftModal({
  isOpen,
  onClose,
  onSubmit,
  processing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { target: 'all' | 'vip' | 'active7d'; credits: number; memo: string }) => Promise<void>;
  processing: boolean;
}) {
  const [target, setTarget] = useState<'all' | 'vip' | 'active7d'>('all');
  const [credits, setCredits] = useState(5000);
  const [memo, setMemo] = useState('Quà tặng sự kiện tri ân khách hàng AutoSurvey VN');

  if (!isOpen) return null;

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ target, credits, memo });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Tặng Credits Hàng Loạt</h3>
              <p className="text-xs text-slate-500">Phát thưởng tự động cho tập khách hàng mục tiêu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleForm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm khách hàng nhận thưởng</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as 'all' | 'vip' | 'active7d')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="all">Toàn bộ khách hàng đang hoạt động (Trừ Admin & Banned)</option>
              <option value="vip">Chỉ Khách hàng hạng VIP ⭐</option>
              <option value="active7d">Khách hàng có đăng nhập trong 7 ngày qua</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số Credits tặng mỗi tài khoản</label>
            <input
              type="number"
              min={100}
              step={100}
              required
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Thông điệp hiển thị trong lịch sử ví</label>
            <input
              type="text"
              required
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Phát Thưởng Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. Customer 360 Profile Modal
export function Customer360Modal({
  customer,
  orders,
  transactions,
  loginHistory,
  onClose,
  onUpdateUser,
  onOpenCreditModal,
  processing,
}: {
  customer: AdminUserItem | null;
  orders: AdminOrderItem[];
  transactions: AdminTransactionItem[];
  loginHistory: AdminLoginEvent[];
  onClose: () => void;
  onUpdateUser: (patch: {
    userId: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'vip' | 'banned';
    note?: string;
    newPassword?: string;
  }) => Promise<void>;
  onOpenCreditModal: (u: AdminUserItem) => void;
  processing: boolean;
}) {
  const [subTab, setSubTab] = useState<'crm' | 'orders' | 'logins' | 'tx'>('crm');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [status, setStatus] = useState<'active' | 'vip' | 'banned'>('active');
  const [note, setNote] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (customer) {
      setRole(customer.role);
      setStatus(customer.status || 'active');
      setNote(customer.note || '');
      setNewPassword('');
      setSubTab('crm');
    }
  }, [customer]);

  if (!customer) return null;

  const userOrders = orders.filter(
    (o) =>
      o.userId === customer.id ||
      (o.userEmail && o.userEmail.toLowerCase() === customer.email.toLowerCase())
  );
  const userTx = transactions.filter((t) => t.userId === customer.id);
  const userLogins = loginHistory.filter(
    (l) => l.userId === customer.id || l.email.toLowerCase() === customer.email.toLowerCase()
  );

  const handleSaveCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateUser({
      userId: customer.id,
      role,
      status,
      note,
      newPassword: newPassword.trim() || undefined,
    });
    setNewPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-black text-lg shrink-0">
              {customer.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold truncate">{customer.username}</h3>
                {customer.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 border border-purple-400/50 text-purple-100">
                    ADMIN
                  </span>
                )}
                {customer.status === 'vip' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/30 border border-amber-300/60 text-amber-200">
                    ⭐ VIP
                  </span>
                )}
                {customer.status === 'banned' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/40 border border-rose-400 text-rose-100">
                    ĐÃ KHOÁ
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
                  {customer.authProvider === 'google' || customer.authProvider === 'firebase'
                    ? 'Google OAuth'
                    : 'Email / Password'}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">{customer.email}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300 mt-1.5">
                <span>ID: {customer.id}</span>
                <span>Đăng ký: {new Date(customer.createdAt).toLocaleDateString('vi-VN')}</span>
                <span>Đăng nhập: {customer.loginCount} lần</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50/80 divide-x divide-y sm:divide-y-0 divide-slate-200 shrink-0">
          <div className="p-3 text-center">
            <div className="text-[11px] text-slate-500 font-semibold">Số dư hiện tại</div>
            <div className="text-sm font-black text-blue-700 font-mono mt-0.5">
              {customer.role === 'admin' ? '∞ Vô hạn' : `${customer.credits.toLocaleString()} Cr`}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[11px] text-slate-500 font-semibold">Tổng tiền đã nạp</div>
            <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
              {customer.totalDeposited.toLocaleString()}đ
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-[11px] text-slate-500 font-semibold">Chiến dịch đã tạo</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {userOrders.length} đơn ({customer.submittedCount} mẫu)
            </div>
          </div>
          <div className="p-3 text-center flex items-center justify-center">
            <button
              type="button"
              onClick={() => onOpenCreditModal(customer)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" /> Cộng / Trừ Ví
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex border-b border-slate-200 px-4 bg-white gap-1 overflow-x-auto shrink-0">
          {[
            { id: 'crm', label: 'Quản trị & Bảo mật', icon: Shield },
            { id: 'orders', label: `Đơn hàng (${userOrders.length})`, icon: ShoppingBag },
            { id: 'logins', label: `Lịch sử Đăng nhập (${userLogins.length})`, icon: History },
            { id: 'tx', label: `Giao dịch Ví (${userTx.length})`, icon: Receipt },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id as any)}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  subTab === t.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {subTab === 'crm' && (
            <form onSubmit={handleSaveCrm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700">Thông tin Thiết bị & Truy cập gần nhất</div>
                  <div className="text-slate-600">
                    Hoạt động cuối:{' '}
                    <strong className="text-slate-900">
                      {customer.lastActiveAt
                        ? new Date(customer.lastActiveAt).toLocaleString('vi-VN')
                        : 'Chưa ghi nhận'}
                    </strong>
                  </div>
                  <div className="text-slate-600">
                    Thiết bị: <strong className="text-slate-900">{customer.lastLoginDevice || '—'}</strong>
                  </div>
                  <div className="text-slate-600">
                    Địa chỉ IP: <strong className="font-mono text-slate-900">{customer.lastLoginIp || '—'}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700">Affiliate & Giới thiệu</div>
                  <div className="text-slate-600">
                    Mã giới thiệu:{' '}
                    <strong className="font-mono text-blue-700">
                      {customer.referralCode || customer.username.toUpperCase()}
                    </strong>
                  </div>
                  <div className="text-slate-600">
                    Số người đã mời: <strong className="text-slate-900">{customer.referralCount} khách</strong>
                  </div>
                  <div className="text-slate-600">
                    Hoa hồng nhận được:{' '}
                    <strong className="text-emerald-700 font-mono">
                      {customer.affiliateEarnings.toLocaleString()} Credits
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền hệ thống</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="user">Khách hàng (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái & Phân hạng khách hàng
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'vip' | 'banned')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">✅ Đang hoạt động (Active)</option>
                    <option value="vip">⭐ Khách hàng VIP (Ưu tiên)</option>
                    <option value="banned">🚫 Khoá tài khoản (Chặn đăng nhập)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Ghi chú CRM nội bộ (Lưu thông tin chăm sóc riêng cho khách hàng này)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú số Zalo, nhu cầu khảo sát, lịch sử hỗ trợ của khách..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Cấp lại mật khẩu trực tiếp (Để trống nếu không muốn đổi mật khẩu của khách)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự) để đặt lại ngay..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu Hồ sơ Khách hàng
                </button>
              </div>
            </form>
          )}

          {subTab === 'orders' && (
            <div className="space-y-2.5">
              {userOrders.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400">
                  Khách hàng này chưa khởi tạo chiến dịch khảo sát nào.
                </p>
              ) : (
                userOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700">#{o.id}</span>
                        <span className="text-xs font-bold text-slate-900 truncate">{o.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>Chế độ: {o.mode.toUpperCase()}</span>
                        <span>
                          Tiến độ: <strong>{o.completedCount}/{o.totalTarget}</strong> (OK: {o.successCount}, Lỗi:{' '}
                          {o.errorCount})
                        </span>
                        <span>{new Date(o.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          o.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : o.status === 'running' || o.status === 'pending'
                            ? 'bg-blue-100 text-blue-700'
                            : o.status === 'paused'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {o.status}
                      </span>
                      <a
                        href={o.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600"
                        title="Mở link form gốc"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'logins' && (
            <div className="space-y-2">
              {userLogins.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400">
                  Chưa có bản ghi chi tiết lịch sử đăng nhập cho tài khoản này.
                </p>
              ) : (
                userLogins.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {l.action === 'register'
                          ? '🎉 Đăng ký tài khoản'
                          : l.action === 'login_google' || l.action === 'login_firebase'
                          ? '🌐 Đăng nhập Google'
                          : '🔑 Đăng nhập Mật khẩu'}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {l.device} • IP: <span className="font-mono">{l.ip}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {new Date(l.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'tx' && (
            <div className="space-y-2">
              {userTx.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400">Chưa có giao dịch ví nào.</p>
              ) : (
                userTx.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{t.memo}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        #{t.id} • {new Date(t.createdAt).toLocaleString('vi-VN')} • {t.status}
                      </div>
                    </div>
                    <span
                      className={`font-mono font-extrabold shrink-0 ${
                        t.type === 'order_charge' || t.credits < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {t.type === 'order_charge' || t.credits < 0 ? '-' : '+'}
                      {Math.abs(t.credits).toLocaleString()} Cr
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 5. Order Logs Modal
export function OrderLogsModal({
  order,
  onClose,
  onForceStep,
  processing,
}: {
  order: AdminOrderItem | null;
  onClose: () => void;
  onForceStep: (orderId: string) => Promise<void>;
  processing: boolean;
}) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-slate-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-xs text-emerald-400 font-bold">#{order.id}</span>
              <h3 className="text-sm font-extrabold text-white truncate">{order.title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Khách hàng: <strong className="text-slate-200">{order.username || order.userEmail || 'Khách'}</strong> •
              Tiến độ: <strong className="text-emerald-400">{order.completedCount}/{order.totalTarget}</strong> (Thành
              công: {order.successCount} | Lỗi: {order.errorCount})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 flex-1 overflow-y-auto space-y-1.5 font-mono text-xs">
          {!order.logs || order.logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Chưa có dòng nhật ký phản hồi nào được ghi nhận cho đơn hàng này.
            </div>
          ) : (
            order.logs.map((lg, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border ${
                  lg.status === 'success'
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <span className="text-slate-400 mr-2">[{lg.timestamp}]</span>
                <span className="font-bold mr-2">
                  {lg.status === 'success' ? `[OK #${lg.index}]` : `[ERR #${lg.index}]`}
                </span>
                <span>{lg.message}</span>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <a
            href={order.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            Mở Form gốc <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="flex items-center gap-2">
            {order.completedCount < order.totalTarget && (
              <button
                type="button"
                disabled={processing}
                onClick={() => onForceStep(order.id)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Bơm tức thì +1 lượt
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
