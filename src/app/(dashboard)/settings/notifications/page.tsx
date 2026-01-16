'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import layoutStyles from '../settings-layout.module.scss'
import notificationStyles from './notifications.module.scss'
import Button from '@/components/ui/Button'

interface NotificationSetting {
  id?: string
  category: string
  is_enabled: boolean
  template_code: string
  timing: {
    days_before?: number
    days_after?: number
  } | null
  conditions: Record<string, unknown> | null
}

const categoryLabels: Record<string, string> = {
  reservation_reminder: '예약 리마인드',
  treatment_aftercare: '시술 후 안내',
  payment_reminder: '결제 리마인드',
  birthday: '생일 축하',
  revisit: '재방문 유도'
}

export default function SettingsNotificationsPage() {
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

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([])
  const [templates, setTemplates] = useState<Array<{ template_code: string; name: string }>>([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchNotificationData = useCallback(async () => {
    setNotificationLoading(true)
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        fetch('/api/notifications/automation'),
        fetch('/api/messaging/templates')
      ])

      const settingsData = await settingsRes.json()
      const templatesData = await templatesRes.json()

      setNotificationSettings(settingsData.success ? (settingsData.data || []) : [])
      setTemplates(templatesData.success ? (templatesData.data || []) : [])
    } catch (error) {
      console.error('알림 설정 조회 오류:', error)
      setNotificationSettings([])
      setTemplates([])
    } finally {
      setNotificationLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotificationData()
  }, [fetchNotificationData])

  const updateNotificationSetting = (category: string, field: string, value: unknown) => {
    setNotificationSettings(prev => {
      const existing = prev.find(s => s.category === category)
      if (existing) {
        return prev.map(s => s.category === category ? { ...s, [field]: value } : s)
      }
      return [...prev, {
        category,
        is_enabled: true,
        template_code: '',
        timing: null,
        conditions: null,
        [field]: value
      } as NotificationSetting]
    })
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      const promises = notificationSettings.map(setting =>
        fetch('/api/notifications/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting)
        })
      )
      await Promise.all(promises)
      alert('설정이 저장되었습니다.')
    } catch (error) {
      console.error('설정 저장 오류:', error)
      alert('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

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

      <div className={notificationStyles.header}>
        <h1>자동 알림 설정</h1>
        <Button variant="black" size="sm" onClick={handleSaveNotifications} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {notificationLoading ? (
        <div className={notificationStyles.loading}>로딩 중...</div>
      ) : (
        <div className={notificationStyles.settingsList}>
          {Object.entries(categoryLabels).map(([category, label]) => {
            const setting = notificationSettings.find(s => s.category === category) || {
              category,
              is_enabled: false,
              template_code: '',
              timing: null,
              conditions: null
            }

            return (
              <div key={category} className={notificationStyles.settingCard}>
                <div className={notificationStyles.settingHeader}>
                  <div className={notificationStyles.settingTitle}>{label}</div>
                  <label className={notificationStyles.toggle}>
                    <input
                      type="checkbox"
                      checked={setting.is_enabled}
                      onChange={(e) => updateNotificationSetting(category, 'is_enabled', e.target.checked)}
                    />
                    <span>활성화</span>
                  </label>
                </div>

                {setting.is_enabled && (
                  <div className={notificationStyles.settingBody}>
                    <div className={notificationStyles.formRow}>
                      <div className={notificationStyles.formField}>
                        <label>템플릿</label>
                        <select
                          value={setting.template_code}
                          onChange={(e) => updateNotificationSetting(category, 'template_code', e.target.value)}
                        >
                          <option value="">템플릿 선택</option>
                          {templates.map(t => (
                            <option key={t.template_code} value={t.template_code}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {category === 'reservation_reminder' && (
                      <div className={notificationStyles.formRow}>
                        <div className={notificationStyles.formField}>
                          <label>예약 몇 일 전 발송</label>
                          <input
                            type="number"
                            min="0"
                            value={setting.timing?.days_before || 1}
                            onChange={(e) => updateNotificationSetting(category, 'timing', {
                              ...setting.timing,
                              days_before: parseInt(e.target.value) || 1
                            })}
                          />
                        </div>
                      </div>
                    )}

                    {category === 'treatment_aftercare' && (
                      <div className={notificationStyles.formRow}>
                        <div className={notificationStyles.formField}>
                          <label>시술 후 며칠 뒤 발송</label>
                          <input
                            type="number"
                            min="0"
                            value={setting.timing?.days_after || 0}
                            onChange={(e) => updateNotificationSetting(category, 'timing', {
                              ...setting.timing,
                              days_after: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


