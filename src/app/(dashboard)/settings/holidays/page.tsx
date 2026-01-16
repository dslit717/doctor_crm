'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import styles from '../settings-layout.module.scss'
import Button from '@/components/ui/Button'

interface Holiday {
  id: string
  date: string
  name: string
  type: string
}

export default function SettingsHolidaysPage() {
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

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })

  const fetchHolidays = useCallback(async () => {
    setLoading(true)
    try {
      const year = new Date().getFullYear()
      const holidaysRes = await fetch(`/api/settings/holidays?year=${year}`)
      const holidaysData = await holidaysRes.json()
      if (holidaysData.success) {
        setHolidays(holidaysData.data || [])
      } else {
        setHolidays([])
      }
    } catch (error) {
      console.error('휴무일 조회 오류:', error)
      alert('휴무일을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('날짜와 휴무일명을 입력하세요.')
      return
    }

    try {
      const res = await fetch('/api/settings/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHoliday)
      })
      if (res.ok) {
        setNewHoliday({ date: '', name: '' })
        fetchHolidays()
      } else {
        alert('추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('Add holiday error:', error)
      alert('추가에 실패했습니다.')
    }
  }

  const deleteHoliday = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/settings/holidays?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchHolidays()
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete holiday error:', error)
      alert('삭제에 실패했습니다.')
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
          <Button variant="black" size="sm" onClick={addHoliday}>
            <Plus size={16} /> 추가
          </Button>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteHoliday(holiday.id)}
                  aria-label="휴무일 삭제"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


