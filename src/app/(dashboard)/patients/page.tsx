'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X, FileText } from 'lucide-react'
import styles from './patients.module.scss'
import Button from '@/components/ui/Button'
import PatientModal from './components/PatientModal'
import type { Patient, Pagination } from './types'

const genderLabels: Record<string, string> = {
  male: '남',
  female: '여',
  other: '기타'
}

const statusLabels: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  blacklist: '블랙리스트'
}

const referralLabels: Record<string, string> = {
  search: '인터넷 검색',
  sns: 'SNS',
  blog: '블로그',
  friend: '지인 소개',
  sign: '간판',
  revisit: '재방문',
  other: '기타'
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [pagination.page, statusFilter])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(pagination.page))
      params.append('limit', String(pagination.limit))
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/patients?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setPatients(data.data || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('환자 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchPatients()
  }

  const handleAddPatient = () => {
    setEditingPatient(null)
    setShowModal(true)
  }

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient)
    setShowModal(true)
  }

  const handleSavePatient = async (formData: Record<string, unknown>) => {
    try {
      const method = editingPatient ? 'PUT' : 'POST'
      const body = editingPatient ? { ...formData, id: editingPatient.id } : formData

      const res = await fetch('/api/patients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPatients()
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('환자 저장 오류:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleDeletePatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPatients()
      } else {
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('환자 삭제 오류:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>환자 관리</h1>
        <Button variant="black" onClick={handleAddPatient}>
          <Plus size={18} />
          <span>환자 등록</span>
        </Button>
      </div>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInput}>
            <Search size={18} />
            <input
              type="text"
              placeholder="이름, 전화번호, 차트번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="black" size="sm">검색</Button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="blacklist">블랙리스트</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>차트번호</th>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>성별/나이</th>
                  <th>내원경로</th>
                  <th>최초내원</th>
                  <th>최근내원</th>
                  <th>내원횟수</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.empty}>등록된 환자가 없습니다</td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      onClick={() => handleEditPatient(patient)}
                      className={styles.clickable}
                    >
                      <td className={styles.chartNo}>{patient.chart_no}</td>
                      <td className={styles.name}>{patient.name}</td>
                      <td>{patient.phone}</td>
                      <td>{genderLabels[patient.gender] || '-'} / {calculateAge(patient.birth_date)}세</td>
                      <td>{referralLabels[patient.referral_source || ''] || patient.referral_source || '-'}</td>
                      <td>{formatDate(patient.first_visit_date)}</td>
                      <td>{formatDate(patient.last_visit_date)}</td>
                      <td>{patient.visit_count || 0}회</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[patient.status]}`}>
                          {statusLabels[patient.status] || patient.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                이전
              </button>
              <span>{pagination.page} / {pagination.totalPages}</span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <PatientModal
          patient={editingPatient}
          onClose={() => setShowModal(false)}
          onSave={handleSavePatient}
          onDelete={handleDeletePatient}
        />
      )}
    </div>
  )
}
