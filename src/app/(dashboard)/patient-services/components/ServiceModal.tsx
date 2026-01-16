'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../patient-services.module.scss'
import type { PatientService } from '../types'
import type { Patient } from '@/app/(dashboard)/patients/types'
import type { Service } from '@/app/(dashboard)/services/types'
import { apiCall } from '@/lib/api'

export default function ServiceModal({
  service,
  onClose,
  onSave
}: {
  service: PatientService | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}) {
  const isEditMode = !!service

  // 환자 검색
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // 서비스 검색
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceResults, setServiceResults] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const [formData, setFormData] = useState({
    patient_id: service?.patient_id || '',
    service_id: service?.service_id || '',
    service_name: service?.service_name || '',
    service_type: service?.service_type || 'package',
    total_sessions: service?.total_sessions || 1,
    expiry_date: service?.expiry_date || '',
    total_price: service?.total_price || 0,
    memo: service?.memo || ''
  })

  // 편집 모드일 때 서비스 정보 로드
  useEffect(() => {
    if (isEditMode && service?.service_id) {
      apiCall<Service>(`/api/services?id=${service.service_id}`).then(result => {
        if (result.success && result.data) {
          setSelectedService(Array.isArray(result.data) ? result.data[0] : result.data)
        }
      })
    }
  }, [isEditMode, service])

  // service prop이 변경될 때 formData 업데이트
  useEffect(() => {
    if (service) {
      setFormData({
        patient_id: service.patient_id || '',
        service_id: service.service_id || '',
        service_name: service.service_name || '',
        service_type: service.service_type || 'package',
        total_sessions: service.total_sessions || 1,
        expiry_date: service.expiry_date || '',
        total_price: service.total_price || 0,
        memo: service.memo || ''
      })
    } else {
      setFormData({
        patient_id: '',
        service_id: '',
        service_name: '',
        service_type: 'package',
        total_sessions: 1,
        expiry_date: '',
        total_price: 0,
        memo: ''
      })
    }
  }, [service])

  // 환자 검색
  useEffect(() => {
    if (isEditMode) return
    if (patientSearch.length >= 1) {
      const timer = setTimeout(async () => {
        const result = await apiCall<Patient[]>(
          `/api/patients?search=${encodeURIComponent(patientSearch)}&limit=5`
        )
        if (result.success && result.data) {
          setPatientResults(Array.isArray(result.data) ? result.data : [])
        } else {
          setPatientResults([])
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setPatientResults([])
    }
  }, [patientSearch, isEditMode])

  // 서비스 검색
  useEffect(() => {
    if (isEditMode) return
    if (serviceSearch.length >= 1) {
      const timer = setTimeout(async () => {
        const result = await apiCall<Service[]>(
          `/api/services?search=${encodeURIComponent(serviceSearch)}&limit=5`
        )
        if (result.success && result.data) {
          setServiceResults(Array.isArray(result.data) ? result.data : [])
        } else {
          setServiceResults([])
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setServiceResults([])
    }
  }, [serviceSearch, isEditMode])

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({ ...prev, patient_id: patient.id }))
    setPatientSearch('')
    setPatientResults([])
  }

  const selectService = (service: Service) => {
    setSelectedService(service)
    setFormData(prev => ({
      ...prev,
      service_id: service.id,
      service_name: service.name,
      total_price: service.price
    }))
    setServiceSearch('')
    setServiceResults([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditMode ? '서비스 상세' : '서비스 등록'}
      size="md"
      closeOnOverlayClick={false}
      footer={
        <div className="footer-right">
          {isEditMode ? (
            <Button type="button" variant="secondary" onClick={onClose}>
              닫기
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" form="service-form" variant="primary">
                등록
              </Button>
            </>
          )}
        </div>
      }
    >
      <form id="service-form" onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <p>환자 선택</p>
          {isEditMode ? (
            <div className={styles.selectedItem}>
              <div>
                <strong>{service?.patient?.name}</strong>
                <span>{service?.patient?.chart_no}</span>
              </div>
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
                  />
                </div>
                {patientResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {patientResults.map((patient) => (
                      <div
                        key={patient.id}
                        className={styles.searchResultItem}
                        onClick={() => selectPatient(patient)}
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
              {selectedPatient && (
                <div className={styles.selectedItem}>
                  <div>
                    <strong>{selectedPatient.name}</strong>
                    <span className={styles.chartNo}>{selectedPatient.chart_no}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null)
                      setFormData(prev => ({ ...prev, patient_id: '' }))
                    }}
                  >
                    제거
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          {!isEditMode && (
            <div className={styles.searchWrapper}>
              <div className={styles.patientSearch}>
                <div className={styles.searchInput}>
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="서비스명 검색"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                </div>
                {serviceResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {serviceResults.map((svc) => (
                      <div
                        key={svc.id}
                        className={styles.searchResultItem}
                        onClick={() => selectService(svc)}
                      >
                        <div>
                          <strong>{svc.name}</strong>
                          <span>{svc.category}</span>
                        </div>
                        <span>{new Intl.NumberFormat('ko-KR').format(svc.price)}원</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedService && (
                <div className={styles.selectedItem}>
                  <div>
                    <strong>{selectedService.name}</strong>
                    <span>{selectedService.category}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(null)
                      setFormData(prev => ({
                        ...prev,
                        service_id: '',
                        service_name: '',
                        total_price: 0
                      }))
                    }}
                  >
                    제거
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>서비스명 *</label>
              <input
                type="text"
                value={formData.service_name}
                onChange={isEditMode ? undefined : (e) => setFormData({ ...formData, service_name: e.target.value })}
                readOnly={isEditMode}
                required={!isEditMode}
              />
            </div>
            <div className={styles.formField}>
              <label>서비스 유형</label>
              <select
                value={formData.service_type}
                onChange={isEditMode ? undefined : (e) => setFormData({ ...formData, service_type: e.target.value as 'package' | 'single' })}
                disabled={isEditMode}
              >
                <option value="package">패키지</option>
                <option value="single">단일</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>총 회차 *</label>
              <input
                type="number"
                min="1"
                value={formData.total_sessions}
                onChange={isEditMode ? undefined : (e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || 1 })}
                readOnly={isEditMode}
                required={!isEditMode}
              />
            </div>
            <div className={styles.formField}>
              <label>유효기간</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={isEditMode ? undefined : (e) => setFormData({ ...formData, expiry_date: e.target.value })}
                readOnly={isEditMode}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>구매금액 *</label>
              <input
                type="number"
                min="0"
                value={formData.total_price}
                onChange={isEditMode ? undefined : (e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                readOnly={isEditMode}
                required={!isEditMode}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>메모</label>
              <textarea
                value={formData.memo}
                onChange={isEditMode ? undefined : (e) => setFormData({ ...formData, memo: e.target.value })}
                readOnly={isEditMode}
                rows={3}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

