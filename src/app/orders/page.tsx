'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
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
  Download,
  RotateCcw,
  Sparkles,
  Globe,
  Copy,
  Check,
  Zap,
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

  // Multi-order independent countdown and runner tracking
  const [countdownMap, setCountdownMap] = useState<Record<string, number>>({});
  const [steppingMap, setSteppingMap] = useState<Record<string, boolean>>({});
  const nextStepTimesRef = useRef<Record<string, number>>({});
  const isSteppingRef = useRef<Record<string, boolean>>({});

  // 24/7 Cloud Background runner helper state
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [cronLogs, setCronLogs] = useState<any[]>([]);
  const [showCronHistory, setShowCronHistory] = useState(false);
  const [lastCronInfo, setLastCronInfo] = useState<{ source?: string; time?: string; count?: number } | null>(null);

  const displayOrders = orders.length > 0 ? orders : (activeOrder ? [activeOrder] : []);
  const currentOrder = activeOrder || (displayOrders.length > 0 ? displayOrders[0] : null);

  const runningOrders = displayOrders.filter(
    (o) => o.status === 'running' && o.completedCount < o.totalTarget
  );

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

  // Fetch all orders from server and merge with localStorage
  const loadOrders = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('autosurvey_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', { headers });
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

          // Auto-sync active orders to Vercel Blob persistent store
          if (result.length > 0) {
            fetch('/api/cron/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ orders: result }),
            }).catch(() => {});
          }

          // Keep activeOrder synchronized with newest status, count, and logs
          setActiveOrder((prevActive) => {
            if (selectedId) {
              const match = result.find((o) => o.id === selectedId);
              if (match) return match;
            }
            if (prevActive) {
              const match = result.find((o) => o.id === prevActive.id);
              if (match) return match;
            }
            return result[0] || null;
          });

          return result;
        });
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
      setRefreshToast('Đã đồng bộ và cập nhật danh sách đơn hàng từ Cloud thành công!');
      setTimeout(() => setRefreshToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Connect SSE for active order
  useEffect(() => {
    if (!currentOrder) return;
    const sse = new EventSource(`/api/orders/${currentOrder.id}/stream`);

    sse.onmessage = (event) => {
      try {
        const updated: SurveyOrder = JSON.parse(event.data);
        setActiveOrder((prev) => (prev?.id === updated.id ? updated : prev));
        setOrders((prev) => {
          const list = prev.map((o) => (o.id === updated.id ? updated : o));
          if (!list.find((o) => o.id === updated.id)) {
            list.unshift(updated);
          }
          try {
            localStorage.setItem('autosurvey_orders', JSON.stringify(list));
          } catch {}
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

  // Step execution helper for an individual order
  const triggerStep = async (orderToStep: SurveyOrder) => {
    if (isSteppingRef.current[orderToStep.id]) return;
    isSteppingRef.current[orderToStep.id] = true;
    setSteppingMap((prev) => ({ ...prev, [orderToStep.id]: true }));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('autosurvey_token') : null;
      const res = await fetch(`/api/orders/${orderToStep.id}/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order: orderToStep }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        const updated: SurveyOrder = data.order;
        setOrders((prev) => {
          const list = prev.map((o) => (o.id === updated.id ? updated : o));
          if (!list.find((o) => o.id === updated.id)) {
            list.unshift(updated);
          }
          try {
            localStorage.setItem('autosurvey_orders', JSON.stringify(list));
          } catch {}
          return list;
        });

        if (activeOrder?.id === updated.id) {
          setActiveOrder(updated);
        }

        // Schedule next step time for THIS specific order
        if (updated.status === 'running' && updated.completedCount < updated.totalTarget) {
          const minSec = updated.delayMin || 1;
          const maxSec = updated.delayMax || minSec;
          const nextSec = minSec + Math.random() * (maxSec - minSec);
          const nextTime = Date.now() + nextSec * 1000;
          nextStepTimesRef.current[updated.id] = nextTime;
          setCountdownMap((prev) => ({
            ...prev,
            [updated.id]: Math.round(nextSec),
          }));
        } else {
          delete nextStepTimesRef.current[updated.id];
          setCountdownMap((prev) => {
            const next = { ...prev };
            delete next[updated.id];
            return next;
          });
        }
      }
    } catch (err) {
      console.warn(`Error stepping order ${orderToStep.id}:`, err);
    } finally {
      isSteppingRef.current[orderToStep.id] = false;
      setSteppingMap((prev) => ({ ...prev, [orderToStep.id]: false }));
    }
  };

  const handleForceStepNow = () => {
    if (currentOrder && currentOrder.status === 'running' && currentOrder.completedCount < currentOrder.totalTarget) {
      nextStepTimesRef.current[currentOrder.id] = Date.now();
      triggerStep(currentOrder);
    }
  };

  // MULTI-ORDER CONCURRENT HEARTBEAT LOOP
  // Runs every 1 second, independently stepping EACH running order when its individual timer hits 0
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const currentCountdowns: Record<string, number> = {};

      runningOrders.forEach((ord) => {
        let targetTime = nextStepTimesRef.current[ord.id];

        if (!targetTime) {
          if (ord.nextScheduledAt) {
            targetTime = new Date(ord.nextScheduledAt).getTime();
          } else if (ord.lastSubmittedAt && ord.delayMin && ord.delayMin >= 10) {
            targetTime = new Date(ord.lastSubmittedAt).getTime() + ord.delayMin * 1000;
          } else {
            // First time or immediately due
            targetTime = now;
          }
          nextStepTimesRef.current[ord.id] = targetTime;
        }

        const remainingSec = Math.max(0, Math.ceil((targetTime - now) / 1000));
        currentCountdowns[ord.id] = remainingSec;

        // If time is up and not currently stepping, step this order!
        if (remainingSec <= 0 && !isSteppingRef.current[ord.id]) {
          triggerStep(ord);
        }
      });

      setCountdownMap(currentCountdowns);
    }, 1000);

    return () => clearInterval(timer);
  }, [displayOrders, runningOrders.length]);

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
        const updated = data.order;
        if (action === 'start') {
          nextStepTimesRef.current[id] = Date.now() + 1000;
        } else {
          delete nextStepTimesRef.current[id];
        }
        setActiveOrder((prev) => (prev?.id === updated.id ? updated : prev));
        setOrders((prev) => {
          const list = prev.map((o) => (o.id === updated.id ? updated : o));
          try {
            localStorage.setItem('autosurvey_orders', JSON.stringify(list));
          } catch {}
          return list;
        });
      }
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://auto-survey-vn.vercel.app';
    const url = `${origin}/api/cron/orders`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  const handleTestPingCron = async () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const res = await fetch('/api/cron/orders');
      const data = await res.json();
      if (data.success) {
        setPingStatus(`Ping thành công! Đã kiểm tra ${data.activeCount} đơn đang chạy (${data.steppedCount} đơn vừa nộp, ${data.skipped?.length || 0} đơn đang chờ hẹn giờ).`);
        if (data.recentLogs) {
          setCronLogs(data.recentLogs);
          if (data.recentLogs[0]) {
            setLastCronInfo({
              source: data.recentLogs[0].source,
              time: data.recentLogs[0].timeFormatted,
              count: data.recentLogs[0].activeCount,
            });
          }
        }
      } else {
        setPingStatus(`Lỗi ping: ${data.error}`);
      }
    } catch (err: any) {
      setPingStatus(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingStatus(null), 8000);
    }
  };

  const handleFetchCronHistory = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/cron/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.recentLogs)) {
        setCronLogs(data.recentLogs);
        setShowCronHistory(true);
        if (data.recentLogs[0]) {
          setLastCronInfo({
            source: data.recentLogs[0].source,
            time: data.recentLogs[0].timeFormatted,
            count: data.recentLogs[0].activeCount,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinging(false);
    }
  };

  // Check recent cron logs on mount
  useEffect(() => {
    fetch('/api/cron/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.recentLogs)) {
          setCronLogs(d.recentLogs);
          if (d.recentLogs[0]) {
            setLastCronInfo({
              source: d.recentLogs[0].source,
              time: d.recentLogs[0].timeFormatted,
              count: d.recentLogs[0].activeCount,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Tiến trình & Lịch sử</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản lý đơn hàng điền form</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hỗ trợ chạy song song độc lập nhiều đơn hàng, duy trì tiến độ 24/7 và xuất báo cáo khoa học.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {refreshToast && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* MULTI-ORDER CONCURRENT RUNNER BANNER */}
      {runningOrders.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-indigo-800/40 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                <Zap className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white">
                    Hệ thống đang chạy song song: {runningOrders.length} đơn hàng độc lập
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Tách biệt thời gian 100%
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Mỗi đơn chạy trên đồng hồ đếm ngược riêng, không phụ thuộc nhau, đảm bảo hoàn thành đúng tiến độ cả 3 form.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyWebhook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-indigo-100 font-semibold border border-white/10 transition-all cursor-pointer shrink-0"
              title="Copy link Webhook Cron để chạy ngầm 24/7 kể cả khi tắt máy"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'Đã copy URL 24/7' : 'URL Cron 24/7'}</span>
            </button>
          </div>

          {/* Quick pills of running orders */}
          <div className="flex items-center gap-2.5 flex-wrap pt-1 border-t border-white/10">
            {runningOrders.map((ro) => {
              const sec = countdownMap[ro.id] || 0;
              const isStepping = steppingMap[ro.id];
              const isSelected = currentOrder?.id === ro.id;
              const pct = Math.round((ro.completedCount / ro.totalTarget) * 100) || 0;

              return (
                <button
                  key={ro.id}
                  onClick={() => setActiveOrder(ro)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/10'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                  <span className="truncate max-w-[140px] text-left">{ro.title || `Đơn #${ro.id}`}</span>
                  <span className="text-[11px] font-mono text-indigo-300 bg-black/20 px-1.5 py-0.5 rounded">
                    {ro.completedCount}/{ro.totalTarget} ({pct}%)
                  </span>
                  <span className="font-mono text-emerald-300 font-bold shrink-0">
                    {isStepping
                      ? '🚀 Nộp...'
                      : sec > 0
                      ? `⏱️ ${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
                      : '⚡ Nộp ngay'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 24/7 CLOUD BACKGROUND RUNNER NOTICE */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Chế độ chạy ngầm 24/7 khi tắt máy tính</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Cloud Webhook Sẵn sàng
              </span>
            </div>
            <p className="text-slate-500 mt-0.5">
              Để đơn chạy liên tục 24/7 ngay cả khi bạn tắt máy tính, bạn chỉ cần dán URL Webhook vào dịch vụ hẹn giờ miễn phí như <strong>cron-job.org</strong> (ping 1 phút/lần). Khi mở lại máy, web cũng sẽ tự động tiếp tục tiến trình ngay lập tức.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyWebhook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold shadow-2xs transition-all cursor-pointer"
          >
            {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedWebhook ? 'Đã copy URL' : 'Copy URL Webhook'}</span>
          </button>

          <button
            onClick={handleTestPingCron}
            disabled={isPinging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Đang ping...' : 'Test Ping Cron'}</span>
          </button>

          <button
            onClick={() => setShowCronHistory(!showCronHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showCronHistory ? 'Đóng lịch sử' : `Lịch sử gọi (${cronLogs.length})`}</span>
          </button>
        </div>
      </div>

      {lastCronInfo && (
        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span><strong>Tín hiệu Cronjob mới nhất:</strong> Đã gọi lúc <strong>{lastCronInfo.time}</strong> từ <strong>{lastCronInfo.source}</strong> (Quét {lastCronInfo.count} đơn).</span>
          </span>
          <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Đang kết nối 24/7</span>
        </div>
      )}

      {showCronHistory && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Nhật ký gọi Cronjob gần nhất ({cronLogs.length} lần ping)</span>
            </div>
            <button
              onClick={handleFetchCronHistory}
              disabled={isPinging}
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Làm mới lịch sử
            </button>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto text-xs font-mono">
            {cronLogs.length === 0 ? (
              <div className="text-slate-400 py-3 text-center text-[11px]">Chưa có lượt ping nào được ghi nhận.</div>
            ) : (
              cronLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">[{log.timeFormatted || log.timestamp}]</span>
                    <span className="font-bold text-blue-700">{log.source}</span>
                    <span className="text-slate-500 font-sans truncate max-w-[200px]">({log.userAgent})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {log.activeCount} đơn đang chạy
                    </span>
                    {log.steppedCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        +{log.steppedCount} vừa nộp
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Đang đếm giờ</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {pingStatus && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{pingStatus}</span>
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
                const sec = countdownMap[ord.id];
                const isStepping = steppingMap[ord.id];

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
                        {ord.status === 'running' ? 'Đang chạy' : ord.status === 'completed' ? 'Hoàn thành' : ord.status}
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

                    {/* Live Parallel Status Badge */}
                    {ord.status === 'running' && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2 py-1 rounded-lg">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                          <span>{isStepping ? 'Đang gửi phản hồi...' : 'Đang chạy song song'}</span>
                        </span>
                        <span className="font-mono font-bold">
                          {sec !== undefined && sec > 0
                            ? `⏱️ ${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
                            : isStepping
                            ? '🚀 Đang nộp'
                            : '⚡ Chuẩn bị nộp'}
                        </span>
                      </div>
                    )}
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
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                        <span>Chi tiết đơn #{currentOrder.id}</span>
                        {currentOrder.status === 'running' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Chạy độc lập
                          </span>
                        )}
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
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Tạm dừng</span>
                        </button>
                      ) : currentOrder.status === 'paused' || currentOrder.status === 'pending' ? (
                        <button
                          onClick={() => handleAction(currentOrder.id, 'start')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02] cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Tiếp tục gửi</span>
                        </button>
                      ) : null}

                      {currentOrder.status !== 'completed' && currentOrder.status !== 'cancelled' && (
                        <button
                          onClick={() => handleAction(currentOrder.id, 'cancel')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                            {steppingMap[currentOrder.id] ? (
                              <span className="text-indigo-800 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                                Đang nộp câu trả lời lên Google/Microsoft Forms...
                              </span>
                            ) : countdownMap[currentOrder.id] !== undefined && countdownMap[currentOrder.id] > 0 ? (
                              <span>
                                Lần nộp tiếp theo của đơn này sau:{' '}
                                <strong className="font-mono text-purple-900 font-bold">
                                  {Math.floor(countdownMap[currentOrder.id] / 60)}:
                                  {(countdownMap[currentOrder.id] % 60).toString().padStart(2, '0')}
                                </strong>
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
                          disabled={steppingMap[currentOrder.id]}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.02] shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{steppingMap[currentOrder.id] ? 'Đang gửi...' : 'Nộp ngay phản hồi này'}</span>
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
