'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, X, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import styles from './consents.module.scss'
import Button from '@/components/ui/Button'
import ConsentTemplateModal from './components/ConsentTemplateModal'
import { apiCall } from '@/lib/api'

interface ConsentTemplate {
  id: string
  name: string
  category: string
  content: string
  is_required: boolean
  validity_days: number | null
  version: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

interface PatientConsent {
  id: string
  patient_id: string
  template_id: string
  template_version: number
  status: 'active' | 'expired' | 'revoked'
  signed_at: string
  expires_at: string | null
  revoked_at: string | null
  patient?: {
    id: string
    name: string
    chart_no: string
  }
  template?: {
    id: string
    name: string
    category: string
    is_required: boolean
  }
}

const categoryLabels: Record<string, string> = {
  personal_info: '개인정보',
  marketing: '마케팅',
  photography: '촬영',
  treatment: '시술',
  anesthesia: '마취',
  surgery: '수술',
  other: '기타'
}

const statusLabels: Record<string, string> = {
  active: '유효',
  expired: '만료',
  revoked: '철회'
}

export default function ConsentsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'status'>('templates')
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])
  const [consents, setConsents] = useState<PatientConsent[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ConsentTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    content: '',
    is_required: false,
    validity_days: null as number | null,
    version: 1,
    is_active: true
  })
  const [statusFilters, setStatusFilters] = useState({
    status: '',
    template_id: '',
    patient_id: ''
  })
  const [statusPagination, setStatusPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiCall<ConsentTemplate[]>('/api/consents/templates?include_inactive=true')
      if (result.success && result.data) {
        setTemplates(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchConsents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(statusPagination.page))
      params.append('limit', String(statusPagination.limit))
      if (statusFilters.status) params.append('status', statusFilters.status)
      if (statusFilters.template_id) params.append('template_id', statusFilters.template_id)
      if (statusFilters.patient_id) params.append('patient_id', statusFilters.patient_id)

      const result = await apiCall<{ data: PatientConsent[]; pagination: typeof statusPagination }>(`/api/consents/status?${params}`)
      if (result.success && result.data) {
        setConsents(result.data.data || [])
        setStatusPagination(result.data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilters, statusPagination.page])

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates()
    } else {
      fetchConsents()
    }
  }, [activeTab, fetchTemplates, fetchConsents])

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = '/api/consents/templates'
    const method = editingTemplate ? 'PUT' : 'POST'
    const body = editingTemplate 
      ? { ...formData, id: editingTemplate.id }
      : formData

    const result = await apiCall(url, {
      method,
      body: JSON.stringify(body)
    })

    if (result.success) {
      alert(editingTemplate ? '템플릿이 수정되었습니다.' : '템플릿이 등록되었습니다.')
      setShowTemplateModal(false)
      resetForm()
      fetchTemplates()
    }
  }

  const handleEdit = (template: ConsentTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      is_required: template.is_required,
      validity_days: template.validity_days,
      version: template.version,
      is_active: template.is_active
    })
    setShowTemplateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('템플릿을 비활성화하시겠습니까?')) return

    const result = await apiCall(`/api/consents/templates?id=${id}`, { method: 'DELETE' })
    if (result.success) {
      alert('템플릿이 비활성화되었습니다.')
      fetchTemplates()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      content: '',
      is_required: false,
      validity_days: null,
      version: 1,
      is_active: true
    })
    setEditingTemplate(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowTemplateModal(true)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>동의서 관리</h1>
        {activeTab === 'templates' && (
          <Button variant="black" onClick={openAddModal}>
            <Plus size={16} />
            템플릿 등록
          </Button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'templates' ? styles.active : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          템플릿 관리
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'status' ? styles.active : ''}`}
          onClick={() => setActiveTab('status')}
        >
          서명 현황
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>

          {loading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>템플릿명</th>
                    <th>카테고리</th>
                    <th>필수여부</th>
                    <th>유효기간</th>
                    <th>버전</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        등록된 템플릿이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{categoryLabels[template.category] || template.category}</td>
                        <td>
                          {template.is_required ? (
                            <span className={styles.required}>필수</span>
                          ) : (
                            <span className={styles.optional}>선택</span>
                          )}
                        </td>
                        <td>{template.validity_days ? `${template.validity_days}일` : '무제한'}</td>
                        <td>v{template.version}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${template.is_active ? styles.active : styles.inactive}`}>
                            {template.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Button type="button" variant="info" size="sm" onClick={() => handleEdit(template)}>
                              수정
                            </Button>
                            <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(template.id)}>
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
        </>
      ) : (
        <>
          <div className={styles.filters}>
            <select
              value={statusFilters.status}
              onChange={(e) => setStatusFilters({ ...statusFilters, status: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="">전체 상태</option>
              <option value="active">유효</option>
              <option value="expired">만료</option>
              <option value="revoked">철회</option>
            </select>
            <input
              type="text"
              value={statusFilters.patient_id}
              onChange={(e) => setStatusFilters({ ...statusFilters, patient_id: e.target.value })}
              className={styles.filterInput}
              placeholder="환자 ID"
            />
            <button 
              onClick={() => {
                setStatusFilters({ status: '', template_id: '', patient_id: '' })
                setStatusPagination({ ...statusPagination, page: 1 })
              }}
              className={styles.resetBtn}
            >
              초기화
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>서명일시</th>
                      <th>환자명</th>
                      <th>차트번호</th>
                      <th>템플릿명</th>
                      <th>카테고리</th>
                      <th>상태</th>
                      <th>만료일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.empty}>
                          서명 이력이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      consents.map((consent) => (
                        <tr key={consent.id}>
                          <td>{new Date(consent.signed_at).toLocaleString('ko-KR')}</td>
                          <td>{consent.patient?.name || '-'}</td>
                          <td>{consent.patient?.chart_no || '-'}</td>
                          <td>{consent.template?.name || '-'}</td>
                          <td>{consent.template ? categoryLabels[consent.template.category] || consent.template.category : '-'}</td>
                          <td>
                            <span className={styles[consent.status]}>
                              {statusLabels[consent.status]}
                            </span>
                          </td>
                          <td>
                            {consent.expires_at 
                              ? new Date(consent.expires_at).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {statusPagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    disabled={statusPagination.page === 1}
                    onClick={() => setStatusPagination({ ...statusPagination, page: statusPagination.page - 1 })}
                  >
                    이전
                  </button>
                  <span>{statusPagination.page} / {statusPagination.totalPages}</span>
                  <button
                    disabled={statusPagination.page === statusPagination.totalPages}
                    onClick={() => setStatusPagination({ ...statusPagination, page: statusPagination.page + 1 })}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showTemplateModal && (
        <ConsentTemplateModal
          isOpen
          onClose={() => setShowTemplateModal(false)}
          title={editingTemplate ? '템플릿 수정' : '템플릿 등록'}
          categoryOptions={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmitTemplate}
          submitText={editingTemplate ? '수정' : '등록'}
        />
      )}
    </div>
  )
}

