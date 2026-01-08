import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface CallCenterQueueWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function CallCenterQueueWidget({ isEditing, onRemove }: CallCenterQueueWidgetProps) {
  const queue = [
    { name: '김민지', type: '예약 문의', wait: '2분', priority: 'normal' },
    { name: '이준호', type: '긴급 상담', wait: '5분', priority: 'high' },
    { name: '박서연', type: '일반 문의', wait: '1분', priority: 'normal' },
  ];

  return (
    <WidgetCard title="상담 대기열" isEditing={isEditing} onRemove={onRemove}>
      <div>
        <div className={styles.queueHeader}>
          <span className={styles.queueLabel}>
            대기 중
          </span>
          <span className={styles.queueCount}>
            {queue.length}명
          </span>
        </div>
        <div className={styles.queueList}>
          {queue.map((item, idx) => (
            <div key={idx} className={`${styles.queueItem} ${item.priority === 'high' ? styles.priority : ''}`}>
              <div>
                <div className={styles.queueCustomer}>
                  {item.name}
                </div>
                <div className={styles.queueType}>{item.type}</div>
              </div>
              <span className={styles.queueWait}>
                {item.wait}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

