'use client';

import { DashboardGrid } from './dashboard/DashboardGrid';
import { USER_ID } from '@/lib/constants';
import styles from '@/styles/dashboard.module.scss';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <DashboardGrid userId={USER_ID} />
    </div>
  );
}

