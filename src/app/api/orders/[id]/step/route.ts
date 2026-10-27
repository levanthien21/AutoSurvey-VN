import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.order && body.order.id === params.id) {
      const existing = orderManager.getOrder(params.id);
      if (!existing || (body.order.completedCount || 0) >= (existing.completedCount || 0)) {
        orderManager.saveOrder(body.order);
      }
    }

    const updated = await orderManager.executeStep(params.id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xử lý đơn' }, { status: 500 });
  }
}
