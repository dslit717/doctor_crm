'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import styles from '../settings-layout.module.scss'
import Button from '@/components/ui/Button'
import { apiCall } from '@/lib/api'

interface BusinessHours {
  weekday: { open: string; close: string; lunch_start: string; lunch_end: string }
  saturday: { open: string; close: string }
  sunday: { closed: boolean }
}

export default function SettingsHoursPage() {
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

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    weekday: { open: '09:00', close: '18:00', lunch_start: '12:00', lunch_end: '13:00' },
    saturday: { open: '09:00', close: '13:00' },
    sunday: { closed: true }
  })
  const [loading, setLoading] = useState(true)

  const fetchHours = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiCall<{ data: { setting_value: BusinessHours } }>('/api/settings/operation?key=business_hours')
      if (result.success && result.data?.data?.setting_value) {
        setBusinessHours(result.data.data.setting_value)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHours()
  }, [fetchHours])

  const saveBusinessHours = async () => {
    const result = await apiCall('/api/settings/operation', {
      method: 'POST',
      body: JSON.stringify({
        setting_key: 'business_hours',
        setting_value: businessHours
      })
    })
    if (result.success) {
      alert('저장되었습니다.')
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
          onClick={() => router.push('/settings/hours')}
        >
          진료 시간
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'holidays' ? styles.active : ''}`}
          onClick={() => router.push('/settings/holidays')}
        >
          휴무일 관리
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
          onClick={() => router.push('/settings/notifications')}
        >
          자동 알림
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'charts' ? styles.active : ''}`}
          onClick={() => router.push('/settings/charts')}
        >
          차트 설정
        </button>
      </div>

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

        <Button variant="black" onClick={saveBusinessHours} className={styles.businessHoursSaveBtn}>
          저장
        </Button>
      </div>
    </div>
  )
}


