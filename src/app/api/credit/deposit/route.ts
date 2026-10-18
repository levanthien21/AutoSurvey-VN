import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 10000) {
      return NextResponse.json(
        { success: false, error: 'Số tiền nạp tối thiểu là 10.000 VNĐ.' },
        { status: 400 }
      );
    }

    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để tạo giao dịch nạp tiền.' },
        { status: 401 }
      );
    }

    // Calculate bonus
    let credits = numAmount;
    if (numAmount >= 1000000) {
      credits = Math.round(numAmount * 1.35); // +35%
    } else if (numAmount >= 500000) {
      credits = Math.round(numAmount * 1.30); // +30%
    } else if (numAmount >= 200000) {
      credits = Math.round(numAmount * 1.20); // +20%
    } else if (numAmount >= 100000) {
      credits = Math.round(numAmount * 1.10); // +10%
    }

    const settings = db.getSettings();
    const memo = `NAP ${user.id.toUpperCase().replace('USR_', '')}`;

    const tx = db.createTransaction({
      userId: user.id,
      username: user.username,
      type: 'deposit',
      amount: numAmount,
      credits,
      memo,
      status: 'pending',
    });

    const qrUrl = `https://img.vietqr.io/image/${settings.bankInfo.bankCode}-${settings.bankInfo.accountNumber}-compact2.png?amount=${numAmount}&addInfo=${encodeURIComponent(
      memo
    )}&accountName=${encodeURIComponent(settings.bankInfo.accountName)}`;

    return NextResponse.json({
      success: true,
      transaction: tx,
      qrUrl,
      bankInfo: settings.bankInfo,
      memo,
      credits,
    });
  } catch (err: any) {
    console.error('Deposit error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tạo giao dịch nạp' }, { status: 500 });
  }
}
