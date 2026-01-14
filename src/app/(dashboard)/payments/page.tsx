'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react'
import styles from './payments.module.scss'

interface Payment {
  id: string
  payment_no: string
  payment_date: string
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  status: string
  memo?: string
  patient?: {
    id: string
    name: string
    chart_no: string
    phone: string
  }
  items?: PaymentItem[]
  details?: PaymentDetail[]
}

interface PaymentItem {
  id: string
  item_name: string
  item_type: string
  quantity: number
  unit_price: number
  discount_amount: number
  total_price: number
}

interface PaymentDetail {
  id: string
  method: string
  amount: number
  card_company?: string
  installment?: number
  approval_no?: string
  paid_at: string
}

interface Patient {
  id: string
  name: string
  chart_no: string
  phone: string
}

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
        <button className={styles.addBtn} onClick={handleAddPayment}>
          <Plus size={18} />
          <span>결제 등록</span>
        </button>
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

// 결제 등록/상세 모달
function PaymentModal({
  payment,
  onClose,
  onSave,
  onAddPayment,
  onCancel
}: {
  payment: Payment | null
  onClose: () => void
  onSave: (data: {
    patient_id: string
    items: { item_name: string; unit_price: number; quantity: number; total_price: number }[]
    payment_methods: { method: string; amount: number }[]
    memo?: string
  }) => void
  onAddPayment: (paymentId: string, additionalPayment: { method: string; amount: number }) => void
  onCancel: (paymentId: string) => void
}) {
  const isViewMode = !!payment
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [addMethod, setAddMethod] = useState('card')
  const [addAmount, setAddAmount] = useState(0)

  // 환자 검색
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    payment?.patient || null
  )

  // 결제 항목
  const [items, setItems] = useState<{
    item_name: string
    unit_price: number
    quantity: number
    discount: number
    total_price: number
  }[]>([{ item_name: '', unit_price: 0, quantity: 1, discount: 0, total_price: 0 }])

  // 결제 수단
  const [paymentMethods, setPaymentMethods] = useState<{
    method: string
    amount: number
  }[]>([{ method: 'card', amount: 0 }])

  const [memo, setMemo] = useState('')

  // 환자 검색
  useEffect(() => {
    if (patientSearch.length >= 2) {
      const timer = setTimeout(async () => {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&limit=5`)
        const data = await res.json()
        if (data.success) {
          setPatientResults(data.data || [])
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setPatientResults([])
    }
  }, [patientSearch])

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setPatientSearch('')
    setPatientResults([])
  }

  // 항목 추가/삭제
  const addItem = () => {
    setItems([...items, { item_name: '', unit_price: 0, quantity: 1, discount: 0, total_price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    // 총액 자동 계산
    const qty = newItems[index].quantity || 1
    const price = newItems[index].unit_price || 0
    const discount = newItems[index].discount || 0
    newItems[index].total_price = (qty * price) - discount
    setItems(newItems)
  }

  // 결제 수단 추가/삭제
  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'cash', amount: 0 }])
  }

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
    }
  }

  const updatePaymentMethod = (index: number, field: string, value: string | number) => {
    const newMethods = [...paymentMethods]
    newMethods[index] = { ...newMethods[index], [field]: value }
    setPaymentMethods(newMethods)
  }

  // 합계 계산
  const totalAmount = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const paidAmount = paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      alert('환자를 선택해주세요.')
      return
    }

    if (items.some(item => !item.item_name || item.total_price <= 0)) {
      alert('결제 항목을 입력해주세요.')
      return
    }

    onSave({
      patient_id: selectedPatient.id,
      items: items.map(item => ({
        item_name: item.item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price
      })),
      payment_methods: paymentMethods.filter(pm => pm.amount > 0),
      memo
    })
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{isViewMode ? '결제 상세' : '결제 등록'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {/* 환자 선택 */}
          <div className={styles.formSection}>
            <h4>환자 정보</h4>
            {isViewMode ? (
              <div className={styles.patientSelected}>
                <span>{payment?.patient?.name}</span>
                <span className={styles.chartNo}>{payment?.patient?.chart_no}</span>
              </div>
            ) : (
              <div className={styles.patientSearch}>
                {selectedPatient ? (
                  <div className={styles.patientSelected}>
                    <span>{selectedPatient.name}</span>
                    <span className={styles.chartNo}>{selectedPatient.chart_no}</span>
                    <button type="button" onClick={() => setSelectedPatient(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.searchInput}>
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="환자 검색 (이름, 전화번호)"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                    {patientResults.length > 0 && (
                      <div className={styles.searchResults}>
                        {patientResults.map((p) => (
                          <div
                            key={p.id}
                            className={styles.searchItem}
                            onClick={() => selectPatient(p)}
                          >
                            <span>{p.name}</span>
                            <span className={styles.chartNo}>{p.chart_no}</span>
                            <span className={styles.phone}>{p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 결제 항목 */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h4>결제 항목</h4>
              {!isViewMode && (
                <button type="button" className={styles.addRowBtn} onClick={addItem}>
                  + 항목 추가
                </button>
              )}
            </div>
            
            {isViewMode ? (
              <div className={styles.itemsList}>
                {payment?.items?.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.item_name}</span>
                    <span>{item.quantity}개</span>
                    <span>{formatMoney(item.total_price)}원</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.itemsTable}>
                {items.map((item, index) => (
                  <div key={index} className={styles.itemInputRow}>
                    <input
                      type="text"
                      placeholder="항목명"
                      value={item.item_name}
                      onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      className={styles.itemName}
                    />
                    <input
                      type="number"
                      placeholder="단가"
                      value={item.unit_price || ''}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      className={styles.itemPrice}
                    />
                    <input
                      type="number"
                      placeholder="수량"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className={styles.itemQty}
                      min={1}
                    />
                    <input
                      type="number"
                      placeholder="할인"
                      value={item.discount || ''}
                      onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                      className={styles.itemDiscount}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeItem(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.totalRow}>
              <span>합계</span>
              <span className={styles.totalAmount}>{formatMoney(isViewMode ? payment?.total_amount || 0 : totalAmount)}원</span>
            </div>
          </div>

          {/* 결제 수단 */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h4>결제 수단</h4>
              {!isViewMode && (
                <button type="button" className={styles.addRowBtn} onClick={addPaymentMethod}>
                  + 수단 추가
                </button>
              )}
            </div>

            {isViewMode ? (
              <div className={styles.methodsList}>
                {payment?.details?.map((d, i) => (
                  <div key={i} className={styles.methodRow}>
                    <span className={styles.methodName}>
                      {methodIcons[d.method]}
                      {methodLabels[d.method] || d.method}
                      {d.card_company && ` (${d.card_company})`}
                      {d.installment && d.installment > 0 && ` ${d.installment}개월`}
                    </span>
                    <span>{formatMoney(d.amount)}원</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.methodsTable}>
                {paymentMethods.map((pm, index) => (
                  <div key={index} className={styles.methodInputRow}>
                    <select
                      value={pm.method}
                      onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                    >
                      <option value="card">카드</option>
                      <option value="cash">현금</option>
                      <option value="transfer">계좌이체</option>
                      <option value="kakaopay">카카오페이</option>
                      <option value="naverpay">네이버페이</option>
                      <option value="point">포인트</option>
                    </select>
                    <input
                      type="number"
                      placeholder="금액"
                      value={pm.amount || ''}
                      onChange={(e) => updatePaymentMethod(index, 'amount', Number(e.target.value))}
                    />
                    {paymentMethods.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removePaymentMethod(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isViewMode && (
              <div className={styles.paymentSummary}>
                <div className={styles.summaryRow}>
                  <span>총 결제액</span>
                  <span>{formatMoney(totalAmount)}원</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>수납액</span>
                  <span>{formatMoney(paidAmount)}원</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.balance}`}>
                  <span>잔액</span>
                  <span className={totalAmount - paidAmount > 0 ? styles.unpaid : ''}>
                    {formatMoney(totalAmount - paidAmount)}원
                  </span>
                </div>
              </div>
            )}

            {/* 상세 보기 - 결제 현황 */}
            {isViewMode && (
              <div className={styles.paymentSummary}>
                <div className={styles.summaryRow}>
                  <span>총액</span>
                  <span>{formatMoney(payment?.total_amount || 0)}원</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>수납액</span>
                  <span>{formatMoney(payment?.paid_amount || 0)}원</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.balance}`}>
                  <span>미수금</span>
                  <span className={(payment?.unpaid_amount || 0) > 0 ? styles.unpaid : ''}>
                    {formatMoney(payment?.unpaid_amount || 0)}원
                  </span>
                </div>
              </div>
            )}

            {/* 추가 수납 폼 */}
            {isViewMode && showAddPayment && (
              <div className={styles.addPaymentForm}>
                <h5>추가 수납</h5>
                <div className={styles.methodInputRow}>
                  <select value={addMethod} onChange={(e) => setAddMethod(e.target.value)}>
                    <option value="card">카드</option>
                    <option value="cash">현금</option>
                    <option value="transfer">계좌이체</option>
                    <option value="kakaopay">카카오페이</option>
                    <option value="naverpay">네이버페이</option>
                  </select>
                  <input
                    type="number"
                    placeholder="금액"
                    value={addAmount || ''}
                    onChange={(e) => setAddAmount(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className={styles.btnSubmit}
                    onClick={() => {
                      if (addAmount > 0 && payment) {
                        onAddPayment(payment.id, { method: addMethod, amount: addAmount })
                      }
                    }}
                  >
                    수납
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 메모 */}
          <div className={styles.formSection}>
            <h4>메모</h4>
            {isViewMode ? (
              <p className={styles.memoText}>{payment?.memo || '-'}</p>
            ) : (
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 입력"
                rows={2}
              />
            )}
          </div>

          {/* 버튼 */}
          <div className={styles.modalFooter}>
            {!isViewMode && (
              <>
                <button type="button" className={styles.btnCancel} onClick={onClose}>
                  취소
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  결제 등록
                </button>
              </>
            )}
            {isViewMode && (
              <div className={styles.rightBtns}>
                {(payment?.unpaid_amount || 0) > 0 && payment?.status !== 'cancelled' && (
                  <button
                    type="button"
                    className={styles.btnSubmit}
                    onClick={() => setShowAddPayment(!showAddPayment)}
                  >
                    {showAddPayment ? '닫기' : '추가 수납'}
                  </button>
                )}
                {payment?.status !== 'cancelled' && payment?.status !== 'refunded' && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => payment && onCancel(payment.id)}
                  >
                    결제취소
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

