import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập mã khuyến mãi.' }, { status: 400 });
    }

    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để sử dụng mã khuyến mãi.' }, { status: 401 });
    }

    const result = db.redeemCoupon(code, user.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    const updatedUser = db.findUserById(user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
      bonus: result.bonus,
      newCredits: updatedUser?.credits,
    });
  } catch (err: any) {
    console.error('Coupon redemption error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi áp dụng mã' }, { status: 500 });
  }
}
