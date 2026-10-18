import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { account, otp, newPassword } = await req.json();

    if (!account || typeof account !== 'string' || !otp || typeof otp !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin tài khoản hoặc mã xác thực OTP.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    const result = db.verifyAndResetPassword(account, otp, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Đặt lại mật khẩu thất bại' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay.',
      username: result.user?.username,
    });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi cập nhật mật khẩu mới' },
      { status: 500 }
    );
  }
}
