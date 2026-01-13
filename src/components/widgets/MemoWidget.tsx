import React, { useState, useEffect, useMemo } from 'react';
import { WidgetCard } from './WidgetCard';
import { api } from '@/lib/api';
import { debounce } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import styles from './widgets.module.scss';

interface MemoWidgetProps {
  widgetId?: string;
  isEditing?: boolean;
  onRemove?: () => void;
}

export function MemoWidget({ widgetId = 'memo', isEditing, onRemove }: MemoWidgetProps) {
  const { user } = useAuth();
  const employeeId = user?.employee?.id || 'default';
  
  const [title, setTitle] = useState('메모');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await api.widgetData.get<{ title: string; content: string }>(employeeId, widgetId);
        if (result.success && result.data) {
          setTitle(result.data.title || '메모');
          setContent(result.data.content || '');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [employeeId, widgetId]);

  const saveToDatabase = useMemo(
    () => debounce(async (newTitle: string, newContent: string) => {
      await api.widgetData.save(employeeId, widgetId, {
        title: newTitle,
        content: newContent
      });
    }, 1000),
    [employeeId, widgetId]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveToDatabase(newTitle, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    saveToDatabase(title, newContent);
  };

  if (isLoading) {
    return (
      <WidgetCard title={title} isEditing={isEditing} onRemove={onRemove}>
        <div className={styles.loadingState}>
          로딩 중...
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard 
      title={
        isEditing ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="제목을 입력하세요"
            className={styles.memoTitleInput}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
        ) : (
          title
        )
      }
      isEditing={isEditing} 
      onRemove={onRemove}
    >
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="메모 내용을 작성하세요..."
        className={styles.memoTextarea}
        readOnly={!isEditing}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
    </WidgetCard>
  );
}

