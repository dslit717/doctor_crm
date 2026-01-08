import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface CalendarWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function CalendarWidget({ isEditing, onRemove }: CalendarWidgetProps) {
  const today = new Date();
  const schedules = [
    { time: '09:00', patient: '김철수', type: '초진' },
    { time: '10:30', patient: '이영희', type: '재진' },
    { time: '14:00', patient: '박민수', type: '시술' },
    { time: '15:30', patient: '최지은', type: '상담' },
  ];

  return (
    <WidgetCard title="진료 일정" isEditing={isEditing} onRemove={onRemove}>
      <div>
        <div className={styles.calendarDate}>
          {today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </div>
        <div className={styles.scheduleList}>
          {schedules.map((schedule, idx) => (
            <div key={idx} className={styles.scheduleItem}>
              <span className={styles.scheduleTime}>
                {schedule.time}
              </span>
              <div className={styles.scheduleDetails}>
                <div className={styles.schedulePatient}>{schedule.patient}</div>
                <div className={styles.scheduleType}>{schedule.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

