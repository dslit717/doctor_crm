import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from './widgets.module.scss';

interface HospitalTimetableWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function HospitalTimetableWidget({ isEditing, onRemove }: HospitalTimetableWidgetProps) {
  const schedule = [
    { day: '월-금', time: '09:00 - 18:00', status: 'open' },
    { day: '토요일', time: '09:00 - 15:00', status: 'open' },
    { day: '일요일', time: '휴진', status: 'closed' },
    { day: '점심시간', time: '13:00 - 14:00', status: 'break' },
  ];

  return (
    <WidgetCard title="병원 운영시간" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.timetableList}>
        {schedule.map((item, idx) => (
          <div key={idx} className={`${styles.timetableItem} ${item.status === 'closed' ? styles.closed : ''}`}>
            <span className={styles.timetableDay}>
              {item.day}
            </span>
            <span className={`${styles.timetableTime} ${item.status === 'closed' ? styles.closed : ''}`}>
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

