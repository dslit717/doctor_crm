'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import styles from './operation.module.scss'

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

export default function OperationSettingsPage() {
  const [activeTab, setActiveTab] = useState<'hours' | 'holidays'>('hours')
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    weekday: { open: '09:00', close: '18:00', lunch_start: '12:00', lunch_end: '13:00' },
    saturday: { open: '09:00', close: '13:00' },
    sunday: { closed: true }
  })
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })

  useEffect(() => {
    fetchData()
  }, [])

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
      ) : (
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
      )}
    </div>
  )
}

