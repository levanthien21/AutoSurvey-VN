import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await db.syncFromBlob();

    const admin = getUserFromRequest(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên mới có quyền duyệt giao dịch nạp tiền.' },
        { status: 403 }
      );
    }

    const { txId, action = 'approve', reason } = await req.json();

    if (!txId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã giao dịch txId' }, { status: 400 });
    }

    if (action === 'reject') {
      const tx = db.rejectTransaction(txId, reason);
      if (!tx) {
        return NextResponse.json(
          { success: false, error: 'Giao dịch không tồn tại hoặc đã được xử lý trước đó.' },
          { status: 400 }
        );
      }

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'DEPOSIT_REJECT',
        target: `#${txId} (${tx.username})`,
        details: `Từ chối lệnh nạp ${tx.amount.toLocaleString()}đ${reason ? ` • Lý do: ${reason}` : ''}`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã từ chối giao dịch #${txId} của ${tx.username}.`,
        transaction: tx,
      });
    }

    const tx = db.approveTransaction(txId);
    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Giao dịch không tồn tại hoặc đã được xử lý trước đó.' },
        { status: 400 }
      );
    }

    // Auto-reward referrer 10% commission on deposit
    const commission = db.rewardReferrerOnDeposit(tx.userId, tx.amount);

    db.recordAuditLog({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'DEPOSIT_APPROVE',
      target: `#${txId} (${tx.username})`,
      details: `Duyệt nạp ${tx.amount.toLocaleString()}đ → +${tx.credits.toLocaleString()} Credits`,
    });

    return NextResponse.json({
      success: true,
      message: `Đã duyệt thành công giao dịch #${txId}. Đã cộng ${tx.credits.toLocaleString()} Credits cho người dùng ${tx.username}.${
        commission > 0
          ? ` (Đã chi trả ${commission.toLocaleString()} Credits hoa hồng Affiliate cho người giới thiệu)`
          : ''
      }`,
      transaction: tx,
      commissionAwarded: commission,
    });
  } catch (err: any) {
    console.error('Approve deposit error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi duyệt giao dịch' },
      { status: 500 }
    );
  }
}
