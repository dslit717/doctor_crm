'use client'

import { useState, useEffect } from 'react'
import ChartModal from '@/components/charts/ChartModal'
import SatisfactionChartModal from '@/components/charts/SatisfactionChartModal'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../patients.module.scss'
import type { Patient } from '../types'

export default function PatientModal({
  patient,
  onClose,
  onSave,
  onDelete
}: {
  patient: Patient | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const isEditMode = !!patient
  const [showChartModal, setShowChartModal] = useState(false)
  const [showChartMenu, setShowChartMenu] = useState(false)
  const [chartType, setChartType] = useState<'consultation' | 'medical' | 'care' | 'satisfaction' | null>(null)

  const [formData, setFormData] = useState({
    name: patient?.name || '',
    phone: patient?.phone || '',
    birth_date: patient?.birth_date || '',
    gender: patient?.gender || 'female',
    email: patient?.email || '',
    referral_source: patient?.referral_source || '',
    status: patient?.status || 'active',
    marketing_consent: patient?.marketing_consent || false,
    sms_consent: patient?.sms_consent || false
  })

  // patient가 변경될 때 formData 업데이트
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        phone: patient.phone || '',
        birth_date: patient.birth_date || '',
        gender: patient.gender || 'female',
        email: patient.email || '',
        referral_source: patient.referral_source || '',
        status: patient.status || 'active',
        marketing_consent: patient.marketing_consent || false,
        sms_consent: patient.sms_consent || false
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        birth_date: '',
        gender: 'female',
        email: '',
        referral_source: '',
        status: 'active',
        marketing_consent: false,
        sms_consent: false
      })
    }
  }, [patient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleDelete = () => {
    if (patient && confirm('정말 삭제하시겠습니까?')) {
      onDelete(patient.id)
    }
  }

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={isEditMode ? '환자 정보' : '신규 환자 등록'}
        size="md"
        closeOnOverlayClick={false}
        footer={
          <>
            {isEditMode && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Button
                    type="button"
                    variant="info"
                    onClick={() => setShowChartMenu(!showChartMenu)}
                  >
                    차트 입력
                  </Button>
                  {showChartMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: '8px',
                      background: 'white',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      minWidth: '150px'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('consultation')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                      >
                        상담 차트
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('medical')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                      >
                        진료 차트
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('care')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                      >
                        관리 차트
                      </button>
                      <div style={{ borderTop: '1px solid #E5E7EB', margin: '4px 0' }}></div>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('satisfaction')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                      >
                        만족도 차트
                      </button>
                    </div>
                  )}
                </div>
                <Button type="button" variant="danger" onClick={handleDelete}>
                  삭제
                </Button>
              </div>
            )}

            <div className="footer-right">
              <Button type="button" variant="secondary" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" form="patient-form" variant="primary">
                {isEditMode ? '수정' : '등록'}
              </Button>
            </div>
          </>
        }
      >
        <form id="patient-form" onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h4>기본정보</h4>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>연락처 *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>성별</label>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    여
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    남
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h4>추가정보</h4>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>생년월일</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div className={styles.formField}>
                <label>이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>내원경로</label>
                <select
                  value={formData.referral_source}
                  onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                >
                  <option value="">선택</option>
                  <option value="search">인터넷 검색</option>
                  <option value="sns">SNS</option>
                  <option value="blog">블로그</option>
                  <option value="friend">지인 소개</option>
                  <option value="sign">간판</option>
                  <option value="revisit">재방문</option>
                  <option value="other">기타</option>
                </select>
              </div>
              {isEditMode && (
                <div className={styles.formField}>
                  <label>상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="blacklist">블랙리스트</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <h4>마케팅 동의</h4>
            <div className={styles.checkboxRow}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.marketing_consent}
                  onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                />
                마케팅 정보 수신 동의
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.sms_consent}
                  onChange={(e) => setFormData({ ...formData, sms_consent: e.target.checked })}
                />
                SMS 수신 동의
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {showChartModal && chartType && (
        <>
          {chartType === 'satisfaction' ? (
            <SatisfactionChartModal
              isOpen={showChartModal}
              onClose={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
              patientId={patient?.id}
              onSave={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
            />
          ) : (
            <ChartModal
              isOpen={showChartModal}
              onClose={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
              chartType={chartType as 'consultation' | 'medical' | 'care'}
              patientId={patient?.id}
              onSave={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
            />
          )}
        </>
      )}
    </>
  )
}


