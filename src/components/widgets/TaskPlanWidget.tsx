import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface TaskPlanWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function TaskPlanWidget({ isEditing, onRemove }: TaskPlanWidgetProps) {
  const tasks = [
    { task: '차트 정리 및 기록', time: '09:00 - 10:00', done: true },
    { task: '오전 진료', time: '10:00 - 13:00', done: true },
    { task: '점심 미팅', time: '13:00 - 14:00', done: false },
    { task: '오후 진료', time: '14:00 - 18:00', done: false },
    { task: '내일 스케줄 확인', time: '18:00 -', done: false },
  ];

  return (
    <WidgetCard title="업무 계획" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.taskList}>
        {tasks.map((item, idx) => (
          <div key={idx} className={`${styles.taskItem} ${item.done ? styles.completed : ''}`}>
            <input
              type="checkbox"
              checked={item.done}
              readOnly
              className={styles.taskCheckbox}
            />
            <div className={styles.taskContent}>
              <div className={`${styles.taskName} ${item.done ? styles.completed : ''}`}>
                {item.task}
              </div>
              <div className={styles.taskTime}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

