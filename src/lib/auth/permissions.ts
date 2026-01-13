import type { 
  CurrentUser, 
  UserPermission, 
  PermissionCheckRequest,
  PermissionWithScope,
  RoleWithPermissions,
} from './types'
import type { DataScope } from '../types/database'

/**
 * 여러 역할의 권한을 병합하여 최종 권한 목록 생성
 * - 같은 권한이 여러 역할에 있으면 OR 연산으로 병합
 * - 데이터 스코프는 가장 넓은 범위 적용 (all > department > own)
 */
export function mergePermissions(roles: RoleWithPermissions[]): UserPermission[] {
  const permissionMap = new Map<string, UserPermission>()

  for (const role of roles) {
    for (const permission of role.permissions) {
      const existing = permissionMap.get(permission.code)
      
      if (existing) {
        // 기존 권한과 병합 (OR 연산)
        existing.can_create = existing.can_create || !!permission.can_create
        existing.can_read = existing.can_read || !!permission.can_read
        existing.can_update = existing.can_update || !!permission.can_update
        existing.can_delete = existing.can_delete || !!permission.can_delete
        existing.can_export = existing.can_export || !!permission.can_export
        existing.can_bulk_edit = existing.can_bulk_edit || !!permission.can_bulk_edit
        existing.data_scope = getWiderScope(existing.data_scope, permission.data_scope)
      } else {
        // 새 권한 추가
        permissionMap.set(permission.code, {
          code: permission.code,
          category: permission.category,
          can_create: !!permission.can_create,
          can_read: !!permission.can_read,
          can_update: !!permission.can_update,
          can_delete: !!permission.can_delete,
          can_export: !!permission.can_export,
          can_bulk_edit: !!permission.can_bulk_edit,
          data_scope: permission.data_scope,
        })
      }
    }
  }

  return Array.from(permissionMap.values())
}

/**
 * 두 데이터 스코프 중 더 넓은 범위 반환
 */
function getWiderScope(scope1: DataScope, scope2: DataScope): DataScope {
  const scopeOrder: DataScope[] = ['own', 'department', 'all']
  const index1 = scopeOrder.indexOf(scope1)
  const index2 = scopeOrder.indexOf(scope2)
  return index1 > index2 ? scope1 : scope2
}

/**
 * 특정 권한 체크
 */
export function hasPermission(
  user: CurrentUser | null,
  request: PermissionCheckRequest
): boolean {
  if (!user) return false

  const permission = user.permissions.find(p => p.code === request.permissionCode)
  if (!permission) return false

  switch (request.action) {
    case 'create':
      return permission.can_create
    case 'read':
      return permission.can_read
    case 'update':
      return permission.can_update
    case 'delete':
      return permission.can_delete
    case 'export':
      return permission.can_export
    case 'bulk_edit':
      return permission.can_bulk_edit
    default:
      return false
  }
}

/**
 * 권한 코드로 데이터 스코프 조회
 */
export function getDataScope(
  user: CurrentUser | null,
  permissionCode: string
): DataScope | null {
  if (!user) return null

  const permission = user.permissions.find(p => p.code === permissionCode)
  return permission?.data_scope ?? null
}

/**
 * 특정 역할 보유 여부 확인
 */
export function hasRole(user: CurrentUser | null, roleCode: string): boolean {
  if (!user) return false
  return user.roles.some(role => role.code === roleCode)
}

/**
 * 특정 레벨 이상의 역할 보유 여부 확인
 */
export function hasRoleLevel(user: CurrentUser | null, minLevel: number): boolean {
  if (!user) return false
  return user.roles.some(role => (role.level ?? 0) >= minLevel)
}

/**
 * 메뉴 접근 권한 확인
 */
export function canAccessMenu(user: CurrentUser | null, menuCode: string): boolean {
  if (!user) return false
  return user.accessibleMenus.some(menu => menu.code === menuCode)
}

/**
 * 권한 체크 유틸리티 함수들
 */
export const can = {
  // 환자 관련
  viewPatient: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'patient.read', action: 'read' }),
  createPatient: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'patient.create', action: 'create' }),
  updatePatient: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'patient.update', action: 'update' }),
  deletePatient: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'patient.delete', action: 'delete' }),
  exportPatient: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'patient.export', action: 'export' }),

  // 예약 관련
  viewReservation: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'reservation.read', action: 'read' }),
  createReservation: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'reservation.create', action: 'create' }),
  updateReservation: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'reservation.update', action: 'update' }),
  cancelReservation: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'reservation.cancel', action: 'update' }),

  // 수납 관련
  viewPayment: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'payment.read', action: 'read' }),
  createPayment: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'payment.create', action: 'create' }),
  refundPayment: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'payment.refund', action: 'update' }),

  // 직원 관련
  viewEmployee: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'employee.read', action: 'read' }),
  manageEmployee: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'employee.manage', action: 'create' }),

  // 리포트 관련
  viewReport: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'report.read', action: 'read' }),
  exportReport: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'report.export', action: 'export' }),

  // 설정 관련
  manageSettings: (user: CurrentUser | null) => 
    hasPermission(user, { permissionCode: 'settings.manage', action: 'update' }),
}

/**
 * 데이터 스코프에 따른 필터 조건 생성
 */
export function getScopeFilter(
  user: CurrentUser | null,
  permissionCode: string
): { type: 'all' | 'department' | 'own'; employeeId?: string; departmentId?: string } | null {
  if (!user) return null

  const scope = getDataScope(user, permissionCode)
  if (!scope) return null

  switch (scope) {
    case 'all':
      return { type: 'all' }
    case 'department':
      return { 
        type: 'department', 
        departmentId: user.employee.department_id ?? undefined 
      }
    case 'own':
      return { 
        type: 'own', 
        employeeId: user.employee.id 
      }
    default:
      return null
  }
}

