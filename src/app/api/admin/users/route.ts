import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Không có quyền truy cập quản trị' }, { status: 403 });
  }

  try {
    const { userId, deltaCredits, memo } = await req.json();

    if (!userId || deltaCredits === undefined) {
      return NextResponse.json({ success: false, error: 'Dữ liệu không đầy đủ' }, { status: 400 });
    }

    const numDelta = Number(deltaCredits);
    if (isNaN(numDelta)) {
      return NextResponse.json({ success: false, error: 'Số credits không hợp lệ' }, { status: 400 });
    }

    const targetUser = db.findUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Update credits
    db.updateUserCredits(userId, numDelta);

    // Record transaction
    db.createTransaction({
      userId,
      username: targetUser.username,
      type: numDelta >= 0 ? 'bonus' : 'order_charge',
      amount: Math.abs(numDelta),
      credits: numDelta,
      memo: memo || (numDelta >= 0 ? 'Admin cộng điểm thủ công' : 'Admin trừ điểm thủ công'),
      status: 'completed',
    });

    return NextResponse.json({
      success: true,
      message: `Đã ${numDelta >= 0 ? 'cộng' : 'trừ'} ${Math.abs(numDelta).toLocaleString()} Credits cho ${targetUser.username}.`,
      newCredits: targetUser.credits,
    });
  } catch (err: any) {
    console.error('Admin user action error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi thao tác người dùng' }, { status: 500 });
  }
}
