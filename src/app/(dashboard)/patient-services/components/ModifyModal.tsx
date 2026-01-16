'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../patient-services.module.scss'
import type { PatientService } from '../types'
import type { Patient } from '@/app/(dashboard)/patients/types'
import { apiCall } from '@/lib/api'

type ModifyAction = 'update_sessions' | 'update_price' | 'update_expiry' | 'update_service_name' | 'partial_refund' | 'transfer'

export default function ModifyModal({
  service,
  onClose,
  onSave
}: {
  service: PatientService
  onClose: () => void
  onSave: () => void
}) {
  const [action, setAction] = useState<ModifyAction>('update_sessions')
  const [formData, setFormData] = useState({
    total_sessions: service.total_sessions,
    total_price: service.total_price || 0,
    expiry_date: service.expiry_date || '',
    service_name: service.service_name,
    refund_sessions: 0,
    refund_amount: 0,
    refund_reason: '',
    new_patient_id: '',
    new_patient_name: '',
    memo: ''
  })

  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // service 변경 시 formData 업데이트
  useEffect(() => {
    setFormData({
      total_sessions: service.total_sessions,
      total_price: service.total_price || 0,
      expiry_date: service.expiry_date || '',
      service_name: service.service_name,
      refund_sessions: 0,
      refund_amount: 0,
      refund_reason: '',
      new_patient_id: '',
      new_patient_name: '',
      memo: ''
    })
  }, [service])

  // 환자 검색
  useEffect(() => {
    if (action !== 'transfer') return
    if (patientSearch.length >= 1) {
      const timer = setTimeout(() => {
        searchPatients(patientSearch)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setPatientResults([])
    }
  }, [patientSearch, action])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: Record<string, unknown> = { ...formData }
    
    // 빈 값 정리
    Object.keys(data).forEach(key => {
      if (data[key] === '' || data[key] === 0) {
        delete data[key]
      }
    })

    const result = await apiCall(`/api/patient-services/modify`, {
      method: 'POST',
      body: JSON.stringify({
        patient_service_id: service.id,
        action,
        data
      })
    })

    if (result.success) {
      onSave()
      onClose()
    }
  }

  // 환자 검색
  const searchPatients = async (term: string) => {
    const result = await apiCall<Patient[]>(`/api/patients?search=${encodeURIComponent(term)}&limit=5`)
    if (result.success && result.data) {
      setPatientResults(Array.isArray(result.data) ? result.data : [])
    } else {
      setPatientResults([])
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="서비스 변경/환불"
      size="md"
      closeOnOverlayClick={false}
      footer={
        <div className="footer-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="modify-form" variant="primary">
            적용
          </Button>
        </div>
      }
    >
      <form id="modify-form" onSubmit={handleSubmit}>
        <div className={styles.formSection}>
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
            {service.expiry_date && (
              <div className={styles.infoRow}>
                <span>유효기간</span>
                <strong>{new Date(service.expiry_date).toLocaleDateString('ko-KR')}</strong>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          <p>변경 유형</p>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as ModifyAction)}
              >
                <option value="update_sessions">회차 수정</option>
                <option value="update_price">가격 수정</option>
                <option value="update_expiry">유효기간 수정</option>
                <option value="update_service_name">서비스명 수정</option>
                <option value="partial_refund">부분 환불</option>
                <option value="transfer">양도 처리</option>
              </select>
            </div>
          </div>
        </div>

        {action === 'update_sessions' && (
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>총 회차 수 *</label>
                <input
                  type="number"
                  min={service.used_sessions}
                  value={formData.total_sessions}
                  onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || service.total_sessions })}
                  required
                />
                <small>현재 사용: {service.used_sessions}회 (최소 {service.used_sessions}회 이상)</small>
              </div>
            </div>
          </div>
        )}

        {action === 'update_price' && (
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>구매금액 *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {action === 'update_expiry' && (
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>유효기간 *</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {action === 'update_service_name' && (
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>서비스명 *</label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {action === 'partial_refund' && (
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>환불 회차 수 *</label>
                <input
                  type="number"
                  min="1"
                  max={service.remaining_sessions}
                  value={formData.refund_sessions}
                  onChange={(e) => setFormData({ ...formData, refund_sessions: parseInt(e.target.value) || 0 })}
                  required
                />
                <small>최대 {service.remaining_sessions}회</small>
              </div>
              <div className={styles.formField}>
                <label>환불 금액 *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.refund_amount}
                  onChange={(e) => setFormData({ ...formData, refund_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>환불 사유</label>
                <textarea
                  value={formData.refund_reason}
                  onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {action === 'transfer' && (
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>양도받을 환자 *</label>
                {selectedPatient ? (
                  <div className={styles.selectedItem}>
                    <div>
                      <strong>{selectedPatient.name}</strong>
                      <span className={styles.chartNo}>{selectedPatient.chart_no}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setFormData({ ...formData, new_patient_id: '', new_patient_name: '' })
                        setPatientSearch('')
                      }}
                    >
                      제거
                    </button>
                  </div>
                ) : (
                  <div className={styles.searchWrapper}>
                    <div className={styles.patientSearch}>
                      <div className={styles.searchInput}>
                        <Search size={18} />
                        <input
                          type="text"
                          placeholder="환자 이름, 차트번호 검색"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          style={{ padding: '0' }}
                        />
                      </div>
                      {patientResults.length > 0 && (
                        <div className={styles.searchResults}>
                          {patientResults.map((patient) => (
                            <div
                              key={patient.id}
                              className={styles.searchResultItem}
                              onClick={() => {
                                setSelectedPatient(patient)
                                setFormData({ ...formData, new_patient_id: patient.id, new_patient_name: patient.name })
                                setPatientSearch('')
                                setPatientResults([])
                              }}
                            >
                              <div>
                                <strong>{patient.name}</strong>
                                <span className={styles.chartNo}>{patient.chart_no}</span>
                              </div>
                              <span>{patient.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.formSection}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>메모</label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

