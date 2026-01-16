'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './SatisfactionChartModal.module.scss'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface SatisfactionChartModalProps {
  isOpen: boolean
  onClose: () => void
  patientId?: string
  reservationId?: string
  chartId?: string
  onSave?: () => void
}

const gradeOptions = [
  { value: 'very_satisfied', label: '매우만족' },
  { value: 'satisfied', label: '만족' },
  { value: 'normal', label: '보통' },
  { value: 'dissatisfied', label: '불만' },
  { value: 'very_dissatisfied', label: '매우불만' }
]

const improvementOptions = [
  { value: 'very_improved', label: '매우호전' },
  { value: 'improved', label: '호전' },
  { value: 'maintained', label: '유지' },
  { value: 'worsened', label: '악화' }
]

const revisitOptions = [
  { value: 'very_likely', label: '매우 의향 있음' },
  { value: 'likely', label: '의향 있음' },
  { value: 'neutral', label: '보통' },
  { value: 'unlikely', label: '의향 없음' },
  { value: 'very_unlikely', label: '전혀 의향 없음' }
]

const personalityOptions = [
  { value: 'cooperative', label: '협조적' },
  { value: 'demanding', label: '까다로움' },
  { value: 'sensitive', label: '예민함' },
  { value: 'calm', label: '차분함' },
  { value: 'other', label: '기타' }
]

export default function SatisfactionChartModal({
  isOpen,
  onClose,
  patientId,
  reservationId,
  chartId,
  onSave
}: SatisfactionChartModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    satisfaction_grade: '',
    satisfaction_comment: '',
    service_grade: '',
    pain_level: null as number | null,
    revisit_intention: '',
    patient_personality: '',
    staff_observation: '',
    improvement_grade: '',
    improvement_comment: '',
    area_evaluations: {} as Record<string, { grade: string; comment: string }>
  })

  useEffect(() => {
    if (isOpen && chartId) {
      fetchChart()
    } else if (isOpen) {
      resetForm()
    }
  }, [isOpen, chartId])

  const fetchChart = async () => {
    if (!chartId) return

    try {
      const res = await fetch(`/api/charts?type=satisfaction&patient_id=${patientId || ''}&reservation_id=${reservationId || ''}`)
      const data = await res.json()
      if (data.success && data.data.satisfaction) {
        const chart = data.data.satisfaction.find((c: { id: string }) => c.id === chartId)
        if (chart) {
          setFormData({
            satisfaction_grade: chart.satisfaction_grade || '',
            satisfaction_comment: chart.satisfaction_comment || '',
            service_grade: chart.service_grade || '',
            pain_level: chart.pain_level,
            revisit_intention: chart.revisit_intention || '',
            patient_personality: chart.patient_personality || '',
            staff_observation: chart.staff_observation || '',
            improvement_grade: chart.improvement_grade || '',
            improvement_comment: chart.improvement_comment || '',
            area_evaluations: (chart.area_evaluations as Record<string, { grade: string; comment: string }>) || {}
          })
        }
      }
    } catch (error) {
      console.error('만족도 차트 조회 오류:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      satisfaction_grade: '',
      satisfaction_comment: '',
      service_grade: '',
      pain_level: null,
      revisit_intention: '',
      patient_personality: '',
      staff_observation: '',
      improvement_grade: '',
      improvement_comment: '',
      area_evaluations: {}
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = chartId ? '/api/charts' : '/api/charts'
      const method = chartId ? 'PUT' : 'POST'
      const body = {
        chart_type: 'satisfaction',
        patient_id: patientId,
        reservation_id: reservationId,
        ...formData,
        ...(chartId && { id: chartId })
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        alert(chartId ? '만족도 차트가 수정되었습니다.' : '만족도 차트가 저장되었습니다.')
        onSave?.()
        onClose()
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('만족도 차트 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`만족도 차트 ${chartId ? '수정' : '등록'}`}
      size="md"
      footer={
        <>
          <span />
          <div className="footer-right">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" form="satisfaction-chart-form" variant="primary" size="sm" disabled={loading}>
              {loading ? '저장 중...' : (chartId ? '수정' : '저장')}
            </Button>
          </div>
        </>
      }
    >
        <form id="satisfaction-chart-form" onSubmit={handleSubmit}>
            <div className={styles.section}>
              <h3>주관적 만족도 (환자 관점)</h3>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>시술 만족도</label>
                  <select
                    value={formData.satisfaction_grade}
                    onChange={(e) => setFormData({ ...formData, satisfaction_grade: e.target.value })}
                  >
                    <option value="">선택</option>
                    {gradeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>서비스 만족도</label>
                  <select
                    value={formData.service_grade}
                    onChange={(e) => setFormData({ ...formData, service_grade: e.target.value })}
                  >
                    <option value="">선택</option>
                    {gradeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField} style={{ flex: 1 }}>
                  <label>만족도 코멘트</label>
                  <textarea
                    value={formData.satisfaction_comment}
                    onChange={(e) => setFormData({ ...formData, satisfaction_comment: e.target.value })}
                    rows={3}
                    placeholder="환자 만족도에 대한 코멘트를 입력하세요..."
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>통증/불편감 (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.pain_level || ''}
                    onChange={(e) => setFormData({ ...formData, pain_level: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>재방문 의향</label>
                  <select
                    value={formData.revisit_intention}
                    onChange={(e) => setFormData({ ...formData, revisit_intention: e.target.value })}
                  >
                    <option value="">선택</option>
                    {revisitOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3>직원 관찰 기록</h3>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>환자 성향</label>
                  <select
                    value={formData.patient_personality}
                    onChange={(e) => setFormData({ ...formData, patient_personality: e.target.value })}
                  >
                    <option value="">선택</option>
                    {personalityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField} style={{ flex: 1 }}>
                  <label>직원 관찰 메모</label>
                  <textarea
                    value={formData.staff_observation}
                    onChange={(e) => setFormData({ ...formData, staff_observation: e.target.value })}
                    rows={3}
                    placeholder="환자 반응, 특이사항 등을 기록하세요..."
                  />
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3>객관적 호전지표 (의료진 관점)</h3>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>호전 정도</label>
                  <select
                    value={formData.improvement_grade}
                    onChange={(e) => setFormData({ ...formData, improvement_grade: e.target.value })}
                  >
                    <option value="">선택</option>
                    {improvementOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField} style={{ flex: 1 }}>
                  <label>호전도 코멘트</label>
                  <textarea
                    value={formData.improvement_comment}
                    onChange={(e) => setFormData({ ...formData, improvement_comment: e.target.value })}
                    rows={3}
                    placeholder="구체적인 경과 기록을 입력하세요..."
                  />
                </div>
              </div>
            </div>
        </form>
      </Modal>
  )
}

