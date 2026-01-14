import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 직원의 역할 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const supabase = getSupabaseServer()
    const { employeeId } = await params

    // 직원-역할 매핑 조회
    const { data: employeeRoles, error } = await supabase
      .from('employee_roles')
      .select('id, role_id, is_primary, assigned_at')
      .eq('employee_id', employeeId)

    if (error) throw error

    // 역할 상세 정보 조회
    const roleIds = employeeRoles?.map(er => er.role_id) || []
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .in('id', roleIds)

    // 역할 맵 생성
    const roleMap = new Map(roles?.map(r => [r.id, r]) || [])

    return NextResponse.json({
      success: true,
      data: employeeRoles?.map(er => {
        const role = roleMap.get(er.role_id)
        return {
          ...role,
          is_primary: er.is_primary,
          assigned_at: er.assigned_at,
          employee_role_id: er.id,
        }
      }).filter(Boolean) || [],
    })

  } catch (error) {
    console.error('Employee roles fetch error:', error)
    return NextResponse.json(
      { success: false, error: '직원 역할 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 직원에게 역할 할당
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const supabase = getSupabaseServer()
    const { employeeId } = await params
    const body = await request.json()
    const { roleId, isPrimary = false } = body

    // 중복 확인
    const { data: existing } = await supabase
      .from('employee_roles')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('role_id', roleId)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 할당된 역할입니다.' },
        { status: 400 }
      )
    }

    // 주 역할로 설정 시 기존 주 역할 해제
    if (isPrimary) {
      await supabase
        .from('employee_roles')
        .update({ is_primary: false })
        .eq('employee_id', employeeId)
        .eq('is_primary', true)
    }

    // 세션에서 할당자 ID 조회
    const sessionToken = request.cookies.get('session_token')?.value
    let assignedBy = null
    
    if (sessionToken) {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('employee_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single()
      
      assignedBy = session?.employee_id
    }

    const { data, error } = await supabase
      .from('employee_roles')
      .insert({
        employee_id: employeeId,
        role_id: roleId,
        is_primary: isPrimary,
        assigned_by: assignedBy,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Employee role assignment error:', error)
    return NextResponse.json(
      { success: false, error: '역할 할당 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 직원 역할 일괄 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const supabase = getSupabaseServer()
    const { employeeId } = await params
    const body = await request.json()
    const { roleIds, primaryRoleId } = body

    // 세션에서 할당자 ID 조회
    const sessionToken = request.cookies.get('session_token')?.value
    let assignedBy = null
    
    if (sessionToken) {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('employee_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single()
      
      assignedBy = session?.employee_id
    }

    // 기존 역할 삭제
    await supabase
      .from('employee_roles')
      .delete()
      .eq('employee_id', employeeId)

    // 새 역할 삽입
    if (roleIds && roleIds.length > 0) {
      const { error } = await supabase
        .from('employee_roles')
        .insert(
          roleIds.map((roleId: string) => ({
            employee_id: employeeId,
            role_id: roleId,
            is_primary: roleId === primaryRoleId,
            assigned_by: assignedBy,
          }))
        )

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Employee roles update error:', error)
    return NextResponse.json(
      { success: false, error: '역할 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 직원에서 역할 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const supabase = getSupabaseServer()
    const { employeeId } = await params
    const searchParams = request.nextUrl.searchParams
    const roleId = searchParams.get('roleId')

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: '역할 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('employee_roles')
      .delete()
      .eq('employee_id', employeeId)
      .eq('role_id', roleId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Employee role removal error:', error)
    return NextResponse.json(
      { success: false, error: '역할 제거 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

