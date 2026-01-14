import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 근태 기록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = req.nextUrl.searchParams
    const employeeId = searchParams.get('employee_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(id, name, employee_no)
      `)
      .order('date', { ascending: false })

    if (employeeId) query = query.eq('employee_id', employeeId)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Attendance fetch error:', error)
    return NextResponse.json({ success: false, error: '근태 기록 조회 실패' }, { status: 500 })
  }
}

// 출퇴근 기록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { employee_id, type } = body // type: 'check_in' | 'check_out'

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // 기존 기록 확인
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('date', today)
      .single()

    if (type === 'check_in') {
      if (existing) {
        return NextResponse.json({ success: false, error: '이미 출근 기록이 있습니다.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id,
          date: today,
          check_in: now,
          status: 'present',
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data, message: '출근 처리 완료' })
    }

    if (type === 'check_out') {
      if (!existing) {
        return NextResponse.json({ success: false, error: '출근 기록이 없습니다.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out: now,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data, message: '퇴근 처리 완료' })
    }

    return NextResponse.json({ success: false, error: '잘못된 요청' }, { status: 400 })
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json({ success: false, error: '근태 처리 실패' }, { status: 500 })
  }
}

