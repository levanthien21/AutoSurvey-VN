import { NextRequest, NextResponse } from 'next/server';
import { orderManager } from '@/lib/orderStore';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (user && user.role !== 'admin') {
    // Regular users see their own orders + demo orders if any
    const orders = orderManager.getAllOrders().filter((o) => !o.userId || o.userId === user.id);
    return NextResponse.json({ success: true, orders });
  }

  // Admins see all orders
  const orders = orderManager.getAllOrders();
  return NextResponse.json({ success: true, orders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      formUrl,
      submitUrl,
      mode = 'ratio',
      totalTarget,
      delayMin,
      delayMax,
      responsesQueue,
      fbzx,
      autoStart = true,
    } = body;

    if (!submitUrl || !responsesQueue || !Array.isArray(responsesQueue) || responsesQueue.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu đơn hàng hoặc danh sách câu trả lời không hợp lệ' },
        { status: 400 }
      );
    }

    // Resolve authenticated user
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập tài khoản để bắt đầu chạy đơn điền form.' },
        { status: 401 }
      );
    }

    const count = totalTarget || responsesQueue.length;
    const settings = db.getSettings();
    const modeKey = (mode as keyof typeof settings.pricePerResponse) || 'ratio';
    const costPerResponse = settings.pricePerResponse[modeKey] || 100;
    const totalCost = count * costPerResponse;

    // Credit verification
    if (user) {
      if (user.credits < totalCost) {
        return NextResponse.json(
          {
            success: false,
            error: `Số dư không đủ! Đơn này cần ${totalCost.toLocaleString()} Credits, số dư hiện tại của bạn là ${user.credits.toLocaleString()} Credits. Vui lòng nạp thêm để tiếp tục.`,
            requiredCredits: totalCost,
            currentCredits: user.credits,
          },
          { status: 402 }
        );
      }

      // Deduct credits
      db.updateUserCredits(user.id, -totalCost);

      // Record transaction
      db.createTransaction({
        userId: user.id,
        username: user.username,
        type: 'order_charge',
        amount: totalCost,
        credits: -totalCost,
        memo: `Thanh toán khảo sát: ${title || 'Google Form'} (${count} phản hồi)`,
        status: 'completed',
      });
    }

    const order = orderManager.createOrder({
      userId: user?.id,
      title: title || 'Đơn điền form tự động',
      formUrl,
      submitUrl,
      mode,
      totalTarget: count,
      delayMin: delayMin ? Number(delayMin) : settings.defaultDelayMin || 1.0,
      delayMax: delayMax ? Number(delayMax) : settings.defaultDelayMax || 2.5,
      costPerResponse,
      totalCost,
      responsesQueue,
      fbzx,
    });

    if (autoStart) {
      // Trigger background worker
      orderManager.startWorker(order.id).catch((err) => {
        console.error(`Worker error for order ${order.id}:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      order,
      chargedCredits: totalCost,
      remainingCredits: user ? user.credits - totalCost : undefined,
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tạo đơn' }, { status: 500 });
  }
}
