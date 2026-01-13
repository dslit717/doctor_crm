import React from 'react';
import { WidgetCard } from './WidgetCard';
import styles from './widgets.module.scss';

interface DocumentTemplatesWidgetProps {
  isEditing?: boolean;
  onRemove?: () => void;
}

export function DocumentTemplatesWidget({ isEditing, onRemove }: DocumentTemplatesWidgetProps) {
  const templates = [
    { name: '상담 동의서', icon: '📄', used: 45 },
    { name: '시술 동의서', icon: '📝', used: 32 },
    { name: '개인정보 동의서', icon: '🔒', used: 78 },
    { name: '치료 계획서', icon: '📋', used: 23 },
  ];

  return (
    <WidgetCard title="문서 템플릿" isEditing={isEditing} onRemove={onRemove}>
      <div className={styles.templateList}>
        {templates.map((template, idx) => (
          <button key={idx} className={styles.templateButton}>
            <div className={styles.templateInfo}>
              <span className={styles.templateIcon}>{template.icon}</span>
              <span className={styles.templateName}>
                {template.name}
              </span>
            </div>
            <span className={styles.templateUsage}>
              {template.used}회
            </span>
          </button>
        ))}
      </div>
    </WidgetCard>
  );
}

