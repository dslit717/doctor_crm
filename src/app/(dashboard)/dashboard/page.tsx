'use client';

import { DashboardGrid } from './DashboardGrid';
import { useAuth } from '@/contexts/AuthContext';
import styles from './dashboard.module.scss';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // 직원 ID (로그인 사용자 또는 기본값)
  const employeeId = user?.employee?.id || 'default';
  
  return (
    <div className={styles.container}>
      <DashboardGrid employeeId={employeeId} />
    </div>
  );
}

