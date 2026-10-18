import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { uid, email, displayName, photoURL } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email tài khoản không hợp lệ.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists or create new
    let user = db.findUserByEmail(cleanEmail);
    if (!user) {
      user = db.createGoogleUser({
        email: cleanEmail,
        name: displayName,
        avatar: photoURL,
        googleId: uid,
      });
    } else {
      if (photoURL && !user.avatar) {
        user.avatar = photoURL;
        db.saveDb();
      }
      if (uid && !user.googleId) {
        user.googleId = uid;
        db.saveDb();
      }
    }

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
          ? `Đăng nhập Firebase thành công! Đặc quyền Quản trị viên (Admin) đã được kích hoạt cho ${user.email}.`
          : `Đăng nhập Firebase thành công! Xin chào ${user.username}.`,
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
    console.error('Firebase Auth API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xử lý xác thực Firebase' }, { status: 500 });
  }
}
