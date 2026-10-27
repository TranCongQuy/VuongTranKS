import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/providers/AppProvider';

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý Kế hoạch, Giao việc & Đánh giá Lãnh đạo | PXU TaskMaster Pro',
  description: 'Nền tảng phân rã mục tiêu, giao việc cộng sự, báo cáo chỉ đạo và đánh giá lãnh đạo trực quan, chuyên nghiệp.',
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
                  var stored = localStorage.getItem('pxu_taskmaster_store_v6') || localStorage.getItem('pxu_taskmaster_store_v5');
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
      <body className="antialiased min-h-screen bg-[#F8F9FA] dark:bg-[#090D16]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
