import React, { useState, useEffect, useMemo } from 'react';
import { WidgetCard } from './WidgetCard';
import { api } from '@/lib/api';
import { debounce } from '@/lib/utils';
import { USER_ID } from '@/lib/constants';
import styles from '@/styles/widgets.module.scss';

interface MemoWidgetProps {
  widgetId?: string;
  isEditing?: boolean;
  onRemove?: () => void;
}

export function MemoWidget({ widgetId = 'memo', isEditing, onRemove }: MemoWidgetProps) {
  const [title, setTitle] = useState('메모');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await api.widgetData.get<{ title: string; content: string }>(USER_ID, widgetId);
        if (result.success && result.data) {
          setTitle(result.data.title || '메모');
          setContent(result.data.content || '');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [widgetId]);

  const saveToDatabase = useMemo(
    () => debounce(async (newTitle: string, newContent: string) => {
      await api.widgetData.save(USER_ID, widgetId, {
        title: newTitle,
        content: newContent
      });
    }, 1000),
    [widgetId]
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

