'use client'

import Sidebar from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// 대시보드 레이아웃 (사이드바 포함, 인증 필요)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
}

