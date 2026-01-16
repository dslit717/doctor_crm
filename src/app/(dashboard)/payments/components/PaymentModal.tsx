'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Search, X, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../payments.module.scss'
import type { Patient, Payment } from '../types'

const methodLabels: Record<string, string> = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
  kakaopay: '카카오페이',
  naverpay: '네이버페이',
  point: '포인트'
}

const methodIcons: Record<string, ReactNode> = {
  cash: <Banknote size={16} />,
  card: <CreditCard size={16} />,
  transfer: <Building2 size={16} />,
  kakaopay: <Smartphone size={16} />,
  naverpay: <Smartphone size={16} />,
  point: <CreditCard size={16} />
}

export type PaymentModalSavePayload = {
  patient_id: string
  items: { item_name: string; unit_price: number; quantity: number; total_price: number }[]
  payment_methods: { method: string; amount: number }[]
  memo?: string
}

export default function PaymentModal({
  payment,
  onClose,
  onSave,
  onAddPayment,
  onCancel
}: {
  payment: Payment | null
  onClose: () => void
  onSave: (data: PaymentModalSavePayload) => void
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

  useEffect(() => {
    if (isViewMode) return
    // 신규 등록 시 초기화
    setShowAddPayment(false)
    setAddMethod('card')
    setAddAmount(0)
    setPatientSearch('')
    setPatientResults([])
    setSelectedPatient(null)
    setItems([{ item_name: '', unit_price: 0, quantity: 1, discount: 0, total_price: 0 }])
    setPaymentMethods([{ method: 'card', amount: 0 }])
    setMemo('')
  }, [isViewMode])

  // 환자 검색
  useEffect(() => {
    if (isViewMode) return
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
  }, [patientSearch, isViewMode])

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setPatientSearch('')
    setPatientResults([])
  }

  const addItem = () => {
    setItems([...items, { item_name: '', unit_price: 0, quantity: 1, discount: 0, total_price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    const qty = newItems[index].quantity || 1
    const price = newItems[index].unit_price || 0
    const discount = newItems[index].discount || 0
    newItems[index].total_price = (qty * price) - discount
    setItems(newItems)
  }

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'cash', amount: 0 }])
  }

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
  }

  const updatePaymentMethod = (index: number, field: string, value: string | number) => {
    const newMethods = [...paymentMethods]
    newMethods[index] = { ...newMethods[index], [field]: value }
    setPaymentMethods(newMethods)
  }

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

  const formatMoney = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount)

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isViewMode ? '결제 상세' : '결제 등록'}
      size="lg"
      footer={
        <>
          {!isViewMode && (
            <>
              <span />
              <div className="footer-right">
                <Button type="button" variant="secondary" onClick={onClose}>
                  취소
                </Button>
                <Button type="submit" form="payment-form" variant="primary">
                  결제 등록
                </Button>
              </div>
            </>
          )}
          {isViewMode && (
            <>
              <span />
              <div className="footer-right">
                {(payment?.unpaid_amount || 0) > 0 && payment?.status !== 'cancelled' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setShowAddPayment(!showAddPayment)}
                  >
                    {showAddPayment ? '닫기' : '추가 수납'}
                  </Button>
                )}
                {payment?.status !== 'cancelled' && payment?.status !== 'refunded' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => payment && onCancel(payment.id)}
                  >
                    결제취소
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit}>
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
              <Button type="button" variant="info" size="sm" onClick={addItem}>
                + 항목 추가
              </Button>
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
            <span className={styles.totalAmount}>
              {formatMoney(isViewMode ? payment?.total_amount || 0 : totalAmount)}원
            </span>
          </div>
        </div>

        {/* 결제 수단 */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h4>결제 수단</h4>
            {!isViewMode && (
              <Button type="button" variant="info" size="sm" onClick={addPaymentMethod}>
                + 수단 추가
              </Button>
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
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (addAmount > 0 && payment) {
                      onAddPayment(payment.id, { method: addMethod, amount: addAmount })
                    }
                  }}
                >
                  수납
                </Button>
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
      </form>
    </Modal>
  )
}


