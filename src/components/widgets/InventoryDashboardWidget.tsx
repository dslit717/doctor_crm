import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from '@/styles/widgets.module.scss';

interface InventoryDashboardWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function InventoryDashboardWidget({ isEditing, onRemove }: InventoryDashboardWidgetProps) {
  const inventory = [
    { item: '보톡스', stock: 15, unit: '병', status: 'ok' },
    { item: '필러', stock: 8, unit: '개', status: 'ok' },
    { item: '마취크림', stock: 3, unit: '개', status: 'low' },
    { item: '주사기', stock: 1, unit: '박스', status: 'critical' },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'ok': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'low': return { bg: '#fff3e0', text: '#e65100' };
      case 'critical': return { bg: '#ffebee', text: '#c62828' };
      default: return { bg: '#f5f5f5', text: '#737373' };
    }
  };

  return (
    <WidgetCard title="재고 관리" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.inventoryList}>
        {inventory.map((item, idx) => {
          const colors = statusColor(item.status);
          return (
            <div key={idx} className={styles.inventoryItem} style={{ background: colors.bg }}>
              <span className={styles.inventoryName}>
                {item.item}
              </span>
              <span className={styles.inventoryStock} style={{ color: colors.text }}>
                {item.stock} {item.unit}
              </span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

