'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from '@/app/(auth)/login/login.module.scss'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'otp' | 'sms'>('sms')
  const [selectedMethod, setSelectedMethod] = useState<'otp' | 'sms'>('sms')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [idleMessage, setIdleMessage] = useState('')

  // 자동 로그아웃 안내 메시지
  useEffect(() => {
    const reason = searchParams.get('reason')
    if (reason === 'idle') {
      setIdleMessage('장시간 미사용으로 자동 로그아웃되었습니다.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(
        email, 
        password, 
        showOtp ? otpCode : undefined,
        !showOtp ? selectedMethod : undefined // 2FA 방식 전달
      )

      if (result.success) {
        router.push('/dashboard')
        return
      }

      if (result.requiresTwoFactor) {
        setShowOtp(true)
        setTwoFactorMethod(result.twoFactorMethod as 'otp' | 'sms' || selectedMethod)
        setError('')
        return
      }

      setError(result.error || '로그인에 실패했습니다.')
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 로고 */}
        <div className={styles.logo}>
          <h1>Dr.CRM</h1>
        </div>

        {/* 자동 로그아웃 안내 */}
        {idleMessage && (
          <div className={styles.warning}>
            <p>{idleMessage}</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {!showOtp ? (
            <>
              {/* 아이디 */}
              <div className={styles.inputGroup}>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="아이디 (이메일)"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 비밀번호 */}
              <div className={styles.inputGroup}>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 2FA 방식 선택 */}
              <div className={styles.twoFactorOptions}>
                <label className={selectedMethod === 'otp' ? styles.selected : ''}>
                  <input
                    type="radio"
                    name="twoFactorMethod"
                    value="otp"
                    checked={selectedMethod === 'otp'}
                    onChange={() => setSelectedMethod('otp')}
                    disabled={isLoading}
                  />
                  <span>OTP 앱</span>
                </label>
                <label className={selectedMethod === 'sms' ? styles.selected : ''}>
                  <input
                    type="radio"
                    name="twoFactorMethod"
                    value="sms"
                    checked={selectedMethod === 'sms'}
                    onChange={() => setSelectedMethod('sms')}
                    disabled={isLoading}
                  />
                  <span>SMS</span>
                </label>
              </div>

              {/* 옵션 */}
              <div className={styles.options}>
                <label className={styles.rememberMe}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>ID 저장</span>
                </label>
                <a href="/forgot-password" className={styles.forgotPassword}>
                  비밀번호를 잊으셨나요?
                </a>
              </div>
            </>
          ) : (
            <>
              {/* 2FA 안내 */}
              <div className={styles.otpGuide}>
                <p>
                  {twoFactorMethod === 'otp' && 'OTP 앱에서 인증 코드를 확인하세요'}
                  {twoFactorMethod === 'sms' && 'SMS로 전송된 인증 코드를 입력하세요'}
                </p>
                {twoFactorMethod === 'sms' && (
                  <p className={styles.devCode}>
                    테스트 코드: <strong>123456</strong>
                  </p>
                )}
              </div>

              {/* OTP 코드 */}
              <div className={`${styles.inputGroup} ${styles.otpInput}`}>
                <input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {/* 뒤로가기 */}
              <button
                type="button"
                onClick={() => {
                  setShowOtp(false)
                  setOtpCode('')
                  setError('')
                }}
                className={styles.backButton}
              >
                ← 다시 입력
              </button>
            </>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? '처리 중...' : showOtp ? '인증하기' : '로그인'}
          </button>
        </form>

        {/* 하단 안내 */}
        {!showOtp && (
          <div className={styles.footer}>
            <p>계정 문의는 관리자에게 연락하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
