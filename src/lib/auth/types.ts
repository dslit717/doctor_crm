import type { Employee, Role, Permission, Menu, DataScope, RoleCode } from '../types/database'

// 현재 사용자 정보
export interface CurrentUser {
  employee: Employee
  roles: RoleWithPermissions[]
  permissions: UserPermission[]
  accessibleMenus: Menu[]
}

// 역할 + 권한 정보
export interface RoleWithPermissions extends Role {
  permissions: PermissionWithScope[]
}

// 권한 + 데이터 스코프
export interface PermissionWithScope extends Permission {
  data_scope: DataScope
}

// 사용자 권한 (병합된)
export interface UserPermission {
  code: string
  category: string
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  can_export: boolean
  can_bulk_edit: boolean
  data_scope: DataScope
}

// 권한 체크 요청
export interface PermissionCheckRequest {
  permissionCode: string
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'bulk_edit'
}

// 세션 정보
export interface SessionInfo {
  id: string
  employeeId: string
  ipAddress: string
  userAgent: string
  isInternalIp: boolean
  loginAt: Date
  lastActivityAt: Date
  expiresAt: Date
}

// 로그인 요청
export interface LoginRequest {
  email: string
  password: string
  otpCode?: string
}

// 로그인 응답
export interface LoginResponse {
  success: boolean
  requiresTwoFactor?: boolean
  twoFactorMethod?: 'otp' | 'sms' | 'email'
  session?: SessionInfo
  user?: CurrentUser
  error?: string
}

// IP 체크 결과
export interface IpCheckResult {
  isInternal: boolean
  requiresTwoFactor: boolean
  ipAddress: string
}

// 감사 로그 기록 요청
export interface AuditLogRequest {
  actionType: string
  actionCategory: string
  actionDetail?: string
  targetTable?: string
  targetId?: string
  targetName?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

// 역할별 기본 권한 설정
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  director: [
    'patient.read', 'patient.create', 'patient.update', 'patient.delete', 'patient.export',
    'reservation.read', 'reservation.create', 'reservation.update', 'reservation.cancel',
    'payment.read', 'payment.create', 'payment.refund',
    'employee.read', 'employee.manage',
    'report.read', 'report.export',
    'settings.manage',
  ],
  vice_director: [
    'patient.read', 'patient.create', 'patient.update', 'patient.delete', 'patient.export',
    'reservation.read', 'reservation.create', 'reservation.update', 'reservation.cancel',
    'payment.read', 'payment.create', 'payment.refund',
    'employee.read', 'employee.manage',
    'report.read', 'report.export',
  ],
  manager: [
    'patient.read', 'patient.create', 'patient.update', 'patient.export',
    'reservation.read', 'reservation.create', 'reservation.update', 'reservation.cancel',
    'payment.read', 'payment.create', 'payment.refund',
    'employee.read',
    'report.read', 'report.export',
  ],
  doctor: [
    'patient.read', 'patient.update',
    'reservation.read', 'reservation.update',
    'report.read',
  ],
  coordinator: [
    'patient.read', 'patient.create', 'patient.update',
    'reservation.read', 'reservation.create', 'reservation.update', 'reservation.cancel',
    'payment.read', 'payment.create',
  ],
  counselor: [
    'patient.read', 'patient.create', 'patient.update',
    'reservation.read', 'reservation.create', 'reservation.update',
    'payment.read',
    'report.read',
  ],
  nurse: [
    'patient.read', 'patient.update',
    'reservation.read',
  ],
  therapist: [
    'patient.read',
    'reservation.read',
  ],
  staff: [
    'patient.read',
    'reservation.read',
  ],
}

// 역할별 기본 데이터 스코프
export const DEFAULT_DATA_SCOPES: Record<RoleCode, DataScope> = {
  director: 'all',
  vice_director: 'all',
  manager: 'all',
  doctor: 'department',
  coordinator: 'department',
  counselor: 'own',
  nurse: 'department',
  therapist: 'own',
  staff: 'own',
}

