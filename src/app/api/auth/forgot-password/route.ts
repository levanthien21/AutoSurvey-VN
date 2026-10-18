import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { account } = await req.json();

    if (!account || typeof account !== 'string' || account.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập Email hoặc Tên đăng nhập.' },
        { status: 400 }
      );
    }

    const clean = account.trim().toLowerCase();
    const user = db.findUserByEmail(clean) || db.findUserByUsername(clean);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: `Không tìm thấy tài khoản tương ứng với "${account}". Vui lòng kiểm tra lại hoặc tạo tài khoản mới.`,
        },
        { status: 404 }
      );
    }

    // If account was created with Google OAuth
    if (user.googleId && !user.passwordHash) {
      return NextResponse.json({
        success: true,
        isGoogle: true,
        email: user.email,
        message: `Tài khoản ${user.email} được liên kết bảo mật trực tiếp với Google. Bạn chỉ cần bấm "Tiếp tục với Google" để đăng nhập ngay mà không cần mật khẩu.`,
      });
    }

    // Generate 6-digit verification OTP valid for 15 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.setResetOtp(user.id, otp, expiry);

    return NextResponse.json({
      success: true,
      hasOtp: true,
      otp, // Provided for instant on-screen verification & recovery
      email: user.email,
      username: user.username,
      message: `Đã tạo mã xác thực khôi phục mật khẩu cho tài khoản ${user.username} (${user.email}).`,
    });
  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi xử lý yêu cầu khôi phục mật khẩu' },
      { status: 500 }
    );
  }
}
