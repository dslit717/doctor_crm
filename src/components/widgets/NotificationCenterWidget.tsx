import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface NotificationCenterWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function NotificationCenterWidget({ isEditing, onRemove }: NotificationCenterWidgetProps) {
  const notifications = [
    { type: 'critical', message: '환자 응급 상황 발생 - 3층 상담실', time: '방금' },
    { type: 'urgent', message: '김철수 환자 예약 변경 요청 (긴급)', time: '5분 전' },
    { type: 'alert', message: '재고 부족 - 보톡스 (2병 남음)', time: '30분 전' },
    { type: 'urgent', message: '시스템 점검 예정: 오늘 18:00', time: '1시간 전' },
  ];

  const typeConfig = (type: string) => {
    switch (type) {
      case 'critical': return { icon: '🚨', bg: '#ffebee', color: '#b71c1c' };
      case 'urgent': return { icon: '🔴', bg: '#ffebee', color: '#c62828' };
      case 'alert': return { icon: '⚠️', bg: '#fff3e0', color: '#e65100' };
      default: return { icon: '🔔', bg: '#e8f5e9', color: '#2e7d32' };
    }
  };

  return (
    <WidgetCard title="긴급 알림" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.notificationList}>
        {notifications.map((notif, idx) => {
          const config = typeConfig(notif.type);
          return (
            <div key={idx} className={styles.notificationItem} style={{ background: config.bg }}>
              <span className={styles.notificationIcon}>{config.icon}</span>
              <div className={styles.notificationContent}>
                <div className={styles.notificationMessage}>
                  {notif.message}
                </div>
                <div className={styles.notificationTime}>
                  {notif.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

