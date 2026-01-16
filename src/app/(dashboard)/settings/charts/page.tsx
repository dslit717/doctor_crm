'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import layoutStyles from '../settings-layout.module.scss'
import styles from './chart-fields.module.scss'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

export default function SettingsChartsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const activeTab: 'hours' | 'holidays' | 'notifications' | 'charts' =
    pathname.includes('/settings/holidays')
      ? 'holidays'
      : pathname.includes('/settings/notifications')
        ? 'notifications'
        : pathname.includes('/settings/charts')
          ? 'charts'
          : 'hours'

  interface ChartField {
    id?: string
    chart_type: string
    field_key: string
    field_name: string
    field_type: string
    section?: string
    section_order: number
    field_order: number
    is_required: boolean
    default_value?: string
    placeholder?: string
    help_text?: string
    validation_rules?: Record<string, unknown>
    options?: Array<{ label: string; value: string }>
    display_condition?: Record<string, unknown>
    is_active: boolean
    is_searchable: boolean
    is_list_display: boolean
  }

  const CHART_TYPES = [
    { value: 'consultation', label: '상담 차트' },
    { value: 'medical', label: '진료 차트' },
    { value: 'care', label: '관리 차트' },
    { value: 'satisfaction', label: '만족도 차트' }
  ]

  const FIELD_TYPES = [
    { value: 'text', label: '텍스트 (단문)' },
    { value: 'textarea', label: '텍스트 영역 (장문)' },
    { value: 'number', label: '숫자' },
    { value: 'date', label: '날짜' },
    { value: 'datetime', label: '날짜/시간' },
    { value: 'select', label: '단일 선택' },
    { value: 'multiselect', label: '다중 선택' },
    { value: 'checkbox', label: '체크박스' },
    { value: 'file', label: '파일 첨부' },
    { value: 'signature', label: '서명' }
  ]

  const [selectedChartType, setSelectedChartType] = useState<string>('consultation')
  const [fields, setFields] = useState<ChartField[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<ChartField | null>(null)
  const [formData, setFormData] = useState<Partial<ChartField>>({
    chart_type: 'consultation',
    field_key: '',
    field_name: '',
    field_type: 'text',
    section: '',
    section_order: 0,
    field_order: 0,
    is_required: false,
    is_active: true,
    is_searchable: false,
    is_list_display: false,
    options: [],
    validation_rules: {},
    display_condition: {}
  })

  const fetchFields = useCallback(async () => {
    if (!selectedChartType) return

    setLoading(true)
    try {
      const res = await fetch(`/api/chart-fields?chart_type=${selectedChartType}&is_active=true`)
      const data = await res.json()
      if (data.success) {
        setFields(data.data || [])
      }
    } catch (error) {
      console.error('필드 조회 오류:', error)
      alert('필드를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [selectedChartType])

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  const handleAddField = () => {
    setFormData({
      chart_type: selectedChartType,
      field_key: '',
      field_name: '',
      field_type: 'text',
      section: '',
      section_order: 0,
      field_order: fields.length,
      is_required: false,
      is_active: true,
      is_searchable: false,
      is_list_display: false,
      options: [],
      validation_rules: {},
      display_condition: {}
    })
    setEditingField(null)
    setIsModalOpen(true)
  }

  const handleEditField = (field: ChartField) => {
    setEditingField(field)
    setFormData(field)
    setIsModalOpen(true)
  }

  const handleDeleteField = async (id: string) => {
    if (!confirm('이 필드를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/chart-fields?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        alert('필드가 삭제되었습니다.')
        fetchFields()
      } else {
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('필드 삭제 오류:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.field_key || !formData.field_name || !formData.field_type) {
      alert('필수 항목을 입력하세요.')
      return
    }

    const fieldKeyPattern = /^[a-z][a-z0-9_]*$/
    if (!fieldKeyPattern.test(formData.field_key)) {
      alert('필드 키는 영문 소문자로 시작하고, 숫자와 언더스코어만 사용할 수 있습니다.')
      return
    }

    try {
      const url = '/api/chart-fields'
      const method = editingField ? 'PUT' : 'POST'
      const body = {
        ...(editingField && { id: editingField.id }),
        ...formData
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        alert(editingField ? '필드가 수정되었습니다.' : '필드가 추가되었습니다.')
        setIsModalOpen(false)
        fetchFields()
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('필드 저장 오류:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const sortedFields = [...fields].sort((a, b) => {
    if (a.section_order !== b.section_order) {
      return a.section_order - b.section_order
    }
    return a.field_order - b.field_order
  })

  return (
    <div className={layoutStyles.container}>
      <div className={layoutStyles.header}>
        <h1>운영 설정</h1>
      </div>

      <div className={layoutStyles.tabs}>
        <button
          className={`${layoutStyles.tab} ${activeTab === 'hours' ? layoutStyles.active : ''}`}
          onClick={() => router.push('/settings/hours')}
        >
          진료 시간
        </button>
        <button
          className={`${layoutStyles.tab} ${activeTab === 'holidays' ? layoutStyles.active : ''}`}
          onClick={() => router.push('/settings/holidays')}
        >
          휴무일 관리
        </button>
        <button
          className={`${layoutStyles.tab} ${activeTab === 'notifications' ? layoutStyles.active : ''}`}
          onClick={() => router.push('/settings/notifications')}
        >
          자동 알림
        </button>
        <button
          className={`${layoutStyles.tab} ${activeTab === 'charts' ? layoutStyles.active : ''}`}
          onClick={() => router.push('/settings/charts')}
        >
          차트 설정
        </button>
      </div>

      <div className={styles.header}>
        <h1>차트 필드 관리</h1>
        <div className={styles.controls}>
          <select
            value={selectedChartType}
            onChange={(e) => setSelectedChartType(e.target.value)}
            className={styles.chartTypeSelect}
          >
            {CHART_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <Button variant="black" onClick={handleAddField}>
            <Plus size={16} />
            필드 추가
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <div className={styles.tableWrapper}>
          {sortedFields.length === 0 ? (
            <div className={styles.empty}>등록된 필드가 없습니다.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순서</th>
                  <th>필드명</th>
                  <th>필드 키</th>
                  <th>타입</th>
                  <th>섹션</th>
                  <th>필수</th>
                  <th>검색</th>
                  <th>목록</th>
                </tr>
              </thead>
              <tbody>
                {sortedFields.map((field) => (
                  <tr
                    key={field.id}
                    onClick={() => handleEditField(field)}
                    className={styles.tableRow}
                  >
                    <td>{field.field_order}</td>
                    <td>
                      <div className={styles.fieldNameCell}>
                        <span className={styles.fieldName}>{field.field_name}</span>
                        {field.help_text && (
                          <span className={styles.helpText}>{field.help_text}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <code className={styles.fieldKey}>{field.field_key}</code>
                    </td>
                    <td>
                      {FIELD_TYPES.find((t) => t.value === field.field_type)?.label || field.field_type}
                    </td>
                    <td>{field.section || '-'}</td>
                    <td>
                      {field.is_required ? (
                        <span className={styles.badgeRequired}>필수</span>
                      ) : (
                        <span className={styles.badgeOptional}>선택</span>
                      )}
                    </td>
                    <td>
                      {field.is_searchable ? (
                        <span className={styles.badgeYes}>예</span>
                      ) : (
                        <span className={styles.badgeNo}>아니오</span>
                      )}
                    </td>
                    <td>
                      {field.is_list_display ? (
                        <span className={styles.badgeYes}>예</span>
                      ) : (
                        <span className={styles.badgeNo}>아니오</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsModalOpen(false)}
          title={editingField ? '필드 수정' : '필드 추가'}
          size="md"
          footer={
            <>
              {editingField ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (editingField.id && confirm('이 필드를 삭제하시겠습니까?')) {
                      handleDeleteField(editingField.id)
                      setIsModalOpen(false)
                    }
                  }}
                >
                  삭제
                </Button>
              ) : (
                <span />
              )}
              <div className="footer-right">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" form="chart-field-form" variant="primary">
                  저장
                </Button>
              </div>
            </>
          }
        >
          <form id="chart-field-form" onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <label>필드명 (한글) *</label>
              <input
                type="text"
                value={formData.field_name || ''}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formRow}>
              <label>필드 키 (영문) *</label>
              <input
                type="text"
                value={formData.field_key || ''}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase() })}
                placeholder="예: competitor_consultation"
                required
                pattern="[a-z][a-z0-9_]*"
              />
              <small>영문 소문자, 숫자, 언더스코어만 사용 가능</small>
            </div>

            <div className={styles.formRow}>
              <label>필드 타입 *</label>
              <select
                value={formData.field_type || 'text'}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                required
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <label>섹션</label>
              <input
                type="text"
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="섹션명 (그룹핑용)"
              />
            </div>

            <div className={styles.formRow}>
              <label>순서</label>
              <input
                type="number"
                value={formData.field_order || 0}
                onChange={(e) => setFormData({ ...formData, field_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            {(formData.field_type === 'select' || formData.field_type === 'multiselect') && (
              <div className={styles.formRow}>
                <label>선택 옵션</label>
                <textarea
                  value={JSON.stringify(formData.options || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const options = JSON.parse(e.target.value)
                      setFormData({ ...formData, options })
                    } catch {
                      // JSON 파싱 실패 시 무시
                    }
                  }}
                  placeholder='[{"label": "옵션1", "value": "option1"}]'
                  rows={4}
                />
                <small>JSON 형식으로 입력 (예: 배열 형태로 label과 value를 포함한 객체)</small>
              </div>
            )}

            <div className={styles.formRow}>
              <label>플레이스홀더</label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <label>도움말</label>
              <textarea
                value={formData.help_text || ''}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                rows={2}
              />
            </div>

            <div className={styles.formRow}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_required || false}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                />
                필수 항목
              </label>
            </div>

            <div className={styles.formRow}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_searchable || false}
                  onChange={(e) => setFormData({ ...formData, is_searchable: e.target.checked })}
                />
                검색 가능
              </label>
            </div>

            <div className={styles.formRow}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_list_display || false}
                  onChange={(e) => setFormData({ ...formData, is_list_display: e.target.checked })}
                />
                목록 표시
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}


