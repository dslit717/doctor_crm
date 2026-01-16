'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import styles from './Modal.module.scss'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export type UIModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: UIModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeOnEsc, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (closeOnOverlayClick) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${styles.container} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title !== undefined) && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="닫기"
            >
              <X size={20} />
            </Button>
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}


