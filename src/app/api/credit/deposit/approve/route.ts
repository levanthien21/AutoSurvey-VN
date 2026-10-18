import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { txId } = await req.json();

    if (!txId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã giao dịch txId' }, { status: 400 });
    }

    const tx = db.approveTransaction(txId);
    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Giao dịch không tồn tại hoặc đã được xử lý trước đó.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã duyệt thành công giao dịch #${txId}. Đã cộng ${tx.credits.toLocaleString()} Credits cho người dùng ${tx.username}.`,
      transaction: tx,
    });
  } catch (err: any) {
    console.error('Approve deposit error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi duyệt giao dịch' }, { status: 500 });
  }
}
