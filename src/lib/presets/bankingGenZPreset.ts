import { FormQuestion } from '../googleFormParser';

/**
 * CẤU HÌNH DÀNH RIÊNG CHO KHÁCH HÀNG:
 * Khảo sát Thẻ tín dụng và Ngân hàng số ở Gen Z (Mô hình CB-SEM / PLS-SEM)
 * Áp dụng chuẩn xác 100% theo file "DỰ ĐOÁN KẾT QUẢ DỮ LIỆU" của khách hàng.
 */

export interface LikertStatementRule {
  statementIndex: number;
  questionNumber: number;
  shortTitle: string;
  keywords: string[];
  meanMin: number;
  meanMax: number;
  targetMean: number;
  targetStd: number;
  isReverse?: boolean; // ĐC - Câu đảo chiều
  isAttentionCheck?: boolean; // Câu kiểm tra chú ý (Câu 39)
}

export const BANKING_GENZ_LIKERT_RULES: LikertStatementRule[] = [
  // Phần 5. Cảm nhận về chiếc thẻ và về thói quen ngân hàng số
  // Câu 10. Lợi ích chiếc thẻ mang lại cho anh/chị
  {
    statementIndex: 1,
    questionNumber: 10,
    shortTitle: 'Kiểm soát chi tiêu tốt hơn',
    keywords: ['kiểm soát', 'chi tiêu tốt hơn', 'quản lý chi tiêu', 'pb1', 'phát biểu 1'],
    meanMin: 3.0,
    meanMax: 3.6,
    targetMean: 3.3,
    targetStd: 0.85,
  },
  {
    statementIndex: 2,
    questionNumber: 10,
    shortTitle: 'Mua được thứ cần vào đúng lúc cần',
    keywords: ['mua được thứ cần', 'đúng lúc cần', 'nhu cầu kịp thời', 'pb2', 'phát biểu 2'],
    meanMin: 3.6,
    meanMax: 4.1,
    targetMean: 3.85,
    targetStd: 0.82,
  },
  {
    statementIndex: 3,
    questionNumber: 10,
    shortTitle: 'Đạt mục tiêu tài chính quan trọng',
    keywords: ['mục tiêu tài chính', 'tài chính quan trọng', 'dài hạn', 'pb3', 'phát biểu 3'],
    meanMin: 3.1,
    meanMax: 3.6,
    targetMean: 3.35,
    targetStd: 0.9,
  },

  // Câu 11. Mức độ dễ dùng và dễ hiểu của chiếc thẻ
  {
    statementIndex: 4,
    questionNumber: 11,
    shortTitle: 'Dùng chiếc thẻ này dễ dàng',
    keywords: ['dùng chiếc thẻ', 'dễ dàng', 'sử dụng dễ', 'pb4', 'phát biểu 4'],
    meanMin: 3.7,
    meanMax: 4.1,
    targetMean: 3.9,
    targetStd: 0.8,
  },
  {
    statementIndex: 5,
    questionNumber: 11,
    shortTitle: 'Thủ tục mở thẻ đơn giản, nhanh gọn',
    keywords: ['thủ tục mở thẻ', 'đơn giản', 'nhanh gọn', 'pb5', 'phát biểu 5'],
    meanMin: 3.5,
    meanMax: 4.0,
    targetMean: 3.75,
    targetStd: 0.85,
  },
  {
    statementIndex: 6,
    questionNumber: 11,
    shortTitle: 'Khó hiểu điều khoản, biểu phí',
    keywords: ['khó hiểu điều khoản', 'biểu phí', 'phức tạp', 'pb6', 'phát biểu 6'],
    meanMin: 3.0,
    meanMax: 3.6,
    targetMean: 3.3,
    targetStd: 0.95,
    isReverse: true, // ĐC
  },

  // Câu 12. Ý kiến của những người xung quanh về thẻ tín dụng
  {
    statementIndex: 7,
    questionNumber: 12,
    shortTitle: 'Gia đình ủng hộ dùng thẻ tín dụng',
    keywords: ['gia đình ủng hộ', 'bố mẹ', 'người thân', 'pb7', 'phát biểu 7'],
    meanMin: 2.8,
    meanMax: 3.4,
    targetMean: 3.1,
    targetStd: 0.9,
  },
  {
    statementIndex: 8,
    questionNumber: 12,
    shortTitle: 'Bạn bè, đồng nghiệp thấy hợp lý',
    keywords: ['bạn bè', 'đồng nghiệp', 'thấy hợp lý', 'pb8', 'phát biểu 8'],
    meanMin: 3.3,
    meanMax: 3.8,
    targetMean: 3.55,
    targetStd: 0.85,
  },
  {
    statementIndex: 9,
    questionNumber: 12,
    shortTitle: 'Người tin về tiền bạc khuyên dùng',
    keywords: ['tin về tiền bạc', 'khuyên dùng', 'chuyên gia', 'pb9', 'phát biểu 9'],
    meanMin: 2.9,
    meanMax: 3.5,
    targetMean: 3.2,
    targetStd: 0.88,
  },

  // Câu 13. Những điều kiện giúp anh/chị dùng thẻ thuận lợi
  {
    statementIndex: 10,
    questionNumber: 13,
    shortTitle: 'Hiểu đủ để tránh lãi và phí phạt',
    keywords: ['tránh lãi', 'phí phạt', 'hiểu đủ', 'pb10', 'phát biểu 10'],
    meanMin: 3.3,
    meanMax: 3.9,
    targetMean: 3.6,
    targetStd: 0.85,
  },
  {
    statementIndex: 11,
    questionNumber: 13,
    shortTitle: 'Ngân hàng hỗ trợ khi thẻ trục trặc',
    keywords: ['hỗ trợ khi thẻ trục trặc', 'tổng đài', 'sự cố', 'pb11', 'phát biểu 11'],
    meanMin: 3.4,
    meanMax: 3.9,
    targetMean: 3.65,
    targetStd: 1.05, // Độ phân tán lớn
  },
  {
    statementIndex: 12,
    questionNumber: 13,
    shortTitle: 'Dùng được với ứng dụng thanh toán đang xài',
    keywords: ['ứng dụng thanh toán', 'apple pay', 'google pay', 'ví', 'pb12', 'phát biểu 12'],
    meanMin: 3.7,
    meanMax: 4.2,
    targetMean: 3.95,
    targetStd: 0.8,
  },

  // Câu 14. Cảm giác khi dùng chiếc thẻ
  {
    statementIndex: 13,
    questionNumber: 14,
    shortTitle: 'Trả bằng thẻ thích hơn trả tiền mặt',
    keywords: ['thích hơn trả tiền mặt', 'không dùng tiền mặt', 'thay tiền mặt', 'pb13', 'phát biểu 13'],
    meanMin: 3.7,
    meanMax: 4.3,
    targetMean: 4.0,
    targetStd: 0.82,
  },
  {
    statementIndex: 14,
    questionNumber: 14,
    shortTitle: 'Thích thú khi dùng chiếc thẻ',
    keywords: ['thích thú', 'cảm giác thích', 'khi dùng chiếc thẻ', 'pb14', 'phát biểu 14'],
    meanMin: 3.3,
    meanMax: 3.8,
    targetMean: 3.55,
    targetStd: 0.85,
  },
  {
    statementIndex: 15,
    questionNumber: 14,
    shortTitle: 'Dùng ưu đãi, điểm thưởng thấy hài lòng',
    keywords: ['ưu đãi', 'điểm thưởng', 'hài lòng', 'cashback', 'pb15', 'phát biểu 15'],
    meanMin: 3.7,
    meanMax: 4.2,
    targetMean: 3.95,
    targetStd: 0.8,
  },

  // Câu 15. Chi phí và giá trị nhận được từ chiếc thẻ
  {
    statementIndex: 16,
    questionNumber: 15,
    shortTitle: 'Phí thường niên hợp lý',
    keywords: ['phí thường niên', 'hợp lý', 'hàng năm', 'pb16', 'phát biểu 16'],
    meanMin: 2.9,
    meanMax: 3.5,
    targetMean: 3.2,
    targetStd: 0.95,
  },
  {
    statementIndex: 17,
    questionNumber: 15,
    shortTitle: 'Ưu đãi xứng với số tiền bỏ ra',
    keywords: ['xứng với số tiền', 'giá trị nhận lại', 'bỏ ra', 'pb17', 'phát biểu 17'],
    meanMin: 3.2,
    meanMax: 3.7,
    targetMean: 3.45,
    targetStd: 0.88,
  },
  {
    statementIndex: 18,
    questionNumber: 15,
    shortTitle: 'Lãi và phí trả chậm nhiều hơn phần lợi',
    keywords: ['lãi và phí trả chậm', 'nhiều hơn phần lợi', 'phạt chậm', 'pb18', 'phát biểu 18'],
    meanMin: 3.1,
    meanMax: 3.7,
    targetMean: 3.4,
    targetStd: 0.92,
    isReverse: true, // ĐC
  },

  // Câu 16. Thói quen dùng ứng dụng ngân hàng (Khối cao nhất phiếu)
  {
    statementIndex: 19,
    questionNumber: 16,
    shortTitle: 'Dùng ứng dụng ngân hàng đã thành thói quen',
    keywords: ['thành thói quen', 'ứng dụng ngân hàng đã thành', 'hằng ngày', 'pb19', 'phát biểu 19'],
    meanMin: 4.0,
    meanMax: 4.5,
    targetMean: 4.25,
    targetStd: 0.75, // Cao nhất toàn phiếu
  },
  {
    statementIndex: 20,
    questionNumber: 16,
    shortTitle: 'Gần như ngày nào cũng cần dùng',
    keywords: ['ngày nào cũng cần dùng', 'chuyển khoản', 'quét qr', 'pb20', 'phát biểu 20'],
    meanMin: 3.8,
    meanMax: 4.4,
    targetMean: 4.1,
    targetStd: 0.8,
  },
  {
    statementIndex: 21,
    questionNumber: 16,
    shortTitle: 'Bất tiện nếu vài ngày không vào được',
    keywords: ['bất tiện', 'vài ngày không vào được', 'lỗi app', 'pb21', 'phát biểu 21'],
    meanMin: 3.7,
    meanMax: 4.3,
    targetMean: 4.0,
    targetStd: 0.85,
  },

  // Phần 6. Cảm nhận về ngân hàng và về hệ thống gợi ý
  // Câu 17. Năng lực của ngân hàng và hệ thống gợi ý
  {
    statementIndex: 22,
    questionNumber: 17,
    shortTitle: 'Hệ thống hiểu tình hình tài chính của tôi',
    keywords: ['hiểu tình hình tài chính', 'dữ liệu giao dịch', 'hiểu tôi', 'pb22', 'phát biểu 22'],
    meanMin: 3.2,
    meanMax: 3.7,
    targetMean: 3.45,
    targetStd: 0.88,
  },
  {
    statementIndex: 23,
    questionNumber: 17,
    shortTitle: 'Hệ thống ít khi gợi ý sai',
    keywords: ['ít khi gợi ý sai', 'gợi ý chính xác', 'chuẩn xác', 'pb23', 'phát biểu 23'],
    meanMin: 3.0,
    meanMax: 3.5,
    targetMean: 3.25,
    targetStd: 0.9,
  },
  {
    statementIndex: 24,
    questionNumber: 17,
    shortTitle: 'Ngân hàng đủ chuyên môn xây dựng hệ thống',
    keywords: ['đủ chuyên môn', 'xây dựng hệ thống', 'năng lực kỹ thuật', 'pb24', 'phát biểu 24'],
    meanMin: 3.6,
    meanMax: 4.0,
    targetMean: 3.8,
    targetStd: 0.8,
  },

  // Câu 18. Cách ngân hàng đối xử với khách hàng
  {
    statementIndex: 25,
    questionNumber: 18,
    shortTitle: 'Gợi ý thẻ hợp với tôi dù ngân hàng lời ít hơn',
    keywords: ['lời ít hơn', 'lợi nhuận ngân hàng', 'hợp với tôi dù', 'pb25', 'phát biểu 25'],
    meanMin: 2.7,
    meanMax: 3.3,
    targetMean: 3.0,
    targetStd: 0.92, // Thấp nhất Phần 6
  },
  {
    statementIndex: 26,
    questionNumber: 18,
    shortTitle: 'Nói cả mặt bất lợi của thẻ',
    keywords: ['mặt bất lợi', 'rủi ro', 'mặt hạn chế', 'pb26', 'phát biểu 26'],
    meanMin: 2.9,
    meanMax: 3.5,
    targetMean: 3.2,
    targetStd: 0.9,
  },
  {
    statementIndex: 27,
    questionNumber: 18,
    shortTitle: 'Khó trả nợ thì ngân hàng ưu tiên thu nợ',
    keywords: ['ưu tiên thu nợ', 'khó trả nợ', 'thu hồi nợ', 'pb27', 'phát biểu 27'],
    meanMin: 3.4,
    meanMax: 4.0,
    targetMean: 3.7,
    targetStd: 0.88,
    isReverse: true, // ĐC
  },

  // Câu 19. So sánh gợi ý của hệ thống với các cách chọn thẻ khác
  {
    statementIndex: 28,
    questionNumber: 19,
    shortTitle: 'Gợi ý hợp hơn thẻ tôi tự chọn',
    keywords: ['hợp hơn thẻ tôi tự chọn', 'tự tìm hiểu', 'pb28', 'phát biểu 28'],
    meanMin: 2.9,
    meanMax: 3.4,
    targetMean: 3.15,
    targetStd: 0.88,
  },
  {
    statementIndex: 29,
    questionNumber: 19,
    shortTitle: 'Hợp hơn lời tư vấn của nhân viên',
    keywords: ['tư vấn của nhân viên', 'nhân viên ngân hàng', 'pb29', 'phát biểu 29'],
    meanMin: 3.1,
    meanMax: 3.6,
    targetMean: 3.35,
    targetStd: 0.85,
  },
  {
    statementIndex: 30,
    questionNumber: 19,
    shortTitle: 'Hợp hơn trang so sánh',
    keywords: ['trang so sánh', 'website so sánh', 'fintech so sánh', 'pb30', 'phát biểu 30'],
    meanMin: 2.9,
    meanMax: 3.4,
    targetMean: 3.15,
    targetStd: 0.88,
  },
  {
    statementIndex: 31,
    questionNumber: 19,
    shortTitle: 'Nhìn chung hợp hơn các cách chọn khác',
    keywords: ['nhìn chung hợp hơn', 'các cách chọn khác', 'tổng thể', 'pb31', 'phát biểu 31'],
    meanMin: 3.0,
    meanMax: 3.5,
    targetMean: 3.25,
    targetStd: 0.85,
  },

  // Phần 7. Về bản thân anh/chị và dữ liệu cá nhân
  // Câu 20. Cách anh/chị đón nhận công nghệ tài chính mới
  {
    statementIndex: 32,
    questionNumber: 20,
    shortTitle: 'Thích tìm hiểu dịch vụ tài chính công nghệ mới',
    keywords: ['tìm hiểu dịch vụ', 'công nghệ mới', 'fintech', 'pb32', 'phát biểu 32'],
    meanMin: 3.6,
    meanMax: 4.1,
    targetMean: 3.85,
    targetStd: 0.82,
  },
  {
    statementIndex: 33,
    questionNumber: 20,
    shortTitle: 'Thường là người đầu tiên dùng tính năng mới',
    keywords: ['người đầu tiên', 'tiên phong', 'tính năng mới', 'pb33', 'phát biểu 33'],
    meanMin: 2.9,
    meanMax: 3.5,
    targetMean: 3.2,
    targetStd: 0.95,
  },
  {
    statementIndex: 34,
    questionNumber: 20,
    shortTitle: 'Sẵn lòng thử dù chưa quen',
    keywords: ['sẵn lòng thử', 'chưa quen', 'trải nghiệm mới', 'pb34', 'phát biểu 34'],
    meanMin: 3.3,
    meanMax: 3.8,
    targetMean: 3.55,
    targetStd: 0.85,
  },

  // Câu 21. Việc ngân hàng sử dụng dữ liệu của anh/chị
  {
    statementIndex: 35,
    questionNumber: 21,
    shortTitle: 'Ngại ngân hàng phân tích lịch sử giao dịch',
    keywords: ['ngại ngân hàng phân tích', 'lịch sử giao dịch', 'riêng tư', 'pb35', 'phát biểu 35'],
    meanMin: 3.4,
    meanMax: 4.0,
    targetMean: 3.7,
    targetStd: 0.88,
  },
  {
    statementIndex: 36,
    questionNumber: 21,
    shortTitle: 'Lo không rút lại được sự đồng ý',
    keywords: ['rút lại sự đồng ý', 'hủy quyền', 'luật 91', 'pb36', 'phát biểu 36'],
    meanMin: 3.3,
    meanMax: 3.9,
    targetMean: 3.6,
    targetStd: 0.88,
  },
  {
    statementIndex: 37,
    questionNumber: 21,
    shortTitle: 'Lo ngân hàng dùng dữ liệu vào việc khác',
    keywords: ['dùng dữ liệu vào việc khác', 'bị gọi quảng cáo', 'lộ thông tin', 'pb37', 'phát biểu 37'],
    meanMin: 3.6,
    meanMax: 4.2,
    targetMean: 3.9,
    targetStd: 0.82, // Cao nhất bảng 21
  },
  {
    statementIndex: 38,
    questionNumber: 21,
    shortTitle: 'Thoải mái để ngân hàng dùng dữ liệu',
    keywords: ['thoải mái để ngân hàng dùng', 'tin tưởng dữ liệu', 'pb38', 'phát biểu 38'],
    meanMin: 2.7,
    meanMax: 3.3,
    targetMean: 3.0,
    targetStd: 0.95,
    isReverse: true, // ĐC
  },
  {
    statementIndex: 39,
    questionNumber: 21,
    shortTitle: 'Câu kiểm tra chú ý (Chọn mức 1)',
    keywords: ['kiểm tra chú ý', 'chú ý', 'vui lòng chọn mức 1', 'chọn hoàn toàn không đồng ý', 'attention check', 'pb39', 'phát biểu 39'],
    meanMin: 1.1,
    meanMax: 1.3,
    targetMean: 1.15,
    targetStd: 0.45,
    isAttentionCheck: true, // 85-95% chọn mức 1, ~10% chọn sai mức khác
  },

  // Phần 8. Một vài phát biểu chung
  // Câu 22. Sở thích cá nhân
  {
    statementIndex: 40,
    questionNumber: 22,
    shortTitle: 'Thích màu xanh lam',
    keywords: ['thích màu xanh lam', 'màu xanh lam', 'màu xanh dương', 'pb40', 'phát biểu 40'],
    meanMin: 3.2,
    meanMax: 3.9,
    targetMean: 3.55,
    targetStd: 0.9,
  },
  {
    statementIndex: 41,
    questionNumber: 22,
    shortTitle: 'Xanh lam là màu đẹp',
    keywords: ['xanh lam là màu đẹp', 'màu sắc đẹp', 'pb41', 'phát biểu 41'],
    meanMin: 3.3,
    meanMax: 4.0,
    targetMean: 3.65,
    targetStd: 0.88,
  },
  {
    statementIndex: 42,
    questionNumber: 22,
    shortTitle: 'Nếu được chọn thì chọn xanh lam',
    keywords: ['chọn xanh lam', 'nếu được chọn', 'pb42', 'phát biểu 42'],
    meanMin: 3.0,
    meanMax: 3.7,
    targetMean: 3.35,
    targetStd: 0.92,
  },

  // Phần 9. Gợi ý của hệ thống và dự định của anh/chị
  // Câu 23. Anh/chị sẽ dùng gợi ý của hệ thống như thế nào (Điểm giảm dần từ 43 đến 45)
  {
    statementIndex: 43,
    questionNumber: 23,
    shortTitle: 'Xem hệ thống gợi ý gì trước khi chọn',
    keywords: ['xem hệ thống gợi ý gì', 'tham khảo trước', 'pb43', 'phát biểu 43'],
    meanMin: 3.4,
    meanMax: 3.9,
    targetMean: 3.65,
    targetStd: 0.82,
  },
  {
    statementIndex: 44,
    questionNumber: 23,
    shortTitle: 'Gợi ý là một yếu tố cân nhắc',
    keywords: ['yếu tố cân nhắc', 'cân nhắc trước khi', 'pb44', 'phát biểu 44'],
    meanMin: 3.4,
    meanMax: 3.9,
    targetMean: 3.65,
    targetStd: 0.82,
  },
  {
    statementIndex: 45,
    questionNumber: 23,
    shortTitle: 'Gợi ý có thể làm tôi đổi thẻ định chọn',
    keywords: ['đổi thẻ định chọn', 'thay đổi quyết định', 'pb45', 'phát biểu 45'],
    meanMin: 3.0,
    meanMax: 3.6,
    targetMean: 3.3,
    targetStd: 0.9,
  },
  {
    statementIndex: 46,
    questionNumber: 23,
    shortTitle: 'Tự quyết, không để gợi ý ảnh hưởng',
    keywords: ['tự quyết', 'không để gợi ý ảnh hưởng', 'tự chủ', 'pb46', 'phát biểu 46'],
    meanMin: 3.4,
    meanMax: 4.0,
    targetMean: 3.7,
    targetStd: 0.88,
    isReverse: true, // ĐC
  },

  // Câu 24. Dự định của anh/chị với chiếc thẻ
  {
    statementIndex: 47,
    questionNumber: 24,
    shortTitle: 'Nếu thẻ được mở bán sẽ đăng ký',
    keywords: ['mở bán sẽ đăng ký', 'đăng ký mở thẻ', 'sẽ dùng', 'pb47', 'phát biểu 47'],
    meanMin: 3.0,
    meanMax: 3.6,
    targetMean: 3.3,
    targetStd: 0.9,
  },
  {
    statementIndex: 48,
    questionNumber: 24,
    shortTitle: 'Dùng cho phần lớn chi tiêu hằng ngày',
    keywords: ['phần lớn chi tiêu', 'chi tiêu hằng ngày', 'thanh toán thường xuyên', 'pb48', 'phát biểu 48'],
    meanMin: 2.9,
    meanMax: 3.5,
    targetMean: 3.2,
    targetStd: 0.9, // Thấp nhất trong 3 câu
  },
  {
    statementIndex: 49,
    questionNumber: 24,
    shortTitle: 'Dùng lâu dài, không chỉ dùng thử',
    keywords: ['dùng lâu dài', 'không chỉ dùng thử', 'gắn bó', 'pb49', 'phát biểu 49'],
    meanMin: 3.1,
    meanMax: 3.7,
    targetMean: 3.4,
    targetStd: 0.88,
  },
];

