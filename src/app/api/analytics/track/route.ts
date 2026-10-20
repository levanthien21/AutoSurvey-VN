import { NextRequest, NextResponse } from 'next/server';
import { analytics } from '@/lib/analytics';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const visitorId = body.visitorId || req.headers.get('x-visitor-id') || '';
    const path = body.path || '/';
    const device = body.device || 'desktop';
    const referrer = body.referrer || '';

    const result = analytics.recordVisit({
      visitorId,
      path,
      device,
      referrer,
    });

    return NextResponse.json({
      success: true,
      activeNow: result.activeNow,
      todayUnique: result.todayUnique,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Tracking failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const simulate = searchParams.get('simulate');

  if (simulate === 'true') {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }
    const testPath = searchParams.get('path') || '/';
    const stats = analytics.simulateTestVisit(testPath);
    return NextResponse.json({ success: true, stats, message: 'Đã giả lập 1 lượt truy cập thành công!' });
  }

  const stats = analytics.getStats();
  return NextResponse.json({ success: true, stats });
}
