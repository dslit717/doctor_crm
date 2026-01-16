'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../services.module.scss'
import type { CustomField, ServiceFormData } from '../types'

export default function ServiceModal({
  isOpen,
  onClose,
  title,
  submitText,
  formData,
  setFormData,
  onSubmit,
  categoryLabels
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  submitText: string
  formData: ServiceFormData
  setFormData: (updater: ServiceFormData) => void
  onSubmit: (e: React.FormEvent) => void
  categoryLabels: Record<string, string>
}) {
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  useEffect(() => {
    if (!isOpen) return
    setCustomFields([])
  }, [isOpen, title])

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      field_name: '',
      field_key: '',
      field_type: 'text',
      options: []
    }
    setCustomFields(prev => [...prev, newField])
  }

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeCustomField = (id: string) => {
    const field = customFields.find(f => f.id === id)
    setCustomFields(prev => prev.filter(f => f.id !== id))
    if (field?.field_key) {
      const newCustomData = { ...formData.custom_data }
      delete newCustomData[field.field_key]
      setFormData({ ...formData, custom_data: newCustomData })
    }
  }

  const addOptionToField = (fieldId: string) => {
    setCustomFields(prev => prev.map(f => f.id === fieldId ? { ...f, options: [...(f.options || []), ''] } : f))
  }

  const updateFieldOption = (fieldId: string, optionIndex: number, value: string) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      return { ...f, options: (f.options || []).map((opt, idx) => idx === optionIndex ? value : opt) }
    }))
  }

  const removeFieldOption = (fieldId: string, optionIndex: number) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      return { ...f, options: (f.options || []).filter((_, idx) => idx !== optionIndex) }
    }))
  }

  const handleCustomFieldChange = (fieldKey: string, value: string | number) => {
    setFormData({ ...formData, custom_data: { ...formData.custom_data, [fieldKey]: value } })
  }

  const renderCustomFieldInput = (field: CustomField) => {
    const value = formData.custom_data[field.field_key] || ''

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            className={styles.customFieldInput}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, parseFloat(e.target.value) || 0)}
            className={styles.customFieldInput}
          />
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            className={styles.customFieldInput}
          >
            <option value="">선택하세요</option>
            {field.options?.filter(opt => opt.trim()).map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            rows={3}
            className={styles.customFieldInput}
          />
        )
      default:
        return null
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <span />
          <div className="footer-right">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" form="service-form" variant="primary">
              {submitText}
            </Button>
          </div>
        </>
      }
    >
      <form id="service-form" onSubmit={onSubmit}>
        <div className={styles.formSection}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>서비스 코드 *</label>
              <input
                type="text"
                value={formData.service_code}
                onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                required
              />
            </div>
            <div className={styles.formField}>
              <label>서비스명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>카테고리 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label>가격 *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                required
                min="0"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>과세 유형 *</label>
              <select
                value={formData.tax_type}
                onChange={(e) => setFormData({ ...formData, tax_type: e.target.value as ServiceFormData['tax_type'] })}
                required
              >
                <option value="tax">과세</option>
                <option value="tax_free">비과세</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label>소요시간 (분) *</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                required
                min="1"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>정렬 순서</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className={`${styles.formField} ${styles.checkboxField}`}>
              <div className={styles.checkboxRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  활성
                </label>
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* 이미 저장된 커스텀 필드들의 실제 입력 필드들 */}
          {Object.keys(formData.custom_data || {})
            .filter(key => !customFields.some(field => field.field_key === key))
            .map((key) => {
              const value = formData.custom_data[key]
              const fieldType = typeof value === 'number'
                ? 'number'
                : (value && typeof value === 'string' && value.length > 50) ? 'textarea' : 'text'

              return (
                <div key={key} className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                    {fieldType === 'number' ? (
                      <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => handleCustomFieldChange(key, parseFloat(e.target.value) || 0)}
                      />
                    ) : fieldType === 'textarea' ? (
                      <textarea
                        value={value || ''}
                        onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )
            })}

          {/* 커스텀 필드 정의 섹션 */}
          <div className={styles.customFieldsSection}>
            <div className={styles.customFieldsHeader}>
              <h4>추가 필드</h4>
              <button
                type="button"
                onClick={addCustomField}
                className={styles.addFieldBtn}
              >
                <Plus size={14} />
                필드 추가
              </button>
            </div>

            {customFields.map((field) => (
              <div key={field.id} className={styles.customFieldBox}>
                <div className={`${styles.formRow} mb-3`}>
                  <div className={styles.formField}>
                    <label>필드명</label>
                    <input
                      type="text"
                      value={field.field_name}
                      onChange={(e) => {
                        const fieldKey = e.target.value.toLowerCase().replace(/\s+/g, '_')
                        updateCustomField(field.id, {
                          field_name: e.target.value,
                          field_key: fieldKey
                        })
                      }}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>필드 타입</label>
                    <select
                      value={field.field_type}
                      onChange={(e) => updateCustomField(field.id, {
                        field_type: e.target.value as CustomField['field_type'],
                        options: e.target.value === 'select' ? [''] : undefined
                      })}
                    >
                      <option value="text">텍스트</option>
                      <option value="number">숫자</option>
                      <option value="select">선택</option>
                      <option value="textarea">텍스트 영역</option>
                    </select>
                  </div>
                  <div className={`${styles.formField} ${styles.removeFieldBtnWrapper}`}>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className={styles.removeFieldBtn}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {field.field_type === 'select' && (
                  <div className={styles.optionsSection}>
                    <label className={styles.optionsLabel}>
                      옵션 목록
                    </label>
                    {field.options?.map((option, idx) => (
                      <div key={idx} className={styles.optionRow}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateFieldOption(field.id, idx, e.target.value)}
                          placeholder="옵션 입력"
                          className={styles.optionInput}
                        />
                        <button
                          type="button"
                          onClick={() => removeFieldOption(field.id, idx)}
                          className={styles.removeOptionBtn}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOptionToField(field.id)}
                      className={styles.addOptionBtn}
                    >
                      <Plus size={12} /> 옵션 추가
                    </button>
                  </div>
                )}

                {field.field_name && field.field_name.trim().length >= 2 && field.field_key && (
                  <div className={styles.customFieldInputWrapper}>
                    {renderCustomFieldInput(field)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}


