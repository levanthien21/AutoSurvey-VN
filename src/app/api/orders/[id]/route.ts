import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let order = orderManager.getOrder(params.id);
  if (!order) {
    await orderManager.syncFromBlob();
    order = orderManager.getOrder(params.id);
  }
  if (!order) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }
  return NextResponse.json({ success: true, order });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { action } = await req.json();
  let order = orderManager.getOrder(params.id);
  if (!order) {
    await orderManager.syncFromBlob();
    order = orderManager.getOrder(params.id);
  }
  if (!order) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }

  if (action === 'start' || action === 'resume') {
    orderManager.startWorker(params.id);
  } else if (action === 'pause') {
    orderManager.pauseWorker(params.id);
  } else if (action === 'cancel') {
    orderManager.cancelOrder(params.id);
  } else {
    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  }

  await orderManager.saveToBlob();

  return NextResponse.json({ success: true, order: orderManager.getOrder(params.id) });
}