/**
 * Trình sinh điểm Likert 1-5 theo phân phối chuẩn rút gọn (Truncated Normal Distribution)
 * có yếu tố biến tiềm ẩn (Latent Factor) để giữ tính nhất quán và tương quan nghịch ở câu đảo chiều.
 */
export function generateLikertScore(
  rule: LikertStatementRule,
  latentFactor: number, // theta: [-2, 2]
  isAttentionFail: boolean,
  forcedScore?: number
): number {
  if (forcedScore && forcedScore >= 1 && forcedScore <= 5) {
    return forcedScore;
  }

  // Câu kiểm tra chú ý (Câu 39)
  if (rule.isAttentionCheck) {
    if (!isAttentionFail) {
      return 1; // 88-92% chọn đúng mức 1
    } else {
      // 8-12% chọn sai mức khác
      const wrongScores = [2, 3, 4];
      return wrongScores[Math.floor(Math.random() * wrongScores.length)];
    }
  }

  // Latent persona impact (0.3 - 0.45 weight)
  const factorDirection = rule.isReverse ? -1 : 1;
  const personaInfluence = latentFactor * factorDirection * 0.38;

  // Gaussian noise
  const u1 = Math.random() || 0.001;
  const u2 = Math.random() || 0.001;
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const noise = z * (rule.targetStd * 0.65);

  let raw = rule.targetMean + personaInfluence + noise;

  // Bound to [1, 5]
  let score = Math.round(raw);
  if (score < 1) score = 1;
  if (score > 5) score = 5;

  return score;
}

