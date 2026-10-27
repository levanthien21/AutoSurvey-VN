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
      pageHistory,
      platform,
      antiForgeryToken,
      serverSessionId,
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
        {
          success: false,
          error: 'Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu chạy đơn. Tài khoản chưa đăng ký sẽ có 0 Credits.',
        },
        { status: 401 }
      );
    }

    const count = totalTarget || responsesQueue.length;
    const settings = db.getSettings();
    const modeKey = (mode as keyof typeof settings.pricePerResponse) || 'ratio';
    const costPerResponse = settings.pricePerResponse[modeKey] || 100;
    const totalCost = count * costPerResponse;

    const isMs = platform === 'microsoft' || submitUrl.includes('forms.cloud.microsoft') || submitUrl.includes('forms.office.com');
    const formBrand = isMs ? 'Microsoft Form' : 'Google Form';

    // Credit verification
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
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

      // Deduct credits for regular users
      db.updateUserCredits(user.id, -totalCost);

      // Record transaction
      db.createTransaction({
        userId: user.id,
        username: user.username,
        type: 'order_charge',
        amount: totalCost,
        credits: -totalCost,
        memo: `Thanh toán khảo sát: ${title || formBrand} (${count} phản hồi)`,
        status: 'completed',
      });
    } else {
      // Admin privilege: Unlimited credits, 0 charge
      db.createTransaction({
        userId: user.id,
        username: user.username,
        type: 'order_charge',
        amount: 0,
        credits: 0,
        memo: `[Đặc quyền Admin - Miễn phí] Khảo sát: ${title || formBrand} (${count} phản hồi)`,
        status: 'completed',
      });
    }

    const order = orderManager.createOrder({
      userId: user.id,
      title: title || 'Đơn điền form tự động',
      formUrl,
      submitUrl,
      platform: isMs ? 'microsoft' : 'google',
      antiForgeryToken,
      serverSessionId,
      mode,
      totalTarget: count,
      delayMin: delayMin ? Number(delayMin) : settings.defaultDelayMin || 1.0,
      delayMax: delayMax ? Number(delayMax) : settings.defaultDelayMax || 2.5,
      costPerResponse: isAdmin ? 0 : costPerResponse,
      totalCost: isAdmin ? 0 : totalCost,
      responsesQueue,
      fbzx,
      pageHistory,
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
      chargedCredits: isAdmin ? 0 : totalCost,
      remainingCredits: isAdmin ? 999999999 : user.credits - totalCost,
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tạo đơn' }, { status: 500 });
  }
}
