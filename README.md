# AutoSurvey VN — Nền Tảng Tự Động Điền Khảo Sát & Số Liệu SPSS / SmartPLS

Nền tảng tự động hóa điền khảo sát Google Forms và Microsoft Forms hàng đầu tại Việt Nam, tích hợp động cơ mô phỏng thống kê ma trận Cholesky Likert và trí tuệ nhân tạo Agentic AI đa nhân khẩu phục vụ sinh viên, học viên cao học và các đơn vị nghiên cứu thị trường.

---

## 🌟 Các Tính Năng Đột Phá

### 1. ⚡ 4 Chế Độ Điền Form Chuyên Sâu
1. **Mô Hình Nghiên Cứu Khoa Học (`/create-form/model`)**:
   - Tự động cấu trúc mô hình đường dẫn SEM / PLS-PM (Biến độc lập, trung gian, phụ thuộc).
   - Kiểm soát ma trận tương quan giữa các biến quan sát. Đảm bảo đạt độ tin cậy **Cronbach's Alpha $\ge 0.82$**, **Phương sai trích AVE $\ge 0.5$**, **Hệ số hồi quy $\beta$ có ý nghĩa thống kê ($p < 0.05$)** và **VIF $< 2.1$** (không đa cộng tuyến).
   - Xuất dữ liệu đã số hóa thang đo Likert 1-5 sẵn sàng nạp vào SPSS / SmartPLS.

2. **Tỉ Lệ & Phân Phối Chuẩn Gaussian (`/create-form/ratio`)**:
   - Tự động bóc tách cấu trúc câu hỏi và phương án từ URL Google Form.
   - Tuỳ chỉnh phần trăm (%) xuất hiện của từng đáp án với các mẫu thiết lập sẵn: Phân phối chuẩn (Bell Curve), Lệch tích cực (hài lòng cao), Lệch tiêu cực, Phân bổ đều.

3. **Nạp Data Bảng Tính Có Sẵn (`/create-form/data`)**:
   - Hỗ trợ tải lên file Excel (`.xlsx`, `.xls`) hoặc `.csv`.
   - Thuật toán tự động nhận diện và ánh xạ tiêu đề cột trong file vào câu hỏi Google Form chuẩn xác.

4. **AI Agent Tự Luận Đa Nhân Khẩu (`/create-form/agent`)**:
   - Tự động sinh hồ sơ người trả lời (Sinh viên Gen Z, Nhân viên văn phòng, Chuyên gia IT, Quản lý).
   - AI tự suy luận và viết câu trả lời tự luận tự nhiên 100% bằng tiếng Việt, không trùng lặp câu chữ.

---

### 2. 🧪 Phòng Lab Dữ Liệu Học Thuật
- **Bộ Tổng Hợp Dữ Liệu Sạch (`/data-builder`)**: Trình sinh dữ liệu thô độc lập cho mô hình nghiên cứu khoa học, xuất file Excel ngay tức thì.
- **Mã Hóa Thang Đo Likert (`/data-encode`)**: Tự động chuyển đổi các câu trả lời dạng chữ ("Hoàn toàn đồng ý", "Bình thường"...) sang điểm số 1 - 5, hỗ trợ mã hóa ngược (Reverse Coding).

---

### 3. 🛡️ Cơ Chế Bảo Vệ & An Toàn 100%
- Tự động trích xuất đúng token số nguyên `fbzx` từ Google Docs.
- Xoay vòng danh sách User-Agent trình duyệt hiện đại (Chrome, Safari, Firefox, Edge).
- Độ trễ tự nhiên (Random Jitter Delay 1.0s - 2.5s) mô phỏng chính xác hành vi người thật, không bị Google đánh dấu bot.
- Bảo hành dữ liệu 100% và cơ chế hoàn tiền tự động về ví khi hủy đơn.

---

### 4. 💳 Thanh Toán VietQR Tự Động 24/7
- Tích hợp cổng VietQR Napas chuẩn quốc gia.
- Xác nhận và cộng số dư credits tự động trong 5 - 10 giây.

---

## 🚀 Triển Khai Lên Vercel (1-Click Deployment)

Dự án được xây dựng bằng **Next.js 14 App Router** và đã được tối ưu hóa sẵn sàng cho Vercel:

1. Đăng nhập vào [Vercel](https://vercel.com).
2. Bấm **Add New...** -> **Project**.
3. Chọn kho lưu trữ GitHub: `https://github.com/levanthien21/AutoSurvey-VN`.
4. Thiết lập Build Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
5. Bấm **Deploy**. Sau 1 - 2 phút, hệ thống sẽ hoạt động trên tên miền Vercel của bạn!

---

## 🛠️ Chạy Cục Bộ (Local Development)

```bash
# 1. Cài đặt thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Mở trình duyệt tại:
http://localhost:3000
```
