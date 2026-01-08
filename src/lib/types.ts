export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface Widget {
  id: string;
  name: string;
  category: 'core' | 'recommended' | 'advanced';
  defaultSize: {
    w: number;
    h: number;
  };
}

export interface LayoutData {
  id: string;
  user_id: string;
  layout_json: LayoutItem[];
  created_at: string;
  updated_at: string;
}

export const AVAILABLE_WIDGETS: Widget[] = [
  { id: "calendar", name: "진료 일정", category: "core", defaultSize: { w: 4, h: 8 } },
  { id: "notice-board", name: "공지사항", category: "core", defaultSize: { w: 4, h: 8 } },
  { id: "patient-history", name: "환자 시술 히스토리", category: "core", defaultSize: { w: 4, h: 8 } },
  { id: "task-plan", name: "업무 계획", category: "core", defaultSize: { w: 4, h: 8 } },
  { id: "hospital-timetable", name: "병원 운영시간", category: "core", defaultSize: { w: 4, h: 8 } },
  { id: "memo", name: "메모", category: "core", defaultSize: { w: 4, h: 8 } },
  { id: "patient-list", name: "내원 환자", category: "recommended", defaultSize: { w: 4, h: 8 } },
  { id: "reservation-status", name: "예약 상태", category: "recommended", defaultSize: { w: 4, h: 8 } },
  { id: "sales-dashboard", name: "매출 통계", category: "recommended", defaultSize: { w: 4, h: 8 } },
  { id: "inventory-dashboard", name: "재고 관리", category: "recommended", defaultSize: { w: 4, h: 8 } },
  { id: "patient-analytics", name: "환자 통계", category: "advanced", defaultSize: { w: 4, h: 8 } },
  { id: "document-templates", name: "문서 템플릿", category: "advanced", defaultSize: { w: 4, h: 8 } },
  { id: "before-after", name: "전후 사진", category: "advanced", defaultSize: { w: 4, h: 8 } },
  { id: "call-center-queue", name: "상담 대기열", category: "advanced", defaultSize: { w: 4, h: 8 } },
  { id: "notification-center", name: "긴급 알림", category: "advanced", defaultSize: { w: 4, h: 8 } }
];

