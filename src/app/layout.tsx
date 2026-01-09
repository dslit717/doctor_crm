import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Sidebar from '@/components/Sidebar';
import '@/styles/globals.scss';

const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Doctor CRM',
  description: '위젯 기반 의사용 CRM 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={pretendard.className}>
        <Sidebar />
        <main 
          className="main-content"
          style={{
            marginLeft: '200px',
            maxWidth: 'calc(100vw - 200px)',
            width: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden'
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}

