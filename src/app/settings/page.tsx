'use client';

import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, CheckCircle2, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, openAuthModal } = useAuth();
  const [delayMin, setDelayMin] = useState(1.0);
  const [delayMax, setDelayMax] = useState(2.5);
  const [autoStart, setAutoStart] = useState(true);
  const [userAgentRotation, setUserAgentRotation] = useState(true);
  const [proxyUrl, setProxyUrl] = useState('');
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setPwLoading(true);
    setPwMessage(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMessage({ type: 'success', text: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwMessage({ type: 'error', text: data.error || 'Đổi mật khẩu thất bại' });
      }
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Hệ thống</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cài đặt & Tối ưu hóa</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình tài khoản, mật khẩu, tốc độ gửi, chống chặn bot Google và thiết lập mặc định cho đơn hàng.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công cấu hình hệ thống!</span>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Thông tin tài khoản</h3>
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Tên đăng nhập</label>
              <input
                type="text"
                readOnly
                value={user.username}
                className="w-full h-10 px-3 font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Email liên kết</label>
              <input
                type="email"
                readOnly
                value={user.email}
                className="w-full h-10 px-3 font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Vai trò hệ thống</label>
              <input
                type="text"
                readOnly
                value={user.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thành viên tiêu chuẩn'}
                className="w-full h-10 px-3 font-semibold rounded-xl border border-slate-200 bg-slate-50 text-purple-700 cursor-not-allowed uppercase font-bold"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Số dư khả dụng</label>
              <input
                type="text"
                readOnly
                value={user.role === 'admin' ? '∞ Vô hạn (Đặc quyền Quản trị viên)' : `${user.credits.toLocaleString()} Credits`}
                className="w-full h-10 px-3 font-bold font-mono rounded-xl border border-slate-200 bg-slate-50 text-blue-700 cursor-not-allowed"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center justify-between">
            <span>Bạn đang duyệt web ở chế độ khách chưa đăng ký (0 Credits).</span>
            <button
              onClick={() => openAuthModal('login')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      {user && (
        <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Đổi mật khẩu bảo mật</h3>
          </div>

          {pwMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                pwMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {pwMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{pwMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-colors"
          >
            {pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      )}

      {/* Submitter Optimization Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-900">Cấu hình Submitter & Chống chặn Google Bot</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giãn cách gửi tối thiểu mặc định (giây)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={delayMin}
              onChange={(e) => setDelayMin(Number(e.target.value) || 1)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giãn cách gửi tối đa mặc định (giây)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              value={delayMax}
              onChange={(e) => setDelayMax(Number(e.target.value) || 2.5)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900">Xoay vòng User-Agent trình duyệt ngẫu nhiên</div>
              <div className="text-[11px] text-slate-500">Giả lập các phiên bản Chrome, Firefox, Safari khác nhau cho mỗi lượt gửi</div>
            </div>
            <input
              type="checkbox"
              checked={userAgentRotation}
              onChange={(e) => setUserAgentRotation(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900">Tự động khởi chạy tiến trình khi tạo đơn</div>
              <div className="text-[11px] text-slate-500">Bắt đầu điền form ngay lập tức sau khi nhấn tạo đơn</div>
            </div>
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </div>

        {/* Proxy setting */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Máy chủ Proxy tùy chọn (HTTP / SOCKS5)
          </label>
          <input
            type="text"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="http://user:pass@ip:port (để trống nếu dùng IP máy chủ trực tiếp)"
            className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Dùng khi cần đổi IP địa lý liên tục cho khảo sát quy mô lớn (&gt; 5000 mẫu).
          </span>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  );
}
