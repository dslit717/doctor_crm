'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Clock, Package, CheckCircle, XCircle, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../patient-services.module.scss'
import { apiCall } from '@/lib/api'

interface Alert {
  service_id: string
  patient_id: string
  patient_name: string
  alert_type: string
  message: string
}

const alertTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  low_remaining: {
    label: '잔여 회차 부족',
    icon: <AlertCircle size={16} />,
    color: '#f59e0b'
  },
  expiring: {
    label: '유효기간 임박',
    icon: <Clock size={16} />,
    color: '#ef4444'
  },
  unused: {
    label: '미사용',
    icon: <Package size={16} />,
    color: '#8b5cf6'
  },
  completed: {
    label: '소진 완료',
    icon: <CheckCircle size={16} />,
    color: '#10b981'
  }
}

export default function NotificationModal({
  onClose
}: {
  onClose: () => void
}) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const result = await apiCall<{ alerts: Alert[]; count: number }>(
        '/api/patient-services/notifications',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'check_all' })
        }
      )
      if (result.success && result.data) {
        setAlerts(result.data.alerts || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (alert: Alert) => {
    setSending(alert.service_id)
    try {
      const result = await apiCall('/api/patient-services/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_notification',
          service_id: alert.service_id,
          patient_id: alert.patient_id,
          alert_type: alert.alert_type,
          message: alert.message
        })
      })
      if (result.success) {
        // 발송 후 목록에서 제거하거나 상태 업데이트
        setAlerts(prev => prev.filter(a => a.service_id !== alert.service_id))
      }
    } finally {
      setSending(null)
    }
  }

  const handleSendAll = async () => {
    setSending('all')
    try {
      for (const alert of alerts) {
        await handleSendNotification(alert)
      }
    } finally {
      setSending(null)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="서비스 알림"
      size="lg"
      closeOnOverlayClick={false}
      footer={
        <div className="footer-right">
          {alerts.length > 0 && (
            <Button
              variant="primary"
              onClick={handleSendAll}
              disabled={sending !== null}
            >
              {sending === 'all' ? '발송 중...' : '전체 발송'}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div className={styles.notificationContent}>
        {loading ? (
          <div className={styles.empty}>알림을 확인하는 중...</div>
        ) : alerts.length === 0 ? (
          <div className={styles.empty}>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '12px' }} />
            <p>현재 알림이 없습니다.</p>
          </div>
        ) : (
          <div className={styles.alertList}>
            {alerts.map((alert) => {
              const config = alertTypeConfig[alert.alert_type] || {
                label: alert.alert_type,
                icon: <AlertCircle size={16} />,
                color: '#6b7280'
              }
              return (
                <div key={alert.service_id} className={styles.alertItem}>
                  <div className={styles.alertItemHeader}>
                    <div className={styles.alertTypeBadge} style={{ color: config.color }}>
                      {config.icon}
                      <span>{config.label}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSendNotification(alert)}
                      disabled={sending === alert.service_id}
                    >
                      {sending === alert.service_id ? (
                        '발송 중...'
                      ) : (
                        <>
                          <span>발송</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className={styles.alertItemBody}>
                    <div className={styles.alertPatient}>
                      <strong>{alert.patient_name}</strong>
                    </div>
                    <div className={styles.alertMessage}>{alert.message}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

