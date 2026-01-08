import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface SalesDashboardWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function SalesDashboardWidget({ isEditing, onRemove }: SalesDashboardWidgetProps) {
  const sales = [
    { label: '오늘 매출', amount: '3,250,000', change: '+12%', up: true },
    { label: '이번 주', amount: '18,500,000', change: '+8%', up: true },
    { label: '이번 달', amount: '72,300,000', change: '-3%', up: false },
  ];

  return (
    <WidgetCard title="매출 통계" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.salesList}>
        {sales.map((item, idx) => (
          <div key={idx} className={styles.salesCard}>
            <div className={styles.salesLabel}>
              {item.label}
            </div>
            <div className={styles.salesContent}>
              <span className={styles.salesAmount}>
                {item.amount}
                <span>원</span>
              </span>
              <span className={`${styles.salesChange} ${item.up ? styles.up : styles.down}`}>
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

