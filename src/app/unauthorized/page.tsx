'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from '@/components/auth/auth.module.scss'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className={styles.unauthorizedContainer}>
      <div className={styles.unauthorizedContent}>
        {/* 아이콘 */}
        <div className={styles.iconWrapper}>
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 메시지 */}
        <h1 className={styles.title}>접근 권한 없음</h1>
        <p className={styles.description}>
          해당 페이지에 접근할 수 있는 권한이 없습니다.
          <br />
          필요한 권한이 있다면 관리자에게 문의하세요.
        </p>

        {/* 버튼 */}
        <div className={styles.buttonGroup}>
          <button onClick={handleGoBack} className={`${styles.button} ${styles.secondary}`}>
            이전 페이지로
          </button>
          {isAuthenticated && (
            <>
              <button onClick={handleGoHome} className={`${styles.button} ${styles.primary}`}>
                대시보드로 이동
              </button>
              <button onClick={handleLogout} className={`${styles.button} ${styles.danger}`}>
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
