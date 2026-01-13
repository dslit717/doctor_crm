import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from './widgets.module.scss';

interface ReservationStatusWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function ReservationStatusWidget({ isEditing, onRemove }: ReservationStatusWidgetProps) {
  const stats = [
    { label: '오늘 예약', value: 12, color: '#0b6aff' },
    { label: '대기중', value: 3, color: '#f59e0b' },
    { label: '완료', value: 8, color: '#00a67e' },
    { label: '취소', value: 1, color: '#eb5757' },
  ];

  const upcoming = [
    { time: '14:00', name: '김민지', type: '상담' },
    { time: '15:30', name: '이준호', type: '시술' },
  ];

  return (
    <WidgetCard title="예약 상태" isEditing={isEditing} onRemove={onRemove}>
      <div>
        <div className={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statValue} style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className={styles.statLabel}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.divider}>
          <div className={styles.sectionTitle}>
            다음 예약
          </div>
          {upcoming.map((item, idx) => (
            <div key={idx} className={styles.upcomingItem}>
              <span className={styles.upcomingName}>{item.time} - {item.name}</span>
              <span className={styles.upcomingType}>{item.type}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

