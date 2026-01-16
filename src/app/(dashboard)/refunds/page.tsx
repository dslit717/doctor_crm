'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './refunds.module.scss'
import { apiCall } from '@/lib/api'

interface Refund {
  id: string
  refund_no: string
  refund_amount: number
  refund_method: string
  reason: string
  status: string
  created_at: string
  approved_at?: string
  payment?: {
    id: string
    payment_no: string
    total_amount: number
    patient?: {
      id: string
      name: string
      chart_no: string
    }
  }
  approved_by_employee?: {
    id: string
    name: string
  }
}

const statusLabels: Record<string, string> = {
  pending: '대기',
  completed: '완료',
  rejected: '거절'
}

const statusColors: Record<string, string> = {
  pending: 'warning',
  completed: 'success',
  rejected: 'error'
}

const methodLabels: Record<string, string> = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
  original: '원결제수단'
}

export default function RefundsPage() {
  const { user } = useAuth()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchRefunds()
  }, [statusFilter, pagination.page])

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const result = await apiCall<{ data: Refund[]; pagination: typeof pagination }>(`/api/refunds?${params}`)
      if (result.success && result.data) {
        setRefunds(result.data.data || [])
        if (result.data?.pagination) {
          setPagination(prev => ({
            ...prev,
            total: result.data!.pagination.total,
            totalPages: result.data!.pagination.totalPages
          }))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('환불을 승인하시겠습니까?')) return

    if (!user?.employee?.id) {
      alert('사용자 정보를 불러올 수 없습니다.')
      return
    }

    const result = await apiCall('/api/refunds', {
      method: 'PUT',
      body: JSON.stringify({
        id,
        action: 'approve',
        approved_by: user.employee.id
      })
    })

    if (result.success) {
      alert('환불이 승인되었습니다.')
      fetchRefunds()
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('환불을 거절하시겠습니까?')) return

    if (!user?.employee?.id) {
      alert('사용자 정보를 불러올 수 없습니다.')
      return
    }

    const result = await apiCall('/api/refunds', {
      method: 'PUT',
      body: JSON.stringify({
        id,
        action: 'reject',
        approved_by: user.employee.id
      })
    })

    if (result.success) {
      alert('환불이 거절되었습니다.')
      fetchRefunds()
    }
  }

  const filteredRefunds = refunds.filter(refund => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      refund.refund_no.toLowerCase().includes(term) ||
      refund.payment?.patient?.name.toLowerCase().includes(term) ||
      refund.payment?.patient?.chart_no.toLowerCase().includes(term)
    )
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>환불 관리</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="환불번호, 환자명, 차트번호 검색..."
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
                  <th>환불번호</th>
                  <th>결제번호</th>
                  <th>환자</th>
                  <th>환불금액</th>
                  <th>환불방법</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>신청일</th>
                  <th>처리일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={styles.empty}>
                      환불 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((refund) => (
                    <tr key={refund.id}>
                      <td>{refund.refund_no}</td>
                      <td>{refund.payment?.payment_no || '-'}</td>
                      <td>
                        {refund.payment?.patient ? (
                          <div>
                            <div>{refund.payment.patient.name}</div>
                            <div className={styles.chartNo}>{refund.payment.patient.chart_no}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className={styles.amount}>
                        {refund.refund_amount.toLocaleString()}원
                      </td>
                      <td>{methodLabels[refund.refund_method] || refund.refund_method}</td>
                      <td className={styles.reason}>{refund.reason}</td>
                      <td>
                        <span className={`${styles.status} ${styles[statusColors[refund.status]]}`}>
                          {statusLabels[refund.status]}
                        </span>
                      </td>
                      <td>{new Date(refund.created_at).toLocaleDateString()}</td>
                      <td>
                        {refund.approved_at 
                          ? new Date(refund.approved_at).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td>
                        {refund.status === 'pending' && (
                          <div className={styles.actions}>
                            <button
                              onClick={() => handleApprove(refund.id)}
                              className={styles.approveBtn}
                              title="승인"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(refund.id)}
                              className={styles.rejectBtn}
                              title="거절"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                        {refund.status !== 'pending' && (
                          <span className={styles.processed}>
                            {refund.approved_by_employee?.name || '-'}
                          </span>
                        )}
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

