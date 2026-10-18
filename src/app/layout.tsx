import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { AuthProvider } from '@/context/AuthContext';
import { MobileNavProvider } from '@/context/MobileNavContext';

export const metadata: Metadata = {
  title: 'AutoSurvey VN - Dịch Vụ Điền Khảo Sát & Số Liệu SPSS',
  description:
    'Giải cứu deadline luận văn! Dịch vụ tăng lượt điền khảo sát Google/MS Form siêu tốc. Data giả lập người thật, chuẩn SPSS (Alpha > 0.8). Hỗ trợ 24/7 - Uy tín - Bảo hành data.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

import AppLayoutShell from '@/components/AppLayoutShell';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function shouldSuppress(e) {
                  try {
                    var msg = (e && (e.message || (e.error && e.error.message) || (e.reason && (e.reason.message || e.reason)))) || '';
                    var file = (e && (e.filename || (e.error && (e.error.fileName || e.error.stack)))) || '';
                    var sMsg = String(msg);
                    var sFile = String(file);
                    if (
                      sMsg.indexOf('M_ID') !== -1 ||
                      sMsg.indexOf('chrome-extension://') !== -1 ||
                      sMsg.indexOf('moz-extension://') !== -1 ||
                      sFile.indexOf('chrome-extension://') !== -1 ||
                      sFile.indexOf('moz-extension://') !== -1
                    ) {
                      return true;
                    }
                  } catch (err) {}
                  return false;
                }
                window.addEventListener('error', function(e) {
                  if (shouldSuppress(e)) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (shouldSuppress(e)) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden">
        <AuthProvider>
          <MobileNavProvider>
            <AppLayoutShell>
              {children}
            </AppLayoutShell>
          </MobileNavProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
