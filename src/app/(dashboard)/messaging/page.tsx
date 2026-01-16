'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Send, History, FileText } from 'lucide-react'
import styles from './messaging.module.scss'
import Button from '@/components/ui/Button'
import MessageTemplateModal from './components/MessageTemplateModal'
import type { MessageTemplate, MessageTemplateFormData, NotificationLog } from './types'
import { apiCall } from '@/lib/api'

const categoryLabels: Record<string, string> = {
  reservation: '예약',
  reminder: '리마인드',
  treatment: '시술',
  payment: '결제',
  marketing: '마케팅',
  other: '기타'
}

const channelLabels: Record<string, string> = {
  sms: 'SMS',
  lms: 'LMS',
  mms: 'MMS'
}

const statusLabels: Record<string, string> = {
  sent: '발송완료',
  failed: '발송실패'
}

export default function MessagingPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [history, setHistory] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState<MessageTemplateFormData>({
    name: '',
    template_code: '',
    category: 'other',
    channel: 'sms',
    content: '',
    is_active: true
  })
  const [historyFilters, setHistoryFilters] = useState({
    status: '',
    channel: '',
    start_date: '',
    end_date: ''
  })
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates()
    } else {
      fetchHistory()
    }
  }, [activeTab, historyFilters, historyPagination.page])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const result = await apiCall<MessageTemplate[]>('/api/messaging/templates?include_inactive=true')
      if (result.success && result.data) {
        setTemplates(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(historyPagination.page))
      params.append('limit', String(historyPagination.limit))
      if (historyFilters.status) params.append('status', historyFilters.status)
      if (historyFilters.channel) params.append('channel', historyFilters.channel)
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date)
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date)

      const result = await apiCall<{ data: NotificationLog[]; pagination: typeof historyPagination }>(`/api/messaging/history?${params}`)
      if (result.success && result.data) {
        setHistory(result.data.data || [])
        setHistoryPagination(result.data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = '/api/messaging/templates'
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

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      template_code: template.template_code,
      category: template.category || 'other',
      channel: template.channel,
      content: template.content,
      is_active: template.is_active
    })
    setShowTemplateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('템플릿을 비활성화하시겠습니까?')) return

    const result = await apiCall(`/api/messaging/templates?id=${id}`, { method: 'DELETE' })
    if (result.success) {
      alert('템플릿이 비활성화되었습니다.')
      fetchTemplates()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      template_code: '',
      category: 'other',
      channel: 'sms',
      content: '',
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
        <h1>메시지 관리</h1>
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
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          발송 이력
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
                    <th>템플릿 코드</th>
                    <th>카테고리</th>
                    <th>채널</th>
                    <th>내용 미리보기</th>
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
                        <td className={styles.code}>{template.template_code}</td>
                        <td>{categoryLabels[template.category || 'other'] || template.category}</td>
                        <td>{channelLabels[template.channel]}</td>
                        <td className={styles.preview}>
                          {template.content.length > 50 
                            ? `${template.content.substring(0, 50)}...` 
                            : template.content}
                        </td>
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
              value={historyFilters.status}
              onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="">전체 상태</option>
              <option value="sent">발송완료</option>
              <option value="failed">발송실패</option>
            </select>
            <select
              value={historyFilters.channel}
              onChange={(e) => setHistoryFilters({ ...historyFilters, channel: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="">전체 채널</option>
              <option value="sms">SMS</option>
              <option value="lms">LMS</option>
              <option value="mms">MMS</option>
            </select>
            <input
              type="date"
              value={historyFilters.start_date}
              onChange={(e) => setHistoryFilters({ ...historyFilters, start_date: e.target.value })}
              className={styles.dateInput}
              placeholder="시작일"
            />
            <input
              type="date"
              value={historyFilters.end_date}
              onChange={(e) => setHistoryFilters({ ...historyFilters, end_date: e.target.value })}
              className={styles.dateInput}
              placeholder="종료일"
            />
            <button 
              onClick={() => {
                setHistoryFilters({ status: '', channel: '', start_date: '', end_date: '' })
                setHistoryPagination({ ...historyPagination, page: 1 })
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
                      <th>발송일시</th>
                      <th>수신자</th>
                      <th>환자명</th>
                      <th>채널</th>
                      <th>내용</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.empty}>
                          발송 이력이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      history.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.sent_at).toLocaleString('ko-KR')}</td>
                          <td>{log.recipient}</td>
                          <td>{log.patient?.name || '-'}</td>
                          <td>{channelLabels[log.channel] || log.channel}</td>
                          <td className={styles.preview}>
                            {log.content.length > 50 
                              ? `${log.content.substring(0, 50)}...` 
                              : log.content}
                          </td>
                          <td>
                            <span className={log.status === 'sent' ? styles.sent : styles.failed}>
                              {statusLabels[log.status]}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {historyPagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    disabled={historyPagination.page === 1}
                    onClick={() => setHistoryPagination({ ...historyPagination, page: historyPagination.page - 1 })}
                  >
                    이전
                  </button>
                  <span>{historyPagination.page} / {historyPagination.totalPages}</span>
                  <button
                    disabled={historyPagination.page === historyPagination.totalPages}
                    onClick={() => setHistoryPagination({ ...historyPagination, page: historyPagination.page + 1 })}
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
        <MessageTemplateModal
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

