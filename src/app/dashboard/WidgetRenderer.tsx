import React from 'react';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { NoticeBoardWidget } from '@/components/widgets/NoticeBoardWidget';
import { PatientHistoryWidget } from '@/components/widgets/PatientHistoryWidget';
import { MemoWidget } from '@/components/widgets/MemoWidget';
import { TaskPlanWidget } from '@/components/widgets/TaskPlanWidget';
import { HospitalTimetableWidget } from '@/components/widgets/HospitalTimetableWidget';
import { PatientListWidget } from '@/components/widgets/PatientListWidget';
import { ReservationStatusWidget } from '@/components/widgets/ReservationStatusWidget';
import { SalesDashboardWidget } from '@/components/widgets/SalesDashboardWidget';
import { InventoryDashboardWidget } from '@/components/widgets/InventoryDashboardWidget';
import { PatientAnalyticsWidget } from '@/components/widgets/PatientAnalyticsWidget';
import { DocumentTemplatesWidget } from '@/components/widgets/DocumentTemplatesWidget';
import { BeforeAfterWidget } from '@/components/widgets/BeforeAfterWidget';
import { CallCenterQueueWidget } from '@/components/widgets/CallCenterQueueWidget';
import { NotificationCenterWidget } from '@/components/widgets/NotificationCenterWidget';

interface WidgetRendererProps {
  type: string;
  isEditing?: boolean;
  onRemove?: () => void;
}

export function WidgetRenderer({ type, isEditing, onRemove }: WidgetRendererProps) {
  if (type === 'progress-notes' || type === 'memo' || type.startsWith('memo-')) {
    return <MemoWidget widgetId={type} isEditing={isEditing} onRemove={onRemove} />;
  }

  switch (type) {
    case 'calendar':
      return <CalendarWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'notice-board':
      return <NoticeBoardWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'patient-history':
      return <PatientHistoryWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'task-plan':
      return <TaskPlanWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'hospital-timetable':
      return <HospitalTimetableWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'patient-list':
      return <PatientListWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'reservation-status':
      return <ReservationStatusWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'sales-dashboard':
      return <SalesDashboardWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'inventory-dashboard':
      return <InventoryDashboardWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'patient-analytics':
      return <PatientAnalyticsWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'document-templates':
      return <DocumentTemplatesWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'before-after':
      return <BeforeAfterWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'call-center-queue':
      return <CallCenterQueueWidget isEditing={isEditing} onRemove={onRemove} />;
    case 'notification-center':
      return <NotificationCenterWidget isEditing={isEditing} onRemove={onRemove} />;
    default:
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#a3a3a3' }}>
          알 수 없는 위젯: {type}
        </div>
      );
  }
}

