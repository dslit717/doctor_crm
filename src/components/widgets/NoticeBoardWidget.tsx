import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from './widgets.module.scss';

interface NoticeBoardWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function NoticeBoardWidget({ isEditing, onRemove }: NoticeBoardWidgetProps) {
  const notices = [
    { id: 1, title: '연말 휴진 안내', date: '2024-01-08', important: true },
    { id: 2, title: '신규 장비 도입 교육', date: '2024-01-07', important: false },
    { id: 3, title: '보험 청구 변경사항', date: '2024-01-05', important: true },
  ];

  return (
    <WidgetCard title="공지사항" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.noticeList}>
        {notices.map(notice => (
          <div key={notice.id} className={`${styles.noticeItem} ${notice.important ? styles.important : ''}`}>
            <div className={styles.noticeHeader}>
              {notice.important && <span className={styles.noticeIcon}>🔔</span>}
              <span className={styles.noticeTitle}>
                {notice.title}
              </span>
            </div>
            <div className={styles.noticeDate}>{notice.date}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}