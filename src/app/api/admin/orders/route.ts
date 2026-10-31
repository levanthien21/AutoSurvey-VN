import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { orderManager } from '@/lib/orderStore';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  await Promise.all([db.syncFromBlob(), orderManager.syncFromBlob()]);

  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Không có quyền truy cập quản trị' },
      { status: 403 }
    );
  }

  try {
    const { action, orderId } = await req.json();

    if (action === 'pause_all') {
      const running = orderManager.getActiveRunningOrders();
      for (const ord of running) {
        orderManager.pauseWorker(ord.id);
      }
      await orderManager.saveToBlob();
      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_PAUSE_ALL',
        target: `${running.length} đơn đang chạy`,
        details: 'Tạm dừng đồng loạt tất cả đơn hàng đang chạy trên toàn hệ thống',
      });
      return NextResponse.json({
        success: true,
        message: `Đã tạm dừng ${running.length} đơn hàng đang chạy.`,
      });
    }

    if (action === 'resume_all') {
      const paused = orderManager
        .getAllOrders()
        .filter((o) => o.status === 'paused' && o.completedCount < o.totalTarget);
      for (const ord of paused) {
        orderManager.updateOrder(ord.id, {
          status: 'running',
          nextScheduledAt: new Date().toISOString(),
        });
      }
      await orderManager.saveToBlob();
      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_RESUME_ALL',
        target: `${paused.length} đơn tạm dừng`,
        details: 'Kích hoạt chạy tiếp toàn bộ đơn đang tạm dừng (24/7 Cloud Cron)',
      });
      return NextResponse.json({
        success: true,
        message: `Đã kích hoạt chạy lại ${paused.length} đơn hàng đang tạm dừng!`,
      });
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã đơn hàng orderId' }, { status: 400 });
    }

    const order = orderManager.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (action === 'get_logs') {
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          title: order.title,
          formUrl: order.formUrl,
          username: order.username,
          userEmail: order.userEmail,
          status: order.status,
          completedCount: order.completedCount,
          totalTarget: order.totalTarget,
          successCount: order.successCount,
          errorCount: order.errorCount,
          logs: order.logs || [],
        },
      });
    }

    if (action === 'pause') {
      orderManager.pauseWorker(orderId);
      await orderManager.saveToBlob();
      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_PAUSE',
        target: `#${order.id} (${order.username || order.userEmail || 'Khách'})`,
        details: `Tạm dừng đơn "${order.title}" tại tiến độ ${order.completedCount}/${order.totalTarget}`,
      });
      return NextResponse.json({
        success: true,
        message: `Đã tạm dừng đơn #${order.id}.`,
      });
    }

    if (action === 'resume') {
      if (order.completedCount >= order.totalTarget) {
        return NextResponse.json(
          { success: false, error: 'Đơn hàng này đã hoàn thành đủ số lượng mục tiêu.' },
          { status: 400 }
        );
      }
      orderManager.updateOrder(orderId, {
        status: 'running',
        nextScheduledAt: new Date().toISOString(),
      });
      // Trigger 1 immediate background step
      orderManager.executeStep(orderId).catch(() => {});
      await orderManager.saveToBlob();

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_RESUME',
        target: `#${order.id} (${order.username || order.userEmail || 'Khách'})`,
        details: `Tiếp tục chạy đơn "${order.title}" (${order.completedCount}/${order.totalTarget})`,
      });
      return NextResponse.json({
        success: true,
        message: `Đã kích hoạt chạy tiếp đơn #${order.id}!`,
      });
    }

    if (action === 'force_step') {
      if (order.completedCount >= order.totalTarget) {
        return NextResponse.json(
          { success: false, error: 'Đơn hàng đã đạt đủ số lượng mục tiêu.' },
          { status: 400 }
        );
      }
      if (order.status === 'paused') {
        orderManager.updateOrder(orderId, { status: 'running' });
      }
      const updated = await orderManager.executeStep(orderId);
      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_FORCE_STEP',
        target: `#${order.id}`,
        details: `Bơm tức thì +1 lượt điền form → Tiến độ: ${updated?.completedCount}/${updated?.totalTarget}`,
      });
      return NextResponse.json({
        success: true,
        message: `Đã đẩy tức thì +1 phản hồi cho đơn #${order.id} (${updated?.completedCount}/${updated?.totalTarget}).`,
      });
    }

    if (action === 'cancel') {
      if (order.status === 'cancelled' || order.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Đơn hàng đã kết thúc hoặc đã huỷ trước đó.' },
          { status: 400 }
        );
      }
      const uncompleted = Math.max(0, order.totalTarget - order.completedCount);
      orderManager.cancelOrder(orderId);
      await orderManager.saveToBlob();

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_CANCEL',
        target: `#${order.id} (${order.username || order.userEmail || 'Khách'})`,
        details: `Huỷ đơn & hoàn Credits cho ${uncompleted} phản hồi chưa chạy`,
      });
      return NextResponse.json({
        success: true,
        message: `Đã huỷ đơn #${order.id} và tự động hoàn tiền ${uncompleted} lượt chưa thực hiện.`,
      });
    }

    if (action === 'delete') {
      orderManager.deleteOrder(orderId);
      await orderManager.saveToBlob();
      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ORDER_DELETE',
        target: `#${order.id}`,
        details: `Xoá vĩnh viễn bản ghi đơn "${order.title}"`,
      });
      return NextResponse.json({
        success: true,
        message: `Đã xoá đơn hàng #${order.id} khỏi danh sách.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Thao tác đơn hàng không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin orders API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi điều hành đơn hàng' },
      { status: 500 }
    );
  }
}
