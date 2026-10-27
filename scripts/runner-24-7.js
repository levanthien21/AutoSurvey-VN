/**
 * Auto-Survey VN - 24/7 Background Runner Daemon
 * 
 * Chạy liên tục 24/7 để giữ tiến trình nộp khảo sát hoạt động xuyên suốt,
 * độc lập cho từng đơn hàng với thời gian ngẫu nhiên 8-10 phút.
 * 
 * Cách dùng:
 *   node scripts/runner-24-7.js
 */

const https = require('https');
const http = require('http');

const API_BASE = process.env.SURVEY_RUNNER_API || 'https://auto-survey-vn.vercel.app';
const CHECK_INTERVAL_MS = 30000; // Kiểm tra mỗi 30 giây

console.log('='.repeat(60));
console.log('🚀 Auto-Survey VN - 24/7 Background Runner Daemon');
console.log(`🌐 Target: ${API_BASE}`);
console.log(`⏱️ Chu kỳ kiểm tra: ${CHECK_INTERVAL_MS / 1000}s`);
console.log('='.repeat(60));

function pingCron() {
  const url = `${API_BASE}/api/cron/orders`;
  const client = url.startsWith('https') ? https : http;

  const req = client.get(url, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        const time = new Date().toLocaleTimeString();

        if (json.success) {
          console.log(`[${time}] ✅ Active: ${json.activeCount} đơn | Đã nộp: ${json.steppedCount} đơn | Chờ hẹn giờ: ${json.skipped?.length || 0} đơn`);
          if (json.stepped && json.stepped.length > 0) {
            json.stepped.forEach((s) => {
              console.log(`   👉 [VỪA NỘP] Đơn #${s.id} (${s.title}): ${s.completedCount}/${s.totalTarget}`);
            });
          }
          if (json.skipped && json.skipped.length > 0) {
            json.skipped.forEach((sk) => {
              const m = Math.floor(sk.secondsRemaining / 60);
              const s = sk.secondsRemaining % 60;
              console.log(`   ⏳ [HẸN GIỜ] Đơn #${sk.id}: còn ${m}m ${s}s (Tiến độ: ${sk.completedCount}/${sk.totalTarget})`);
            });
          }
        } else {
          console.warn(`[${time}] ⚠️ Server trả về lỗi:`, json.error);
        }
      } catch (e) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Lỗi đọc JSON phản hồi:`, body.slice(0, 150));
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Lỗi kết nối mạng:`, err.message);
  });
}

// Chạy ngay lần đầu tiên
pingCron();

// Lặp lại chu kỳ
setInterval(pingCron, CHECK_INTERVAL_MS);
