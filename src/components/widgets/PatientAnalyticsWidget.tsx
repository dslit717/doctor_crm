import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface PatientAnalyticsWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function PatientAnalyticsWidget({ isEditing, onRemove }: PatientAnalyticsWidgetProps) {
  const analytics = [
    { label: '총 환자', value: '1,285', change: '+15' },
    { label: '이번 주', value: '78', change: '+8' },
    { label: '신규 환자', value: '23', change: '+5' },
    { label: '재방문율', value: '68%', change: '+3%' },
  ];

  return (
    <WidgetCard title="환자 통계" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.analyticsGrid}>
        {analytics.map((item, idx) => (
          <div key={idx} className={styles.analyticsCard}>
            <div className={styles.analyticsLabel}>
              {item.label}
            </div>
            <div className={styles.analyticsValue}>
              {item.value}
            </div>
            <div className={styles.analyticsChange}>
              {item.change}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

