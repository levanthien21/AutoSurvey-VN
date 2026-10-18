# Auto-Survey — Hệ thống Điền Form Tự Động & Xử Lý Số Liệu NCKH

Dự án được clone và tái cấu trúc dựa trên công cụ kỹ thuật đảo ngược **REA (`morluto/rea`)** kết hợp phân tích ứng dụng mục tiêu **Fillform (`app.fillform.info`)**.

---

## 🚀 Các tính năng chính

### 1. ⚡ Tạo form ngay (4 chế độ chuyên sâu cho Google Forms)
1. **Điền theo tỉ lệ mong muốn (`/create-form/ratio`)**:
   - Tự động bóc tách cấu trúc câu hỏi, loại câu hỏi và phương án từ link Google Form.
   - Tuỳ chỉnh phần trăm (%) xuất hiện của từng đáp án.
   - Các mẫu phân phối thiết lập sẵn: Phân phối chuẩn (Bell Curve), Nghiêng tích cực / hài lòng cao, Nghiêng tiêu cực, Phân bổ đều.
2. **Điền data có trước (`/create-form/data`)**:
   - Tải file Excel (`.xlsx`, `.xls`) hoặc `.csv`.
   - Xem trước dữ liệu và tự động ánh xạ cột Excel sang câu hỏi Google Form.
   - Nộp tự động từng bản ghi theo hàng loạt.
3. **Điền theo mô hình NCKH (`/create-form/model`)**:
   - Thiết kế mô hình cấu trúc SEM / PLS-PM (Nhân tố độc lập, trung gian, phụ thuộc).
   - Đảm bảo các chỉ số kiểm định học thuật khắt khe: **Cronbach's Alpha $\ge 0.8$**, **AVE $\ge 0.5$**, **Hệ số hồi quy $\beta$ có ý nghĩa ($p < 0.05$)**, **VIF $< 3$** (không đa cộng tuyến).
   - Nộp trực tiếp vào Google Form hoặc tải file Excel thô dùng cho SPSS / SmartPLS.
4. **AI Agent điền form (`/create-form/agent`)**:
   - Mô phỏng đối tượng khảo sát (Sinh viên Gen Z, Nhân viên văn phòng, Quản lý, Đa dạng nhân khẩu học).
   - Tự động sinh nội dung tự luận phong phú, ngôn từ tự nhiên tiếng Việt 100%.

### 2. 🧪 Dịch vụ dữ liệu học thuật
- **Build dữ liệu đẹp (`/data-builder`)**: Trình sinh dữ liệu thô độc lập cho mô hình nghiên cứu khoa học, xuất file Excel sẵn sàng nạp vào SPSS / SmartPLS.
- **Mã hoá data (`/data-encode`)**: Tự động chuyển đổi các câu trả lời dạng chữ ("Hoàn toàn đồng ý", "Bình thường"...) sang điểm số Likert (1 - 5) và hỗ trợ đảo chiều (Reverse Coding).

### 3. 📋 Quản lý đơn hàng & Tiến trình thời gian thực
- **Theo dõi qua Server-Sent Events (SSE) (`/orders`)**:
  - Live Submission Terminal: Xem trạng thái từng lượt gửi (`[OK]`, `[ERR]`), mã lượt, thời gian.
  - Tạm dừng, Tiếp tục, Hủy tiến trình.
  - Cơ chế chống chặn Google Bot: Ngẫu nhiên hóa User-Agent, ngẫu nhiên hóa thời gian chờ (Jitter delay).

### 4. 💳 Ví credits & Cài đặt hệ thống
- **Nạp tiền / Quản lý số dư (`/credit`)**: Giao diện VietQR, gói nạp credit, lịch sử giao dịch.
- **Cài đặt hệ thống (`/settings`)**: Cấu hình thời gian delay, chế độ proxy, tự động xoay User-Agent.

---

## 🛠️ Cài đặt & Khởi chạy

### Yêu cầu hệ thống:
- **Node.js**: v18+ hoặc v20+ / v22+
- **Trình duyệt**: Chrome, Edge, Firefox, Safari

### Các bước khởi chạy:
```bash
# 1. Cài đặt các gói phụ thuộc (nếu chưa có)
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev

# 3. Mở trình duyệt và truy cập:
http://localhost:3000
```

Hoặc build bản production tối ưu:
```bash
npm run build
npm start
```

---

## 📂 Cấu trúc thư mục

```
Auto-Survey/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── forms/parse/         # Bóc tách cấu trúc Google Forms
│   │   │   ├── orders/              # Quản lý đơn & SSE live stream
│   │   │   └── data-builder/        # Sinh dữ liệu NCKH & xuất Excel
│   │   ├── create-form/
│   │   │   ├── ratio/               # Chế độ 1: Theo tỉ lệ %
│   │   │   ├── data/                # Chế độ 2: Theo file Excel
│   │   │   ├── model/               # Chế độ 3: Theo mô hình NCKH
│   │   │   └── agent/               # Chế độ 4: AI Agent
│   │   ├── data-builder/            # Build dữ liệu đẹp SPSS
│   │   ├── data-encode/             # Mã hoá thang đo
│   │   ├── orders/                  # Theo dõi tiến trình đơn hàng
│   │   ├── credit/                  # Ví & Nạp tiền VietQR
│   │   └── settings/                # Cài đặt tốc độ & bot bypass
│   ├── components/
│   │   ├── Sidebar.tsx              # Thanh điều hướng chuẩn Fillform
│   │   ├── Navbar.tsx               # Header hệ thống
│   │   └── StatisticalReport.tsx    # Bảng kết quả kiểm định NCKH
│   └── lib/
│       ├── googleFormParser.ts      # Engine phân tích Google Forms
│       ├── googleFormSubmitter.ts   # Engine gửi dữ liệu & chống bot
│       ├── orderStore.ts            # Quản lý hàng đợi & worker nền
│       └── statisticsEngine.ts      # Thư viện tính toán Cronbach, SEM, Regression
└── package.json
```
