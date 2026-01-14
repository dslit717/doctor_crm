import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// IP 화이트리스트 조회
export async function GET() {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('ip_whitelist')
      .select(`
        *,
        created_by_employee:employees!ip_whitelist_created_by_fkey (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })

  } catch (error) {
    console.error('IP whitelist error:', error)
    return NextResponse.json(
      { success: false, error: 'IP 화이트리스트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// IP 화이트리스트 추가
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { ipAddress, description } = body

    // IP 형식 검증
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^\*$|^(\d{1,3}\.){0,3}\*$/
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json(
        { success: false, error: 'IP 주소 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const { data: existing } = await supabase
      .from('ip_whitelist')
      .select('id')
      .eq('ip_address', ipAddress)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 IP 주소입니다.' },
        { status: 400 }
      )
    }

    // 세션에서 직원 ID 조회
    const sessionToken = req.cookies.get('session_token')?.value
    let createdBy = null
    
    if (sessionToken) {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('employee_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single()
      
      createdBy = session?.employee_id
    }

    const { data, error } = await supabase
      .from('ip_whitelist')
      .insert({
        ip_address: ipAddress,
        description,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // 감사 로그 기록
    if (createdBy) {
      await supabase.from('audit_logs').insert({
        employee_id: createdBy,
        action_type: 'create',
        action_category: 'settings',
        action_detail: `IP 화이트리스트 추가: ${ipAddress}`,
        target_table: 'ip_whitelist',
        target_id: data.id,
        new_values: { ip_address: ipAddress, description },
      })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('IP whitelist creation error:', error)
    return NextResponse.json(
      { success: false, error: 'IP 화이트리스트 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// IP 화이트리스트 수정
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, isActive, description } = body

    const updateData: { is_active?: boolean; description?: string } = {}
    if (isActive !== undefined) updateData.is_active = isActive
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('ip_whitelist')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('IP whitelist update error:', error)
    return NextResponse.json(
      { success: false, error: 'IP 화이트리스트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// IP 화이트리스트 삭제
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ip_whitelist')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('IP whitelist deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'IP 화이트리스트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

