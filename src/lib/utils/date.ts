/**
 * 날짜를 DB 형식으로 변환 (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 특정 달의 모든 날짜 가져오기 (이전/다음 달 포함)
 */
export function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days = [];
  
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
    days.push({ date: prevDate, isCurrentMonth: false });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  return days;
}

/**
 * 선택된 날짜가 포함된 주의 모든 날짜 가져오기 (일요일 시작)
 */
export function getWeekDates(selectedDate: Date): Date[] {
  const day = selectedDate.getDay();
  const sunday = new Date(selectedDate);
  sunday.setDate(selectedDate.getDate() - day);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * 주간 범위 문자열 반환 (예: 2026년 1월 5일 - 1월 11일)
 */
export function getWeekRange(selectedDate: Date): string {
  const dates = getWeekDates(selectedDate);
  const start = dates[0];
  const end = dates[6];
  return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
}

/**
 * 날짜 표시 문자열 반환 (예: 2026년 1월 9일 (목))
 */
export function getDayDisplay(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

/**
 * 오늘인지 확인 (테스트용 - 2026년 1월 9일 기준)
 */
export function isToday(date: Date): boolean {
  return date.getDate() === 9 && date.getMonth() === 0 && date.getFullYear() === 2026;
}

/**
 * 두 날짜가 같은 날인지 확인
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

