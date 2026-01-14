import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 역할 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = request.nextUrl.searchParams
    const includePermissions = searchParams.get('includePermissions') === 'true'

    if (includePermissions) {
      // 권한 포함 조회
      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false })

      if (error) throw error

      // 모든 역할의 권한 매핑 조회
      const roleIds = roles?.map(r => r.id) || []
      const { data: allRolePermissions } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id, data_scope')
        .in('role_id', roleIds)

      // 권한 상세 정보 조회
      const permissionIds = [...new Set(allRolePermissions?.map(rp => rp.permission_id) || [])]
      const { data: permissions } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds)

      const permissionMap = new Map(permissions?.map(p => [p.id, p]) || [])

      // 역할별로 권한 매핑
      const rolesWithPermissions = (roles || []).map(role => {
        const rolePerms = allRolePermissions?.filter(rp => rp.role_id === role.id) || []
        return {
          ...role,
          permissions: rolePerms.map(rp => ({
            ...permissionMap.get(rp.permission_id),
            data_scope: rp.data_scope,
          })).filter(Boolean),
        }
      })

      return NextResponse.json({
        success: true,
        data: rolesWithPermissions,
      })
    }

    // 기본 조회
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })

  } catch (error) {
    console.error('Roles fetch error:', error)
    return NextResponse.json(
      { success: false, error: '역할 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 역할 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { name, code, description, level } = body

    // 중복 확인
    const { data: existing } = await supabase
      .from('roles')
      .select('id')
      .or(`name.eq.${name},code.eq.${code}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 역할 이름 또는 코드입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('roles')
      .insert({
        name,
        code,
        description,
        level: level || 0,
        is_system: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Role creation error:', error)
    return NextResponse.json(
      { success: false, error: '역할 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 역할 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { id, name, description, level, isActive } = body

    // 시스템 역할 수정 방지
    const { data: role } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single()

    if (role?.is_system) {
      return NextResponse.json(
        { success: false, error: '시스템 기본 역할은 수정할 수 없습니다.' },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (level !== undefined) updateData.level = level
    if (isActive !== undefined) updateData.is_active = isActive

    const { data, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json(
      { success: false, error: '역할 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

