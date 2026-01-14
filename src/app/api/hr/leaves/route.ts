import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 휴가 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = req.nextUrl.searchParams
    const employeeId = searchParams.get('employee_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('leaves')
      .select(`
        *,
        employee:employees!leaves_employee_id_fkey(id, name, employee_no),
        approver:employees!leaves_approved_by_fkey(id, name)
      `)
      .order('created_at', { ascending: false })

    if (employeeId) query = query.eq('employee_id', employeeId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Leaves fetch error:', error)
    return NextResponse.json({ success: false, error: '휴가 목록 조회 실패' }, { status: 500 })
  }
}

// 휴가 신청
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { employee_id, leave_type, start_date, end_date, days, reason } = body

    const { data, error } = await supabase
      .from('leaves')
      .insert({
        employee_id,
        leave_type,
        start_date,
        end_date,
        days,
        reason,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data, message: '휴가 신청 완료' })
  } catch (error) {
    console.error('Leave request error:', error)
    return NextResponse.json({ success: false, error: '휴가 신청 실패' }, { status: 500 })
  }
}

// 휴가 승인/반려
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, status, approved_by } = body

    const { data, error } = await supabase
      .from('leaves')
      .update({
        status,
        approved_by,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Leave update error:', error)
    return NextResponse.json({ success: false, error: '휴가 처리 실패' }, { status: 500 })
  }
}


