'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './hr.module.scss'
import { apiCall } from '@/lib/api'

interface Employee {
  id: string
  employee_no: string
  name: string
  email: string
  phone: string
  position: string
  department?: { name: string }
  status: string
  hire_date: string
}

interface Leave {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
  reason: string
  status: string
  employee?: { name: string }
}

const leaveTypeLabels: Record<string, string> = {
  annual: '연차',
  sick: '병가',
  personal: '개인휴가',
  half_day_am: '오전반차',
  half_day_pm: '오후반차',
  substitute: '대체휴무',
}

const statusLabels: Record<string, string> = {
  pending: '대기중',
  approved: '승인',
  rejected: '반려',
}

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'leaves'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'employees') {
        const result = await apiCall('/api/employees')
        if (result.success && result.data) setEmployees(result.data)
      } else {
        const result = await apiCall('/api/hr/leaves')
        if (result.success && result.data) setLeaves(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    const result = await apiCall('/api/hr/leaves', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    })
    if (result.success) {
      fetchData()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>인사관리</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'employees' ? styles.active : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          직원 목록
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'leaves' ? styles.active : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          휴가 관리
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>로딩중...</div>
      ) : activeTab === 'employees' ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>사번</th>
                <th>이름</th>
                <th>직책</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>입사일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={7} className={styles.empty}>등록된 직원이 없습니다</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.employee_no}</td>
                    <td>{emp.name}</td>
                    <td>{emp.position || '-'}</td>
                    <td>{emp.email || '-'}</td>
                    <td>{emp.phone || '-'}</td>
                    <td>{emp.hire_date || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[emp.status]}`}>
                        {emp.status === 'active' ? '재직' : '퇴직'}
                      </span>
                    </td>
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
                <th>신청자</th>
                <th>유형</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>일수</th>
                <th>사유</th>
                <th>상태</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>휴가 신청 내역이 없습니다</td></tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.employee?.name || '-'}</td>
                    <td>{leaveTypeLabels[leave.leave_type] || leave.leave_type}</td>
                    <td>{leave.start_date}</td>
                    <td>{leave.end_date}</td>
                    <td>{leave.days}일</td>
                    <td>{leave.reason || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[leave.status]}`}>
                        {statusLabels[leave.status] || leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'pending' && (
                        <div className={styles.actions}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleLeaveAction(leave.id, 'approved')}
                          >
                            승인
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleLeaveAction(leave.id, 'rejected')}
                          >
                            반려
                          </button>
                        </div>
                      )}
                    </td>
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

