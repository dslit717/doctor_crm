'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Calendar, Package, Clock, Edit, FileText, Bell } from 'lucide-react'
import styles from './patient-services.module.scss'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ServiceModal from './components/ServiceModal'
import UsageModal from './components/UsageModal'
import ModifyModal from './components/ModifyModal'
import ReportModal from './components/ReportModal'
import NotificationModal from './components/NotificationModal'
import type { PatientService } from './types'
import { apiCall } from '@/lib/api'

const statusLabels: Record<string, string> = {
  active: '활성',
  expired: '만료',
  completed: '완료',
  cancelled: '취소'
}

const statusColors: Record<string, string> = {
  active: 'success',
  expired: 'warning',
  completed: 'info',
  cancelled: 'disabled'
}

export default function PatientServicesPage() {
  const [services, setServices] = useState<PatientService[]>([])
  const [loading, setLoading] = useState(true)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [selectedService, setSelectedService] = useState<PatientService | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (patientSearch) {
        // 환자 검색은 API에서 지원하지 않으므로 클라이언트에서 필터링
      }

      const result = await apiCall<PatientService[]>(`/api/patient-services?${params}`)
      if (result.success && result.data) {
        let filtered = result.data
        // 환자 이름/차트번호로 필터링
        if (patientSearch) {
          filtered = filtered.filter(s => 
            s.patient?.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
            s.patient?.chart_no?.includes(patientSearch)
          )
        }
        setServices(filtered)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, patientSearch])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleAddService = () => {
    setSelectedService(null)
    setShowServiceModal(true)
  }

  const handleEditService = (service: PatientService) => {
    setSelectedService(service)
    setShowServiceModal(true)
  }

  const handleUseSession = (service: PatientService) => {
    setSelectedService(service)
    setShowUsageModal(true)
  }

  const handleSaveService = async (formData: Record<string, unknown>) => {
    const method = selectedService ? 'PUT' : 'POST'
    const body = selectedService 
      ? { ...formData, id: selectedService.id }
      : formData

    const result = await apiCall('/api/patient-services', {
      method,
      body: JSON.stringify(body)
    })

    if (result.success) {
      setShowServiceModal(false)
      setSelectedService(null)
      fetchServices()
    }
  }

  const handleUseSessionSave = async (formData: Record<string, unknown>) => {
    const result = await apiCall('/api/patient-services', {
      method: 'PUT',
      body: JSON.stringify({
        patient_service_id: selectedService?.id,
        ...formData
      })
    })

    if (result.success) {
      setShowUsageModal(false)
      fetchServices()
    }
  }

  const handleModify = (service: PatientService) => {
    setSelectedService(service)
    setShowModifyModal(true)
  }

  const handleModifySave = () => {
    setShowModifyModal(false)
    fetchServices()
  }

  const handleCheckAlerts = () => {
    setShowAlertsModal(true)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>서비스 이행 관리</h1>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={handleCheckAlerts}>
            <Bell size={18} />
            <span>알림 확인</span>
          </Button>
          <Button variant="secondary" onClick={() => setShowReportModal(true)}>
            <FileText size={18} />
            <span>리포트</span>
          </Button>
          <Button variant="black" onClick={handleAddService}>
            <Plus size={18} />
            <span>서비스 등록</span>
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.searchForm} onSubmit={(e) => { e.preventDefault(); }}>
          <div className={styles.searchInput}>
            <Search size={18} />
            <input
              type="text"
              placeholder="환자 이름, 차트번호 검색"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="expired">만료</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>환자</th>
                <th>서비스명</th>
                <th>회차</th>
                <th>유효기간</th>
                <th>구매금액</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    등록된 서비스가 없습니다
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const expiring = isExpiringSoon(service.expiry_date)
                  const expired = isExpired(service.expiry_date)
                  
                  return (
                    <tr
                      key={service.id}
                      className={`
                        ${expiring ? styles.expiring : ''}
                        ${expired && service.status === 'active' ? styles.expired : ''}
                      `}
                    >
                      <td>
                        <div className={styles.patientInfo}>
                          <div className={styles.patientName}>{service.patient?.name || '-'}</div>
                          <div className={styles.chartNo}>{service.patient?.chart_no || '-'}</div>
                        </div>
                      </td>
                      <td className={styles.serviceName}>{service.service_name}</td>
                      <td>
                        <div className={styles.sessions}>
                          <span className={styles.used}>{service.used_sessions}</span>
                          <span>/</span>
                          <span className={styles.total}>{service.total_sessions}</span>
                          <span className={styles.remaining}>
                            (잔여: {service.remaining_sessions})
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.expiry}>
                          {service.expiry_date ? (
                            <>
                              <Calendar size={14} />
                              <span>{formatDate(service.expiry_date)}</span>
                              {expired && <span className={styles.expiredBadge}>만료</span>}
                              {expiring && !expired && (
                                <span className={styles.expiringBadge}>임박</span>
                              )}
                            </>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.price}>
                        {new Intl.NumberFormat('ko-KR').format(service.total_price || 0)}원
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[statusColors[service.status]]}`}>
                          {statusLabels[service.status] || service.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {service.status === 'active' && service.remaining_sessions > 0 && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleUseSession(service)}
                            >
                              회차 사용
                            </Button>
                          )}
                          {service.status === 'active' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleModify(service)}
                            >
                              <Edit size={14} />
                              변경
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditService(service)}
                          >
                            상세
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showServiceModal && (
        <ServiceModal
          service={selectedService}
          onClose={() => setShowServiceModal(false)}
          onSave={handleSaveService}
        />
      )}

      {showUsageModal && selectedService && (
        <UsageModal
          service={selectedService}
          onClose={() => setShowUsageModal(false)}
          onSave={handleUseSessionSave}
        />
      )}

      {showModifyModal && selectedService && (
        <ModifyModal
          service={selectedService}
          onClose={() => setShowModifyModal(false)}
          onSave={handleModifySave}
        />
      )}

      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showAlertsModal && (
        <NotificationModal
          onClose={() => setShowAlertsModal(false)}
        />
      )}
    </div>
  )
}

