'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reservation, CATEGORIES, TIME_SLOTS } from '@/lib/types';
import { 
  formatDateForDB, 
  getDaysInMonth, 
  getWeekDates, 
  getWeekRange, 
  getDayDisplay,
  isToday,
  isSameDay
} from '@/lib/utils';
import { useReservations } from '@/lib/hooks/useReservations';
import { ReservationModal } from './components/ReservationModal';
import styles from '@/styles/dashboard.module.scss';
import './reservations.scss';

export default function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 9));
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [filterTab, setFilterTab] = useState<'all' | 'reservation' | 'checkin' | 'cancelled'>('all');

  const {
    reservations,
    loading,
    loadReservations,
    saveReservation,
    updateReservation,
    deleteReservation,
  } = useReservations();

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setSelectedDate(newDate);
    if (newDate.getMonth() !== selectedDate.getMonth() || newDate.getFullYear() !== selectedDate.getFullYear()) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const nextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
    if (newDate.getMonth() !== selectedDate.getMonth() || newDate.getFullYear() !== selectedDate.getFullYear()) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const getReservationsForSlot = (date: string, time: string) => {
    return reservations.filter(r => r.date === date && r.time === time);
  };

  const handleSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date: formatDateForDB(date), time });
    setShowAddModal(true);
  };

  const handleSaveReservation = async (data: Partial<Reservation>) => {
    const success = await saveReservation(data, selectedSlot);
    if (success) {
      setShowAddModal(false);
      setSelectedSlot(null);
    }
  };

  const handleUpdateReservation = async (data: Partial<Reservation>) => {
    if (!selectedReservation?.id) return;
    const success = await updateReservation(selectedReservation.id, data);
    if (success) {
      setSelectedReservation(null);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    const success = await deleteReservation(id);
    if (success) {
      setSelectedReservation(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className="reservations-layout-v2">
      {/* 왼쪽 사이드바 */}
      <aside className="sidebar-left">
        <div className="calendar-mini">
          <div className="calendar-header">
            <button onClick={prevMonth} className="month-nav">
              <ChevronLeft size={16} />
            </button>
            <h3>{currentMonth.getFullYear()}.{String(currentMonth.getMonth() + 1).padStart(2, '0')}</h3>
            <button onClick={nextMonth} className="month-nav">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calendar-grid">
            <div className="weekdays">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="days">
              {getDaysInMonth(currentMonth).map((day, index) => (
                <button
                  key={index}
                  className={`day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''} ${isSameDay(day.date, selectedDate) ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  {day.date.getDate()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="daily-schedule">
          <div className="schedule-header">
            <h4>
              {String(selectedDate.getFullYear()).slice(-2)}-{String(selectedDate.getMonth() + 1).padStart(2, '0')}-{String(selectedDate.getDate()).padStart(2, '0')} 예약현황 
              <span className="total-count">{reservations.filter(r => r.date === formatDateForDB(selectedDate)).length}</span>
            </h4>
          </div>
          
          <div className="schedule-tabs">
            <button 
              className={`tab ${filterTab === 'reservation' ? 'active' : ''}`}
              onClick={() => setFilterTab('reservation')}
            >
              예약 <span className="count">{reservations.filter(r => r.date === formatDateForDB(selectedDate) && (r.status || 'reservation') === 'reservation').length}</span>
            </button>
            <button 
              className={`tab ${filterTab === 'checkin' ? 'active' : ''}`}
              onClick={() => setFilterTab('checkin')}
            >
              접수 <span className="count">{reservations.filter(r => r.date === formatDateForDB(selectedDate) && r.status === 'checkin').length}</span>
            </button>
            <button 
              className={`tab ${filterTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setFilterTab('cancelled')}
            >
              예약취소 <span className="count">{reservations.filter(r => r.date === formatDateForDB(selectedDate) && r.status === 'cancelled').length}</span>
            </button>
            <button 
              className={`tab ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              전체 <span className="count">{reservations.filter(r => r.date === formatDateForDB(selectedDate)).length}</span>
            </button>
          </div>

          <div className="schedule-table">
            <div className="table-header">
              <div className="col-time">시간</div>
              <div className="col-patient">환자정보</div>
              <div className="col-contact">예약자정보</div>
              <div className="col-purpose">방문목적</div>
            </div>
            <div className="table-body">
              {reservations
                .filter(r => {
                  const selectedDateStr = formatDateForDB(selectedDate);
                  if (r.date !== selectedDateStr) return false;
                  if (filterTab === 'all') return true;
                  if (filterTab === 'reservation') return (r.status || 'reservation') === 'reservation';
                  if (filterTab === 'checkin') return r.status === 'checkin';
                  if (filterTab === 'cancelled') return r.status === 'cancelled';
                  return true;
                })
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(reservation => {
                  const category = CATEGORIES.find(c => c.id === reservation.category);
                  return (
                    <div 
                      key={reservation.id} 
                      className="table-row"
                      onClick={() => setSelectedReservation(reservation)}
                    >
                      <div className="col-time">{reservation.time}</div>
                      <div className="col-patient">
                        <div className="patient-name">{reservation.patient_name}</div>
                      </div>
                      <div className="col-contact">
                        <div className="patient-name">{reservation.patient_name}</div>
                        <div className="patient-phone">{reservation.phone}</div>
                      </div>
                      <div className="col-purpose">
                        {CATEGORIES.find(c => c.id === reservation.category)?.name || reservation.category}
                      </div>
                    </div>
                  );
                })}
              {reservations.filter(r => r.date === formatDateForDB(selectedDate)).length === 0 && (
                <div className="empty-message">예약이 없습니다</div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="reservations-main-content">
        <div className="content-header">
          <div className="date-nav">
            <button onClick={prevPeriod} className="nav-btn">
              <ChevronLeft size={20} />
            </button>
            <h2>{viewMode === 'week' ? getWeekRange(selectedDate) : getDayDisplay(selectedDate)}</h2>
            <button onClick={nextPeriod} className="nav-btn">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="view-tabs">
            <button
              className={`tab ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              일별
            </button>
            <button
              className={`tab ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              주별
            </button>
          </div>
        </div>

        {viewMode === 'week' && (
          <div className="week-grid">
            <div className="week-header">
              <div className="time-col-header">시간</div>
              {getWeekDates(selectedDate).map((date, index) => (
                <div key={index} className="day-col-header">
                  {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]} ({date.getMonth() + 1}.{date.getDate()})
                </div>
              ))}
            </div>
            <div className="week-body">
              {/* 30분 단위로 행 그룹화 */}
              {Array.from({ length: 20 }, (_, i) => {
                const hour = 9 + Math.floor(i / 2);
                const minute = (i % 2) * 30;
                const hourLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                
                return (
                  <div key={i} className="week-row-group">
                    <div className="time-col-group">{hourLabel}</div>
                    <div className="day-cols-wrapper">
                      {getWeekDates(selectedDate).map((date, dayIndex) => {
                        const dateStr = formatDateForDB(date);
                        
                        return (
                          <div key={dayIndex} className="day-col-group">
                            {/* 15분 단위 슬롯 2개 */}
                            {[0, 15].map(offset => {
                              const slotTime = `${String(hour).padStart(2, '0')}:${String(minute + offset).padStart(2, '0')}`;
                              const slotReservations = reservations.filter(r => {
                                return r.date === dateStr && r.time === slotTime;
                              });
                              
                              return (
                                <div
                                  key={offset}
                                  className="time-slot-card"
                                  onClick={() => handleSlotClick(date, slotTime)}
                                >
                                  <div className="slot-header">
                                    <span className="slot-time">{slotTime}</span>
                                    <span className="slot-count">{slotReservations.length}</span>
                                  </div>
                                  {slotReservations.length > 0 && (
                                    <div className="slot-patients">
                                      {slotReservations.map((reservation, idx) => {
                                        const category = CATEGORIES.find(c => c.id === reservation.category);
                                        return (
                                          <div
                                            key={reservation.id}
                                            className="patient-name-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedReservation(reservation);
                                            }}
                                          >
                                            {idx + 1}. {reservation.patient_name} <span className="required-mark">*</span> <span className="category-name">{category?.name || ''}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="day-grid">
            <div className="day-header">
              <div className="time-col-header">시간</div>
              <div className="slot-col-header">예약 현황</div>
            </div>
            <div className="day-body">
              {Array.from({ length: 20 }, (_, i) => {
                const hour = 9 + Math.floor(i / 2);
                const minute = (i % 2) * 30;
                const hourLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const dateStr = formatDateForDB(selectedDate);
                
                return (
                  <div key={i} className="day-row-group">
                    <div className="time-col-group">{hourLabel}</div>
                    <div className="day-slots-wrapper">
                      {/* 15분 단위 슬롯 2개 */}
                      {[0, 15].map(offset => {
                        const slotTime = `${String(hour).padStart(2, '0')}:${String(minute + offset).padStart(2, '0')}`;
                        const slotReservations = reservations.filter(r => {
                          return r.date === dateStr && r.time === slotTime;
                        });
                        
                        return (
                          <div
                            key={offset}
                            className="time-slot-card"
                            onClick={() => handleSlotClick(selectedDate, slotTime)}
                          >
                            <div className="slot-header">
                              <span className="slot-time">{slotTime}</span>
                              <span className="slot-count">{slotReservations.length}</span>
                            </div>
                            {slotReservations.length > 0 && (
                              <div className="slot-patients">
                                {slotReservations.map((reservation, idx) => {
                                  const category = CATEGORIES.find(c => c.id === reservation.category);
                                  return (
                                    <div
                                      key={reservation.id}
                                      className="patient-name-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedReservation(reservation);
                                      }}
                                    >
                                      {idx + 1}. {reservation.patient_name} <span className="required-mark">*</span> <span className="category-name">{category?.name || ''}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 예약 모달 (추가 & 상세) */}
      {(showAddModal || selectedReservation) && (
        <ReservationModal
          slot={selectedSlot}
          reservation={selectedReservation}
          onSave={handleSaveReservation}
          onUpdate={handleUpdateReservation}
          onDelete={selectedReservation ? () => handleDeleteReservation(selectedReservation.id!) : undefined}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSlot(null);
            setSelectedReservation(null);
          }}
        />
      )}
      </div>
    </div>
  );
}

