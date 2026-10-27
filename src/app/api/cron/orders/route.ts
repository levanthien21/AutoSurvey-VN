import { NextRequest, NextResponse } from 'next/server';
import { orderManager, SurveyOrder } from '@/lib/orderStore';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow maximum serverless execution time (up to 60s)

export interface CronLogEntry {
  id: string;
  timestamp: string;
  timeFormatted: string;
  ip: string;
  userAgent: string;
  source: string;
  activeCount: number;
  steppedCount: number;
  steppedTitles?: string[];
}

const TMP_CRON_LOGS = path.join('/tmp', 'cron_logs.json');

async function getRecentCronLogs(): Promise<CronLogEntry[]> {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const res = await fetch('https://meo68oenlhu0k0ib.public.blob.vercel-storage.com/cron_logs.json', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    }
  } catch {}

  try {
    if (fs.existsSync(TMP_CRON_LOGS)) {
      const raw = fs.readFileSync(TMP_CRON_LOGS, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch {}

  return [];
}

async function recordCronLog(entry: CronLogEntry) {
  try {
    const logs = await getRecentCronLogs();
    const updated = [entry, ...logs].slice(0, 50);

    // Write to /tmp
    try {
      fs.writeFileSync(TMP_CRON_LOGS, JSON.stringify(updated), 'utf8');
    } catch {}

    // Write to Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put('cron_logs.json', JSON.stringify(updated), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Error recording cron log:', e);
  }
}

function detectSource(userAgent: string): string {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('cron-job.org') || ua.includes('cron-job')) return 'cron-job.org';
  if (ua.includes('github-actions') || ua.includes('github')) return 'GitHub Actions';
  if (ua.includes('uptimerobot')) return 'UptimeRobot';
  if (ua.includes('easycron')) return 'EasyCron';
  if (ua.includes('postman')) return 'Postman';
  if (ua.includes('curl')) return 'Curl / Terminal';
  if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) return 'Trình duyệt Web (Trực tiếp / Test Ping)';
  return 'Dịch vụ Webhook Tự động';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceId = searchParams.get('id');
    const ua = req.headers.get('user-agent') || 'Unknown';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || '127.0.0.1';
    const source = detectSource(ua);

    // Sync state from Vercel Blob cloud store
    await orderManager.syncFromBlob();

    if (forceId) {
      const stepped = await orderManager.executeStep(forceId);
      return NextResponse.json({
        success: true,
        action: 'force_step',
        order: stepped,
      });
    }

    const result = await orderManager.stepDueOrders();
    const activeOrders = orderManager.getActiveRunningOrders();

    const logEntry: CronLogEntry = {
      id: 'clog_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      ip,
      userAgent: ua,
      source,
      activeCount: activeOrders.length,
      steppedCount: result.stepped.length,
      steppedTitles: result.stepped.map((o) => `#${o.id} (${o.completedCount}/${o.totalTarget})`),
    };

    // Record log asynchronously
    await recordCronLog(logEntry);
    const recentLogs = await getRecentCronLogs();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      caller: {
        source,
        userAgent: ua,
        ip,
      },
      cronStats: {
        lastPingAt: logEntry.timestamp,
        lastPingTimeVN: logEntry.timeFormatted,
        totalRecentCalls: recentLogs.length,
        status: 'HOẠT ĐỘNG TỐT (200 OK)',
      },
      activeCount: activeOrders.length,
      steppedCount: result.stepped.length,
      stepped: result.stepped.map((o) => ({
        id: o.id,
        title: o.title,
        completedCount: o.completedCount,
        totalTarget: o.totalTarget,
        status: o.status,
        lastSubmittedAt: o.lastSubmittedAt,
        nextScheduledAt: o.nextScheduledAt,
      })),
      skipped: result.skipped.map((o) => ({
        id: o.id,
        title: o.title,
        completedCount: o.completedCount,
        totalTarget: o.totalTarget,
        status: o.status,
        nextScheduledAt: o.nextScheduledAt,
        secondsRemaining: o.nextScheduledAt
          ? Math.max(0, Math.ceil((new Date(o.nextScheduledAt).getTime() - Date.now()) / 1000))
          : 0,
      })),
      recentLogs: recentLogs.slice(0, 15),
    });
  } catch (err: any) {
    console.error('Cron runner error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi xử lý cron orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ua = req.headers.get('user-agent') || 'Unknown';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || '127.0.0.1';
    const source = detectSource(ua);

    // Sync existing orders from Blob first
    await orderManager.syncFromBlob();

    // If client syncs orders array into serverless memory
    if (Array.isArray(body.orders) && body.orders.length > 0) {
      for (const ord of body.orders) {
        if (ord && ord.id) {
          const existing = orderManager.getOrder(ord.id);
          if (!existing || (ord.completedCount || 0) >= (existing.completedCount || 0)) {
            orderManager.saveOrder(ord);
          }
        }
      }
      // Force write updated merged state to Vercel Blob
      await orderManager.saveToBlob();
    }

    const result = await orderManager.stepDueOrders();
    const activeOrders = orderManager.getActiveRunningOrders();

    const logEntry: CronLogEntry = {
      id: 'clog_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      ip,
      userAgent: ua,
      source: body.orders ? 'Client Đồng bộ Trực tiếp' : source,
      activeCount: activeOrders.length,
      steppedCount: result.stepped.length,
      steppedTitles: result.stepped.map((o) => `#${o.id} (${o.completedCount}/${o.totalTarget})`),
    };

    await recordCronLog(logEntry);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeCount: activeOrders.length,
      steppedCount: result.stepped.length,
      stepped: result.stepped.map((o) => ({
        id: o.id,
        completedCount: o.completedCount,
        totalTarget: o.totalTarget,
        status: o.status,
        nextScheduledAt: o.nextScheduledAt,
      })),
      skippedCount: result.skipped.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi POST cron orders' },
      { status: 500 }
    );
  }
}
