export interface Reservation {
  id?: string;
  date: string;
  time: string;
  patient_id?: string;
  patient_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  treatment?: string;
  category?: string;
  memo?: string;
  chart_number?: string;
  doctor_id?: string;
  counselor_id?: string;
  status?: 'reservation' | 'checkin' | 'consulting' | 'treatment' | 'completed' | 'cancelled' | 'no_show';
}

export const CATEGORIES = [
  { id: 'consultation', name: '상담', color: '#4A90E2' },
  { id: 'treatment', name: '시술', color: '#E85D75' },
  { id: 'skincare', name: '관리', color: '#6BCF7F' },
  { id: 'etc', name: '기타', color: '#95A5A6' },
] as const;

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 4) + 9;
  const minute = (i % 4) * 15;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}).filter(time => {
  const hour = parseInt(time.split(':')[0]);
  return hour >= 9 && hour < 19;
});

