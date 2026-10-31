import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await db.syncFromBlob();
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 401 });
  }

  if (user.status === 'banned' && user.role !== 'admin') {
    return NextResponse.json(
      { success: false, authenticated: false, banned: true, error: 'Tài khoản đã bị khoá.' },
      { status: 403 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  const ua = req.headers.get('user-agent') || '';
  db.touchUserActivity(user.id, ip, ua);

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      avatar: user.avatar,
      credits: user.credits,
      createdAt: user.createdAt,
    },
  });
}
