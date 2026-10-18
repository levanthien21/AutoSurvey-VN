import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'AutoSurvey VN - Dịch Vụ Điền Khảo Sát & Số Liệu SPSS',
  description:
    'Giải cứu deadline luận văn! Dịch vụ tăng lượt điền khảo sát Google/MS Form siêu tốc. Data giả lập người thật, chuẩn SPSS (Alpha > 0.8). Hỗ trợ 24/7 - Uy tín - Bảo hành data.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
