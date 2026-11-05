import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/providers/AppProvider';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-bvp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quản lý Dự án PXU | Giao việc, Giám sát & Báo cáo Công trình',
  description: 'Hệ thống quản lý dự án và gói thầu của Đại học Phú Xuân: Admin giao việc, giám sát báo cáo tiến độ kèm ảnh minh chứng và sự cố, lãnh đạo theo dõi và chỉ đạo theo dự án được cấp quyền.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('pxu_taskmaster_store_v7');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed && parsed.state && parsed.state.theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${beVietnamPro.variable} antialiased min-h-screen bg-cream dark:bg-night`}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-sm font-medium text-slate-500">Đang khởi tạo Quản lý Dự án PXU...</p>
            </div>
          }
        >
          <AppProvider>{children}</AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
