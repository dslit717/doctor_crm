'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './ChartModal.module.scss'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface ChartModalProps {
  isOpen: boolean
  onClose: () => void
  chartType: 'consultation' | 'medical' | 'care'
  patientId?: string
  reservationId?: string
  chartId?: string
  onSave?: () => void
}

export default function ChartModal({
  isOpen,
  onClose,
  chartType,
  patientId,
  reservationId,
  chartId,
  onSave
}: ChartModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (isOpen && chartId) {
      fetchChart()
    } else if (isOpen) {
      resetForm()
    }
  }, [isOpen, chartId, chartType])

  const fetchChart = async () => {
    if (!chartId) return

    try {
      const res = await fetch(`/api/charts?type=${chartType}&patient_id=${patientId || ''}&reservation_id=${reservationId || ''}`)
      const data = await res.json()
      if (data.success && data.data[chartType]) {
        const chart = data.data[chartType].find((c: { id: string }) => c.id === chartId)
        if (chart) {
          setFormData(chart)
        }
      }
    } catch (error) {
      console.error('차트 조회 오류:', error)
    }
  }

  const resetForm = () => {
    const baseData: Record<string, unknown> = {
      patient_id: patientId,
      reservation_id: reservationId
    }

    if (chartType === 'consultation') {
      baseData.consultation_date = new Date().toISOString()
      baseData.counselor_id = user?.employee?.id
    } else if (chartType === 'medical') {
      baseData.chart_date = new Date().toISOString()
      baseData.doctor_id = user?.employee?.id
    } else if (chartType === 'care') {
      baseData.chart_date = new Date().toISOString()
      baseData.staff_id = user?.employee?.id
    }

    setFormData(baseData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/charts'
      const method = chartId ? 'PUT' : 'POST'
      const body = {
        chart_type: chartType,
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
        alert(chartId ? '차트가 수정되었습니다.' : '차트가 저장되었습니다.')
        onSave?.()
        onClose()
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('차트 저장 오류:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setFormData({ ...formData, [field]: value })
  }

  if (!isOpen) return null

  const chartTypeLabels = {
    consultation: '상담 차트',
    medical: '진료 차트',
    care: '관리 차트'
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${chartTypeLabels[chartType]} ${chartId ? '수정' : '등록'}`}
      size="xl"
      footer={
        <>
          <span />
          <div className="footer-right">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" form="chart-form" variant="primary" size="sm" disabled={loading}>
              {loading ? '저장 중...' : (chartId ? '수정' : '저장')}
            </Button>
          </div>
        </>
      }
    >
        <form id="chart-form" onSubmit={handleSubmit}>
            {chartType === 'consultation' && (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>상담일시 *</label>
                    <input
                      type="datetime-local"
                      value={formData.consultation_date ? new Date(formData.consultation_date as string).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateField('consultation_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>주호소</label>
                    <input
                      type="text"
                      value={(formData.chief_complaint as string) || ''}
                      onChange={(e) => updateField('chief_complaint', e.target.value)}
                      placeholder="환자의 주요 고민을 입력하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>예산 범위</label>
                    <input
                      type="text"
                      value={(formData.budget_range as string) || ''}
                      onChange={(e) => updateField('budget_range', e.target.value)}
                      placeholder="예: 100-200만원"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>견적 금액</label>
                    <input
                      type="number"
                      value={(formData.estimated_price as number) || ''}
                      onChange={(e) => updateField('estimated_price', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>상담 결과</label>
                    <select
                      value={(formData.consultation_result as string) || ''}
                      onChange={(e) => updateField('consultation_result', e.target.value)}
                    >
                      <option value="">선택</option>
                      <option value="contracted">계약</option>
                      <option value="pending">보류</option>
                      <option value="rejected">거절</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>메모</label>
                    <textarea
                      value={(formData.memo as string) || ''}
                      onChange={(e) => updateField('memo', e.target.value)}
                      rows={4}
                      placeholder="상담 내용, 특이사항 등을 기록하세요..."
                    />
                  </div>
                </div>
              </>
            )}

            {chartType === 'medical' && (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>진료일시 *</label>
                    <input
                      type="datetime-local"
                      value={formData.chart_date ? new Date(formData.chart_date as string).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateField('chart_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>주소 (Chief Complaint)</label>
                    <input
                      type="text"
                      value={(formData.chief_complaint as string) || ''}
                      onChange={(e) => updateField('chief_complaint', e.target.value)}
                      placeholder="환자의 주소를 입력하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>현병력</label>
                    <textarea
                      value={(formData.present_illness as string) || ''}
                      onChange={(e) => updateField('present_illness', e.target.value)}
                      rows={3}
                      placeholder="현재 병력에 대해 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>과거력</label>
                    <textarea
                      value={(formData.past_history as string) || ''}
                      onChange={(e) => updateField('past_history', e.target.value)}
                      rows={3}
                      placeholder="과거 병력에 대해 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>이학적 소견</label>
                    <textarea
                      value={(formData.physical_exam as string) || ''}
                      onChange={(e) => updateField('physical_exam', e.target.value)}
                      rows={3}
                      placeholder="이학적 소견을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>진단</label>
                    <input
                      type="text"
                      value={(formData.diagnosis as string) || ''}
                      onChange={(e) => updateField('diagnosis', e.target.value)}
                      placeholder="진단명을 입력하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>처방</label>
                    <textarea
                      value={(formData.prescription as string) || ''}
                      onChange={(e) => updateField('prescription', e.target.value)}
                      rows={3}
                      placeholder="처방 내용을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>치료 계획</label>
                    <textarea
                      value={(formData.treatment_plan as string) || ''}
                      onChange={(e) => updateField('treatment_plan', e.target.value)}
                      rows={3}
                      placeholder="치료 계획을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>메모</label>
                    <textarea
                      value={(formData.memo as string) || ''}
                      onChange={(e) => updateField('memo', e.target.value)}
                      rows={3}
                      placeholder="기타 메모를 기록하세요..."
                    />
                  </div>
                </div>
              </>
            )}

            {chartType === 'care' && (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>시술일시 *</label>
                    <input
                      type="datetime-local"
                      value={formData.chart_date ? new Date(formData.chart_date as string).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateField('chart_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>시술명</label>
                    <input
                      type="text"
                      value={(formData.procedure_name as string) || ''}
                      onChange={(e) => updateField('procedure_name', e.target.value)}
                      placeholder="시술명을 입력하세요..."
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>시술 부위</label>
                    <input
                      type="text"
                      value={(formData.treatment_area as string) || ''}
                      onChange={(e) => updateField('treatment_area', e.target.value)}
                      placeholder="예: 얼굴, 목"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>시술 시간 (분)</label>
                    <input
                      type="number"
                      value={(formData.treatment_time as number) || ''}
                      onChange={(e) => updateField('treatment_time', e.target.value ? parseInt(e.target.value) : null)}
                      min="1"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>강도</label>
                    <select
                      value={(formData.intensity_level as string) || ''}
                      onChange={(e) => updateField('intensity_level', e.target.value)}
                    >
                      <option value="">선택</option>
                      <option value="low">낮음</option>
                      <option value="medium">보통</option>
                      <option value="high">높음</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>환자 컨디션</label>
                    <textarea
                      value={(formData.patient_condition as string) || ''}
                      onChange={(e) => updateField('patient_condition', e.target.value)}
                      rows={2}
                      placeholder="환자의 컨디션을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>즉각 반응</label>
                    <textarea
                      value={(formData.immediate_reaction as string) || ''}
                      onChange={(e) => updateField('immediate_reaction', e.target.value)}
                      rows={2}
                      placeholder="시술 직후 반응을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>홈케어 안내</label>
                    <textarea
                      value={(formData.home_care_guide as string) || ''}
                      onChange={(e) => updateField('home_care_guide', e.target.value)}
                      rows={3}
                      placeholder="홈케어 안내 사항을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>다음 내원 안내</label>
                    <textarea
                      value={(formData.next_visit_guide as string) || ''}
                      onChange={(e) => updateField('next_visit_guide', e.target.value)}
                      rows={2}
                      placeholder="다음 내원 시 주의사항을 기록하세요..."
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <label>메모</label>
                    <textarea
                      value={(formData.memo as string) || ''}
                      onChange={(e) => updateField('memo', e.target.value)}
                      rows={3}
                      placeholder="기타 메모를 기록하세요..."
                    />
                  </div>
                </div>
              </>
            )}
        </form>
      </Modal>
  )
}

