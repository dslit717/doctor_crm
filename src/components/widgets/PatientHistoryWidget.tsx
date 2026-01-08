import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface PatientHistoryWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function PatientHistoryWidget({ isEditing, onRemove }: PatientHistoryWidgetProps) {
  const history = [
    { patient: '김철수', procedure: '보톡스', date: '2024-01-08', status: '완료' },
    { patient: '이영희', procedure: '필러', date: '2024-01-07', status: '완료' },
    { patient: '박민수', procedure: '리프팅', date: '2024-01-06', status: '경과관찰' },
  ];

  return (
    <WidgetCard title="환자 시술 히스토리" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.historyList}>
        {history.map((item, idx) => (
          <div key={idx} className={styles.historyItem}>
            <div className={styles.historyHeader}>
              <span className={styles.historyPatient}>
                {item.patient}
              </span>
              <span className={`${styles.historyStatus} ${item.status === '완료' ? styles.completed : styles.ongoing}`}>
                {item.status}
              </span>
            </div>
            <div className={styles.historyProcedure}>{item.procedure}</div>
            <div className={styles.historyDate}>{item.date}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

