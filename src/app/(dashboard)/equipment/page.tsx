'use client'

import { useState, useEffect } from 'react'
import styles from './equipment.module.scss'

interface Equipment {
  id: string
  equipment_code: string
  name: string
  category: string
  model: string
  manufacturer: string
  serial_number: string
  purchase_date: string
  location: string
  status: string
  next_maintenance_date: string
}

interface Maintenance {
  id: string
  maintenance_type: string
  maintenance_date: string
  description: string
  cost: number
  performed_by: string
  equipment?: { name: string; equipment_code: string }
}

const statusLabels: Record<string, string> = {
  active: '정상',
  maintenance: '점검중',
  repair: '수리중',
  disposed: '폐기',
}

const maintenanceLabels: Record<string, string> = {
  regular: '정기점검',
  repair: '수리',
  part_replacement: '부품교체',
  calibration: '교정',
  cleaning: '청소',
}

const categories = ['레이저장비', '리프팅장비', '주사장비', '분석장비', '관리장비', '수술장비']

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance'>('equipment')
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedCategory])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'equipment') {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)

        const res = await fetch(`/api/equipment?${params}`)
        const data = await res.json()
        if (data.success) setEquipments(data.data || [])
      } else {
        const res = await fetch('/api/equipment/maintenance')
        const data = await res.json()
        if (data.success) setMaintenances(data.data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>장비관리</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'equipment' ? styles.active : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          장비 현황
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'maintenance' ? styles.active : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          유지보수 기록
        </button>
      </div>

      {activeTab === 'equipment' && (
        <div className={styles.toolbar}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.select}
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : activeTab === 'equipment' ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>장비코드</th>
                <th>장비명</th>
                <th>카테고리</th>
                <th>모델</th>
                <th>제조사</th>
                <th>위치</th>
                <th>상태</th>
                <th>다음 점검일</th>
              </tr>
            </thead>
            <tbody>
              {equipments.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>등록된 장비가 없습니다</td></tr>
              ) : (
                equipments.map((eq) => (
                  <tr key={eq.id}>
                    <td>{eq.equipment_code}</td>
                    <td>{eq.name}</td>
                    <td>{eq.category || '-'}</td>
                    <td>{eq.model || '-'}</td>
                    <td>{eq.manufacturer || '-'}</td>
                    <td>{eq.location || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[eq.status]}`}>
                        {statusLabels[eq.status] || eq.status}
                      </span>
                    </td>
                    <td className={isOverdue(eq.next_maintenance_date) ? styles.overdue : ''}>
                      {eq.next_maintenance_date || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>점검일</th>
                <th>장비명</th>
                <th>유형</th>
                <th>내용</th>
                <th>비용</th>
                <th>담당자</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>유지보수 기록이 없습니다</td></tr>
              ) : (
                maintenances.map((mt) => (
                  <tr key={mt.id}>
                    <td>{mt.maintenance_date}</td>
                    <td>{mt.equipment?.name || '-'}</td>
                    <td>
                      <span className={styles.typeBadge}>
                        {maintenanceLabels[mt.maintenance_type] || mt.maintenance_type}
                      </span>
                    </td>
                    <td>{mt.description || '-'}</td>
                    <td>{mt.cost?.toLocaleString() || '-'}</td>
                    <td>{mt.performed_by || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function isOverdue(date: string | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

