'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './security.module.scss'
import Button from '@/components/ui/Button'
import { apiCall } from '@/lib/api'

type TwoFaMethod = 'otp' | 'sms' | null

interface TwoFaStatus {
  method: TwoFaMethod
  is_enabled: boolean
  created_at: string
}

export default function SecuritySettingsPage() {
  const { user } = useAuth()
  const [twoFaStatus, setTwoFaStatus] = useState<TwoFaStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [setupMode, setSetupMode] = useState<TwoFaMethod>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [secretKey, setSecretKey] = useState<string>('')
  const [verifyCode, setVerifyCode] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 2FA 상태 조회
  useEffect(() => {
    if (user?.employee?.id) {
      fetchTwoFaStatus()
    }
  }, [user?.employee?.id])

  const fetchTwoFaStatus = async () => {
    try {
      const result = await apiCall<{ twoFa: TwoFaStatus }>(`/api/auth/2fa/setup?employeeId=${user?.employee?.id}`)
      if (result.success && result.data) {
        setTwoFaStatus(result.data.twoFa)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 2FA 설정 시작
  const startSetup = async (method: TwoFaMethod) => {
    if (!method) return
    setMessage(null)
    setSetupMode(method)

    const result = await apiCall<{ qrCode?: string; secret?: string; message?: string }>('/api/auth/2fa/setup', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: user?.employee?.id,
        method,
      }),
    })

    if (result.success && result.data) {
      if (method === 'otp' && result.data.qrCode && result.data.secret) {
        setQrCode(result.data.qrCode)
        setSecretKey(result.data.secret)
      } else {
        // SMS는 바로 활성화
        setMessage({ type: 'success', text: result.data.message || '설정이 완료되었습니다.' })
        setSetupMode(null)
        fetchTwoFaStatus()
      }
    } else {
      setMessage({ type: 'error', text: result.error || '설정 중 오류가 발생했습니다.' })
      setSetupMode(null)
    }
  }

  // TOTP 검증
  const verifyTotpSetup = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setMessage({ type: 'error', text: '6자리 인증 코드를 입력하세요.' })
      return
    }

    const result = await apiCall<{ message?: string }>('/api/auth/2fa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: user?.employee?.id,
        code: verifyCode,
      }),
    })

    if (result.success && result.data) {
      setMessage({ type: 'success', text: result.data.message || '인증이 완료되었습니다.' })
      setSetupMode(null)
      setQrCode('')
      setSecretKey('')
      setVerifyCode('')
      fetchTwoFaStatus()
    } else {
      setMessage({ type: 'error', text: result.error || '검증 중 오류가 발생했습니다.' })
    }
  }

  // 2FA 비활성화
  const disableTwoFa = async () => {
    if (!confirm('2FA를 비활성화하시겠습니까? 보안 수준이 낮아질 수 있습니다.')) {
      return
    }

    const result = await apiCall<{ message?: string }>('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: user?.employee?.id,
      }),
    })

    if (result.success && result.data) {
      setMessage({ type: 'success', text: result.data.message || '비활성화되었습니다.' })
      setTwoFaStatus(null)
    } else {
      setMessage({ type: 'error', text: result.error || '비활성화 중 오류가 발생했습니다.' })
    }
  }

  const cancelSetup = () => {
    setSetupMode(null)
    setQrCode('')
    setSecretKey('')
    setVerifyCode('')
    setMessage(null)
  }

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>
  }

  return (
    <div className={styles.container}>
      <h1>보안 설정</h1>
      <p className={styles.subtitle}>2차 인증(2FA)을 설정하여 계정 보안을 강화하세요.</p>

      {/* 메시지 */}
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* 현재 2FA 상태 */}
      <section className={styles.section}>
        <h2>2차 인증 상태</h2>
        
        {twoFaStatus?.is_enabled ? (
          <div className={styles.statusCard}>
            <div className={styles.statusEnabled}>
              <span className={styles.statusIcon}>✓</span>
              <span>활성화됨</span>
            </div>
            <div className={styles.statusInfo}>
              <p>인증 방식: <strong>{getMethodLabel(twoFaStatus.method)}</strong></p>
              <p>설정일: {new Date(twoFaStatus.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
            <Button variant="danger" size="sm" onClick={disableTwoFa}>
              비활성화
            </Button>
          </div>
        ) : (
          <div className={styles.statusCard}>
            <div className={styles.statusDisabled}>
              <span className={styles.statusIcon}>✗</span>
              <span>비활성화됨</span>
            </div>
            <p className={styles.warning}>
              외부 네트워크에서 접속 시 2FA가 없으면 로그인이 제한될 수 있습니다.
            </p>
          </div>
        )}
      </section>

      {/* 2FA 설정 옵션 (비활성화 상태일 때만) */}
      {!twoFaStatus?.is_enabled && !setupMode && (
        <section className={styles.section}>
          <h2>인증 방식 선택</h2>
          <div className={styles.methodGrid}>
            <div className={styles.methodCard} onClick={() => startSetup('otp')}>
              <div className={styles.methodIcon}>🔐</div>
              <h3>OTP 앱</h3>
              <p>Google Authenticator, Authy 등</p>
              <span className={styles.badge}>추천</span>
            </div>
            <div className={styles.methodCard} onClick={() => startSetup('sms')}>
              <div className={styles.methodIcon}>📱</div>
              <h3>SMS</h3>
              <p>등록된 휴대폰으로 인증 코드</p>
            </div>
          </div>
        </section>
      )}

      {/* TOTP 설정 화면 */}
      {setupMode === 'otp' && qrCode && (
        <section className={styles.section}>
          <h2>OTP 앱 설정</h2>
          <div className={styles.otpSetup}>
            <div className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <p>Google Authenticator 또는 Authy 앱을 설치하세요.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <p>아래 QR 코드를 앱으로 스캔하세요.</p>
            </div>
            
            <div className={styles.qrContainer}>
              <img src={qrCode} alt="QR Code" className={styles.qrCode} />
            </div>

            <div className={styles.secretKey}>
              <p>수동 입력 키:</p>
              <code>{secretKey}</code>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <p>앱에 표시된 6자리 코드를 입력하세요.</p>
            </div>

            <div className={styles.verifyInput}>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
              />
              <Button variant="primary" size="sm" onClick={verifyTotpSetup}>
                확인
              </Button>
            </div>

            <Button variant="secondary" size="sm" onClick={cancelSetup}>
              취소
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

function getMethodLabel(method: TwoFaMethod): string {
  switch (method) {
    case 'otp':
      return 'OTP 앱 (Google Authenticator)'
    case 'sms':
      return 'SMS 문자'
    default:
      return '없음'
  }
}

