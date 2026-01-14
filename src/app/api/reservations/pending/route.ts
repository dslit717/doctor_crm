import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 대기 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const status = searchParams.get('status')
    const counselorId = searchParams.get('counselor_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('pending_reservations')
      .select(`
        *,
        patient:patients(id, name, chart_no, phone),
        counselor:employees!pending_reservations_counselor_id_fkey(id, name)
      `, { count: 'exact' })
      .order('next_contact_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      // 기본: 취소/전환 제외
      query = query.not('status', 'in', '("cancelled","converted")')
    }

    if (counselorId) {
      query = query.eq('counselor_id', counselorId)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('대기 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '대기 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 대기 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_id,
      patient_name,
      phone,
      consultation_summary,
      desired_treatment,
      desired_schedule,
      pending_reason,
      reason_detail,
      expected_decision_date,
      counselor_id,
      next_contact_date,
      memo
    } = body

    const { data, error } = await supabase
      .from('pending_reservations')
      .insert({
        patient_id,
        patient_name,
        phone,
        consultation_summary,
        desired_treatment,
        desired_schedule,
        pending_reason,
        reason_detail,
        expected_decision_date,
        counselor_id,
        next_contact_date,
        memo,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('대기 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: '대기 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 대기 수정 (상태 변경, 연락 이력 추가)
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, contact_log, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 연락 이력 추가
    if (contact_log) {
      const { data: existing } = await supabase
        .from('pending_reservations')
        .select('contact_history')
        .eq('id', id)
        .single()

      const history = Array.isArray(existing?.contact_history) 
        ? existing.contact_history 
        : []
      
      history.push({
        ...contact_log,
        contacted_at: new Date().toISOString()
      })

      updateData.contact_history = history
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('pending_reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('대기 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '대기 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 대기 → 예약 전환
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { pending_id, reservation_data } = body

    if (!pending_id || !reservation_data) {
      return NextResponse.json(
        { success: false, error: '대기 ID와 예약 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // 1. 예약 생성
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(reservation_data)
      .select()
      .single()

    if (reservationError) throw reservationError

    // 2. 대기 상태 업데이트
    const { error: pendingError } = await supabase
      .from('pending_reservations')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        converted_reservation_id: reservation.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', pending_id)

    if (pendingError) throw pendingError

    return NextResponse.json({ 
      success: true, 
      data: { reservation }
    })
  } catch (error) {
    console.error('예약 전환 오류:', error)
    return NextResponse.json(
      { success: false, error: '예약 전환에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 대기 삭제 (취소 처리)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pending_reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('대기 취소 오류:', error)
    return NextResponse.json(
      { success: false, error: '대기 취소에 실패했습니다.' },
      { status: 500 }
    )
  }
}

