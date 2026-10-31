import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

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
    const { action, code, creditBonus, maxUses, expiresAt } = await req.json();

    if (action === 'create') {
      if (!code || typeof code !== 'string' || code.trim().length < 3) {
        return NextResponse.json(
          { success: false, error: 'Mã Coupon phải có ít nhất 3 ký tự.' },
          { status: 400 }
        );
      }
      const bonus = Math.round(Number(creditBonus));
      const uses = Math.round(Number(maxUses));
      if (!bonus || bonus <= 0) {
        return NextResponse.json(
          { success: false, error: 'Số Credits thưởng phải lớn hơn 0.' },
          { status: 400 }
        );
      }
      if (!uses || uses <= 0) {
        return NextResponse.json(
          { success: false, error: 'Số lượt sử dụng tối đa phải lớn hơn 0.' },
          { status: 400 }
        );
      }

      const expIso = expiresAt
        ? new Date(expiresAt).toISOString()
        : new Date(Date.now() + 90 * 86400000).toISOString();

      const coupon = db.createCoupon({
        code: code.trim().toUpperCase(),
        creditBonus: bonus,
        maxUses: uses,
        expiresAt: expIso,
      });

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'COUPON_SAVE',
        target: coupon.code,
        details: `Thưởng +${coupon.creditBonus.toLocaleString()} Credits • Tối đa ${coupon.maxUses} lượt`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã lưu mã khuyến mãi ${coupon.code} (+${coupon.creditBonus.toLocaleString()} Credits).`,
        coupon,
      });
    }

    if (action === 'delete') {
      if (!code) {
        return NextResponse.json({ success: false, error: 'Thiếu mã Coupon' }, { status: 400 });
      }
      const deleted = db.deleteCoupon(code);
      if (!deleted) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy mã Coupon này.' },
          { status: 404 }
        );
      }

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'COUPON_DELETE',
        target: code.toUpperCase(),
        details: 'Xoá mã giảm giá khỏi hệ thống',
      });

      return NextResponse.json({
        success: true,
        message: `Đã xoá mã khuyến mãi ${code.toUpperCase()}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Thao tác không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin coupon API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi thao tác mã giảm giá' },
      { status: 500 }
    );
  }
}
