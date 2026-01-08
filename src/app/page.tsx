import { DashboardGrid } from './dashboard/DashboardGrid';
import { USER_ID, DEFAULT_LAYOUT, DEFAULT_COLUMNS } from '@/lib/constants';
import { validateColumns } from '@/lib/utils';

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  let initialLayout = DEFAULT_LAYOUT;
  let initialColumns: 2 | 3 | 4 = DEFAULT_COLUMNS;

  try {
    const response = await fetch(`${baseUrl}/api/layout/get?userId=${USER_ID}`, {
      cache: 'no-store'
    });
    const result = await response.json();
    
    if (result.success && result.data) {
      initialLayout = result.data.layout || DEFAULT_LAYOUT;
      initialColumns = validateColumns(result.data.columns || DEFAULT_COLUMNS);
    }
  } catch (error) {
    console.error('레이아웃 로드 실패:', error);
  }

  return <DashboardGrid initialLayout={initialLayout} userId={USER_ID} initialColumns={initialColumns} />;
}

