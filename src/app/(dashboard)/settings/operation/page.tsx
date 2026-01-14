'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Bell } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './operation.module.scss'
import notificationStyles from '../notifications/notifications.module.scss'

interface BusinessHours {
  weekday: { open: string; close: string; lunch_start: string; lunch_end: string }
  saturday: { open: string; close: string }
  sunday: { closed: boolean }
}

interface Holiday {
  id: string
  date: string
  name: string
  type: string
}

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

export default function OperationSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as 'hours' | 'holidays' | 'notifications' | null
  const [activeTab, setActiveTab] = useState<'hours' | 'holidays' | 'notifications'>(initialTab || 'hours')
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    weekday: { open: '09:00', close: '18:00', lunch_start: '12:00', lunch_end: '13:00' },
    saturday: { open: '09:00', close: '13:00' },
    sunday: { closed: true }
  })
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([])
  const [templates, setTemplates] = useState<Array<{ template_code: string; name: string }>>([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
    if (activeTab === 'notifications') {
      fetchNotificationData()
    }
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 운영 시간 조회
      const hoursRes = await fetch('/api/settings/operation?key=business_hours')
      const hoursData = await hoursRes.json()
      if (hoursData.success && hoursData.data?.setting_value) {
        setBusinessHours(hoursData.data.setting_value)
      }

      // 휴무일 조회
      const year = new Date().getFullYear()
      const holidaysRes = await fetch(`/api/settings/holidays?year=${year}`)
      const holidaysData = await holidaysRes.json()
      if (holidaysData.success) {
        setHolidays(holidaysData.data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveBusinessHours = async () => {
    try {
      const res = await fetch('/api/settings/operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_key: 'business_hours',
          setting_value: businessHours,
        }),
      })
      if (res.ok) {
        alert('저장되었습니다.')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 실패')
    }
  }

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('날짜와 휴무일명을 입력하세요.')
      return
    }

    try {
      const res = await fetch('/api/settings/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHoliday),
      })
      if (res.ok) {
        setNewHoliday({ date: '', name: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Add holiday error:', error)
    }
  }

  const deleteHoliday = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/settings/holidays?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Delete holiday error:', error)
    }
  }

  const fetchNotificationData = async () => {
    setNotificationLoading(true)
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        fetch('/api/notifications/automation'),
        fetch('/api/messaging/templates')
      ])

      const settingsData = await settingsRes.json()
      const templatesData = await templatesRes.json()

      if (settingsData.success) {
        setNotificationSettings(settingsData.data || [])
      } else {
        // 에러가 발생해도 빈 배열로 설정
        setNotificationSettings([])
      }

      if (templatesData.success) {
        setTemplates(templatesData.data || [])
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error)
      // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setNotificationSettings([])
      setTemplates([])
    } finally {
      setNotificationLoading(false)
    }
  }

  const updateNotificationSetting = (category: string, field: string, value: unknown) => {
    setNotificationSettings(prev => {
      const existing = prev.find(s => s.category === category)
      if (existing) {
        return prev.map(s => 
          s.category === category 
            ? { ...s, [field]: value }
            : s
        )
      } else {
        return [...prev, {
          category,
          is_enabled: true,
          template_code: '',
          timing: null,
          conditions: null,
          [field]: value
        }]
      }
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

  if (loading) {
    return <div className={styles.loading}>로딩중...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>운영 설정</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'hours' ? styles.active : ''}`}
          onClick={() => setActiveTab('hours')}
        >
          진료 시간
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'holidays' ? styles.active : ''}`}
          onClick={() => setActiveTab('holidays')}
        >
          휴무일 관리
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          자동 알림
        </button>
      </div>

      {activeTab === 'hours' ? (
        <div className={styles.section}>
          <h3>평일 (월~금)</h3>
          <div className={styles.timeRow}>
            <div className={styles.field}>
              <label>오픈</label>
              <input
                type="time"
                value={businessHours.weekday.open}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  weekday: { ...businessHours.weekday, open: e.target.value }
                })}
              />
            </div>
            <div className={styles.field}>
              <label>마감</label>
              <input
                type="time"
                value={businessHours.weekday.close}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  weekday: { ...businessHours.weekday, close: e.target.value }
                })}
              />
            </div>
            <div className={styles.field}>
              <label>점심 시작</label>
              <input
                type="time"
                value={businessHours.weekday.lunch_start}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  weekday: { ...businessHours.weekday, lunch_start: e.target.value }
                })}
              />
            </div>
            <div className={styles.field}>
              <label>점심 종료</label>
              <input
                type="time"
                value={businessHours.weekday.lunch_end}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  weekday: { ...businessHours.weekday, lunch_end: e.target.value }
                })}
              />
            </div>
          </div>

          <h3>토요일</h3>
          <div className={styles.timeRow}>
            <div className={styles.field}>
              <label>오픈</label>
              <input
                type="time"
                value={businessHours.saturday.open}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  saturday: { ...businessHours.saturday, open: e.target.value }
                })}
              />
            </div>
            <div className={styles.field}>
              <label>마감</label>
              <input
                type="time"
                value={businessHours.saturday.close}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  saturday: { ...businessHours.saturday, close: e.target.value }
                })}
              />
            </div>
          </div>

          <h3>일요일</h3>
          <div className={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                checked={businessHours.sunday.closed}
                onChange={(e) => setBusinessHours({
                  ...businessHours,
                  sunday: { closed: e.target.checked }
                })}
              />
              휴무
            </label>
          </div>

          <button className={styles.saveBtn} onClick={saveBusinessHours}>
            저장
          </button>
        </div>
      ) : activeTab === 'holidays' ? (
        <div className={styles.section}>
          <div className={styles.addHoliday}>
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className={styles.dateInput}
            />
            <input
              type="text"
              placeholder="휴무일명 (예: 설날)"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              className={styles.nameInput}
            />
            <button className={styles.addBtn} onClick={addHoliday}>
              <Plus size={16} /> 추가
            </button>
          </div>

          <div className={styles.holidayList}>
            {holidays.length === 0 ? (
              <div className={styles.empty}>등록된 휴무일이 없습니다</div>
            ) : (
              holidays.map((holiday) => (
                <div key={holiday.id} className={styles.holidayItem}>
                  <span className={styles.date}>{holiday.date}</span>
                  <span className={styles.name}>{holiday.name}</span>
                  <span className={`${styles.type} ${styles[holiday.type]}`}>
                    {holiday.type === 'national' ? '공휴일' : holiday.type === 'temporary' ? '임시휴무' : '정기휴무'}
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteHoliday(holiday.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'notifications' ? (
        <div className={styles.section}>
          <div className={notificationStyles.header} style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>자동 알림 설정</h2>
            <button className={notificationStyles.saveBtn} onClick={handleSaveNotifications} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>

          {notificationLoading ? (
            <div className={styles.loading}>로딩 중...</div>
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
                      <div className={notificationStyles.settingTitle}>
                        <Bell size={18} />
                        <h3>{label}</h3>
                      </div>
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

          <div className={notificationStyles.infoBox}>
            <p>💡 자동 알림은 매일 자정에 실행됩니다. 설정 변경 후 다음 실행부터 적용됩니다.</p>
            <p>💡 수동 실행: API 엔드포인트 `/api/notifications/process`를 POST로 호출하세요.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

