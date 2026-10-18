import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check collision
    if (db.findUserByUsername(cleanUsername)) {
      return NextResponse.json({ success: false, error: 'Tên đăng nhập đã được sử dụng.' }, { status: 409 });
    }

    if (db.findUserByEmail(cleanEmail)) {
      return NextResponse.json({ success: false, error: 'Email đã được đăng ký.' }, { status: 409 });
    }

    // Create user (auto-detects admin if whitelisted or first user)
    const user = db.createUser(cleanUsername, cleanEmail, password);

    // Record welcome bonus transaction
    db.createTransaction({
      userId: user.id,
      username: user.username,
      type: 'bonus',
      amount: 0,
      credits: user.credits,
      memo:
        user.role === 'admin'
          ? 'Khởi tạo tài khoản Quản trị viên (1.000.000 Credits)'
          : 'Quà tặng chào mừng thành viên mới (5.000 Credits)',
      status: 'completed',
    });

    // Generate session token
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
          ? 'Đăng ký tài khoản Quản trị viên thành công! Cấp quyền Admin & 1.000.000 Credits.'
          : 'Đăng ký tài khoản thành công! Tặng bạn 5.000 Credits trải nghiệm.',
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
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xử lý đăng ký' }, { status: 500 });
  }
}
