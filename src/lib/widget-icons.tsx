import { 
  Calendar, Bell, ClipboardList, StickyNote, CheckSquare, 
  Clock, Users, CalendarCheck, DollarSign, Package, 
  BarChart3, FileText, Camera, Phone, BellRing
} from 'lucide-react';

export function getWidgetIcon(widgetId: string, size: number = 20) {
  const iconMap: Record<string, any> = {
    'calendar': Calendar,
    'notice-board': Bell,
    'patient-history': ClipboardList,
    'memo': StickyNote,
    'task-plan': CheckSquare,
    'hospital-timetable': Clock,
    'patient-list': Users,
    'reservation-status': CalendarCheck,
    'sales-dashboard': DollarSign,
    'inventory-dashboard': Package,
    'patient-analytics': BarChart3,
    'document-templates': FileText,
    'before-after': Camera,
    'call-center-queue': Phone,
    'notification-center': BellRing,
  };
  
  const IconComponent = iconMap[widgetId] || StickyNote;
  return <IconComponent size={size} />;
}

