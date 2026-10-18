import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { orderManager } from '@/lib/orderStore';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = orderManager.getOrder(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // 1. Sheet: Dữ liệu khảo sát
    const rows: Record<string, any>[] = [];

    order.responsesQueue.forEach((payload, idx) => {
      const isCompleted = idx < order.completedCount;
      const row: Record<string, any> = {
        'STT': idx + 1,
        'Trạng thái': isCompleted ? 'Đã gửi' : 'Chờ xử lý',
      };

      // Extract field values
      Object.entries(payload).forEach(([key, val]) => {
        // Flatten array or single value
        if (Array.isArray(val)) {
          row[key] = val.join(', ');
        } else {
          row[key] = val;
        }
      });

      rows.push(row);
    });

    const wb = XLSX.utils.book_new();

    // Add main data sheet
    const wsData = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Thông báo': 'Chưa có phản hồi' }]);
    XLSX.utils.book_append_sheet(wb, wsData, 'Dữ liệu khảo sát');

    // 2. Sheet: Tổng quan chiến dịch
    const overviewRows = [
      { 'Chỉ tiêu': 'Mã đơn hàng', 'Giá trị': order.id },
      { 'Chỉ tiêu': 'Tên chiến dịch', 'Giá trị': order.title },
      { 'Chỉ tiêu': 'Chế độ điền', 'Giá trị': order.mode },
      { 'Chỉ tiêu': 'Link Google Form', 'Giá trị': order.formUrl },
      { 'Chỉ tiêu': 'Tổng số lượng mục tiêu', 'Giá trị': order.totalTarget },
      { 'Chỉ tiêu': 'Đã hoàn thành', 'Giá trị': order.completedCount },
      { 'Chỉ tiêu': 'Gửi thành công', 'Giá trị': order.successCount },
      { 'Chỉ tiêu': 'Gửi thất bại', 'Giá trị': order.errorCount },
      { 'Chỉ tiêu': 'Tỉ lệ thành công', 'Giá trị': `${Math.round((order.successCount / (order.completedCount || 1)) * 100)}%` },
      { 'Chỉ tiêu': 'Trạng thái hiện tại', 'Giá trị': order.status },
      { 'Chỉ tiêu': 'Thời gian tạo', 'Giá trị': new Date(order.createdAt).toLocaleString('vi-VN') },
      { 'Chỉ tiêu': 'Thời gian hoàn tất/cập nhật', 'Giá trị': new Date(order.updatedAt).toLocaleString('vi-VN') },
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan chiến dịch');

    // 3. Sheet: Nhật ký chi tiết (Logs)
    if (order.logs && order.logs.length > 0) {
      const logRows = order.logs.map((l) => ({
        'STT Lần gửi': l.index,
        'Thời gian': l.timestamp,
        'Kết quả': l.status === 'success' ? 'Thành công' : 'Lỗi',
        'Thông điệp': l.message,
      }));
      const wsLogs = XLSX.utils.json_to_sheet(logRows);
      XLSX.utils.book_append_sheet(wb, wsLogs, 'Nhật ký gửi');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Bao_Cao_Khao_Sat_${order.id}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('Error generating Excel report:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xuất báo cáo Excel' }, { status: 500 });
  }
}
