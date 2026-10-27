import { NextRequest, NextResponse } from 'next/server';
import { orderManager, SurveyOrder } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow maximum serverless execution time (up to 60s)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceId = searchParams.get('id');

    if (forceId) {
      const stepped = await orderManager.executeStep(forceId);
      return NextResponse.json({
        success: true,
        action: 'force_step',
        order: stepped,
      });
    }

    const result = await orderManager.stepDueOrders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeCount: orderManager.getActiveRunningOrders().length,
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

    // If client syncs orders array into serverless memory
    if (Array.isArray(body.orders)) {
      for (const ord of body.orders) {
        if (ord && ord.id) {
          const existing = orderManager.getOrder(ord.id);
          if (!existing || (ord.completedCount || 0) >= (existing.completedCount || 0)) {
            orderManager.saveOrder(ord);
          }
        }
      }
    }

    const result = await orderManager.stepDueOrders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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
