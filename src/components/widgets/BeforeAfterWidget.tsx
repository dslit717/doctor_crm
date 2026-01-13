import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from './widgets.module.scss';

interface BeforeAfterWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function BeforeAfterWidget({ isEditing, onRemove }: BeforeAfterWidgetProps) {
  const cases = [
    { patient: '김철수', date: '2024-01-08', procedure: '보톡스' },
    { patient: '이영희', date: '2024-01-05', procedure: '필러' },
    { patient: '박민수', date: '2024-01-03', procedure: '리프팅' },
  ];

  return (
    <WidgetCard title="전후 사진" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.caseList}>
        {cases.map((item, idx) => (
          <div key={idx} className={styles.caseItem}>
            <div className={styles.caseThumbnail}>
              📷
            </div>
            <div className={styles.caseDetails}>
              <div className={styles.casePatient}>
                {item.patient}
              </div>
              <div className={styles.caseProcedure}>
                {item.procedure}
              </div>
              <div className={styles.caseDate}>
                {item.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

