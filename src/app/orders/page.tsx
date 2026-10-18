'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Layers,
  Terminal,
  RefreshCw,
  Sliders,
  Download,
  RotateCcw,
} from 'lucide-react';
import { SurveyOrder } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

function OrdersContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  const [orders, setOrders] = useState<SurveyOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<SurveyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  // Fetch all orders
  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (selectedId) {
          const match = data.orders.find((o: SurveyOrder) => o.id === selectedId);
          if (match) setActiveOrder(match);
        } else if (data.orders.length > 0 && !activeOrder) {
          setActiveOrder(data.orders[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadOrders();
      setRefreshToast('Đã làm mới danh sách đơn hàng thành công!');
      setTimeout(() => setRefreshToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Connect SSE for active order
  useEffect(() => {
    if (!activeOrder) return;
    const sse = new EventSource(`/api/orders/${activeOrder.id}/stream`);

    sse.onmessage = (event) => {
      try {
        const updated: SurveyOrder = JSON.parse(event.data);
        setActiveOrder(updated);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      sse.close();
    };
  }, [activeOrder?.id]);

  // Order action
  const handleAction = async (id: string, action: 'start' | 'pause' | 'cancel') => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Tiến trình & Lịch sử</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản lý đơn hàng điền form</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tiến trình nộp câu trả lời lên Google Forms theo thời gian thực (Real-time SSE) và xuất báo cáo khoa học.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
        </button>
      </div>

      {refreshToast && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{refreshToast}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Chưa có đơn điền form nào</h3>
          <p className="text-xs text-slate-400 mt-1">Hãy khởi tạo đơn mới từ mục Tạo form ngay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List (Left Col) */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Danh sách đơn ({orders.length})
            </h3>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const isSelected = activeOrder?.id === ord.id;
                const pct = Math.round((ord.completedCount / ord.totalTarget) * 100) || 0;

                return (
                  <div
                    key={ord.id}
                    onClick={() => setActiveOrder(ord)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-white shadow-md shadow-blue-500/5'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400">#{ord.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'running'
                            ? 'bg-blue-50 text-blue-700 animate-pulse'
                            : ord.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ord.status === 'paused'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ord.status === 'running' ? 'Đang gửi' : ord.status === 'completed' ? 'Hoàn thành' : ord.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 truncate">{ord.title}</h4>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                        <span>Tiến trình</span>
                        <span className="font-bold text-slate-800">
                          {ord.completedCount}/{ord.totalTarget} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Order Details (Right Col) */}
          <div className="lg:col-span-2 space-y-5">
            {activeOrder && (
              <>
                {/* Header Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Chi tiết đơn #{activeOrder.id}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeOrder.title}</h2>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>Chế độ: <strong className="text-slate-800 capitalize">{activeOrder.mode}</strong></span>
                        <span>•</span>
                        <span>Tạo lúc: {new Date(activeOrder.createdAt).toLocaleTimeString()}</span>
                        {activeOrder.refundedAmount && activeOrder.refundedAmount > 0 ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              Đã hoàn lại: {activeOrder.refundedAmount.toLocaleString()} Credits
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Excel Export Button */}
                      <a
                        href={`/api/orders/${activeOrder.id}/export`}
                        download
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Xuất Excel (.xlsx)</span>
                      </a>

                      {activeOrder.status === 'running' ? (
                        <button
                          onClick={() => handleAction(activeOrder.id, 'pause')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-xs"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Tạm dừng</span>
                        </button>
                      ) : activeOrder.status === 'paused' || activeOrder.status === 'pending' ? (
                        <button
                          onClick={() => handleAction(activeOrder.id, 'start')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02]"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Tiếp tục gửi</span>
                        </button>
                      ) : null}

                      {activeOrder.status !== 'completed' && activeOrder.status !== 'cancelled' && (
                        <button
                          onClick={() => handleAction(activeOrder.id, 'cancel')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Hủy & Hoàn tiền</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">Mục tiêu</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">{activeOrder.totalTarget}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-600">Thành công</div>
                      <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">{activeOrder.successCount}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-rose-500">Lỗi / Bị chặn</div>
                      <div className="text-lg font-black text-rose-600 mt-0.5 font-mono">{activeOrder.errorCount}</div>
                    </div>
                  </div>

                  {/* Progress Bar Large */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Tiến độ hoàn thành</span>
                      <span className="font-extrabold text-blue-700 font-mono">
                        {Math.round((activeOrder.completedCount / activeOrder.totalTarget) * 100) || 0}%
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round((activeOrder.completedCount / activeOrder.totalTarget) * 100) || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Real-time Submission Terminal Log */}
                <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 text-white shadow-2xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200">Real-time Submitter Stream (SSE)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                      50 phản hồi mới nhất
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                    {activeOrder.logs.length === 0 ? (
                      <div className="text-slate-600 py-8 text-center">Đang kết nối tín hiệu phản hồi từ máy chủ...</div>
                    ) : (
                      activeOrder.logs.map((log, lIdx) => (
                        <div key={lIdx} className="flex items-start gap-2.5 text-[11px] hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                          <span className="text-slate-500 shrink-0 font-mono">{log.timestamp}</span>
                          <span
                            className={`font-black shrink-0 ${
                              log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            [{log.status === 'success' ? 'OK' : 'ERR'}] #{log.index}:
                          </span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
