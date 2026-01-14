import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 환자 서비스 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const patientId = searchParams.get('patient_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('patient_services')
      .select(`
        *,
        patient:patients(id, name, chart_no),
        service:services(id, name, category),
        usage:service_usage(*)
      `)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (status) {
      query = query.eq('status', status)
    } else {
      // 기본: 활성 서비스만
      query = query.in('status', ['active', 'expired'])
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('환자 서비스 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '환자 서비스를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 등록 (패키지 구매)
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_id,
      service_id,
      payment_id,
      service_name,
      service_type,
      total_sessions,
      expiry_date,
      total_price,
      memo
    } = body

    const { data, error } = await supabase
      .from('patient_services')
      .insert({
        patient_id,
        service_id,
        payment_id,
        service_name,
        service_type: service_type || 'package',
        total_sessions: total_sessions || 1,
        used_sessions: 0,
        remaining_sessions: total_sessions || 1,
        expiry_date,
        total_price,
        memo,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('환자 서비스 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 회차 사용 (차감)
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_service_id,
      reservation_id,
      staff_id,
      memo
    } = body

    // 현재 서비스 정보 조회
    const { data: service, error: serviceError } = await supabase
      .from('patient_services')
      .select('*')
      .eq('id', patient_service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { success: false, error: '서비스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (service.remaining_sessions <= 0) {
      return NextResponse.json(
        { success: false, error: '잔여 회차가 없습니다.' },
        { status: 400 }
      )
    }

    const newUsed = service.used_sessions + 1
    const newRemaining = service.remaining_sessions - 1
    const newStatus = newRemaining === 0 ? 'completed' : 'active'

    // 이행 이력 추가
    const { error: usageError } = await supabase
      .from('service_usage')
      .insert({
        patient_service_id,
        session_number: newUsed,
        reservation_id,
        usage_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        staff_id,
        memo
      })

    if (usageError) throw usageError

    // 서비스 회차 업데이트
    const { data, error } = await supabase
      .from('patient_services')
      .update({
        used_sessions: newUsed,
        remaining_sessions: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', patient_service_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('회차 사용 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '회차 사용 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

