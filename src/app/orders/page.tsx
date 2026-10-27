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
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { SurveyOrder } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

function OrdersContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  const [orders, setOrders] = useState<SurveyOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('autosurvey_orders');
        return cached ? JSON.parse(cached) : [];
      } catch {}
    }
    return [];
  });

  const [activeOrder, setActiveOrder] = useState<SurveyOrder | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (selectedId) {
          const cached = localStorage.getItem('autosurvey_orders');
          const list: SurveyOrder[] = cached ? JSON.parse(cached) : [];
          const match = list.find((o) => o.id === selectedId);
          if (match) return match;
        }
        const activeCached = localStorage.getItem('autosurvey_active_order');
        if (activeCached) return JSON.parse(activeCached);
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  // Natural delay countdown timer
  const [nextStepTime, setNextStepTime] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const displayOrders = orders.length > 0 ? orders : (activeOrder ? [activeOrder] : []);
  const currentOrder = activeOrder || (displayOrders.length > 0 ? displayOrders[0] : null);

  // Sync active order selection when selectedId changes or orders change
  useEffect(() => {
    if (selectedId) {
      const match = displayOrders.find((o) => o.id === selectedId);
      if (match) {
        setActiveOrder(match);
      }
    } else if (displayOrders.length > 0 && !activeOrder) {
      setActiveOrder(displayOrders[0]);
    }
  }, [selectedId, displayOrders.length]);

  // Save active order to localStorage whenever it changes
  useEffect(() => {
    if (activeOrder) {
      try {
        localStorage.setItem('autosurvey_active_order', JSON.stringify(activeOrder));
      } catch {}
    }
  }, [activeOrder]);

  // Fetch all orders
  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders((prev) => {
          const mergedMap = new Map<string, SurveyOrder>();
          const prevMap = new Map<string, SurveyOrder>();
          prev.forEach((o) => prevMap.set(o.id, o));

          data.orders.forEach((serverOrder: SurveyOrder) => {
            const localOrder = prevMap.get(serverOrder.id);
            if (localOrder) {
              if (
                localOrder.completedCount > serverOrder.completedCount ||
                (localOrder.logs?.length || 0) > (serverOrder.logs?.length || 0)
              ) {
                mergedMap.set(serverOrder.id, localOrder);
              } else {
                mergedMap.set(serverOrder.id, serverOrder);
              }
              prevMap.delete(serverOrder.id);
            } else {
              mergedMap.set(serverOrder.id, serverOrder);
            }
          });

          // Keep local orders that server has not yet seen
          prevMap.forEach((localOrder) => {
            mergedMap.set(localOrder.id, localOrder);
          });

          const result = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          try {
            localStorage.setItem('autosurvey_orders', JSON.stringify(result));
          } catch {}
          return result;
        });

        if (selectedId) {
          setOrders((currentOrders) => {
            const match = currentOrders.find((o) => o.id === selectedId);
            if (match) {
              setActiveOrder((prevActive) => {
                if (!prevActive || match.completedCount >= prevActive.completedCount) {
                  return match;
                }
                return prevActive;
              });
            }
            return currentOrders;
          });
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
    if (!currentOrder) return;
    const sse = new EventSource(`/api/orders/${currentOrder.id}/stream`);

    sse.onmessage = (event) => {
      try {
        const updated: SurveyOrder = JSON.parse(event.data);
        setActiveOrder(updated);
        setOrders((prev) => {
          const list = prev.map((o) => (o.id === updated.id ? updated : o));
          if (!list.find((o) => o.id === updated.id)) {
            list.unshift(updated);
          }
          try { localStorage.setItem('autosurvey_orders', JSON.stringify(list)); } catch {}
          return list;
        });
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      sse.close();
    };
  }, [currentOrder?.id]);

  // Step execution helper
  const triggerStep = async (orderToStep: SurveyOrder) => {
    try {
      const res = await fetch(`/api/orders/${orderToStep.id}/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderToStep }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
        setOrders((prev) => {
          const list = prev.map((o) => (o.id === data.order.id ? data.order : o));
          if (!list.find((o) => o.id === data.order.id)) {
            list.unshift(data.order);
          }
          try { localStorage.setItem('autosurvey_orders', JSON.stringify(list)); } catch {}
          return list;
        });

        // Set next step time if in natural delay mode (delayMin >= 10)
        if (data.order.status === 'running' && data.order.completedCount < data.order.totalTarget) {
          if (data.order.delayMin && data.order.delayMin >= 10) {
            const minSec = data.order.delayMin;
            const maxSec = data.order.delayMax || minSec;
            const nextSec = minSec + Math.random() * (maxSec - minSec);
            setNextStepTime(Date.now() + nextSec * 1000);
          } else {
            setNextStepTime(null);
          }
        } else {
          setNextStepTime(null);
        }
      }
    } catch (err) {
      console.warn('Step runner:', err);
    }
  };

  const handleForceStepNow = () => {
    if (currentOrder && currentOrder.status === 'running' && currentOrder.completedCount < currentOrder.totalTarget) {
      setNextStepTime(Date.now());
      triggerStep(currentOrder);
    }
  };

  // Countdown ticker for natural delay
  useEffect(() => {
    if (!nextStepTime) {
      setCountdownSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((nextStepTime - Date.now()) / 1000));
      setCountdownSeconds(remaining);
    };
    updateCountdown();
    const ticker = setInterval(updateCountdown, 1000);
    return () => clearInterval(ticker);
  }, [nextStepTime]);

  // Client-driven runner heartbeat to ensure continuous progress even if serverless function sleeps
  useEffect(() => {
    if (!currentOrder || currentOrder.status !== 'running' || currentOrder.completedCount >= currentOrder.totalTarget) {
      setNextStepTime(null);
      return;
    }

    const isNaturalDelay = Boolean(currentOrder.delayMin && currentOrder.delayMin >= 10);

    let isStepping = false;
    const interval = setInterval(async () => {
      if (isStepping) return;

      // If in natural delay mode, wait until nextStepTime is reached
      if (isNaturalDelay && nextStepTime && Date.now() < nextStepTime) {
        return;
      }

      isStepping = true;
      try {
        await triggerStep(currentOrder);
      } finally {
        isStepping = false;
      }
    }, isNaturalDelay ? 1000 : 1800);

    return () => clearInterval(interval);
  }, [currentOrder?.id, currentOrder?.status, currentOrder?.completedCount, currentOrder?.totalTarget, nextStepTime]);

  // Order action
  const handleAction = async (id: string, action: 'start' | 'pause' | 'cancel') => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
        setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
      }
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

      {loading && displayOrders.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
      ) : displayOrders.length === 0 ? (
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
              Danh sách đơn ({displayOrders.length})
            </h3>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {displayOrders.map((ord) => {
                const isSelected = currentOrder?.id === ord.id;
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
            {currentOrder && (
              <>
                {/* Header Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Chi tiết đơn #{currentOrder.id}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">{currentOrder.title}</h2>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>Chế độ: <strong className="text-slate-800 capitalize">{currentOrder.mode}</strong></span>
                        <span>•</span>
                        <span>Tạo lúc: {new Date(currentOrder.createdAt).toLocaleTimeString()}</span>
                        {currentOrder.refundedAmount && currentOrder.refundedAmount > 0 ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              Đã hoàn lại: {currentOrder.refundedAmount.toLocaleString()} Credits
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Excel Export Button */}
                      <a
                        href={`/api/orders/${currentOrder.id}/export`}
                        download
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Xuất Excel (.xlsx)</span>
                      </a>

                      {currentOrder.status === 'running' ? (
                        <button
                          onClick={() => handleAction(currentOrder.id, 'pause')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-xs"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Tạm dừng</span>
                        </button>
                      ) : currentOrder.status === 'paused' || currentOrder.status === 'pending' ? (
                        <button
                          onClick={() => handleAction(currentOrder.id, 'start')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02]"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Tiếp tục gửi</span>
                        </button>
                      ) : null}

                      {currentOrder.status !== 'completed' && currentOrder.status !== 'cancelled' && (
                        <button
                          onClick={() => handleAction(currentOrder.id, 'cancel')}
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
                      <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">{currentOrder.totalTarget}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-600">Thành công</div>
                      <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">{currentOrder.successCount}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-rose-500">Lỗi / Bị chặn</div>
                      <div className="text-lg font-black text-rose-600 mt-0.5 font-mono">{currentOrder.errorCount}</div>
                    </div>
                  </div>

                  {/* Progress Bar Large */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Tiến độ hoàn thành</span>
                      <span className="font-extrabold text-blue-700 font-mono">
                        {Math.round((currentOrder.completedCount / currentOrder.totalTarget) * 100) || 0}%
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round((currentOrder.completedCount / currentOrder.totalTarget) * 100) || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Natural Delay Simulation Banner (Chống giảng viên check) */}
                  {currentOrder.delayMin && currentOrder.delayMin >= 10 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                          <Clock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-purple-900">
                              Giãn cách mô phỏng người thật: {(currentOrder.delayMin / 60).toFixed(0)} - {(currentOrder.delayMax / 60).toFixed(0)} phút / phản hồi
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
                              Chống giảng viên check
                            </span>
                          </div>
                          <div className="text-[11px] text-purple-700/90 mt-0.5">
                            {countdownSeconds > 0 ? (
                              <span>
                                Lần nộp tiếp theo sau: <strong className="font-mono text-purple-900 font-bold">{Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, '0')}</strong>
                              </span>
                            ) : (
                              <span>Đang chuẩn bị gửi phản hồi tiếp theo...</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {currentOrder.status === 'running' && currentOrder.completedCount < currentOrder.totalTarget && (
                        <button
                          onClick={handleForceStepNow}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.02] shrink-0 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Nộp ngay phản hồi này</span>
                        </button>
                      )}
                    </div>
                  )}
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
                    {currentOrder.logs.length === 0 ? (
                      <div className="text-slate-600 py-8 text-center">Đang kết nối tín hiệu phản hồi từ máy chủ...</div>
                    ) : (
                      currentOrder.logs.map((log, lIdx) => (
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
