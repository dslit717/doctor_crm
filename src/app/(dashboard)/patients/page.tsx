'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X, FileText } from 'lucide-react'
import ChartModal from '@/components/charts/ChartModal'
import SatisfactionChartModal from '@/components/charts/SatisfactionChartModal'
import styles from './patients.module.scss'

interface Patient {
  id: string
  chart_no: string
  name: string
  phone: string
  birth_date: string
  gender: string
  email?: string
  referral_source?: string
  status: string
  first_visit_date?: string
  last_visit_date?: string
  visit_count: number
  membership_grade?: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const genderLabels: Record<string, string> = {
  male: '남',
  female: '여',
  other: '기타'
}

const statusLabels: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  blacklist: '블랙리스트'
}

const referralLabels: Record<string, string> = {
  search: '인터넷 검색',
  sns: 'SNS',
  blog: '블로그',
  friend: '지인 소개',
  sign: '간판',
  revisit: '재방문',
  other: '기타'
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [pagination.page, statusFilter])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(pagination.page))
      params.append('limit', String(pagination.limit))
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/patients?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setPatients(data.data || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('환자 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchPatients()
  }

  const handleAddPatient = () => {
    setEditingPatient(null)
    setShowModal(true)
  }

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient)
    setShowModal(true)
  }

  const handleSavePatient = async (formData: Record<string, unknown>) => {
    try {
      const method = editingPatient ? 'PUT' : 'POST'
      const body = editingPatient ? { ...formData, id: editingPatient.id } : formData

      const res = await fetch('/api/patients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPatients()
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('환자 저장 오류:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleDeletePatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchPatients()
      } else {
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('환자 삭제 오류:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>환자 관리</h1>
        <button className={styles.addBtn} onClick={handleAddPatient}>
          <Plus size={18} />
          <span>환자 등록</span>
        </button>
      </div>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInput}>
            <Search size={18} />
            <input
              type="text"
              placeholder="이름, 전화번호, 차트번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.searchBtn}>검색</button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="blacklist">블랙리스트</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>차트번호</th>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>성별/나이</th>
                  <th>내원경로</th>
                  <th>최초내원</th>
                  <th>최근내원</th>
                  <th>내원횟수</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.empty}>등록된 환자가 없습니다</td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      onClick={() => handleEditPatient(patient)}
                      className={styles.clickable}
                    >
                      <td className={styles.chartNo}>{patient.chart_no}</td>
                      <td className={styles.name}>{patient.name}</td>
                      <td>{patient.phone}</td>
                      <td>{genderLabels[patient.gender] || '-'} / {calculateAge(patient.birth_date)}세</td>
                      <td>{referralLabels[patient.referral_source || ''] || patient.referral_source || '-'}</td>
                      <td>{formatDate(patient.first_visit_date)}</td>
                      <td>{formatDate(patient.last_visit_date)}</td>
                      <td>{patient.visit_count || 0}회</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[patient.status]}`}>
                          {statusLabels[patient.status] || patient.status}
                        </span>
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
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                이전
              </button>
              <span>{pagination.page} / {pagination.totalPages}</span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <PatientModal
          patient={editingPatient}
          onClose={() => setShowModal(false)}
          onSave={handleSavePatient}
          onDelete={handleDeletePatient}
        />
      )}
    </div>
  )
}

// 환자 등록/수정 모달
function PatientModal({ 
  patient, 
  onClose, 
  onSave,
  onDelete
}: { 
  patient: Patient | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const isEditMode = !!patient
  const [showChartModal, setShowChartModal] = useState(false)
  const [showChartMenu, setShowChartMenu] = useState(false)
  const [chartType, setChartType] = useState<'consultation' | 'medical' | 'care' | 'satisfaction' | null>(null)

  const [formData, setFormData] = useState({
    name: patient?.name || '',
    phone: patient?.phone || '',
    birth_date: patient?.birth_date || '',
    gender: patient?.gender || 'female',
    email: patient?.email || '',
    referral_source: patient?.referral_source || '',
    status: patient?.status || 'active',
    marketing_consent: false,
    sms_consent: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleDelete = () => {
    if (patient && confirm('정말 삭제하시겠습니까?')) {
      onDelete(patient.id)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{isEditMode ? '환자 정보' : '신규 환자 등록'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formSection}>
            <h4>기본정보</h4>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>연락처 *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>성별</label>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    여
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    남
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h4>추가정보</h4>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>생년월일</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div className={styles.formField}>
                <label>이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>내원경로</label>
                <select
                  value={formData.referral_source}
                  onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                >
                  <option value="">선택</option>
                  <option value="search">인터넷 검색</option>
                  <option value="sns">SNS</option>
                  <option value="blog">블로그</option>
                  <option value="friend">지인 소개</option>
                  <option value="sign">간판</option>
                  <option value="revisit">재방문</option>
                  <option value="other">기타</option>
                </select>
              </div>
              {isEditMode && (
                <div className={styles.formField}>
                  <label>상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="blacklist">블랙리스트</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <h4>마케팅 동의</h4>
            <div className={styles.checkboxRow}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.marketing_consent}
                  onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                />
                마케팅 정보 수신 동의
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.sms_consent}
                  onChange={(e) => setFormData({ ...formData, sms_consent: e.target.checked })}
                />
                SMS 수신 동의
              </label>
            </div>
          </div>

          <div className={styles.modalFooter}>
            {isEditMode && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    className={styles.btnChart}
                    onClick={() => setShowChartMenu(!showChartMenu)}
                  >
                    차트 입력
                  </button>
                  {showChartMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: '8px',
                      background: 'white',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      minWidth: '150px'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('consultation')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        상담 차트
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('medical')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        진료 차트
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('care')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        관리 차트
                      </button>
                      <div style={{ borderTop: '1px solid #E5E7EB', margin: '4px 0' }}></div>
                      <button
                        type="button"
                        onClick={() => {
                          setChartType('satisfaction')
                          setShowChartModal(true)
                          setShowChartMenu(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#374151',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        만족도 차트
                      </button>
                    </div>
                  )}
                </div>
                <button type="button" className={styles.btnDelete} onClick={handleDelete}>
                  삭제
                </button>
              </div>
            )}
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnCancel} onClick={onClose}>
                취소
              </button>
              <button type="submit" className={styles.btnSubmit}>
                {isEditMode ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showChartModal && chartType && (
        <>
          {chartType === 'satisfaction' ? (
            <SatisfactionChartModal
              isOpen={showChartModal}
              onClose={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
              patientId={patient?.id}
              onSave={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
            />
          ) : (
            <ChartModal
              isOpen={showChartModal}
              onClose={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
              chartType={chartType}
              patientId={patient?.id}
              onSave={() => {
                setShowChartModal(false)
                setChartType(null)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

