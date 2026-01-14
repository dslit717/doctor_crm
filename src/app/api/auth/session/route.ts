import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { mergePermissions } from '@/lib/auth/permissions'
import type { RoleWithPermissions, PermissionWithScope } from '@/lib/auth/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: '세션이 없습니다.' },
        { status: 401 }
      )
    }

    // 1. 세션 유효성 확인
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      const response = NextResponse.json(
        { success: false, error: '유효하지 않은 세션입니다.' },
        { status: 401 }
      )
      response.cookies.delete('session_token')
      return response
    }

    // 2. 세션 만료 확인
    if (new Date(session.expires_at) < new Date()) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', session.id)

      const response = NextResponse.json(
        { success: false, error: '세션이 만료되었습니다.' },
        { status: 401 }
      )
      response.cookies.delete('session_token')
      return response
    }

    // 3. 마지막 활동 시간 업데이트
    await supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id)

    // 4. 직원 정보 조회
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', session.employee_id)
      .single()

    if (!employee) {
      return NextResponse.json(
        { success: false, error: '직원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 5. 역할 및 권한 조회
    const { data: employeeRoles } = await supabase
      .from('employee_roles')
      .select('role_id')
      .eq('employee_id', employee.id)

    const roleIds = employeeRoles?.map(er => er.role_id) || []

    // 6. 역할 정보 조회
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .in('id', roleIds)

    // 7. 역할별 권한 조회
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id, data_scope')
      .in('role_id', roleIds)

    // 7-1. 권한 상세 정보 조회
    const permissionIds = [...new Set(rolePermissions?.map(rp => rp.permission_id) || [])]
    const { data: permissions } = await supabase
      .from('permissions')
      .select('*')
      .in('id', permissionIds)

    // 권한 맵 생성
    const permissionMap = new Map(permissions?.map(p => [p.id, p]) || [])

    // 8. 역할에 권한 연결
    const rolesWithPermissions: RoleWithPermissions[] = (roles || []).map(role => ({
      ...role,
      permissions: (rolePermissions || [])
        .filter(rp => rp.role_id === role.id)
        .map(rp => {
          const permission = permissionMap.get(rp.permission_id)
          if (!permission) return null
          return {
            ...permission,
            data_scope: rp.data_scope as 'all' | 'department' | 'own',
          } as PermissionWithScope
        })
        .filter((p): p is PermissionWithScope => p !== null),
    }))

    // 9. 권한 병합
    const mergedPermissions = mergePermissions(rolesWithPermissions)

    // 10. 접근 가능한 메뉴 조회
    const { data: roleMenus } = await supabase
      .from('role_menus')
      .select('menu_id')
      .in('role_id', roleIds)
      .eq('can_access', true)

    const menuIds = [...new Set(roleMenus?.map(rm => rm.menu_id) || [])]

    const { data: menus } = await supabase
      .from('menus')
      .select('*')
      .in('id', menuIds)
      .eq('is_active', true)
      .order('sort_order')

    return NextResponse.json({
      success: true,
      user: {
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          employeeNo: employee.employee_no,
          phone: employee.phone,
          position: employee.position,
          departmentId: employee.department_id,
          profileImageUrl: employee.profile_image_url,
        },
        roles: rolesWithPermissions,
        permissions: mergedPermissions,
        accessibleMenus: menus || [],
      },
      session: {
        id: session.id,
        loginAt: session.login_at,
        lastActivityAt: session.last_activity_at,
        expiresAt: session.expires_at,
        isInternalIp: session.is_internal_ip,
      },
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

