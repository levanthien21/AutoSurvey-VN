import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, name, avatar, googleId } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email tài khoản Google không hợp lệ.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Create or retrieve Google user with automatic Admin role check
    const user = db.createGoogleUser({
      email: cleanEmail,
      name,
      avatar,
      googleId,
    });

    // Generate session token
    const token = generateSessionToken(user.id);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      credits: user.credits,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    const res = NextResponse.json({
      success: true,
      message:
        user.role === 'admin'
          ? `Đăng nhập Google thành công! Cấp đặc quyền Quản trị viên (Admin) cho ${user.email}.`
          : `Đăng nhập Google thành công! Xin chào ${user.username}.`,
      user: safeUser,
      token,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xử lý xác thực Google' }, { status: 500 });
  }
}
