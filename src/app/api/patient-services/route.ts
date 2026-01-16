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
        service_id: service_id && service_id.trim() !== '' ? service_id : null,
        payment_id: payment_id && payment_id.trim() !== '' ? payment_id : null,
        service_name,
        service_type: service_type || 'package',
        total_sessions: total_sessions || 1,
        used_sessions: 0,
        remaining_sessions: total_sessions || 1,
        expiry_date: expiry_date && expiry_date.trim() !== '' ? expiry_date : null,
        total_price,
        memo: memo && memo.trim() !== '' ? memo : null,
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

// 서비스 정보 수정 또는 회차 사용 (차감)
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    // id가 있으면 서비스 정보 수정
    if (body.id) {
      const { id, ...updateData } = body

      // 업데이트 가능한 필드만 추출
      const allowedFields = [
        'service_name',
        'service_type',
        'total_sessions',
        'expiry_date',
        'total_price',
        'memo'
      ]
      
      const filteredData: Record<string, unknown> = {}
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field]
        }
      })

      // total_sessions가 변경되면 remaining_sessions도 재계산
      if (filteredData.total_sessions !== undefined) {
        const { data: currentService } = await supabase
          .from('patient_services')
          .select('total_sessions, used_sessions')
          .eq('id', id)
          .single()

        if (currentService) {
          const newTotal = Number(filteredData.total_sessions)
          const used = currentService.used_sessions || 0
          filteredData.remaining_sessions = Math.max(0, newTotal - used)
        }
      }

      // 빈 문자열을 null로 변환
      Object.keys(filteredData).forEach(key => {
        if (filteredData[key] === '') {
          filteredData[key] = null
        }
      })

      const { data, error } = await supabase
        .from('patient_services')
        .update({
          ...filteredData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          patient:patients(id, name, chart_no),
          service:services(id, name, category)
        `)
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data })
    }

    // patient_service_id가 있으면 회차 사용 처리
    if (body.patient_service_id) {
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
    }

    return NextResponse.json(
      { success: false, error: 'id 또는 patient_service_id가 필요합니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('서비스 수정/회차 사용 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