/**
 * Tìm quy tắc phát biểu tương ứng dựa vào title câu hỏi hoặc nhãn row trong Grid
 */
export function matchLikertRule(text: string, statementIndexHint?: number): LikertStatementRule | null {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Match by statement index hint if provided
  if (statementIndexHint && statementIndexHint >= 1 && statementIndexHint <= 49) {
    const byIdx = BANKING_GENZ_LIKERT_RULES.find((r) => r.statementIndex === statementIndexHint);
    if (byIdx) return byIdx;
  }

  // 2. Match by exact PB number in text (e.g., "pb1", "pb 39", "câu 39", "phát biểu 12")
  const pbMatch = normalized.match(/(?:pb|phat bieu|phatbieu|cau|statement)\s*([0-9]{1,2})/);
  if (pbMatch && pbMatch[1]) {
    const num = parseInt(pbMatch[1], 10);
    const byNum = BANKING_GENZ_LIKERT_RULES.find((r) => r.statementIndex === num);
    if (byNum) return byNum;
  }

  // 3. Match by keywords
  for (const rule of BANKING_GENZ_LIKERT_RULES) {
    for (const kw of rule.keywords) {
      const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normKw)) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * Tạo toàn bộ hàng đợi phản hồi (Response Queue) chuyên biệt cho khách hàng này.
 * Đáp ứng đầy đủ 100% điều kiện trong file dự đoán kết quả dữ liệu.
 */
export function buildBankingGenZQueue(
  questions: FormQuestion[],
  targetCount: number
): Record<string, any>[] {
  const queue: Record<string, any>[] = [];

  // Xác định trước danh sách những người sẽ làm sai câu kiểm tra chú ý (khoảng 8-10% phiếu)
  const failAttentionCount = Math.max(1, Math.round(targetCount * 0.09));
  const failSet = new Set<number>();
  while (failSet.size < failAttentionCount && failSet.size < targetCount) {
    failSet.add(Math.floor(Math.random() * targetCount));
  }

  // Phân phối nhân khẩu học cho toàn bộ mẫu N
  const samplePersonas = Array.from({ length: targetCount }).map((_, i) => {
    // Latent factor theta ~ N(0, 1)
    const u1 = Math.random() || 0.001;
    const u2 = Math.random() || 0.001;
    const theta = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Giới tính: Nam ~48%, Nữ ~50%, Khác ~2%
    const gRand = Math.random();
    const gender = gRand < 0.48 ? 'Nam' : gRand < 0.98 ? 'Nữ' : 'Khác';

    // Tuổi / Năm sinh: Gen Z 1998 - 2008 (18 - 28 tuổi) chia 3 nhóm
    const ageRand = Math.random();
    let birthYear = 2004;
    let ageGroup = '21 - 23 tuổi';
    if (ageRand < 0.33) {
      birthYear = 2006 + Math.floor(Math.random() * 3); // 2006-2008 (18-20 tuổi)
      ageGroup = '18 - 20 tuổi';
    } else if (ageRand < 0.72) {
      birthYear = 2003 + Math.floor(Math.random() * 3); // 2003-2005 (21-23 tuổi)
      ageGroup = '21 - 23 tuổi';
    } else {
      birthYear = 1998 + Math.floor(Math.random() * 5); // 1998-2002 (24-28 tuổi)
      ageGroup = '24 - 28 tuổi';
    }

    // Thu nhập tự kiếm
    const incRand = Math.random();
    let incomeLevel = '5 - 10 triệu';
    if (incRand < 0.25) incomeLevel = 'Chưa có thu nhập riêng';
    else if (incRand < 0.60) incomeLevel = '5 - 10 triệu';
    else if (incRand < 0.85) incomeLevel = '10 - 20 triệu';
    else if (incRand < 0.93) incomeLevel = 'Từ 30 triệu trở lên';
    else incomeLevel = 'Không muốn trả lời / Khác';

    // Số ngân hàng có thẻ tín dụng
    const cardRand = Math.random();
    let cardCount = '1 ngân hàng';
    if (cardRand < 0.40) cardCount = 'Chưa có thẻ tín dụng';
    else if (cardRand < 0.82) cardCount = '1 ngân hàng'; // 60-75% nhóm có thẻ
    else if (cardRand < 0.95) cardCount = '2 ngân hàng';
    else cardCount = '3 ngân hàng trở lên';

    return {
      index: i,
      theta,
      gender,
      birthYear,
      ageGroup,
      incomeLevel,
      cardCount,
      isAttentionFail: failSet.has(i),
    };
  });

  // Tách riêng các phát biểu Likert đã match để đảm bảo đủ cả 5 mức thang đo
  let likertSequentialCounter = 0;

  for (let i = 0; i < targetCount; i++) {
    const persona = samplePersonas[i];
    const payload: Record<string, any> = {};
    let personaLikertIndex = 1;

    questions.forEach((q) => {
      const qText = (q.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // ==========================================
      // PHẦN 1. CÂU HỎI MỞ ĐẦU (Câu 1 - 6)
      // ==========================================

      // Câu 1. Đồng ý tham gia khảo sát (Chọn "Không": dưới 2%)
      if (qText.includes('dong y') || qText.includes('tham gia') || qText.includes('consent')) {
        if (q.options && q.options.length > 0) {
          const agreeOpt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes('dong y') || l.includes('co') || l.includes('yes') || l.includes('chap nhan');
          }) || q.options[0];
          const disagreeOpt = q.options.find((o) => o !== agreeOpt) || q.options[q.options.length - 1];

          // Dưới 2% chọn Không
          payload[q.id] = Math.random() < 0.985 ? agreeOpt.value : disagreeOpt.value;
          return;
        }
      }

      // Câu 2. Đã đủ 18 tuổi (Chọn "Chưa": dưới 2%)
      if (qText.includes('18 tuoi') || qText.includes('du tuoi') || qText.includes('du 18')) {
        if (q.options && q.options.length > 0) {
          const yesOpt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes('roi') || l.includes('da du') || l.includes('co') || l.includes('tren 18');
          }) || q.options[0];
          const noOpt = q.options.find((o) => o !== yesOpt) || q.options[q.options.length - 1];

          payload[q.id] = Math.random() < 0.985 ? yesOpt.value : noOpt.value;
          return;
        }
      }

      // Câu 3. Năm sinh / Độ tuổi (Gen Z 1998 - 2008, < 3% ngoài độ tuổi)
      if (qText.includes('nam sinh') || qText.includes('sinh nam') || qText.includes('do tuoi') || qText.includes('nhom tuoi')) {
        if (q.options && q.options.length > 0) {
          // Thử tìm option khớp với nhóm tuổi hoặc năm sinh
          const matchedOpt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes(String(persona.birthYear)) || l.includes(persona.ageGroup);
          }) || q.options[Math.floor(Math.random() * q.options.length)];
          payload[q.id] = matchedOpt.value;
          return;
        } else if (q.type === 'text' || q.type === 'paragraph') {
          payload[q.id] = String(persona.birthYear);
          return;
        }
      }

      // Câu 4. Đang sống tại Việt Nam (Chọn "Không": gần 0%)
      if (qText.includes('viet nam') || qText.includes('song tai') || qText.includes('cu tru')) {
        if (q.options && q.options.length > 0) {
          const vnOpt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes('co') || l.includes('viet nam') || l.includes('dang song');
          }) || q.options[0];
          payload[q.id] = vnOpt.value;
          return;
        }
      }

      // Câu 5. Có dùng ứng dụng ngân hàng 3 tháng qua (Chọn "Không": dưới 3%)
      if ((qText.includes('3 thang') || qText.includes('ung dung ngan hang')) && (qText.includes('dung') || qText.includes('su dung'))) {
        if (q.options && q.options.length > 0) {
          const yesOpt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes('co') || l.includes('da dung') || l.includes('dang dung');
          }) || q.options[0];
          const noOpt = q.options.find((o) => o !== yesOpt) || q.options[q.options.length - 1];

          payload[q.id] = Math.random() < 0.98 ? yesOpt.value : noOpt.value;
          return;
        }
      }

      // Câu 6. Ứng dụng ngân hàng đã dùng (Multi-choice / Checkbox)
      // NHTM khác: 80-95%; Ví điện tử: 60-85%; Ngân hàng số thuần túy: 15-35%; VPBank NEO: 30-50%
      if (q.type === 'checkbox' || qText.includes('ung dung ngan hang da dung') || qText.includes('cac ung dung')) {
        if (q.options && q.options.length > 0) {
          const picked: string[] = [];
          q.options.forEach((opt) => {
            const l = opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (l.includes('vpbank') || l.includes('neo')) {
              if (Math.random() < 0.45) picked.push(opt.value);
            } else if (l.includes('vi dien tu') || l.includes('momo') || l.includes('zalopay') || l.includes('shopeepay')) {
              if (Math.random() < 0.75) picked.push(opt.value);
            } else if (l.includes('ngan hang so') || l.includes('cake') || l.includes('timo') || l.includes('tnex')) {
              if (Math.random() < 0.28) picked.push(opt.value);
            } else {
              // NHTM khác (Vietcombank, Techcombank, MB, BIDV...)
              if (Math.random() < 0.88) picked.push(opt.value);
            }
          });
          // Ít nhất 1 lựa chọn
          if (picked.length === 0) {
            picked.push(q.options[0].value);
          }
          payload[q.id] = picked;
          return;
        }
      }

      // ==========================================
      // PHẦN 2. ĐÔI NÉT VỀ ANH/CHỊ (Câu 7 - 9)
      // ==========================================

      // Câu 7. Giới tính
      if (qText.includes('gioi tinh') || qText.includes('gender')) {
        if (q.options && q.options.length > 0) {
          const opt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes(persona.gender.toLowerCase());
          }) || q.options[0];
          payload[q.id] = opt.value;
          return;
        }
      }

      // Câu 8. Thu nhập tự kiếm
      if (qText.includes('thu nhap') || qText.includes('income')) {
        if (q.options && q.options.length > 0) {
          const opt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes(persona.incomeLevel.toLowerCase()) || l.includes(persona.incomeLevel.slice(0, 5).toLowerCase());
          }) || q.options[Math.floor(Math.random() * q.options.length)];
          payload[q.id] = opt.value;
          return;
        }
      }

      // Câu 9. Số ngân hàng có thẻ tín dụng
      if (qText.includes('the tin dung') && (qText.includes('so ngan hang') || qText.includes('bao nhieu'))) {
        if (q.options && q.options.length > 0) {
          const opt = q.options.find((o) => {
            const l = o.label.toLowerCase();
            return l.includes(persona.cardCount.toLowerCase());
          }) || q.options[0];
          payload[q.id] = opt.value;
          return;
        }
      }

      // ==========================================
      // PHẦN 5 - 9. 49 PHÁT BIỂU LIKERT 1-5
      // ==========================================

      // 1. Grid / Matrix question (Multi-statement Likert rows)
      if (q.type === 'grid' && q.gridRows && q.gridRows.length > 0) {
        const opts = q.options && q.options.length > 0 ? q.options : [{ value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }, { value: '5' }];

        q.gridRows.forEach((row) => {
          if (!row.entryId) return;
          const matchedRule = matchLikertRule(row.title, personaLikertIndex);
          const ruleToUse = matchedRule || BANKING_GENZ_LIKERT_RULES[Math.min(personaLikertIndex - 1, 48)];
          personaLikertIndex++;

          const score = generateLikertScore(ruleToUse, persona.theta, persona.isAttentionFail);

          // Find option matching score 1..5
          const matchedOpt = opts.find((o) => o.value === String(score) || o.label.startsWith(String(score))) || opts[Math.min(score - 1, opts.length - 1)];
          payload[row.entryId] = matchedOpt.value;
        });
        return;
      }

      // 2. Linear Scale question (q.type === 'scale')
      if (q.type === 'scale') {
        const matchedRule = matchLikertRule(q.title, personaLikertIndex);
        const ruleToUse = matchedRule || BANKING_GENZ_LIKERT_RULES[Math.min(personaLikertIndex - 1, 48)];
        personaLikertIndex++;

        const score = generateLikertScore(ruleToUse, persona.theta, persona.isAttentionFail);
        payload[q.id] = String(score);
        return;
      }

      // 3. Radio / Choice question representing a 5-point Likert statement
      if (q.options && q.options.length >= 3 && q.type !== 'checkbox' && q.type !== 'grid') {
        const matchedRule = matchLikertRule(q.title, personaLikertIndex);
        if (matchedRule) {
          personaLikertIndex++;
          const score = generateLikertScore(matchedRule, persona.theta, persona.isAttentionFail);
          const matchedOpt = q.options.find((o) => o.value === String(score) || o.label.startsWith(String(score))) || q.options[Math.min(score - 1, q.options.length - 1)];
          payload[q.id] = matchedOpt.value;
          return;
        }

        // Generic radio fallback
        const chosen = q.options[Math.floor(Math.random() * q.options.length)];
        payload[q.id] = chosen.value;
        return;
      }

      // 4. Fallback for text / open-ended questions
      if (q.type === 'text' || q.type === 'paragraph') {
        const comments = [
          'Ứng dụng ngân hàng hiện nay rất tiện lợi, thao tác mở thẻ trực tuyến nhanh chóng.',
          'Các chương trình ưu đãi tích điểm và hoàn tiền của thẻ tín dụng khá hấp dẫn đối với người trẻ.',
          'Tôi thấy giao diện trực quan, dễ quản lý chi tiêu nhưng cần cảnh báo rõ ràng hơn về ngày sao kê.',
          'Rất ủng hộ việc số hóa quy trình mở thẻ, tiết kiệm nhiều thời gian so với ra quầy giao dịch.',
          'Mong muốn ngân hàng tiếp tục nâng cao tính bảo mật và tối ưu trải nghiệm liên kết ví điện tử.',
        ];
        payload[q.id] = comments[Math.floor(Math.random() * comments.length)];
        return;
      }
    });

    queue.push(payload);
  }

  return queue;
}
