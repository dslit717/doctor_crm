'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Phone, Calendar, X, CheckCircle } from 'lucide-react'
import styles from './pending.module.scss'

interface PendingReservation {
  id: string
  patient_id?: string
  patient_name: string
  phone: string
  consultation_summary?: string
  desired_treatment?: string
  desired_schedule?: string
  pending_reason: string
  reason_detail?: string
  expected_decision_date?: string
  counselor_id?: string
  next_contact_date?: string
  status: string
  memo?: string
  contact_history?: Array<{
    contacted_at: string
    method: string
    content: string
    result?: string
  }>
  created_at: string
  patient?: {
    id: string
    name: string
    chart_no: string
  }
  counselor?: {
    id: string
    name: string
  }
}

const statusLabels: Record<string, string> = {
  pending: '대기중',
  contact_scheduled: '연락예정',
  contact_completed: '연락완료',
  converted: '예약전환',
  cancelled: '취소/종료'
}

const reasonLabels: Record<string, string> = {
  no_slot: '적합한 시간대 없음',
  schedule_undecided: '환자 일정 미확정',
  price_review: '가격/견적 검토 중',
  family_consultation: '가족/타인 상의 필요',
  competitor_comparison: '타 병원 비교 중',
  other: '기타'
}

export default function PendingReservationsPage() {
  const [pendings, setPendings] = useState<PendingReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedPending, setSelectedPending] = useState<PendingReservation | null>(null)

  useEffect(() => {
    fetchPendings()
  }, [statusFilter, pagination.page])

  const fetchPendings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const res = await fetch(`/api/reservations/pending?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setPendings(data.data || [])
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages
          }))
        }
      }
    } catch (error) {
      console.error('대기 목록 조회 오류:', error)
      alert('대기 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToReservation = async (pendingId: string) => {
    if (!confirm('이 대기를 예약으로 전환하시겠습니까?')) return

    try {
      // TODO: 예약 데이터 입력 모달 표시 후 전환
      alert('예약 전환 기능은 예약 페이지에서 진행해주세요.')
    } catch (error) {
      console.error('예약 전환 오류:', error)
    }
  }

  const handleAddContact = async (pendingId: string) => {
    const method = prompt('연락 방법을 입력하세요 (전화/문자/카카오톡):')
    const content = prompt('연락 내용을 입력하세요:')
    const result = prompt('연락 결과를 입력하세요 (선택):')

    if (!method || !content) return

    try {
      const res = await fetch('/api/reservations/pending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pendingId,
          contact_log: {
            method,
            content,
            result: result || undefined
          }
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('연락 이력이 추가되었습니다.')
        fetchPendings()
      } else {
        alert(data.error || '연락 이력 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('연락 이력 추가 오류:', error)
      alert('연락 이력 추가에 실패했습니다.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/reservations/pending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus
        })
      })

      const data = await res.json()
      if (data.success) {
        fetchPendings()
      } else {
        alert(data.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const filteredPendings = pendings.filter(pending => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      pending.patient_name.toLowerCase().includes(term) ||
      pending.phone.includes(term) ||
      pending.desired_treatment?.toLowerCase().includes(term)
    )
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>예약 대기 관리</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="환자명, 전화번호, 시술명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPagination(prev => ({ ...prev, page: 1 }))
          }}
          className={styles.filterSelect}
        >
          <option value="">전체 상태</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>환자명</th>
                  <th>전화번호</th>
                  <th>희망시술</th>
                  <th>대기사유</th>
                  <th>희망일정</th>
                  <th>담당자</th>
                  <th>후속연락일</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={styles.empty}>
                      대기 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredPendings.map((pending) => (
                    <tr key={pending.id}>
                      <td>
                        <div className={styles.patientName}>{pending.patient_name}</div>
                        {pending.patient?.chart_no && (
                          <div className={styles.chartNo}>{pending.patient.chart_no}</div>
                        )}
                      </td>
                      <td>{pending.phone}</td>
                      <td>{pending.desired_treatment || '-'}</td>
                      <td>
                        <div>{reasonLabels[pending.pending_reason] || pending.pending_reason}</div>
                        {pending.reason_detail && (
                          <div className={styles.detail}>{pending.reason_detail}</div>
                        )}
                      </td>
                      <td>{pending.desired_schedule || '-'}</td>
                      <td>{pending.counselor?.name || '-'}</td>
                      <td>
                        {pending.next_contact_date 
                          ? new Date(pending.next_contact_date).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[pending.status]}`}>
                          {statusLabels[pending.status]}
                        </span>
                      </td>
                      <td>{new Date(pending.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          {pending.status !== 'converted' && pending.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleAddContact(pending.id)}
                                className={styles.contactBtn}
                                title="연락 이력 추가"
                              >
                                <Phone size={14} />
                              </button>
                              <button
                                onClick={() => handleConvertToReservation(pending.id)}
                                className={styles.convertBtn}
                                title="예약 전환"
                              >
                                <CheckCircle size={14} />
                              </button>
                            </>
                          )}
                          <select
                            value={pending.status}
                            onChange={(e) => handleStatusChange(pending.id, e.target.value)}
                            className={styles.statusSelect}
                          >
                            {Object.entries(statusLabels).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
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
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className={styles.pageBtn}
              >
                이전
              </button>
              <span className={styles.pageInfo}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className={styles.pageBtn}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

