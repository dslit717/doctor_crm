'use client'

import type { Dispatch, SetStateAction } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from '../consents.module.scss'

export type ConsentTemplateFormData = {
  name: string
  category: string
  content: string
  validity_days: number | null
  version: number
  is_required: boolean
  is_active: boolean
}

export default function ConsentTemplateModal({
  isOpen,
  onClose,
  title,
  categoryOptions,
  formData,
  setFormData,
  onSubmit,
  submitText
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  categoryOptions: { value: string; label: string }[]
  formData: ConsentTemplateFormData
  setFormData: Dispatch<SetStateAction<ConsentTemplateFormData>>
  onSubmit: (e: React.FormEvent) => void
  submitText: string
}) {
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
            <Button type="submit" form="template-form" variant="primary">
              {submitText}
            </Button>
          </div>
        </>
      }
    >
      <form id="template-form" onSubmit={onSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>템플릿명 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.formField}>
            <label>카테고리 *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField} style={{ flex: 1 }}>
            <label>내용 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              required
              placeholder="동의서 내용을 입력하세요..."
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>유효기간 (일)</label>
            <input
              type="number"
              value={formData.validity_days || ''}
              onChange={(e) => setFormData({ ...formData, validity_days: e.target.value ? parseInt(e.target.value) : null })}
              min="1"
              placeholder="비워두면 무제한"
            />
          </div>
          <div className={styles.formField}>
            <label>버전</label>
            <input
              type="number"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
              min="1"
            />
          </div>
        </div>

        <div className={styles.checkboxRow}>
          <label>
            <input
              type="checkbox"
              checked={formData.is_required}
              onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
            />
            필수 동의서
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            활성
          </label>
        </div>
      </form>
    </Modal>
  )
}


