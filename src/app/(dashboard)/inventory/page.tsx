'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import styles from './inventory.module.scss'
import Button from '@/components/ui/Button'

interface InventoryItem {
  id: string
  item_code: string
  item_name: string
  category: string
  unit: string
  current_stock: number
  min_stock: number
  base_price: number
  supplier_name: string
}

interface Transaction {
  id: string
  transaction_type: string
  quantity: number
  reason: string
  created_at: string
  expiry_date?: string
  item?: { item_name: string }
  performer?: { name: string }
}

// 유통기한 임박 체크 (30일 이내)
const isExpiringsoon = (expiryDate?: string) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 30 && diffDays >= 0
}

interface Alerts {
  lowStock: { count: number; items: { item_name: string; current_stock: number }[] }
  expiringSoon: { count: number; items: { item_name: string; expiry_date: string }[] }
}

const typeLabels: Record<string, string> = {
  in: '입고',
  out: '출고',
  adjust: '조정',
  return: '반품',
  dispose: '폐기',
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'transactions'>('items')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<Alerts | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLowStock, setShowLowStock] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/alerts')
      const data = await res.json()
      if (data.success) setAlerts(data.data)
    } catch (error) {
      console.error('Alerts fetch error:', error)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'items') {
        const params = new URLSearchParams()
        if (showLowStock) params.append('low_stock', 'true')
        if (searchTerm) params.append('search', searchTerm)

        const res = await fetch(`/api/inventory?${params}`)
        const data = await res.json()
        if (data.success) setItems(data.data || [])
      } else {
        const res = await fetch('/api/inventory/transactions')
        const data = await res.json()
        if (data.success) setTransactions(data.data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, showLowStock, searchTerm])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>재고관리</h1>
      </div>

      {/* 알림 배너 */}
      {alerts && (alerts.lowStock.count > 0 || alerts.expiringSoon.count > 0) && (
        <div className={styles.alertBanner}>
          {alerts.lowStock.count > 0 && (
            <div className={styles.alertItem + ' ' + styles.warning}>
              <AlertTriangle size={16} />
              <span>재고 부족 {alerts.lowStock.count}건</span>
            </div>
          )}
          {alerts.expiringSoon.count > 0 && (
            <div className={styles.alertItem + ' ' + styles.expiry}>
              <Clock size={16} />
              <span>유통기한 임박 {alerts.expiringSoon.count}건</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'items' ? styles.active : ''}`}
          onClick={() => setActiveTab('items')}
        >
          품목 현황
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'transactions' ? styles.active : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          입출고 내역
        </button>
      </div>

      {activeTab === 'items' && (
        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="품목명 또는 코드 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <Button type="submit" variant="black" size="sm">검색</Button>
          </form>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
            <span>재고 부족만 보기</span>
          </label>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : activeTab === 'items' ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>품목코드</th>
                <th>품목명</th>
                <th>카테고리</th>
                <th>현재 재고</th>
                <th>최소 재고</th>
                <th>단위</th>
                <th>단가</th>
                <th>공급업체</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>등록된 품목이 없습니다</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={item.current_stock <= item.min_stock ? styles.lowStock : ''}>
                    <td>{item.item_code}</td>
                    <td>{item.item_name}</td>
                    <td>{item.category || '-'}</td>
                    <td>
                      <span className={item.current_stock <= item.min_stock ? styles.warning : ''}>
                        {item.current_stock}
                      </span>
                    </td>
                    <td>{item.min_stock}</td>
                    <td>{item.unit || '-'}</td>
                    <td>{item.base_price?.toLocaleString() || '-'}</td>
                    <td>{item.supplier_name || '-'}</td>
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
                <th>일시</th>
                <th>품목명</th>
                <th>유형</th>
                <th>수량</th>
                <th>사유</th>
                <th>처리자</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>입출고 내역이 없습니다</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className={isExpiringsoon(tx.expiry_date) ? styles.expiryAlert : ''}>
                    <td>{new Date(tx.created_at).toLocaleString('ko-KR')}</td>
                    <td>{tx.item?.item_name || '-'}</td>
                    <td>
                      <span className={`${styles.typeBadge} ${styles[tx.transaction_type]}`}>
                        {typeLabels[tx.transaction_type] || tx.transaction_type}
                      </span>
                    </td>
                    <td>{tx.quantity}</td>
                    <td>{tx.reason || '-'}</td>
                    <td>{tx.performer?.name || '-'}</td>
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

