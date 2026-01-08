import { LayoutItem } from './types';

export const USER_ID = 'demo-user-id';

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "calendar", x: 0, y: 0, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "notice-board", x: 4, y: 0, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "patient-history", x: 8, y: 0, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "memo", x: 0, y: 8, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "task-plan", x: 4, y: 8, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "hospital-timetable", x: 8, y: 8, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "patient-list", x: 0, y: 16, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "reservation-status", x: 4, y: 16, w: 4, h: 8, minW: 3, minH: 5 },
  { i: "sales-dashboard", x: 8, y: 16, w: 4, h: 8, minW: 3, minH: 5 }
];

export const DEFAULT_COLUMNS = 3;

export const GRID_CONFIG = {
  MAX_CONTAINER_WIDTH: 1800,
  CONTAINER_PADDING: 48,
  ROW_HEIGHT: 30,
  MARGIN: [8, 8] as [number, number],
  COLS: 12,
} as const;

