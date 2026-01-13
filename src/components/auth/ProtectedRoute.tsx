'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './auth.module.scss'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredRole?: string
  requiredLevel?: number
  fallbackUrl?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  requiredLevel,
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, hasRole, hasRoleLevel, getPermission } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // 인증되지 않은 경우
    if (!isAuthenticated) {
      router.push(fallbackUrl)
      return
    }

    // 권한 체크
    if (requiredPermission && !getPermission(requiredPermission)) {
      router.push('/unauthorized')
      return
    }

    // 역할 체크
    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized')
      return
    }

    // 레벨 체크
    if (requiredLevel && !hasRoleLevel(requiredLevel)) {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, isLoading, requiredPermission, requiredRole, requiredLevel, router, fallbackUrl, hasRole, hasRoleLevel, getPermission])

  // 로딩 중
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우 (리다이렉트 대기)
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

// 권한 체크 래퍼 컴포넌트
interface PermissionGateProps {
  children: React.ReactNode
  permission: string
  action?: 'create' | 'read' | 'update' | 'delete' | 'export'
  fallback?: React.ReactNode
}

export function PermissionGate({
  children,
  permission,
  action = 'read',
  fallback = null,
}: PermissionGateProps) {
  const { getPermission } = useAuth()
  
  const userPermission = getPermission(permission)
  if (!userPermission) return <>{fallback}</>

  let hasAccess = false
  switch (action) {
    case 'create':
      hasAccess = userPermission.can_create
      break
    case 'read':
      hasAccess = userPermission.can_read
      break
    case 'update':
      hasAccess = userPermission.can_update
      break
    case 'delete':
      hasAccess = userPermission.can_delete
      break
    case 'export':
      hasAccess = userPermission.can_export
      break
  }

  if (!hasAccess) return <>{fallback}</>

  return <>{children}</>
}

// 역할 체크 래퍼 컴포넌트
interface RoleGateProps {
  children: React.ReactNode
  role?: string
  roles?: string[]
  minLevel?: number
  fallback?: React.ReactNode
}

export function RoleGate({
  children,
  role,
  roles,
  minLevel,
  fallback = null,
}: RoleGateProps) {
  const { hasRole, hasRoleLevel } = useAuth()

  if (role && !hasRole(role)) return <>{fallback}</>
  if (roles && !roles.some(r => hasRole(r))) return <>{fallback}</>
  if (minLevel && !hasRoleLevel(minLevel)) return <>{fallback}</>

  return <>{children}</>
}
