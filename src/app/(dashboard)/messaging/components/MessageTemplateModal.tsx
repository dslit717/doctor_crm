'use client'

import type { Dispatch, FormEvent, SetStateAction } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from '../messaging.module.scss'
import type { MessageTemplateFormData } from '../types'

export default function MessageTemplateModal({
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
  formData: MessageTemplateFormData
  setFormData: Dispatch<SetStateAction<MessageTemplateFormData>>
  onSubmit: (e: FormEvent) => void
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
            <label>템플릿 코드 *</label>
            <input
              type="text"
              value={formData.template_code}
              onChange={(e) => setFormData({ ...formData, template_code: e.target.value })}
              required
              placeholder="예: RESERVATION_REMINDER"
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
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>채널 *</label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value as 'sms' | 'lms' | 'mms' })}
              required
            >
              <option value="sms">SMS</option>
              <option value="lms">LMS</option>
              <option value="mms">MMS</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField} style={{ flex: 1 }}>
            <label>내용 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              required
              placeholder="변수는 #{변수명} 형식으로 입력하세요. 예: #{이름}님, 예약이 확정되었습니다."
            />
            <div className={styles.helpText}>
              변수 예시: {'#{이름}'}, {'#{예약일시}'}, {'#{시술명}'}, {'#{담당자}'}
            </div>
          </div>
        </div>

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
      </form>
    </Modal>
  )
}


