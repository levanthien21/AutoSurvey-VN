import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  await db.syncFromBlob();
  return NextResponse.json({ success: true, settings: db.getSettings() });
}

export async function POST(req: NextRequest) {
  await db.syncFromBlob();

  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Không có quyền truy cập quản trị' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updated = db.updateSettings(body);

    const changedKeys = Object.keys(body || {}).join(', ');
    db.recordAuditLog({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'SETTINGS_UPDATE',
      target: 'Cấu hình Hệ thống',
      details: `Cập nhật mục: ${changedKeys}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình hệ thống thành công!',
      settings: updated,
    });
  } catch (err: any) {
    console.error('Settings update error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi cập nhật cấu hình' },
      { status: 500 }
    );
  }
}
