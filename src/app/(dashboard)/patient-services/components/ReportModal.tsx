'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '../patient-services.module.scss'
import { apiCall } from '@/lib/api'

type ReportType = 'summary' | 'patient' | 'service' | 'unused' | 'revenue' | 'staff'

export default function ReportModal({
  patientId,
  onClose
}: {
  patientId?: string
  onClose: () => void
}) {
  const [reportType, setReportType] = useState<ReportType>(patientId ? 'patient' : 'summary')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    if (patientId) {
      setReportType('patient')
    }
  }, [patientId])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('type', reportType)
      if (patientId) params.append('patient_id', patientId)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const result = await apiCall(`/api/patient-services/report?${params}`)
      if (result.success) {
        setReportData(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [reportType, patientId, startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="서비스 이행 리포트"
      size="lg"
      closeOnOverlayClick={false}
      footer={
        <div className="footer-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div className={styles.reportContainer}>
        <div className={styles.reportFilters}>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className={styles.filterSelect}
          >
            <option value="summary">요약 통계</option>
            <option value="patient">환자별 현황</option>
            <option value="service">서비스별 통계</option>
            <option value="unused">미소진 분석</option>
            <option value="revenue">매출 인식</option>
            <option value="staff">직원별 이행</option>
          </select>

          {reportType !== 'summary' && reportType !== 'patient' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="시작일"
                className={styles.dateInput}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="종료일"
                className={styles.dateInput}
              />
            </>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <div className={styles.reportContent}>
            {reportType === 'summary' && reportData && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>전체 서비스</div>
                  <div className={styles.statValue}>{formatNumber(reportData.total)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>활성</div>
                  <div className={styles.statValue}>{formatNumber(reportData.active)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>완료</div>
                  <div className={styles.statValue}>{formatNumber(reportData.completed)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>만료</div>
                  <div className={styles.statValue}>{formatNumber(reportData.expired)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>총 회차</div>
                  <div className={styles.statValue}>{formatNumber(reportData.totalSessions)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>사용 회차</div>
                  <div className={styles.statValue}>{formatNumber(reportData.usedSessions)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>잔여 회차</div>
                  <div className={styles.statValue}>{formatNumber(reportData.remainingSessions)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>평균 사용률</div>
                  <div className={styles.statValue}>
                    {reportData.avgUsageRate ? reportData.avgUsageRate.toFixed(1) : '0.0'}%
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>총 매출</div>
                  <div className={styles.statValue}>{formatNumber(reportData.totalAmount)}원</div>
                </div>
              </div>
            )}

            {reportType === 'service' && reportData?.serviceStats && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>서비스명</th>
                      <th>건수</th>
                      <th>총 회차</th>
                      <th>사용 회차</th>
                      <th>잔여 회차</th>
                      <th>평균 사용률</th>
                      <th>총 매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.serviceStats.map((stat: any, idx: number) => (
                      <tr key={idx}>
                        <td>{stat.service_name}</td>
                        <td>{formatNumber(stat.count)}</td>
                        <td>{formatNumber(stat.totalSessions)}</td>
                        <td>{formatNumber(stat.usedSessions)}</td>
                        <td>{formatNumber(stat.remainingSessions)}</td>
                        <td>{stat.avgUsageRate ? stat.avgUsageRate.toFixed(1) : '0.0'}%</td>
                        <td>{formatNumber(stat.totalAmount)}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'unused' && reportData && (
              <div>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>만료된 서비스</div>
                    <div className={styles.statValue}>{formatNumber(reportData.expired)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>임박 서비스</div>
                    <div className={styles.statValue}>{formatNumber(reportData.expiring)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>잔여 1-2회</div>
                    <div className={styles.statValue}>{formatNumber(reportData.lowRemaining)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>미사용 서비스</div>
                    <div className={styles.statValue}>{formatNumber(reportData.unused)}</div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'revenue' && reportData && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>선수금</div>
                  <div className={styles.statValue}>{formatNumber(reportData.prepaid)}원</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>실현 매출</div>
                  <div className={styles.statValue}>{formatNumber(reportData.realized)}원</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>미실현 매출</div>
                  <div className={styles.statValue}>{formatNumber(reportData.unrealized)}원</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>실현률</div>
                  <div className={styles.statValue}>
                    {reportData.realizationRate ? reportData.realizationRate.toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>
            )}

            {reportType === 'patient' && reportData && (
              <div>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>전체 서비스</div>
                    <div className={styles.statValue}>{formatNumber(reportData.stats?.total || 0)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>활성</div>
                    <div className={styles.statValue}>{formatNumber(reportData.stats?.active || 0)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>완료</div>
                    <div className={styles.statValue}>{formatNumber(reportData.stats?.completed || 0)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>총 회차</div>
                    <div className={styles.statValue}>{formatNumber(reportData.stats?.totalSessions || 0)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>사용 회차</div>
                    <div className={styles.statValue}>{formatNumber(reportData.stats?.usedSessions || 0)}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>잔여 회차</div>
                    <div className={styles.statValue}>{formatNumber(reportData.stats?.remainingSessions || 0)}</div>
                  </div>
                </div>
                {reportData.services && reportData.services.length > 0 && (
                  <div className={styles.tableWrapper} style={{ marginTop: '24px' }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>서비스명</th>
                          <th>회차</th>
                          <th>유효기간</th>
                          <th>구매금액</th>
                          <th>상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.services.map((svc: any) => (
                          <tr key={svc.id}>
                            <td>{svc.service_name}</td>
                            <td>
                              {svc.used_sessions} / {svc.total_sessions} (잔여: {svc.remaining_sessions})
                            </td>
                            <td>{svc.expiry_date ? new Date(svc.expiry_date).toLocaleDateString('ko-KR') : '-'}</td>
                            <td>{formatNumber(svc.total_price || 0)}원</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[svc.status]}`}>
                                {svc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {reportType === 'staff' && reportData?.staffStats && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>직원 ID</th>
                      <th>이행 건수</th>
                      <th>서비스 수</th>
                      <th>총 매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.staffStats.map((stat: any, idx: number) => (
                      <tr key={idx}>
                        <td>{stat.staff_id}</td>
                        <td>{formatNumber(stat.count)}</td>
                        <td>{stat.services.length}</td>
                        <td>{formatNumber(stat.totalAmount)}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

