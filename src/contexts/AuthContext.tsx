'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { CurrentUser, UserPermission } from '@/lib/auth/types'
import { can, hasRole, hasRoleLevel, canAccessMenu } from '@/lib/auth/permissions'

interface SessionInfo {
  id: string
  loginAt: string
  lastActivityAt: string
  expiresAt: string
  isInternalIp: boolean
}

interface AuthContextType {
  user: CurrentUser | null
  session: SessionInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, otpCode?: string, twoFactorMethod?: 'otp' | 'sms') => Promise<LoginResult>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  // 권한 체크 헬퍼
  can: typeof can
  hasRole: (roleCode: string) => boolean
  hasRoleLevel: (minLevel: number) => boolean
  canAccessMenu: (menuCode: string) => boolean
  getPermission: (code: string) => UserPermission | undefined
}

interface LoginResult {
  success: boolean
  requiresTwoFactor?: boolean
  twoFactorMethod?: string
  error?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 세션 확인
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          setSession(data.session)
          return true
        }
      }
      
      setUser(null)
      setSession(null)
      return false
    } catch (error) {
      console.error('Session check failed:', error)
      setUser(null)
      setSession(null)
      return false
    }
  }, [])

  // 초기 세션 확인
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await checkSession()
      setIsLoading(false)
    }

    initAuth()
  }, [checkSession])

  // 세션 갱신 (주기적)
  useEffect(() => {
    if (!user) return

    // 5분마다 세션 활동 갱신
    const interval = setInterval(() => {
      checkSession()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, checkSession])

  // 자동 로그아웃 (장시간 미사용 시)
  useEffect(() => {
    if (!user) return

    const IDLE_TIMEOUT = 30 * 60 * 1000 // 30분
    let idleTimer: NodeJS.Timeout

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(async () => {
        console.log('[세션] 장시간 미사용으로 자동 로그아웃')
        await logout()
        window.location.href = '/login?reason=idle'
      }, IDLE_TIMEOUT)
    }

    // 사용자 활동 이벤트
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true })
    })

    // 초기 타이머 시작
    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer)
      })
    }
  }, [user])

  // 로그인
  const login = async (email: string, password: string, otpCode?: string, twoFactorMethod?: 'otp' | 'sms'): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, otpCode, twoFactorMethod }),
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        // 로그인 성공 후 세션 정보 조회
        await checkSession()
        return { success: true }
      }

      if (data.requiresTwoFactor) {
        return {
          success: false,
          requiresTwoFactor: true,
          twoFactorMethod: data.twoFactorMethod,
        }
      }

      return {
        success: false,
        error: data.error || '로그인에 실패했습니다.',
      }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
      }
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setSession(null)
    }
  }

  // 세션 갱신
  const refreshSession = async () => {
    await checkSession()
  }

  // 권한 체크 헬퍼 래퍼
  const hasRoleWrapper = (roleCode: string) => hasRole(user, roleCode)
  const hasRoleLevelWrapper = (minLevel: number) => hasRoleLevel(user, minLevel)
  const canAccessMenuWrapper = (menuCode: string) => canAccessMenu(user, menuCode)
  const getPermission = (code: string) => user?.permissions.find(p => p.code === code)

  // can 헬퍼 래핑 (user를 자동으로 주입)
  const canHelpers = {
    viewPatient: () => can.viewPatient(user),
    createPatient: () => can.createPatient(user),
    updatePatient: () => can.updatePatient(user),
    deletePatient: () => can.deletePatient(user),
    exportPatient: () => can.exportPatient(user),
    viewReservation: () => can.viewReservation(user),
    createReservation: () => can.createReservation(user),
    updateReservation: () => can.updateReservation(user),
    cancelReservation: () => can.cancelReservation(user),
    viewPayment: () => can.viewPayment(user),
    createPayment: () => can.createPayment(user),
    refundPayment: () => can.refundPayment(user),
    viewEmployee: () => can.viewEmployee(user),
    manageEmployee: () => can.manageEmployee(user),
    viewReport: () => can.viewReport(user),
    exportReport: () => can.exportReport(user),
    manageSettings: () => can.manageSettings(user),
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    can: canHelpers,
    hasRole: hasRoleWrapper,
    hasRoleLevel: hasRoleLevelWrapper,
    canAccessMenu: canAccessMenuWrapper,
    getPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 커스텀 훅
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 권한 체크 훅
export function usePermission(permissionCode: string) {
  const { user, getPermission } = useAuth()
  return {
    permission: getPermission(permissionCode),
    hasPermission: !!getPermission(permissionCode),
    canCreate: getPermission(permissionCode)?.can_create ?? false,
    canRead: getPermission(permissionCode)?.can_read ?? false,
    canUpdate: getPermission(permissionCode)?.can_update ?? false,
    canDelete: getPermission(permissionCode)?.can_delete ?? false,
    canExport: getPermission(permissionCode)?.can_export ?? false,
    dataScope: getPermission(permissionCode)?.data_scope ?? 'own',
  }
}

// 역할 체크 훅
export function useRole() {
  const { user, hasRole, hasRoleLevel } = useAuth()
  
  return {
    roles: user?.roles ?? [],
    primaryRole: user?.roles.find(r => r.code) ?? null,
    hasRole,
    hasRoleLevel,
    isDirector: hasRole('director'),
    isManager: hasRole('manager'),
    isDoctor: hasRole('doctor'),
    isCoordinator: hasRole('coordinator'),
    isCounselor: hasRole('counselor'),
  }
}

// 메뉴 접근 훅
export function useMenuAccess() {
  const { user, canAccessMenu } = useAuth()
  
  return {
    accessibleMenus: user?.accessibleMenus ?? [],
    canAccessMenu,
  }
}

