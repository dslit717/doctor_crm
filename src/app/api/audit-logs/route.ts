import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 감사 로그 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = req.nextUrl.searchParams
    
    // 필터 파라미터
    const employeeId = searchParams.get('employeeId')
    const actionType = searchParams.get('actionType')
    const actionCategory = searchParams.get('actionCategory')
    const targetTable = searchParams.get('targetTable')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 쿼리 빌드
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    if (actionType) {
      query = query.eq('action_type', actionType)
    }
    if (actionCategory) {
      query = query.eq('action_category', actionCategory)
    }
    if (targetTable) {
      query = query.eq('target_table', targetTable)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { success: false, error: '감사 로그 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 감사 로그 기록 (내부 API용)
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const sessionToken = req.cookies.get('session_token')?.value

    // 세션에서 직원 정보 조회
    let employeeInfo = null
    if (sessionToken) {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('id, employee_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single()

      if (session) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id, name')
          .eq('id', session.employee_id)
          .single()

        employeeInfo = {
          sessionId: session.id,
          employeeId: employee?.id,
          employeeName: employee?.name,
        }
      }
    }

    // IP 주소
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0].trim() || '127.0.0.1'

    // 감사 로그 삽입
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        employee_id: employeeInfo?.employeeId || body.employeeId,
        employee_name: employeeInfo?.employeeName || body.employeeName,
        session_id: employeeInfo?.sessionId,
        ip_address: ipAddress,
        user_agent: req.headers.get('user-agent'),
        action_type: body.actionType,
        action_category: body.actionCategory,
        action_detail: body.actionDetail,
        target_table: body.targetTable,
        target_id: body.targetId,
        target_name: body.targetName,
        old_values: body.oldValues,
        new_values: body.newValues,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Audit log creation error:', error)
    return NextResponse.json(
      { success: false, error: '감사 로그 기록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

