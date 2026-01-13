'use client';

import { useState, useCallback, useEffect } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { Plus, Check, Edit } from 'lucide-react';
import { WidgetRenderer } from './WidgetRenderer';
import { LayoutItem, AVAILABLE_WIDGETS } from '@/lib/types';
import { api } from '@/lib/api';
import { GRID_CONFIG } from '@/lib/constants';
import { getWidgetIcon } from '@/lib/widget-icons';
import styles from './dashboard.module.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardGridProps {
  employeeId: string;
}

export function DashboardGrid({ employeeId }: DashboardGridProps) {
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [columns, setColumns] = useState<2 | 3 | 4>(3);
  const [gridWidth, setGridWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await api.layout.get(employeeId);
        
        if (result.success && result.data) {
          setLayout(result.data.layout || []);
          setColumns(result.data.columns as 2 | 3 | 4 || 3);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [employeeId]);

  useEffect(() => {
    const updateWidth = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      const container = document.querySelector('[class*="dashboard_container"]') as HTMLElement;
      if (container) {
        const padding = isMobileView ? 32 : 40;
        setGridWidth(container.clientWidth - padding);
      }
    };
    
    updateWidth();
    
    // ResizeObserver로 container 크기 변화 직접 감지
    const container = document.querySelector('[class*="dashboard_container"]') as HTMLElement;
    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });
      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  const saveLayoutImmediate = useCallback((newLayout: LayoutItem[], cols: number) => {
    api.layout.save(employeeId, newLayout, cols);
  }, [employeeId]);

  const convertToLayoutItems = (newLayout: Layout[]): LayoutItem[] => {
    return newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
    }));
  };

  const onLayoutChange = (newLayout: Layout[]) => {
    if (isMobile) return;
    setLayout(convertToLayoutItems(newLayout));
  };

  const removeWidget = async (widgetId: string) => {
    const newLayout = layout.filter(item => item.i !== widgetId);
    setLayout(newLayout);
    saveLayoutImmediate(newLayout, columns);
    
    if (widgetId === 'memo' || widgetId.startsWith('memo-')) {
      await api.widgetData.delete(employeeId, widgetId);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      saveLayoutImmediate(layout, columns);
    }
    setIsEditing(!isEditing);
  };

  const addWidget = (widgetId: string) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return;

    let finalWidgetId = widgetId;
    if (widgetId === 'memo') {
      const memoCount = layout.filter(item => item.i.startsWith('memo')).length;
      finalWidgetId = memoCount === 0 ? 'memo' : `memo-${memoCount + 1}`;
    } else {
      if (layout.find(item => item.i === widgetId)) {
        alert('이미 추가된 위젯입니다.');
        return;
      }
    }

    const maxY = layout.length > 0 
      ? Math.max(...layout.map(item => item.y + item.h))
      : 0;

    const colWidth = Math.floor(GRID_CONFIG.COLS / columns);
    const lastRowItems = layout.filter(item => item.y >= maxY - 8);
    const position = lastRowItems.length % columns;
    const newX = position * colWidth;
    const newY = position === 0 ? maxY : maxY - 8;

    const newWidget: LayoutItem = {
      i: finalWidgetId,
      x: newX,
      y: newY,
      w: colWidth,
      h: 8,
      minW: Math.max(2, Math.floor(colWidth * 0.8)),
      minH: 5
    };

    const newLayout = [...layout, newWidget];
    setLayout(newLayout);
    saveLayoutImmediate(newLayout, columns); 
    setShowWidgetPanel(false);
  };

  const changeColumns = (newColumns: 2 | 3 | 4) => {
    const colWidth = Math.floor(GRID_CONFIG.COLS / newColumns);
    const reorganizedLayout = layout.map((item, index) => ({
      ...item,
      x: (index % newColumns) * colWidth,
      y: Math.floor(index / newColumns) * 8,
      w: colWidth,
      minW: Math.max(2, Math.floor(colWidth * 0.8))
    }));
    
    setColumns(newColumns);
    setLayout(reorganizedLayout);
    saveLayoutImmediate(reorganizedLayout, newColumns);
  };

  // 모바일에서 레이아웃 재조정
  const mobileLayout = isMobile
    ? layout.map((item, index) => ({
        ...item,
        x: 0,
        y: index * 8,
        w: 12,
      }))
    : layout;

  const effectiveCols = isMobile ? 12 : GRID_CONFIG.COLS;

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1rem',
        color: '#737373'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.controls}>
          {!isMobile && (
            <div className={styles.columnSelector}>
            <button
              onClick={() => changeColumns(2)}
              className={`${styles.columnButton} ${columns === 2 ? styles.active : ''}`}
            >
              2열
            </button>
            <button
              onClick={() => changeColumns(3)}
              className={`${styles.columnButton} ${columns === 3 ? styles.active : ''}`}
            >
              3열
            </button>
            <button
              onClick={() => changeColumns(4)}
              className={`${styles.columnButton} ${columns === 4 ? styles.active : ''}`}
            >
              4열
            </button>
          </div>
          )}

          {isEditing && (
            <button
              onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              className={`${styles.button} ${showWidgetPanel ? styles.active : ''}`}
            >
              <Plus size={18} />
              위젯 추가
            </button>
          )}
          <button
            onClick={toggleEditMode}
            className={`${styles.button} ${isEditing ? styles.active : ''}`}
          >
            {isEditing ? (
              <>
                <Check size={18} strokeWidth={2}/>
                편집 완료
              </>
            ) : (
              <>
                <Edit size={16} />
                편집 모드
              </>
            )}
          </button>
        </div>
      </div>

      {showWidgetPanel && isEditing && (
        <div className={styles.widgetPanel}>
          <h3>위젯 추가</h3>
          <div className={styles.widgetList}>
            {AVAILABLE_WIDGETS.map(widget => {
              const isAdded = widget.id === 'memo' ? false : layout.find(item => item.i === widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  className={`${styles.widgetItem} ${isAdded ? styles.disabled : ''}`}
                  disabled={!!isAdded}
                >
                  <span className={styles.widgetItemIcon}>
                    {getWidgetIcon(widget.id, 24)}
                  </span>
                  <span className={styles.widgetItemName}>{widget.name}</span>
                  {isAdded && (
                    <span className={styles.widgetItemBadge}>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <GridLayout
        key={`grid-${gridWidth}`}
        className="layout"
        layout={mobileLayout}
        cols={effectiveCols}
        rowHeight={GRID_CONFIG.ROW_HEIGHT}
        width={gridWidth}
        onLayoutChange={onLayoutChange}
        onDragStop={(newLayout) => {
          if (isEditing) {
            saveLayoutImmediate(convertToLayoutItems(newLayout), columns);
          }
        }}
        onResizeStop={(newLayout) => {
          if (isEditing) {
            saveLayoutImmediate(convertToLayoutItems(newLayout), columns);
          }
        }}
        isDraggable={isEditing && !isMobile}
        isResizable={isEditing}
        resizeHandles={isMobile ? ['s'] : ['se']}
        compactType="vertical"
        preventCollision={false}
        margin={GRID_CONFIG.MARGIN}
        containerPadding={[0, 0]}
      >
        {layout.map(item => (
          <div key={item.i}>
            <WidgetRenderer
              type={item.i}
              isEditing={isEditing}
              onRemove={() => removeWidget(item.i)}
            />
          </div>
        ))}
      </GridLayout>

      {layout.length === 0 && (
        <div className={styles.emptyState}>
          <div>📊</div>
          <p>위젯이 없습니다. 편집 모드에서 위젯을 추가하세요.</p>
        </div>
      )}
    </>
  );
}

