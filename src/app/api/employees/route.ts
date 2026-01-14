import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 직원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const roleId = searchParams.get('roleId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('name')

    if (status) {
      query = query.eq('status', status)
    }
    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_no.ilike.%${search}%`)
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: employees, error, count } = await query

    if (error) throw error

    // 부서 정보 조회
    const departmentIds = [...new Set(employees?.map(e => e.department_id).filter((id): id is string => !!id) || [])]
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', departmentIds)
    
    const departmentMap = new Map(departments?.map(d => [d.id, d]) || [])

    // 직원별 역할 조회
    const employeeIds = employees?.map(e => e.id) || []
    const { data: employeeRoles } = await supabase
      .from('employee_roles')
      .select('employee_id, role_id')
      .in('employee_id', employeeIds)

    // 역할 정보 조회
    const roleIds2 = [...new Set(employeeRoles?.map(er => er.role_id) || [])]
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name, code, level')
      .in('id', roleIds2)
    
    const roleMap = new Map(roles?.map(r => [r.id, r]) || [])

    // 직원별 역할 매핑
    const employeeRoleMap = new Map<string, typeof roles>()
    employeeRoles?.forEach(er => {
      const empRoles = employeeRoleMap.get(er.employee_id) || []
      const role = roleMap.get(er.role_id)
      if (role) empRoles.push(role)
      employeeRoleMap.set(er.employee_id, empRoles)
    })

    // 데이터 병합
    let enrichedData = employees?.map(emp => ({
      ...emp,
      department: emp.department_id ? departmentMap.get(emp.department_id) : null,
      roles: employeeRoleMap.get(emp.id)?.map(r => ({ role: r })) || [],
    })) || []

    // 역할 ID로 필터링
    if (roleId) {
      enrichedData = enrichedData.filter(emp => 
        emp.roles?.some((r: { role?: { id: string } }) => r.role?.id === roleId)
      )
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Employees fetch error:', error)
    return NextResponse.json(
      { success: false, error: '직원 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 직원 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { 
      employeeNo, name, email, phone, departmentId, position, 
      hireDate, roleIds, extendedData, password 
    } = body

    // 이메일 중복 확인
    if (email) {
      const { data: existingEmail } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .single()

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: '이미 등록된 이메일입니다.' },
          { status: 400 }
        )
      }
    }

    // 사번 중복 확인
    const { data: existingNo } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_no', employeeNo)
      .single()

    if (existingNo) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 사번입니다.' },
        { status: 400 }
      )
    }

    // Supabase Auth 계정 생성 (이메일이 있는 경우)
    let authUserId = null
    if (email && password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError) {
        return NextResponse.json(
          { success: false, error: `계정 생성 실패: ${authError.message}` },
          { status: 400 }
        )
      }

      authUserId = authData.user?.id
    }

    // 직원 정보 저장
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        auth_user_id: authUserId,
        employee_no: employeeNo,
        name,
        email,
        phone,
        department_id: departmentId,
        position,
        hire_date: hireDate,
        extended_data: extendedData || {},
      })
      .select()
      .single()

    if (employeeError) {
      // Auth 계정이 생성되었다면 롤백
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId)
      }
      throw employeeError
    }

    // 역할 할당
    if (roleIds && roleIds.length > 0) {
      const roleAssignments = roleIds.map((roleId: string, index: number) => ({
        employee_id: employee.id,
        role_id: roleId,
        is_primary: index === 0,
      }))

      await supabase.from('employee_roles').insert(roleAssignments)
    }

    return NextResponse.json({ success: true, data: employee })

  } catch (error) {
    console.error('Employee creation error:', error)
    return NextResponse.json(
      { success: false, error: '직원 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 직원 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { 
      id, name, email, phone, departmentId, position, 
      status, extendedData, roleIds 
    } = body

    // 기존 직원 정보 조회
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (departmentId !== undefined) updateData.department_id = departmentId
    if (position !== undefined) updateData.position = position
    if (status !== undefined) updateData.status = status
    if (extendedData !== undefined) {
      updateData.extended_data = {
        ...(existingEmployee.extended_data as object || {}),
        ...extendedData,
      }
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 역할 업데이트
    if (roleIds !== undefined) {
      // 기존 역할 삭제
      await supabase
        .from('employee_roles')
        .delete()
        .eq('employee_id', id)

      // 새 역할 할당
      if (roleIds.length > 0) {
        const roleAssignments = roleIds.map((roleId: string, index: number) => ({
          employee_id: id,
          role_id: roleId,
          is_primary: index === 0,
        }))

        await supabase.from('employee_roles').insert(roleAssignments)
      }
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Employee update error:', error)
    return NextResponse.json(
      { success: false, error: '직원 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 직원 삭제 (소프트 딜리트)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 소프트 딜리트
    const { error } = await supabase
      .from('employees')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'resigned',
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Employee deletion error:', error)
    return NextResponse.json(
      { success: false, error: '직원 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

