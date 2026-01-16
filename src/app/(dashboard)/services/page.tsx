'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
import styles from './services.module.scss'
import Button from '@/components/ui/Button'
import ServiceModal from './components/ServiceModal'
import type { Service, ServiceFormData } from './types'

const categoryLabels: Record<string, string> = {
  treatment: '시술',
  package: '패키지',
  product: '상품',
  consultation: '상담',
  other: '기타'
}

const taxLabels: Record<string, string> = {
  tax: '과세',
  tax_free: '비과세'
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    service_code: '',
    name: '',
    category: 'treatment',
    price: 0,
    tax_type: 'tax',
    duration_minutes: 30,
    description: '',
    is_active: true,
    sort_order: 0,
    custom_data: {}
  })

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (showActiveOnly) params.append('is_active', 'true')

      const res = await fetch(`/api/services?${params}`)
      const data = await res.json()
      if (data.success) {
        setServices(data.data || [])
      }
    } catch (error) {
      console.error('서비스 조회 오류:', error)
      alert('서비스 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory, showActiveOnly])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = '/api/services'
      const method = editingService ? 'PUT' : 'POST'
      const body = editingService 
        ? { ...formData, id: editingService.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        alert(editingService ? '서비스가 수정되었습니다.' : '서비스가 등록되었습니다.')
        setShowModal(false)
        resetForm()
        fetchServices()
      } else {
        alert(data.error || '처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('서비스 저장 오류:', error)
      alert('서비스 저장에 실패했습니다.')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      service_code: service.service_code,
      name: service.name,
      category: service.category,
      price: service.price,
      tax_type: service.tax_type,
      duration_minutes: service.duration_minutes,
      description: service.description || '',
      is_active: service.is_active,
      sort_order: service.sort_order,
      custom_data: service.custom_data || {}
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('서비스를 비활성화하시겠습니까?')) return

    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        alert('서비스가 비활성화되었습니다.')
        fetchServices()
      } else {
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('서비스 삭제 오류:', error)
      alert('서비스 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      service_code: '',
      name: '',
      category: 'treatment',
      price: 0,
      tax_type: 'tax',
      duration_minutes: 30,
      description: '',
      is_active: true,
      sort_order: 0,
      custom_data: {}
    })
    setEditingService(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>서비스 관리</h1>
        <Button variant="black" onClick={openAddModal}>
          <Plus size={16} />
          서비스 등록
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="서비스명, 코드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">전체 카테고리</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
          />
          활성만 보기
        </label>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>코드</th>
                <th>서비스명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>과세</th>
                <th>소요시간</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    등록된 서비스가 없습니다.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.service_code}</td>
                    <td>{service.name}</td>
                    <td>{categoryLabels[service.category] || service.category}</td>
                    <td>{service.price.toLocaleString()}원</td>
                    <td>{taxLabels[service.tax_type]}</td>
                    <td>{service.duration_minutes}분</td>
                    <td>
                      <span className={service.is_active ? styles.active : styles.inactive}>
                        {service.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button type="button" variant="info" size="sm" onClick={() => handleEdit(service)}>
                          수정
                        </Button>
                        <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(service.id)}>
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ServiceModal
          isOpen
          onClose={() => setShowModal(false)}
          title={editingService ? '서비스 수정' : '서비스 등록'}
          submitText={editingService ? '수정' : '등록'}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          categoryLabels={categoryLabels}
        />
      )}
    </div>
  )
}

