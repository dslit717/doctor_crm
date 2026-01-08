'use client';

import { useEffect, useState } from 'react';
import { DashboardGrid } from './dashboard/DashboardGrid';
import { USER_ID, DEFAULT_LAYOUT, DEFAULT_COLUMNS } from '@/lib/constants';
import { validateColumns } from '@/lib/utils';
import { api } from '@/lib/api';

export default function HomePage() {
  const [initialLayout, setInitialLayout] = useState(DEFAULT_LAYOUT);
  const [initialColumns, setInitialColumns] = useState<2 | 3 | 4>(DEFAULT_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        const result = await api.layout.get(USER_ID);
        
        if (result.success && result.data) {
          setInitialLayout(result.data.layout || DEFAULT_LAYOUT);
          setInitialColumns(validateColumns(result.data.columns || DEFAULT_COLUMNS));
        }
      } catch (error) {
        console.error('레이아웃 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1rem',
        color: '#737373'
      }}>
        로딩 중...
      </div>
    );
  }

  return <DashboardGrid initialLayout={initialLayout} userId={USER_ID} initialColumns={initialColumns} />;
}

