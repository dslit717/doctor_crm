'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../patient-services.module.scss'
import type { PatientService } from '../types'
import { apiCall } from '@/lib/api'

interface Reservation {
  id: string
  date: string
  time: string
  patient_name?: string
  treatment?: string
}

interface Employee {
  id: string
  name: string
  employee_no?: string
  department?: { name: string } | null
}

export default function UsageModal({
  service,
  onClose,
  onSave
}: {
  service: PatientService
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}) {
  const [formData, setFormData] = useState({
    reservation_id: '',
    staff_id: '',
    memo: ''
  })

  // 예약 검색
  const [reservationSearch, setReservationSearch] = useState('')
  const [reservationResults, setReservationResults] = useState<Reservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // 직원 검색
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<Employee[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Employee | null>(null)

  // 환자의 최근 예약 목록 로드
  useEffect(() => {
    if (service.patient_id) {
      apiCall<Reservation[]>(`/api/reservations?patient_id=${service.patient_id}`).then(result => {
        if (result.success && result.data) {
          const reservations = Array.isArray(result.data) ? result.data : []
          // 최근 10개만 표시
          setReservationResults(reservations.slice(0, 10))
        }
      })
    }
  }, [service.patient_id])

  // 직원 검색
  useEffect(() => {
    if (staffSearch.length >= 1) {
      const timer = setTimeout(async () => {
        const result = await apiCall<Employee[]>(
          `/api/employees?search=${encodeURIComponent(staffSearch)}&limit=5`
        )
        if (result.success && result.data) {
          setStaffResults(Array.isArray(result.data) ? result.data : [])
        } else {
          setStaffResults([])
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setStaffResults([])
    }
  }, [staffSearch])

  const selectReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setFormData(prev => ({ ...prev, reservation_id: reservation.id }))
    setReservationSearch('')
    setReservationResults([])
  }

  const selectStaff = (employee: Employee) => {
    setSelectedStaff(employee)
    setFormData(prev => ({ ...prev, staff_id: employee.id }))
    setStaffSearch('')
    setStaffResults([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      reservation_id: formData.reservation_id || null,
      staff_id: formData.staff_id || null,
      memo: formData.memo || null
    }
    onSave(submitData)
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="회차 사용"
      size="sm"
      closeOnOverlayClick={false}
      footer={
        <div className="footer-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="usage-form" variant="primary">
            사용 처리
          </Button>
        </div>
      }
    >
      <form id="usage-form" onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <p>서비스 정보</p>
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span>환자</span>
              <strong>{service.patient?.name} ({service.patient?.chart_no})</strong>
            </div>
            <div className={styles.infoRow}>
              <span>서비스</span>
              <strong>{service.service_name}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>회차</span>
              <strong>
                {service.used_sessions} / {service.total_sessions} (잔여: {service.remaining_sessions})
              </strong>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>예약 (선택)</label>
              <div className={styles.searchWrapper}>
                {selectedReservation ? (
                  <div className={styles.selectedItem}>
                    <div>
                      <strong>{selectedReservation.date} {selectedReservation.time}</strong>
                      {selectedReservation.treatment && (
                        <span>{selectedReservation.treatment}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReservation(null)
                        setFormData(prev => ({ ...prev, reservation_id: '' }))
                      }}
                    >
                      제거
                    </button>
                  </div>
                ) : (
                  <div className={styles.patientSearch}>
                    <div className={styles.searchInput}>
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="예약 검색 또는 목록에서 선택"
                        value={reservationSearch}
                        onChange={(e) => setReservationSearch(e.target.value)}
                      />
                    </div>
                    {(reservationResults.length > 0 || reservationSearch) && (
                      <div className={styles.searchResults}>
                        {reservationResults
                          .filter(r => 
                            !reservationSearch || 
                            r.date.includes(reservationSearch) || 
                            r.time.includes(reservationSearch) ||
                            r.treatment?.toLowerCase().includes(reservationSearch.toLowerCase())
                          )
                          .map((reservation) => (
                            <div
                              key={reservation.id}
                              className={styles.searchResultItem}
                              onClick={() => selectReservation(reservation)}
                            >
                              <div>
                                <strong>{reservation.date} {reservation.time}</strong>
                                {reservation.treatment && (
                                  <span>{reservation.treatment}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>담당 직원 (선택)</label>
              <div className={styles.searchWrapper}>
                {selectedStaff ? (
                  <div className={styles.selectedItem}>
                    <div>
                      <strong>{selectedStaff.name}</strong>
                      {selectedStaff.employee_no && (
                        <span>{selectedStaff.employee_no}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null)
                        setFormData(prev => ({ ...prev, staff_id: '' }))
                      }}
                    >
                      제거
                    </button>
                  </div>
                ) : (
                  <div className={styles.patientSearch}>
                    <div className={styles.searchInput}>
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="직원 이름 검색"
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                      />
                    </div>
                    {staffResults.length > 0 && (
                      <div className={styles.searchResults}>
                        {staffResults.map((employee) => (
                          <div
                            key={employee.id}
                            className={styles.searchResultItem}
                            onClick={() => selectStaff(employee)}
                          >
                            <div>
                              <strong>{employee.name}</strong>
                              {employee.employee_no && (
                                <span>{employee.employee_no}</span>
                              )}
                            </div>
                            {employee.department && (
                              <span>{employee.department.name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>메모</label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={3}
                placeholder="회차 사용 관련 메모"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

