import { NextRequest, NextResponse } from 'next/server';
import { db, verifyPassword, hashPassword } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để thực hiện đổi mật khẩu' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.passwordHash, user.salt)) {
      return NextResponse.json({ success: false, error: 'Mật khẩu hiện tại không chính xác' }, { status: 400 });
    }

    // Update password
    const newHash = hashPassword(newPassword, user.salt);
    user.passwordHash = newHash;
    user.updatedAt = new Date().toISOString();

    // Trigger save in db
    (db as any).saveDb();

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi đổi mật khẩu' }, { status: 500 });
  }
}
