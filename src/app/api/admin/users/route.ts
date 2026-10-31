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
    const body = await req.json();
    const action = body.action || 'adjust_credits';

    // 1. Adjust Credits (Add / Deduct)
    if (action === 'adjust_credits') {
      const { userId, deltaCredits, memo } = body;
      if (!userId || deltaCredits === undefined) {
        return NextResponse.json({ success: false, error: 'Dữ liệu không đầy đủ' }, { status: 400 });
      }

      const numDelta = Number(deltaCredits);
      if (isNaN(numDelta) || numDelta === 0) {
        return NextResponse.json({ success: false, error: 'Số credits không hợp lệ' }, { status: 400 });
      }

      const targetUser = db.findUserById(userId);
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
      }

      db.updateUserCredits(userId, numDelta);

      const finalMemo =
        memo || (numDelta >= 0 ? 'Admin cộng điểm thủ công' : 'Admin trừ điểm thủ công');

      db.createTransaction({
        userId,
        username: targetUser.username,
        type: numDelta >= 0 ? 'bonus' : 'order_charge',
        amount: Math.abs(numDelta),
        credits: numDelta,
        memo: finalMemo,
        status: 'completed',
      });

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: numDelta >= 0 ? 'CREDIT_ADD' : 'CREDIT_DEDUCT',
        target: `${targetUser.username} (${targetUser.email})`,
        details: `${numDelta >= 0 ? '+' : ''}${numDelta.toLocaleString()} Credits • ${finalMemo}`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã ${numDelta >= 0 ? 'cộng' : 'trừ'} ${Math.abs(numDelta).toLocaleString()} Credits cho ${targetUser.username}.`,
        newCredits: targetUser.credits,
      });
    }

    // 2. Create New User Directly from Admin
    if (action === 'create_user') {
      const { username, email, password, role, status, initialCredits, note } = body;
      if (!username || username.trim().length < 3) {
        return NextResponse.json(
          { success: false, error: 'Tên tài khoản phải có ít nhất 3 ký tự.' },
          { status: 400 }
        );
      }
      if (!email || !email.includes('@')) {
        return NextResponse.json({ success: false, error: 'Email không hợp lệ.' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu phải từ 6 ký tự trở lên.' },
          { status: 400 }
        );
      }
      if (db.findUserByUsername(username.trim())) {
        return NextResponse.json(
          { success: false, error: 'Tên tài khoản đã tồn tại.' },
          { status: 409 }
        );
      }
      if (db.findUserByEmail(email.trim())) {
        return NextResponse.json({ success: false, error: 'Email đã tồn tại.' }, { status: 409 });
      }

      const created = db.adminCreateUser({
        username: username.trim(),
        email: email.trim(),
        password,
        role: role === 'admin' ? 'admin' : 'user',
        status: status === 'vip' ? 'vip' : 'active',
        initialCredits: Number(initialCredits) || 0,
        note,
      });

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'CREATE_USER',
        target: `${created.username} (${created.email})`,
        details: `Khởi tạo tài khoản • Quyền: ${created.role} • Credits: ${created.credits.toLocaleString()}`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã tạo tài khoản "${created.username}" thành công!`,
        user: created,
      });
    }

    // 3. Update User Role / VIP / Ban / CRM Note / Direct Password Reset
    if (action === 'update_user') {
      const { userId, role, status, note, newPassword } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
      }
      const targetUser = db.findUserById(userId);
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy tài khoản.' },
          { status: 404 }
        );
      }

      if (newPassword && newPassword.trim().length > 0 && newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu mới phải từ 6 ký tự trở lên.' },
          { status: 400 }
        );
      }

      const updated = db.adminUpdateUser(userId, { role, status, note, newPassword });
      const changes: string[] = [];
      if (role) changes.push(`Quyền → ${updated?.role}`);
      if (status) changes.push(`Trạng thái → ${updated?.status}`);
      if (typeof note === 'string') changes.push('Cập nhật ghi chú CRM');
      if (newPassword) changes.push('Đặt lại mật khẩu mới');

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'UPDATE_USER',
        target: `${targetUser.username} (${targetUser.email})`,
        details: changes.join(' • ') || 'Cập nhật hồ sơ khách hàng',
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật tài khoản ${targetUser.username} (${changes.join(', ')}).`,
      });
    }

    // 4. Delete User Account
    if (action === 'delete_user') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
      }
      if (userId === admin.id) {
        return NextResponse.json(
          { success: false, error: 'Không thể tự xoá tài khoản Quản trị viên đang đăng nhập.' },
          { status: 400 }
        );
      }
      const targetUser = db.findUserById(userId);
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy tài khoản.' },
          { status: 404 }
        );
      }

      const ok = db.adminDeleteUser(userId);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Không thể xoá tài khoản Quản trị viên gốc trong Whitelist.' },
          { status: 400 }
        );
      }

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'DELETE_USER',
        target: `${targetUser.username} (${targetUser.email})`,
        details: 'Xoá tài khoản khỏi hệ thống',
      });

      return NextResponse.json({
        success: true,
        message: `Đã xoá tài khoản ${targetUser.username} khỏi hệ thống.`,
      });
    }

    // 5. Bulk Credit Gift Campaign
    if (action === 'bulk_gift') {
      const { target, credits, memo } = body;
      const numCredits = Math.round(Number(credits));
      if (!numCredits || numCredits <= 0) {
        return NextResponse.json(
          { success: false, error: 'Số Credits tặng phải lớn hơn 0.' },
          { status: 400 }
        );
      }

      const validTarget: 'all' | 'vip' | 'active7d' =
        target === 'vip' || target === 'active7d' ? target : 'all';
      const count = db.adminBulkGiftCredits({
        target: validTarget,
        credits: numCredits,
        memo: memo || `Quà tặng tri ân từ Ban Quản Trị (+${numCredits.toLocaleString()} Credits)`,
      });

      db.recordAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'BULK_GIFT',
        target: `Nhóm: ${validTarget.toUpperCase()} (${count} khách hàng)`,
        details: `Tặng +${numCredits.toLocaleString()} Credits/người • Tổng phát hành: ${(count * numCredits).toLocaleString()} Credits`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã tặng thành công +${numCredits.toLocaleString()} Credits cho ${count} tài khoản khách hàng!`,
        rewardedCount: count,
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin user action error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi thao tác người dùng' },
      { status: 500 }
    );
  }
}
