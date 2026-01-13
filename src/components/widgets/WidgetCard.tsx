import React from 'react';
import Image from 'next/image';
import styles from '@/app/(dashboard)/dashboard/dashboard.module.scss';

interface WidgetCardProps {
  title: string | React.ReactNode;
  onRemove?: () => void;
  isEditing?: boolean;
  children: React.ReactNode;
}

export function WidgetCard({ title, onRemove, isEditing, children }: WidgetCardProps) {
  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <div className={styles.widgetTitle}>
          <h3>{title}</h3>
        </div>
        {isEditing && onRemove && (
          <button
            className={styles.widgetRemove}
            onClick={onRemove}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            title="위젯 삭제"    
          >
            <Image 
              src="/images/icons/ico_close.png" 
              alt="삭제" 
              width={24} 
              height={24}
            />
          </button>
        )}
      </div>
      <div className={styles.widgetContent}>
        {children}
      </div>
    </div>
  );
}