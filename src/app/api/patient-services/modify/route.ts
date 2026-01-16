import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 서비스 변경 및 환불 처리
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_service_id,
      action, // 'add_sessions' | 'extend_expiry' | 'change_service' | 'partial_refund' | 'transfer'
      data
    } = body

    if (!patient_service_id || !action) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 없습니다.' },
        { status: 400 }
      )
    }

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

    let updateData: Record<string, unknown> = {}
    let historyData: Record<string, unknown> | null = null

    switch (action) {
      case 'update_sessions': {
        // 회차 수정
        const { total_sessions } = data
        if (!total_sessions || total_sessions < service.used_sessions) {
          return NextResponse.json(
            { success: false, error: `총 회차는 사용한 회차(${service.used_sessions}회) 이상이어야 합니다.` },
            { status: 400 }
          )
        }

        const newRemaining = total_sessions - service.used_sessions

        updateData = {
          total_sessions,
          remaining_sessions: newRemaining,
          updated_at: new Date().toISOString()
        }

        historyData = {
          patient_service_id,
          action: 'update_sessions',
          previous_value: service.total_sessions,
          new_value: total_sessions,
          memo: data.memo || null
        }
        break
      }

      case 'update_price': {
        // 가격 수정
        const { total_price } = data
        if (total_price === undefined || total_price < 0) {
          return NextResponse.json(
            { success: false, error: '구매금액을 입력해주세요.' },
            { status: 400 }
          )
        }

        updateData = {
          total_price,
          updated_at: new Date().toISOString()
        }

        historyData = {
          patient_service_id,
          action: 'update_price',
          previous_value: service.total_price,
          new_value: total_price,
          memo: data.memo || null
        }
        break
      }

      case 'update_expiry': {
        // 유효기간 수정
        const { expiry_date } = data
        if (!expiry_date) {
          return NextResponse.json(
            { success: false, error: '유효기간을 입력해주세요.' },
            { status: 400 }
          )
        }

        updateData = {
          expiry_date,
          updated_at: new Date().toISOString()
        }

        historyData = {
          patient_service_id,
          action: 'update_expiry',
          previous_value: service.expiry_date,
          new_value: expiry_date,
          memo: data.memo || null
        }
        break
      }

      case 'update_service_name': {
        // 서비스명 수정
        const { service_name } = data
        if (!service_name) {
          return NextResponse.json(
            { success: false, error: '서비스명을 입력해주세요.' },
            { status: 400 }
          )
        }

        updateData = {
          service_name,
          updated_at: new Date().toISOString()
        }

        historyData = {
          patient_service_id,
          action: 'update_service_name',
          previous_value: service.service_name,
          new_value: service_name,
          memo: data.memo || null
        }
        break
      }

      case 'partial_refund': {
        // 부분 환불
        const { refund_sessions, refund_amount, refund_reason } = data
        if (!refund_sessions || refund_sessions <= 0) {
          return NextResponse.json(
            { success: false, error: '환불할 회차 수를 입력해주세요.' },
            { status: 400 }
          )
        }

        if (refund_sessions > service.remaining_sessions) {
          return NextResponse.json(
            { success: false, error: '환불할 회차가 잔여 회차보다 많습니다.' },
            { status: 400 }
          )
        }

        const newRemaining = service.remaining_sessions - refund_sessions
        const newTotal = service.total_sessions - refund_sessions

        updateData = {
          total_sessions: newTotal,
          remaining_sessions: newRemaining,
          total_price: (service.total_price || 0) - (refund_amount || 0),
          status: newRemaining === 0 ? 'cancelled' : service.status,
          updated_at: new Date().toISOString()
        }

        historyData = {
          patient_service_id,
          action: 'partial_refund',
          refund_sessions,
          refund_amount: refund_amount || 0,
          refund_reason: refund_reason || null,
          memo: data.memo || null
        }
        break
      }

      case 'transfer': {
        // 양도 처리
        const { new_patient_id, new_patient_name } = data
        if (!new_patient_id) {
          return NextResponse.json(
            { success: false, error: '양도받을 환자를 선택해주세요.' },
            { status: 400 }
          )
        }

        updateData = {
          patient_id: new_patient_id,
          updated_at: new Date().toISOString()
        }

        historyData = {
          patient_service_id,
          action: 'transfer',
          previous_patient_id: service.patient_id,
          new_patient_id,
          memo: data.memo || null
        }
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 작업입니다.' },
          { status: 400 }
        )
    }

    // 서비스 업데이트
    const { data: updatedService, error: updateError } = await supabase
      .from('patient_services')
      .update(updateData)
      .eq('id', patient_service_id)
      .select(`
        *,
        patient:patients(id, name, chart_no)
      `)
      .single()

    if (updateError) throw updateError

    // 변경 이력 저장 (notification_logs 테이블 활용 또는 로그만 기록)
    if (historyData) {
      // 변경 이력은 notification_logs에 기록하거나, 추후 별도 테이블 생성 시 저장
      // 현재는 콘솔 로그만 기록
      console.log('서비스 변경 이력:', {
        patient_service_id,
        action,
        ...historyData,
        created_at: new Date().toISOString()
      })
    }

    return NextResponse.json({ success: true, data: updatedService })
  } catch (error) {
    console.error('서비스 변경 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 변경 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

