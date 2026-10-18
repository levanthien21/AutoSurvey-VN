import { NextRequest, NextResponse } from 'next/server';
import { db, verifyPassword } from '@/lib/db';
import { generateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }, { status: 400 });
    }

    const cleanInput = username.trim().toLowerCase();
    // Allow login with either username or email
    const user = db.findUserByUsername(cleanInput) || db.findUserByEmail(cleanInput);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    const valid = verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Tài khoản hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    const token = generateSessionToken(user.id);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      credits: user.credits,
      createdAt: user.createdAt,
    };

    const res = NextResponse.json({
      success: true,
      message:
        user.role === 'admin'
          ? `Đăng nhập thành công với quyền Quản trị viên! Xin chào ${user.username}.`
          : `Đăng nhập thành công. Xin chào ${user.username}!`,
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
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xử lý đăng nhập' }, { status: 500 });
  }
}
