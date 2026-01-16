'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react'
import styles from './payments.module.scss'
import Button from '@/components/ui/Button'
import PaymentModal from './components/PaymentModal'
import type { Payment } from './types'

const statusLabels: Record<string, string> = {
  pending: '미수납',
  partial: '부분수납',
  completed: '완료',
  refunded: '환불',
  cancelled: '취소'
}

const statusColors: Record<string, string> = {
  pending: 'warning',
  partial: 'info',
  completed: 'success',
  refunded: 'error',
  cancelled: 'disabled'
}

const methodLabels: Record<string, string> = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
  kakaopay: '카카오페이',
  naverpay: '네이버페이',
  point: '포인트'
}

const methodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote size={16} />,
  card: <CreditCard size={16} />,
  transfer: <Building2 size={16} />,
  kakaopay: <Smartphone size={16} />,
  naverpay: <Smartphone size={16} />,
  point: <CreditCard size={16} />
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  // 통계
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0
  })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setPayments(data.data || [])
        // 통계 계산
        const total = (data.data || []).reduce((sum: number, p: Payment) => sum + Number(p.total_amount), 0)
        const paid = (data.data || []).reduce((sum: number, p: Payment) => sum + Number(p.paid_amount), 0)
        setStats({
          totalAmount: total,
          paidAmount: paid,
          unpaidAmount: total - paid
        })
      }
    } catch (error) {
      console.error('결제 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleAddPayment = () => {
    setSelectedPayment(null)
    setShowModal(true)
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowModal(true)
  }

  const handleSavePayment = async (formData: {
    patient_id: string
    items: { item_name: string; unit_price: number; quantity: number; total_price: number }[]
    payment_methods: { method: string; amount: number }[]
    memo?: string
  }) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPayments()
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('결제 저장 오류:', error)
      alert('저장에 실패했습니다.')
    }
  }

  // 추가 수납
  const handleAdditionalPayment = async (paymentId: string, additionalPayment: { method: string; amount: number }) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          additional_payment: additionalPayment
        })
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPayments()
      } else {
        alert(data.error || '추가 수납에 실패했습니다.')
      }
    } catch (error) {
      console.error('추가 수납 오류:', error)
      alert('추가 수납에 실패했습니다.')
    }
  }

  // 결제 취소
  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm('정말 이 결제를 취소하시겠습니까?')) return

    try {
      const res = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPayments()
      } else {
        alert(data.error || '취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('결제 취소 오류:', error)
      alert('취소에 실패했습니다.')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>결제/수납 관리</h1>
        <Button variant="black" onClick={handleAddPayment}>
          <Plus size={18} />
          <span>결제 등록</span>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.label}>총 매출</span>
          <span className={styles.value}>{formatMoney(stats.totalAmount)}원</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.label}>수납 완료</span>
          <span className={`${styles.value} ${styles.success}`}>{formatMoney(stats.paidAmount)}원</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.label}>미수금</span>
          <span className={`${styles.value} ${styles.warning}`}>{formatMoney(stats.unpaidAmount)}원</span>
        </div>
      </div>

      {/* 필터 */}
      <div className={styles.toolbar}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">전체 상태</option>
          <option value="pending">미수납</option>
          <option value="partial">부분수납</option>
          <option value="completed">완료</option>
          <option value="refunded">환불</option>
          <option value="cancelled">취소</option>
        </select>
      </div>

      {/* 결제 목록 */}
      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>결제번호</th>
                <th>날짜</th>
                <th>환자</th>
                <th>항목</th>
                <th>총액</th>
                <th>수납액</th>
                <th>미수금</th>
                <th>결제수단</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.empty}>결제 내역이 없습니다</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr 
                    key={payment.id}
                    onClick={() => handleViewPayment(payment)}
                    className={styles.clickable}
                  >
                    <td className={styles.paymentNo}>{payment.payment_no}</td>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>
                      <div className={styles.patientInfo}>
                        <span className={styles.name}>{payment.patient?.name || '-'}</span>
                        <span className={styles.chartNo}>{payment.patient?.chart_no}</span>
                      </div>
                    </td>
                    <td className={styles.items}>
                      {payment.items?.map(item => item.item_name).join(', ') || '-'}
                    </td>
                    <td className={styles.amount}>{formatMoney(payment.total_amount)}원</td>
                    <td className={styles.amount}>{formatMoney(payment.paid_amount)}원</td>
                    <td className={`${styles.amount} ${payment.unpaid_amount > 0 ? styles.unpaid : ''}`}>
                      {formatMoney(payment.unpaid_amount)}원
                    </td>
                    <td>
                      <div className={styles.methods}>
                        {payment.details?.map((d, i) => (
                          <span key={i} className={styles.methodBadge}>
                            {methodIcons[d.method]}
                            {methodLabels[d.method] || d.method}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[statusColors[payment.status]]}`}>
                        {statusLabels[payment.status] || payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 결제 모달 */}
      {showModal && (
        <PaymentModal
          payment={selectedPayment}
          onClose={() => setShowModal(false)}
          onSave={handleSavePayment}
          onAddPayment={handleAdditionalPayment}
          onCancel={handleCancelPayment}
        />
      )}
    </div>
  )
}