'use client';

import { DashboardGrid } from './dashboard/DashboardGrid';
import { USER_ID } from '@/lib/constants';

export default function HomePage() {
  return <DashboardGrid userId={USER_ID} />;
}

