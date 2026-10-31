'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  TrendingUp,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Search,
  Building2,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  Globe,
  Crown,
  Ban,
  Unlock,
  Trash2,
  UserPlus,
  Gift,
  Download,
  Play,
  Pause,
  Terminal,
  Megaphone,
  Ticket,
  LogIn,
  ClipboardList,
  ExternalLink,
  Sparkles,
  Lock,
  Filter,
  QrCode,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  AdminUserItem,
  AdminOrderItem,
  AdminTransactionItem,
  AdminLoginEvent,
  AdminAuditLogItem,
  AdminCouponItem,
  Trend7dItem,
} from '@/components/admin/types';
import {
  CreditAdjustModal,
  CreateUserModal,
  BulkGiftModal,
  Customer360Modal,
  OrderLogsModal,
} from '@/components/admin/AdminModals';

type AdminTab =
  | 'overview'
  | 'users'
  | 'logins'
  | 'orders'
  | 'finance'
  | 'marketing'
  | 'settings';

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('autosurvey_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
  }
  return headers;
}

async function adminFetch(url: string, init?: RequestInit) {
  const mergedHeaders = getAuthHeaders(
    (init?.headers as Record<string, string>) ||
      (init?.body ? { 'Content-Type': 'application/json' } : undefined)
  );
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers: mergedHeaders,
  });
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
      '\n'
    );
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatTimeAgo(iso?: string): string {
  if (!iso) return 'Chưa đăng nhập';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 30 * 86400) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function SupremeAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Core Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [trend7d, setTrend7d] = useState<Trend7dItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<AdminTransactionItem[]>([]);
  const [coupons, setCoupons] = useState<AdminCouponItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [visitorStats, setVisitorStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Toast Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  );
  const [processing, setProcessing] = useState(false);

  // Overview Chart Mode
  const [trendMode, setTrendMode] = useState<'auth' | 'traffic' | 'orders' | 'revenue'>('auth');

  // CRM Filters & Modals
  const [userSearch, setUserSearch] = useState('');
  const [userSegment, setUserSegment] = useState<string>('all');
  const [userSort, setUserSort] = useState<string>('newest');
  const [creditTargetUser, setCreditTargetUser] = useState<AdminUserItem | null>(null);
  const [profile360User, setProfile360User] = useState<AdminUserItem | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isBulkGiftOpen, setIsBulkGiftOpen] = useState(false);

  // Login Monitor Filters
  const [loginSearch, setLoginSearch] = useState('');
  const [loginActionFilter, setLoginActionFilter] = useState<string>('all');
  const [simulatingVisit, setSimulatingVisit] = useState(false);

  // Orders Command Filters & Modals
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderLogs, setSelectedOrderLogs] = useState<AdminOrderItem | null>(null);

  // Finance Filters
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');

  // Marketing / Coupons Form
  const [couponCode, setCouponCode] = useState('');
  const [couponBonus, setCouponBonus] = useState(10000);
  const [couponMaxUses, setCouponMaxUses] = useState(100);
  const [couponExpires, setCouponExpires] = useState('2027-12-31');

  // Admin Whitelist Input
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const notify = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
  };

  const fetchOverview = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await adminFetch('/api/admin/overview');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setTrend7d(data.trend7d || []);
        setUsers(data.users || []);
        setOrders(data.orders || []);
        setTransactions(data.transactions || []);
        setPendingDeposits(data.pendingDeposits || []);
        setCoupons(data.coupons || []);
        setLoginHistory(data.loginHistory || []);
        setAuditLogs(data.auditLogs || []);
        setVisitorStats(data.visitorStats || null);
        setSettings((prev: any) => prev || data.settings);
        setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (err) {
      console.error('Fetch admin overview error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const reloadSettingsToo = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/overview');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setTrend7d(data.trend7d || []);
        setUsers(data.users || []);
        setOrders(data.orders || []);
        setTransactions(data.transactions || []);
        setPendingDeposits(data.pendingDeposits || []);
        setCoupons(data.coupons || []);
        setLoginHistory(data.loginHistory || []);
        setAuditLogs(data.auditLogs || []);
        setVisitorStats(data.visitorStats || null);
        setSettings(data.settings);
        setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      reloadSettingsToo().finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, reloadSettingsToo]);

  // Live 15s Auto-refresh
  useEffect(() => {
    if (!autoRefresh || user?.role !== 'admin') return;
    const timer = setInterval(() => {
      fetchOverview(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, user, fetchOverview]);

  // Keep 360 profile synced after reload
  useEffect(() => {
    if (profile360User) {
      const refreshed = users.find((u) => u.id === profile360User.id);
      if (refreshed) setProfile360User(refreshed);
    }
  }, [users, profile360User]);

  // --- Filtered & Sorted Users ---
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const todayDateStr = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const sevenDaysAgo = Date.now() - 7 * 86400000;

    return users
      .filter((u) => {
        if (q) {
          const hay = `${u.username} ${u.email} ${u.id} ${u.lastLoginIp || ''} ${u.note || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (userSegment === 'customers') return u.role !== 'admin';
        if (userSegment === 'vip') return u.status === 'vip';
        if (userSegment === 'admin') return u.role === 'admin';
        if (userSegment === 'banned') return u.status === 'banned';
        if (userSegment === 'google')
          return u.authProvider === 'google' || u.authProvider === 'firebase';
        if (userSegment === 'logged_today') {
          if (!u.lastActiveAt) return false;
          const dStr = new Date(u.lastActiveAt).toLocaleDateString('en-CA', {
            timeZone: 'Asia/Ho_Chi_Minh',
          });
          return dStr === todayDateStr;
        }
        if (userSegment === 'active_7d') {
          return u.lastActiveAt ? new Date(u.lastActiveAt).getTime() >= sevenDaysAgo : false;
        }
        if (userSegment === 'has_running_orders') return u.runningOrdersCount > 0;
        if (userSegment === 'deposited') return u.totalDeposited > 0;
        return true;
      })
      .sort((a, b) => {
        if (userSort === 'last_login') {
          const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          return tb - ta;
        }
        if (userSort === 'most_logins') return (b.loginCount || 0) - (a.loginCount || 0);
        if (userSort === 'most_credits') {
          const ca = a.role === 'admin' ? -1 : a.credits;
          const cb = b.role === 'admin' ? -1 : b.credits;
          return cb - ca;
        }
        if (userSort === 'most_Orders') return b.ordersCount - a.ordersCount;
        if (userSort === 'most_deposited') return b.totalDeposited - a.totalDeposited;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [users, userSearch, userSegment, userSort]);

  // --- Filtered Login History ---
  const filteredLogins = useMemo(() => {
    const q = loginSearch.trim().toLowerCase();
    return loginHistory.filter((l) => {
      if (loginActionFilter !== 'all') {
        if (loginActionFilter === 'google') {
          if (l.action !== 'login_google' && l.action !== 'login_firebase') return false;
        } else if (l.action !== loginActionFilter) {
          return false;
        }
      }
      if (q) {
        const hay = `${l.username} ${l.email} ${l.ip} ${l.device}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [loginHistory, loginSearch, loginActionFilter]);

  // --- Filtered Orders ---
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'running') {
          if (o.status !== 'running' && o.status !== 'pending') return false;
        } else if (o.status !== orderStatusFilter) {
          return false;
        }
      }
      if (q) {
        const hay = `${o.id} ${o.title} ${o.username || ''} ${o.userEmail || ''} ${o.formUrl}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // --- Filtered Transactions ---
  const filteredTransactions = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return transactions.filter((t) => {
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
      if (q) {
        const hay = `${t.id} ${t.username} ${t.memo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, txSearch, txTypeFilter]);

  // --- Handlers ---
  const handleDepositDecision = async (txId: string, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') {
      const input = window.prompt('Nhập lý do từ chối lệnh nạp (tuỳ chọn):', 'Chưa nhận được chuyển khoản');
      if (input === null) return;
      reason = input;
    }
    setProcessing(true);
    try {
      const res = await adminFetch('/api/credit/deposit/approve', {
        method: 'POST',
        body: JSON.stringify({ txId, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Thao tác thất bại');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjustCredits = async (userId: string, deltaCredits: number, memo: string) => {
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'adjust_credits', userId, deltaCredits, memo }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        setCreditTargetUser(null);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Lỗi điều chỉnh Credits');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateUser = async (payload: {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    status: 'active' | 'vip';
    initialCredits: number;
    note: string;
  }) => {
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_user', ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        setIsCreateUserOpen(false);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Không thể tạo tài khoản');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateUser = async (patch: {
    userId: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'vip' | 'banned';
    note?: string;
    newPassword?: string;
  }) => {
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_user', ...patch }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Cập nhật thất bại');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (u: AdminUserItem) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XOÁ VĨNH VIỄN tài khoản "${u.username}" (${u.email}) không?`
      )
    ) {
      return;
    }
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_user', userId: u.id }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Không thể xoá tài khoản');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkGift = async (payload: {
    target: 'all' | 'vip' | 'active7d';
    credits: number;
    memo: string;
  }) => {
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'bulk_gift', ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        setIsBulkGiftOpen(false);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Lỗi tặng Credits hàng loạt');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleOrderAction = async (
    action: 'resume' | 'pause' | 'force_step' | 'cancel' | 'delete' | 'pause_all' | 'resume_all',
    orderId?: string
  ) => {
    if (action === 'cancel' && !window.confirm('Huỷ đơn hàng này và tự động hoàn tiền các lượt chưa chạy cho khách?')) {
      return;
    }
    if (action === 'delete' && !window.confirm('Xoá vĩnh viễn bản ghi đơn hàng này khỏi hệ thống?')) {
      return;
    }
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify({ action, orderId }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        await fetchOverview(true);
        if (selectedOrderLogs && orderId === selectedOrderLogs.id) {
          const logsRes = await adminFetch('/api/admin/orders', {
            method: 'POST',
            body: JSON.stringify({ action: 'get_logs', orderId }),
          });
          const logsData = await logsRes.json();
          if (logsData.success && logsData.order) {
            setSelectedOrderLogs((prev) => (prev ? { ...prev, ...logsData.order } : null));
          }
        }
      } else {
        notify('error', data.error || 'Thao tác đơn hàng thất bại');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleTriggerCronNow = async () => {
    setProcessing(true);
    try {
      const res = await adminFetch('/api/cron/orders');
      const data = await res.json();
      notify(
        'success',
        `Đã kích hoạt Cron 24/7 thành công! Đã xử lý bước chạy cho ${data.steppedCount ?? 0} đơn đến hạn (Đang hoạt động: ${data.activeCount ?? 0} đơn).`
      );
      await fetchOverview(true);
    } catch {
      notify('error', 'Không thể gọi Cron API');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenOrderLogs = async (o: AdminOrderItem) => {
    setSelectedOrderLogs(o);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_logs', orderId: o.id }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrderLogs({ ...o, ...data.order });
      }
    } catch {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          code: couponCode,
          creditBonus: couponBonus,
          maxUses: couponMaxUses,
          expiresAt: couponExpires,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        setCouponCode('');
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Lỗi lưu Coupon');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Xoá mã giảm giá "${code}"?`)) return;
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', code }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', data.message);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Lỗi xoá Coupon');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setProcessing(true);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', 'Đã lưu cấu hình hệ thống thành công!');
        setSettings(data.settings);
        await fetchOverview(true);
      } else {
        notify('error', data.error || 'Lưu cấu hình thất bại');
      }
    } catch {
      notify('error', 'Lỗi kết nối máy chủ');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateVisit = async () => {
    setSimulatingVisit(true);
    try {
      const paths = ['/', '/create-form/agent', '/credit', '/orders', '/data-builder'];
      const p = paths[Math.floor(Math.random() * paths.length)];
      const res = await adminFetch(`/api/analytics/track?simulate=true&path=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (data.success) {
        setVisitorStats(data.stats);
        notify('success', data.message);
      }
    } catch {} finally {
      setSimulatingVisit(false);
    }
  };

  // --- Access Guards ---
  if (authLoading || loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          Đang đồng bộ Trung tâm Quản trị Tối thượng...
        </p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-500">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Khu vực Hạn chế Quyền truy cập</h1>
        <p className="text-slate-600 text-sm mb-6">
          Trang Quản trị Tối thượng chỉ dành riêng cho tài khoản Quản trị viên hệ thống.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Về Trang chủ
          </Link>
          {!user && (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              Đăng nhập Quản trị
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Export Helpers
  const exportUsersCsv = () => {
    downloadCsv(
      `autosurvey_customers_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID',
        'Username',
        'Email',
        'Quyen',
        'TrangThai',
        'PhuongThuc',
        'Credits',
        'SoLanDangNhap',
        'HoatDongCuoi',
        'ThietBi',
        'IP',
        'SoDonHang',
        'SoMauDaDien',
        'TongTienDaNap_VND',
        'GhiChuCRM',
        'NgayDangKy',
      ],
      filteredUsers.map((u) => [
        u.id,
        u.username,
        u.email,
        u.role,
        u.status,
        u.authProvider,
        u.role === 'admin' ? 'Unlimited' : u.credits,
        u.loginCount,
        u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString('vi-VN') : '',
        u.lastLoginDevice || '',
        u.lastLoginIp || '',
        u.ordersCount,
        u.submittedCount,
        u.totalDeposited,
        u.note || '',
        new Date(u.createdAt).toLocaleString('vi-VN'),
      ])
    );
  };

  const exportLoginsCsv = () => {
    downloadCsv(
      `autosurvey_logins_${new Date().toISOString().slice(0, 10)}.csv`,
      ['ThoiGian', 'Username', 'Email', 'SuKien', 'ThietBi', 'DiaChiIP', 'Quyen'],
      filteredLogins.map((l) => [
        new Date(l.timestamp).toLocaleString('vi-VN'),
        l.username,
        l.email,
        l.action,
        l.device,
        l.ip,
        l.role,
      ])
    );
  };

  const exportTransactionsCsv = () => {
    downloadCsv(
      `autosurvey_finance_${new Date().toISOString().slice(0, 10)}.csv`,
      ['MaGD', 'ThoiGian', 'Username', 'LoaiGD', 'SoTien_VND', 'Credits', 'TrangThai', 'NoiDung'],
      filteredTransactions.map((t) => [
        t.id,
        new Date(t.createdAt).toLocaleString('vi-VN'),
        t.username,
        t.type,
        t.amount,
        t.credits,
        t.status,
        t.memo,
      ])
    );
  };

  const navTabs: {
    id: AdminTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Tổng quan & Phễu', icon: TrendingUp },
    {
      id: 'users',
      label: 'Khách hàng & Tài khoản',
      icon: Users,
      badge: metrics?.totalUsers || users.length,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'logins',
      label: 'Giám sát Đăng nhập',
      icon: Activity,
      badge: visitorStats?.activeNow || 1,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'orders',
      label: 'Điều hành Đơn 24/7',
      icon: ClipboardList,
      badge: metrics?.runningOrdersCount || 0,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'finance',
      label: 'Tài chính & VietQR',
      icon: Coins,
      badge: pendingDeposits.length,
      badgeColor:
        pendingDeposits.length > 0
          ? 'bg-rose-500 text-white animate-pulse'
          : 'bg-slate-200 text-slate-600',
    },
    { id: 'marketing', label: 'Coupon & Thông báo', icon: Megaphone },
    { id: 'settings', label: 'Cấu hình & Bảo mật', icon: Settings },
  ];

  // VietQR live preview URL
  const vietQrPreviewUrl =
    settings?.bankInfo?.bankCode && settings?.bankInfo?.accountNumber
      ? `https://img.vietqr.io/image/${encodeURIComponent(
          settings.bankInfo.bankCode
        )}-${encodeURIComponent(
          settings.bankInfo.accountNumber
        )}-compact2.png?amount=50000&addInfo=NAP%20TEST%20ADMIN&accountName=${encodeURIComponent(
          settings.bankInfo.accountName || ''
        )}`
      : '';

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Executive Command Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[11px] font-extrabold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Supreme Admin Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {visitorStats?.activeNow || 1} đang online ({visitorStats?.loggedInOnlineCount || 0}{' '}
                khách đăng nhập • {visitorStats?.guestOnlineCount || 0} khách vãng lai)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Trung tâm Quản trị Tối thượng AutoSurvey VN
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Kiểm soát toàn diện tài khoản đăng ký, lưu lượng khách đăng nhập, điều phối đơn 24/7,
              tài chính VietQR & bảo mật hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              Live 15s: {autoRefresh ? 'BẬT' : 'TẮT'}
            </button>

            <button
              type="button"
              onClick={() => reloadSettingsToo()}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới {lastUpdated ? `(${lastUpdated})` : ''}
            </button>

            <button
              type="button"
              onClick={exportUsersCsv}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Báo cáo KH
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100 shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 7-Module Navigation Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 overflow-x-auto">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : t.badgeColor
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW & CUSTOMER CONVERSION FUNNEL                          */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 1. Registered Accounts */}
            <div
              onClick={() => setActiveTab('users')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  +{metrics?.newUsersToday || 0} hôm nay
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Tổng Tài khoản Đăng ký</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {(metrics?.totalUsers || 0).toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">tài khoản</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Khách: <strong className="text-slate-800">{metrics?.customerUsersCount || 0}</strong>{' '}
                  • VIP: <strong className="text-amber-600">{metrics?.vipUsersCount || 0}</strong>
                </span>
                <span>
                  Google: <strong className="text-indigo-600">{metrics?.googleUsersCount || 0}</strong>
                </span>
              </div>
            </div>

            {/* 2. Customer Logins */}
            <div
              onClick={() => setActiveTab('logins')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <LogIn className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {metrics?.loginsTodayCount || 0} phiên hôm nay
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Khách hàng Đăng nhập Hôm nay</div>
              <div className="text-2xl font-black text-indigo-700 mt-0.5">
                {(metrics?.loggedInTodayUnique || 0).toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">khách đăng nhập</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Hoạt động 7 ngày:{' '}
                  <strong className="text-slate-800">{metrics?.activeUsers7d || 0}</strong>
                </span>
                <span>
                  Tổng đã ĐN:{' '}
                  <strong className="text-slate-800">{metrics?.everLoggedInCount || 0}</strong>
                </span>
              </div>
            </div>

            {/* 3. Live Online Visitors */}
            <div
              onClick={() => setActiveTab('logins')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> LIVE
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Đang Truy cập Trực tuyến</div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">
                {visitorStats?.activeNow || 1}{' '}
                <span className="text-xs font-bold text-slate-400">người trên web</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Đã ĐN: <strong className="text-emerald-700">{visitorStats?.loggedInOnlineCount || 0}</strong>{' '}
                  • Khách: <strong>{visitorStats?.guestOnlineCount || 0}</strong>
                </span>
                <span>
                  Hôm nay: <strong>{visitorStats?.todayUnique || 0}</strong> khách
                </span>
              </div>
            </div>

            {/* 4. Revenue */}
            <div
              onClick={() => setActiveTab('finance')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  +{((metrics?.revenueToday || 0) / 1000).toLocaleString()}K hôm nay
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Tổng Doanh thu Đã duyệt</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {(metrics?.totalRevenue || 0).toLocaleString()}đ
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Tháng này:{' '}
                  <strong className="text-teal-700 font-mono">
                    {(metrics?.revenueThisMonth || 0).toLocaleString()}đ
                  </strong>
                </span>
                <span>
                  KH đã nạp: <strong>{metrics?.depositingUsersCount || 0}</strong>
                </span>
              </div>
            </div>

            {/* 5. Pending Deposits */}
            <div
              onClick={() => setActiveTab('finance')}
              className={`p-5 rounded-3xl border shadow-2xs cursor-pointer transition-all ${
                pendingDeposits.length > 0
                  ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                  : 'bg-white border-slate-200/90 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                {pendingDeposits.length > 0 && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    CẦN DUYỆT NGAY
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-500">Lệnh Nạp VietQR Chờ duyệt</div>
              <div className="text-2xl font-black text-amber-700 mt-0.5">
                {pendingDeposits.length}{' '}
                <span className="text-xs font-bold text-slate-400">giao dịch</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Giá trị chờ:{' '}
                  <strong className="font-mono text-amber-800">
                    {(metrics?.pendingDepositsAmount || 0).toLocaleString()}đ
                  </strong>
                </span>
                <span className="text-blue-600 font-bold">Mở duyệt →</span>
              </div>
            </div>

            {/* 6. Orders 24/7 */}
            <div
              onClick={() => setActiveTab('orders')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  {metrics?.runningOrdersCount || 0} đang chạy 24/7
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Tổng Chiến dịch Đơn hàng</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {(metrics?.totalOrders || 0).toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">đơn</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Hoàn tất: <strong className="text-emerald-600">{metrics?.completedOrdersCount || 0}</strong>
                </span>
                <span>
                  Tạm dừng: <strong className="text-amber-600">{metrics?.pausedOrdersCount || 0}</strong>
                </span>
              </div>
            </div>

            {/* 7. Total Form Submissions */}
            <div
              onClick={() => setActiveTab('orders')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
                  Mục tiêu: {(metrics?.totalTargetResponses || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Tổng Mẫu Khảo sát Đã điền</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {(metrics?.totalSubmitted || 0).toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-400">phản hồi</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Thành công:{' '}
                  <strong className="text-emerald-600">
                    {(metrics?.totalSuccessResponses || 0).toLocaleString()}
                  </strong>
                </span>
                <span>
                  Lỗi:{' '}
                  <strong className="text-rose-600">
                    {(metrics?.totalErrorResponses || 0).toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>

            {/* 8. Customer Credits Liability */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700">
                  Trừ ví Admin ∞
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500">Quỹ Credits Ví Khách hàng</div>
              <div className="text-2xl font-black text-orange-600 font-mono mt-0.5">
                {(metrics?.totalCreditsInCirculation || 0).toLocaleString()}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Đã tiêu dùng:{' '}
                  <strong className="text-slate-800 font-mono">
                    {(metrics?.totalCreditsSpent || 0).toLocaleString()}
                  </strong>
                </span>
                <span>
                  Affiliate: <strong>{(metrics?.totalAffiliateCommissions || 0).toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Customer Conversion Funnel & 7-Day Multi-Series Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Funnel (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                Phễu Chuyển đổi Khách hàng Toàn hệ thống
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Đo lường từ khách ghé thăm website → đăng ký → đăng nhập → tạo đơn & nạp tiền
              </p>

              {(() => {
                const topVisitors = Math.max(
                  visitorStats?.totalAllTimeUnique || 0,
                  metrics?.totalUsers || 1
                );
                const steps = [
                  {
                    label: '1. Khách truy cập Website (Unique)',
                    count: topVisitors,
                    color: 'bg-slate-700',
                  },
                  {
                    label: '2. Tài khoản Đăng ký thành công',
                    count: metrics?.totalUsers || 0,
                    color: 'bg-blue-600',
                  },
                  {
                    label: '3. Khách đã Đăng nhập & Hoạt động',
                    count: metrics?.everLoggedInCount || 0,
                    color: 'bg-indigo-600',
                  },
                  {
                    label: '4. Khách đã Khởi tạo Đơn khảo sát',
                    count: metrics?.usersWithOrdersCount || 0,
                    color: 'bg-purple-600',
                  },
                  {
                    label: '5. Khách đã Nạp tiền VietQR',
                    count: metrics?.depositingUsersCount || 0,
                    color: 'bg-emerald-600',
                  },
                ];

                return (
                  <div className="space-y-3">
                    {steps.map((st, idx) => {
                      const pct =
                        topVisitors > 0
                          ? Math.min(100, Math.round((st.count / topVisitors) * 100))
                          : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">{st.label}</span>
                            <span className="font-mono font-extrabold text-slate-900">
                              {st.count.toLocaleString()}{' '}
                              <span className="text-[10px] font-semibold text-slate-400">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${st.color} transition-all duration-500`}
                              style={{ width: `${Math.max(st.count > 0 ? 6 : 0, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 7-Day Trend Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Biểu đồ Tăng trưởng 7 Ngày Gần nhất (GMT+7)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Theo dõi biến động đăng ký, đăng nhập, lưu lượng web và đơn hàng theo ngày
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
                  {[
                    { id: 'auth', label: 'Đăng ký & ĐN' },
                    { id: 'traffic', label: 'Truy cập' },
                    { id: 'orders', label: 'Đơn hàng' },
                    { id: 'revenue', label: 'Doanh thu' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTrendMode(m.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        trendMode === m.id
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const values = trend7d.map((d) =>
                  trendMode === 'auth'
                    ? Math.max(d.registrations, d.uniqueLogins)
                    : trendMode === 'traffic'
                    ? d.views
                    : trendMode === 'orders'
                    ? d.orders
                    : d.revenue
                );
                const maxVal = Math.max(1, ...values);

                return (
                  <div>
                    <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-slate-100">
                      {trend7d.map((d) => {
                        const primary =
                          trendMode === 'auth'
                            ? d.uniqueLogins
                            : trendMode === 'traffic'
                            ? d.views
                            : trendMode === 'orders'
                            ? d.orders
                            : d.revenue;
                        const secondary =
                          trendMode === 'auth'
                            ? d.registrations
                            : trendMode === 'traffic'
                            ? d.uniqueVisitors
                            : null;

                        const hPrimary = Math.max(primary > 0 ? 10 : 3, Math.round((primary / maxVal) * 135));
                        const hSecondary =
                          secondary !== null
                            ? Math.max(secondary > 0 ? 10 : 3, Math.round((secondary / maxVal) * 135))
                            : 0;

                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <div className="text-[10px] font-mono font-bold text-slate-600">
                              {trendMode === 'revenue'
                                ? primary > 0
                                  ? `${Math.round(primary / 1000)}K`
                                  : '0'
                                : primary}
                            </div>
                            <div className="w-full flex items-end justify-center gap-1 h-[138px]">
                              <div
                                className="w-3 sm:w-4 rounded-t-lg bg-indigo-600 group-hover:bg-indigo-500 transition-all"
                                style={{ height: `${hPrimary}px` }}
                                title={`${d.label}: ${primary.toLocaleString()}`}
                              />
                              {secondary !== null && (
                                <div
                                  className="w-3 sm:w-4 rounded-t-lg bg-emerald-400 group-hover:bg-emerald-500 transition-all"
                                  style={{ height: `${hSecondary}px` }}
                                  title={`${d.label}: ${secondary.toLocaleString()}`}
                                />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{d.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center gap-5 pt-3 text-[11px] font-semibold text-slate-500">
                      {trendMode === 'auth' && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> Khách đăng nhập
                            trong ngày
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" /> Tài khoản đăng
                            ký mới
                          </span>
                        </>
                      )}
                      {trendMode === 'traffic' && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> Tổng lượt xem
                            trang (Pageviews)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" /> Khách truy cập
                            duy nhất
                          </span>
                        </>
                      )}
                      {trendMode === 'orders' && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> Số chiến dịch đơn
                          hàng khởi tạo mỗi ngày
                        </span>
                      )}
                      {trendMode === 'revenue' && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> Doanh thu nạp tiền
                          được duyệt (VNĐ)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Dual Live Feed: Latest Logins & Running Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Latest Customer Logins & Registrations */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Khách hàng Đăng nhập & Đăng ký Gần nhất
                  </h3>
                  <p className="text-xs text-slate-500">
                    Theo dõi ai vừa đăng nhập vào hệ thống và dùng thiết bị gì
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('logins')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Xem tất cả →
                </button>
              </div>

              {loginHistory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Các phiên đăng nhập mới sẽ tự động hiển thị trực tiếp tại đây.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {loginHistory.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 truncate">
                            {ev.username}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              ev.action === 'register'
                                ? 'bg-emerald-100 text-emerald-700'
                                : ev.action === 'login_google' || ev.action === 'login_firebase'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ev.action === 'register'
                              ? 'Đăng ký mới'
                              : ev.action === 'login_google' || ev.action === 'login_firebase'
                              ? 'Google'
                              : 'Mật khẩu'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ev.email} • {ev.device}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                        {formatTimeAgo(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active / Recent Orders */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Đơn hàng Khảo sát Mới nhất Toàn hệ thống
                  </h3>
                  <p className="text-xs text-slate-500">
                    Giám sát nhanh tiến độ các chiến dịch đang thực thi 24/7
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Điều hành đơn →
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Chưa có đơn hàng nào trên hệ thống.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {orders.slice(0, 6).map((o) => {
                    const pct =
                      o.totalTarget > 0
                        ? Math.min(100, Math.round((o.completedCount / o.totalTarget) * 100))
                        : 0;
                    return (
                      <div
                        key={o.id}
                        className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-indigo-600">
                              #{o.id}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{o.title}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
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
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate">
                            KH: <strong className="text-slate-700">{o.username || o.userEmail || 'Khách'}</strong>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {o.completedCount}/{o.totalTarget} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              o.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CUSTOMERS & REGISTERED ACCOUNTS CRM                            */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Summary Strip & CRM Actions */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Quản lý Khách hàng & Tài khoản Đăng ký ({users.length} tài khoản)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khách hàng: <strong>{metrics?.customerUsersCount || 0}</strong> • VIP:{' '}
                  <strong className="text-amber-600">{metrics?.vipUsersCount || 0}</strong> • Đăng
                  ký Google: <strong className="text-blue-600">{metrics?.googleUsersCount || 0}</strong>{' '}
                  • Đăng ký Email: <strong>{metrics?.localUsersCount || 0}</strong> • Đang khoá:{' '}
                  <strong className="text-rose-600">{metrics?.bannedUsersCount || 0}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Tạo Tài khoản Mới
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkGiftOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Gift className="w-3.5 h-3.5" /> Tặng Credits Hàng loạt
                </button>
                <button
                  type="button"
                  onClick={exportUsersCsv}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất Excel/CSV ({filteredUsers.length})
                </button>
              </div>
            </div>

            {/* Search, Segment & Sort */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm kiếm theo Username, Email, ID, Địa chỉ IP hoặc Ghi chú CRM..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <select
                  value={userSegment}
                  onChange={(e) => setUserSegment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Phân nhóm: Tất cả ({users.length})</option>
                  <option value="customers">Khách hàng (Trừ Admin)</option>
                  <option value="logged_today">Đã đăng nhập Hôm nay</option>
                  <option value="active_7d">Hoạt động trong 7 ngày qua</option>
                  <option value="vip">⭐ Khách hàng VIP</option>
                  <option value="has_running_orders">Có đơn đang chạy 24/7</option>
                  <option value="deposited">Đã nạp tiền VietQR</option>
                  <option value="google">Đăng nhập bằng Google</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="banned">🚫 Tài khoản đang bị khoá</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <select
                  value={userSort}
                  onChange={(e) => setUserSort(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="newest">Sắp xếp: Mới đăng ký nhất</option>
                  <option value="last_login">Đăng nhập / Hoạt động gần nhất</option>
                  <option value="most_logins">Số lần đăng nhập nhiều nhất</option>
                  <option value="most_credits">Số dư Credits cao nhất</option>
                  <option value="most_Orders">Tạo nhiều đơn khảo sát nhất</option>
                  <option value="most_deposited">Tổng tiền nạp cao nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* CRM Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tài khoản Khách hàng</th>
                    <th className="py-3.5 px-4">Đăng nhập & Thiết bị</th>
                    <th className="py-3.5 px-4">Đơn hàng & Nạp tiền</th>
                    <th className="py-3.5 px-4 text-right">Số dư Credits</th>
                    <th className="py-3.5 px-4 text-right">Thao tác Quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Không tìm thấy tài khoản nào khớp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Col 1: Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white font-black flex items-center justify-center text-xs shrink-0">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setProfile360User(u)}
                                  className="font-extrabold text-slate-900 hover:text-blue-600 text-left"
                                >
                                  {u.username}
                                </button>
                                {u.role === 'admin' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                                    ADMIN
                                  </span>
                                )}
                                {u.status === 'vip' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                    ⭐ VIP
                                  </span>
                                )}
                                {u.status === 'banned' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                                    KHOÁ
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                  {u.authProvider === 'google' || u.authProvider === 'firebase'
                                    ? 'Google'
                                    : 'Email'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                ĐK: {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                {u.note && (
                                  <span className="ml-2 text-indigo-600 font-semibold">
                                    • 📌 {u.note}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Login Stats */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {u.loginCount} lần đăng nhập
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Gần nhất: <span className="font-semibold">{formatTimeAgo(u.lastActiveAt)}</span>
                          </div>
                          {u.lastLoginDevice && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {u.lastLoginDevice} {u.lastLoginIp ? `• ${u.lastLoginIp}` : ''}
                            </div>
                          )}
                        </td>

                        {/* Col 3: Orders & Deposits */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{u.ordersCount} đơn</span>
                            <span className="text-slate-400">({u.submittedCount} mẫu)</span>
                            {u.runningOrdersCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                                {u.runningOrdersCount} đang chạy
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Đã nạp:{' '}
                            <strong className="text-emerald-700 font-mono">
                              {u.totalDeposited.toLocaleString()}đ
                            </strong>
                          </div>
                        </td>

                        {/* Col 4: Balance */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                          {u.role === 'admin' ? (
                            <span className="text-purple-700">∞ Vô hạn</span>
                          ) : (
                            `${u.credits.toLocaleString()}`
                          )}
                        </td>

                        {/* Col 5: Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setProfile360User(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1"
                              title="Xem Hồ sơ 360°, Đơn hàng, Lịch sử ĐN & Đổi mật khẩu"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" /> Hồ sơ 360°
                            </button>

                            <button
                              type="button"
                              onClick={() => setCreditTargetUser(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-[11px] flex items-center gap-1"
                              title="Cộng / Trừ Credits"
                            >
                              <Coins className="w-3.5 h-3.5" /> Ví
                            </button>

                            {u.role !== 'admin' && (
                              <>
                                <button
                                  type="button"
                                  disabled={processing}
                                  onClick={() =>
                                    handleUpdateUser({
                                      userId: u.id,
                                      status: u.status === 'vip' ? 'active' : 'vip',
                                    })
                                  }
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    u.status === 'vip'
                                      ? 'bg-amber-100 border-amber-300 text-amber-700'
                                      : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600'
                                  }`}
                                  title={u.status === 'vip' ? 'Gỡ hạng VIP' : 'Nâng cấp VIP'}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={processing}
                                  onClick={() =>
                                    handleUpdateUser({
                                      userId: u.id,
                                      status: u.status === 'banned' ? 'active' : 'banned',
                                    })
                                  }
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    u.status === 'banned'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'
                                  }`}
                                  title={
                                    u.status === 'banned' ? 'Mở khoá tài khoản' : 'Khoá tài khoản'
                                  }
                                >
                                  {u.status === 'banned' ? (
                                    <Unlock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={processing}
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                                  title="Xoá tài khoản"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CUSTOMER LOGIN & LIVE VISITOR RADAR                            */}
      {/* ===================================================================== */}
      {activeTab === 'logins' && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800">Đang Online Ngay lúc này</div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {visitorStats?.activeNow || 1}{' '}
                <span className="text-xs font-semibold text-emerald-700">phiên</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                {visitorStats?.loggedInOnlineCount || 0} khách đã đăng nhập •{' '}
                {visitorStats?.guestOnlineCount || 0} khách vãng lai
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Khách Đăng nhập Hôm nay</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">
                {metrics?.loggedInTodayUnique || 0}{' '}
                <span className="text-xs font-semibold text-slate-400">tài khoản</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tổng số lượt ĐN hôm nay: <strong>{metrics?.loginsTodayCount || 0}</strong>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Khách Truy cập Web Hôm nay</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {(visitorStats?.todayUnique || 0).toLocaleString()}{' '}
                <span className="text-xs font-semibold text-slate-400">người</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Lượt xem trang: <strong>{(visitorStats?.todayViews || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500">Tổng Khách Truy cập Lũy kế</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {(visitorStats?.totalAllTimeUnique || 0).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimulateVisit}
                disabled={simulatingVisit}
                className="mt-2 self-start px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> + Test 1 lượt truy cập
              </button>
            </div>
          </div>

          {/* Live Active Sessions Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Radar Phiên Truy cập Trực tuyến (Hoạt động trong 5 phút qua)
                </h3>
                <p className="text-xs text-slate-500">
                  Biết chính xác tài khoản khách hàng nào hoặc khách vãng lai nào đang mở trang nào
                </p>
              </div>
            </div>

            {!visitorStats?.activeSessions || visitorStats.activeSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Hiện chỉ có phiên Quản trị viên đang trực tuyến.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {visitorStats.activeSessions.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                      s.isLoggedIn
                        ? 'bg-indigo-50/50 border-indigo-200'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                            s.isLoggedIn
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {s.isLoggedIn ? 'KH ĐÃ ĐĂNG NHẬP' : 'KHÁCH VÃNG LAI'}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {s.username || s.visitorId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-1">
                        Đang xem: <strong className="font-mono text-blue-700">{s.path}</strong> •{' '}
                        {s.device}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                      {s.secondsAgo <= 5 ? 'Vừa xong' : `${s.secondsAgo}s trước`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Login & Registration Audit Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Nhật ký Khách hàng Đăng nhập & Đăng ký ({filteredLogins.length} sự kiện)
                </h3>
                <p className="text-xs text-slate-500">
                  Lưu vết toàn bộ lượt đăng nhập bằng Google, Mật khẩu và Đăng ký tài khoản mới
                </p>
              </div>
              <button
                type="button"
                onClick={exportLoginsCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <Download className="w-3.5 h-3.5" /> Xuất CSV Đăng nhập
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  placeholder="Tìm theo Username, Email, Thiết bị hoặc Địa chỉ IP..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={loginActionFilter}
                  onChange={(e) => setLoginActionFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                >
                  <option value="all">Tất cả sự kiện ({loginHistory.length})</option>
                  <option value="register">🎉 Đăng ký tài khoản mới</option>
                  <option value="google">🌐 Đăng nhập qua Google</option>
                  <option value="login_password">🔑 Đăng nhập Mật khẩu</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Hình thức</th>
                    <th className="py-3 px-4">Thiết bị / Trình duyệt</th>
                    <th className="py-3 px-4">Địa chỉ IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLogins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        Chưa có bản ghi đăng nhập khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredLogins.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ev.username}</div>
                          <div className="text-[11px] text-slate-500">{ev.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              ev.action === 'register'
                                ? 'bg-emerald-100 text-emerald-700'
                                : ev.action === 'login_google' || ev.action === 'login_firebase'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ev.action === 'register'
                              ? '🎉 Đăng ký mới'
                              : ev.action === 'login_google' || ev.action === 'login_firebase'
                              ? '🌐 Google OAuth'
                              : '🔑 Mật khẩu'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{ev.device}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{ev.ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 24-Hour Traffic & Device Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4">
                Phân bổ Lưu lượng Truy cập 24 Giờ Hôm nay (GMT+7)
              </h3>
              {(() => {
                const hourly: number[] = visitorStats?.hourly || Array(24).fill(0);
                const maxH = Math.max(1, ...hourly);
                return (
                  <div className="h-36 flex items-end gap-1 pt-4">
                    {hourly.map((cnt, hr) => {
                      const hPx = Math.max(cnt > 0 ? 8 : 3, Math.round((cnt / maxH) * 110));
                      return (
                        <div key={hr} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full rounded-t ${
                              cnt > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-100'
                            }`}
                            style={{ height: `${hPx}px` }}
                            title={`${hr}:00 - ${cnt} lượt xem`}
                          />
                          {hr % 3 === 0 && (
                            <span className="text-[9px] text-slate-400 font-mono">{hr}h</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">Top Trang Xem Nhiều Hôm nay</h3>
              {!visitorStats?.topPages || visitorStats.topPages.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Chưa có dữ liệu trang hôm nay.</p>
              ) : (
                visitorStats.topPages.map((pg: any) => (
                  <div
                    key={pg.path}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-mono text-slate-700 truncate">{pg.path}</span>
                    <span className="font-extrabold text-indigo-700">{pg.count} lượt</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: GLOBAL ORDERS 24/7 COMMAND CENTER                              */}
      {/* ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Điều hành Đơn hàng Toàn Hệ thống 24/7 ({orders.length} đơn)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đang chạy: <strong className="text-blue-600">{metrics?.runningOrdersCount || 0}</strong>{' '}
                  • Tạm dừng: <strong className="text-amber-600">{metrics?.pausedOrdersCount || 0}</strong>{' '}
                  • Hoàn thành:{' '}
                  <strong className="text-emerald-600">{metrics?.completedOrdersCount || 0}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleTriggerCronNow}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" /> Kích hoạt Cron 24/7 Ngay
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleOrderAction('resume_all')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Chạy lại tất cả đơn Dừng
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleOrderAction('pause_all')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Pause className="w-3.5 h-3.5" /> Tạm dừng tất cả
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Tìm kiếm theo Mã đơn, Tên chiến dịch, Username, Email hoặc Link Form..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                >
                  <option value="all">Trạng thái: Tất cả ({orders.length})</option>
                  <option value="running">🔵 Đang chạy / Đang chờ Cron</option>
                  <option value="paused">🟠 Đang tạm dừng</option>
                  <option value="completed">🟢 Đã hoàn thành</option>
                  <option value="cancelled">⚪ Đã huỷ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                Không có đơn hàng nào khớp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredOrders.map((o) => {
                const pct =
                  o.totalTarget > 0
                    ? Math.min(100, Math.round((o.completedCount / o.totalTarget) * 100))
                    : 0;
                const isRunning = o.status === 'running' || o.status === 'pending';

                return (
                  <div
                    key={o.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-indigo-700">
                          #{o.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            o.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : isRunning
                              ? 'bg-blue-100 text-blue-700'
                              : o.status === 'paused'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {o.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                          {o.platform === 'microsoft' ? 'MS Forms' : 'Google Forms'} • {o.mode}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {o.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          Khách hàng:{' '}
                          <strong className="text-slate-800">
                            {o.username || o.userEmail || 'Khách'}
                          </strong>
                        </span>
                        <span>
                          Delay: <strong>{o.delayMin}s – {o.delayMax}s</strong>
                        </span>
                        <span>Tạo: {new Date(o.createdAt).toLocaleString('vi-VN')}</span>
                        {o.lastSubmittedAt && (
                          <span>Gửi gần nhất: {formatTimeAgo(o.lastSubmittedAt)}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-1 max-w-xl">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-700">
                            Tiến độ: {o.completedCount}/{o.totalTarget} ({pct}%)
                          </span>
                          <span>
                            <strong className="text-emerald-600">OK: {o.successCount}</strong> •{' '}
                            <strong className="text-rose-600">Lỗi: {o.errorCount}</strong>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              o.status === 'completed'
                                ? 'bg-emerald-500'
                                : isRunning
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Controls */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {o.completedCount < o.totalTarget && o.status !== 'cancelled' && (
                        <>
                          {isRunning ? (
                            <button
                              type="button"
                              disabled={processing}
                              onClick={() => handleOrderAction('pause', o.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"
                            >
                              <Pause className="w-3.5 h-3.5" /> Dừng
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={processing}
                              onClick={() => handleOrderAction('resume', o.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" /> Chạy tiếp
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleOrderAction('force_step', o.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1"
                            title="Đẩy ngay lập tức +1 phản hồi"
                          >
                            <Zap className="w-3.5 h-3.5" /> +1 Lượt
                          </button>

                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleOrderAction('cancel', o.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
                          >
                            Huỷ & Hoàn ví
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenOrderLogs(o)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Terminal className="w-3.5 h-3.5" /> Log
                      </button>

                      <a
                        href={o.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Mở link Form gốc"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleOrderAction('delete', o.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Xoá bản ghi đơn hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: FINANCE & VIETQR DEPOSITS APPROVAL                             */}
      {/* ===================================================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Pending Deposits Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Lệnh Nạp tiền VietQR Đang Chờ Duyệt ({pendingDeposits.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Kiểm tra biến động số dư ngân hàng rồi bấm Duyệt để cộng tự động Credits + thưởng
                  10% Affiliate
                </p>
              </div>
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Tuyệt vời! Toàn bộ yêu cầu nạp tiền của khách hàng đã được xử lý sạch sẽ.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDeposits.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[11px] font-black">
                          #{tx.id}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">{tx.username}</span>
                        <span className="text-xs text-slate-500">
                          • {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 mt-1">
                        Nội dung CK: <strong className="font-mono">{tx.memo}</strong>
                      </div>
                      <div className="text-sm font-black text-emerald-700 font-mono mt-1">
                        Số tiền: {tx.amount.toLocaleString()} VNĐ → Cộng +{tx.credits.toLocaleString()}{' '}
                        Credits
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleDepositDecision(tx.id, 'approve')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Duyệt & Cộng Ví
                      </button>
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleDepositDecision(tx.id, 'reject')}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Transaction Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Sổ cái Giao dịch Toàn hệ thống ({filteredTransactions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Đối soát minh bạch toàn bộ dòng tiền nạp, trừ phí chạy đơn, hoàn tiền và thưởng
                </p>
              </div>
              <button
                type="button"
                onClick={exportTransactionsCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <Download className="w-3.5 h-3.5" /> Xuất CSV Tài chính
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Tìm kiếm theo Mã GD, Username hoặc Nội dung..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                >
                  <option value="all">Tất cả loại giao dịch</option>
                  <option value="deposit">💳 Nạp tiền VietQR</option>
                  <option value="order_charge">🛒 Chi tiêu chạy đơn</option>
                  <option value="refund">↩️ Hoàn tiền tự động</option>
                  <option value="bonus">🎁 Thưởng / Coupon / Affiliate</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Mã GD / Thời gian</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Nội dung</th>
                    <th className="py-3 px-4 text-right">Biến động Credits</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-700">#{t.id}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.username}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">{t.memo}</td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-extrabold ${
                          t.type === 'order_charge' || t.credits < 0
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {t.type === 'order_charge' || t.credits < 0 ? '-' : '+'}
                        {Math.abs(t.credits).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: MARKETING, COUPONS & GLOBAL WEBSITE ANNOUNCEMENT               */}
      {/* ===================================================================== */}
      {activeTab === 'marketing' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Global Announcement Banner & Welcome Bonus */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Thông báo Toàn Website & Quà tặng Thành viên
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phát thanh thông báo khuyến mãi hoặc bảo trì trực tiếp trên đầu trang cho mọi khách
                hàng
              </p>
            </div>

            <div className="space-y-3.5">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Bật Thanh Thông báo Toàn Website
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Hiển thị ngay trên đỉnh màn hình máy tính & điện thoại của khách
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings.announcement?.enabled)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...(settings.announcement || {
                          text: '',
                          type: 'promo',
                          linkText: '',
                          linkUrl: '',
                        }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600"
                />
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kiểu màu sắc Banner
                </label>
                <select
                  value={settings.announcement?.type || 'promo'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...(settings.announcement || {}),
                        type: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                >
                  <option value="promo">✨ Khuyến mãi Nổi bật (Gradient Tím - Hồng)</option>
                  <option value="info">📢 Thông tin Hệ thống (Xanh dương)</option>
                  <option value="warning">⚠️ Cảnh báo / Bảo trì (Cam)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung thông báo gửi tới khách hàng
                </label>
                <input
                  type="text"
                  value={settings.announcement?.text || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...(settings.announcement || {}),
                        text: e.target.value,
                      },
                    })
                  }
                  placeholder="VD: Khuyến mãi nạp VietQR tặng thêm +15% Credits trong tuần này!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chữ trên nút bấm (Tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    value={settings.announcement?.linkText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcement: {
                          ...(settings.announcement || {}),
                          linkText: e.target.value,
                        },
                      })
                    }
                    placeholder="Nạp ngay →"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đường dẫn khi bấm (Tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    value={settings.announcement?.linkUrl || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcement: {
                          ...(settings.announcement || {}),
                          linkUrl: e.target.value,
                        },
                      })
                    }
                    placeholder="/credit"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credits tặng Đăng ký mới
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settings.welcomeCredits ?? 5000}
                    onChange={(e) =>
                      setSettings({ ...settings, welcomeCredits: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thưởng Giới thiệu Bạn bè
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settings.referralBonusCredits ?? 5000}
                    onChange={(e) =>
                      setSettings({ ...settings, referralBonusCredits: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleSaveSettings()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu Cấu hình Thông báo & Quà tặng
              </button>
            </div>
          </div>

          {/* Right: Coupon Management */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-500" />
                Quản lý Mã Giảm Giá / Giftcode ({coupons.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo mã quà tặng để khách hàng nhập tại trang Ví Credits
              </p>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mã Coupon (In hoa) *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="VD: KHAITRUONG20K"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Credits thưởng *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={couponBonus}
                    onChange={(e) => setCouponBonus(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tối đa lượt nhập
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    required
                    value={couponExpires}
                    onChange={(e) => setCouponExpires(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Phát hành / Cập nhật Mã Coupon
              </button>
            </form>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {coupons.map((c) => {
                const pct =
                  c.maxUses > 0 ? Math.min(100, Math.round((c.usedCount / c.maxUses) * 100)) : 0;
                return (
                  <div
                    key={c.code}
                    className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          {c.code}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700">
                          +{c.creditBonus.toLocaleString()} Credits
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Đã dùng: <strong>{c.usedCount}/{c.maxUses}</strong> ({pct}%) • HSD:{' '}
                        {new Date(c.expiresAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                      title="Xoá mã này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: PRICING, VIETQR PREVIEW, ADMIN WHITELIST & SECURITY AUDIT LOGS */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pricing & Delay (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600" />
                Bảng giá Dịch vụ (Credits / 1 Phản hồi)
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { key: 'ratio', label: 'Điền theo Tỉ lệ % (Ratio)' },
                  { key: 'data', label: 'Điền từ File Data có sẵn' },
                  { key: 'model', label: 'Điền theo Mô hình SPSS' },
                  { key: 'agent', label: 'AI Agent Tự suy luận' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settings.pricePerResponse?.[item.key] ?? 100}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pricePerResponse: {
                            ...settings.pricePerResponse,
                            [item.key]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delay tối thiểu mặc định (giây)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.defaultDelayMin ?? 1}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultDelayMin: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delay tối đa mặc định (giây)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.defaultDelayMax ?? 3}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultDelayMax: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Admin Email Whitelist */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Danh sách Email Đặc quyền Quản trị viên (Admin Whitelist)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(settings.adminEmails || []).map((em: string) => (
                    <span
                      key={em}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold"
                    >
                      {em}
                      {(settings.adminEmails || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              adminEmails: settings.adminEmails.filter((x: string) => x !== em),
                            })
                          }
                          className="text-purple-400 hover:text-rose-600 font-black"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Thêm email quản trị mới..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newAdminEmail.trim().toLowerCase();
                      if (!clean || !clean.includes('@')) return;
                      if (!(settings.adminEmails || []).includes(clean)) {
                        setSettings({
                          ...settings,
                          adminEmails: [...(settings.adminEmails || []), clean],
                        });
                      }
                      setNewAdminEmail('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Info & Live VietQR Preview (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Tài khoản Ngân hàng Nhận tiền & Xem trước VietQR
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Ngân hàng
                  </label>
                  <input
                    type="text"
                    value={settings.bankInfo?.bankName || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankInfo: { ...settings.bankInfo, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Ngân hàng VietQR (VD: MB, VCB, TCB, ACB)
                  </label>
                  <input
                    type="text"
                    value={settings.bankInfo?.bankCode || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankInfo: {
                          ...settings.bankInfo,
                          bankCode: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Tài khoản
                  </label>
                  <input
                    type="text"
                    value={settings.bankInfo?.accountNumber || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankInfo: { ...settings.bankInfo, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chủ Tài khoản (Không dấu)
                  </label>
                  <input
                    type="text"
                    value={settings.bankInfo?.accountName || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankInfo: {
                          ...settings.bankInfo,
                          accountName: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase"
                  />
                </div>
              </div>

              {vietQrPreviewUrl && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                  <img
                    src={vietQrPreviewUrl}
                    alt="VietQR Preview"
                    className="w-24 h-24 rounded-xl border border-slate-200 object-contain bg-white shrink-0"
                  />
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" /> Mã VietQR Hiển thị cho Khách
                    </div>
                    <p>
                      Ngân hàng: <strong>{settings.bankInfo?.bankCode}</strong> • STK:{' '}
                      <strong className="font-mono">{settings.bankInfo?.accountNumber}</strong>
                    </p>
                    <p>
                      Chủ TK: <strong>{settings.bankInfo?.accountName}</strong>
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu Toàn bộ Cấu hình Hệ thống
              </button>
            </div>
          </form>

          {/* Admin Security Audit Logs */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Nhật ký Bảo mật Thao tác Quản trị viên ({auditLogs.length})
              </h3>
              <p className="text-xs text-slate-500">
                Mọi hành động cộng/trừ ví, duyệt nạp, tạo/khoá tài khoản, điều hành đơn đều được ghi
                nhận tự động
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Chưa có nhật ký thao tác quản trị nào.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Thời gian</th>
                      <th className="py-2.5 px-4">Quản trị viên</th>
                      <th className="py-2.5 px-4">Hành động</th>
                      <th className="py-2.5 px-4">Đối tượng</th>
                      <th className="py-2.5 px-4">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {log.adminUsername}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">
                          {log.target || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreditAdjustModal
        targetUser={creditTargetUser}
        onClose={() => setCreditTargetUser(null)}
        onSubmit={handleAdjustCredits}
        processing={processing}
      />

      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSubmit={handleCreateUser}
        processing={processing}
      />

      <BulkGiftModal
        isOpen={isBulkGiftOpen}
        onClose={() => setIsBulkGiftOpen(false)}
        onSubmit={handleBulkGift}
        processing={processing}
      />

      <Customer360Modal
        customer={profile360User}
        orders={orders}
        transactions={transactions}
        loginHistory={loginHistory}
        onClose={() => setProfile360User(null)}
        onUpdateUser={handleUpdateUser}
        onOpenCreditModal={(u) => setCreditTargetUser(u)}
        processing={processing}
      />

      <OrderLogsModal
        order={selectedOrderLogs}
        onClose={() => setSelectedOrderLogs(null)}
        onForceStep={(id) => handleOrderAction('force_step', id)}
        processing={processing}
      />
    </div>
  );
}
