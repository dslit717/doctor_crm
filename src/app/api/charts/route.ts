import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 차트 조회 (통합)
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const patientId = searchParams.get('patient_id')
    const chartType = searchParams.get('type') // consultation, medical, care, satisfaction
    const reservationId = searchParams.get('reservation_id')

    if (!patientId && !reservationId) {
      return NextResponse.json(
        { success: false, error: '환자 ID 또는 예약 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const result: Record<string, unknown> = {}

    // 상담 차트
    if (!chartType || chartType === 'consultation') {
      let query = supabase
        .from('consultation_charts')
        .select(`
          *,
          counselor:employees!consultation_charts_counselor_id_fkey(id, name)
        `)
        .order('consultation_date', { ascending: false })

      if (patientId) query = query.eq('patient_id', patientId)
      if (reservationId) query = query.eq('reservation_id', reservationId)

      const { data } = await query
      result.consultation = data
    }

    // 진료 차트
    if (!chartType || chartType === 'medical') {
      let query = supabase
        .from('medical_charts')
        .select(`
          *,
          doctor:employees!medical_charts_doctor_id_fkey(id, name)
        `)
        .order('chart_date', { ascending: false })

      if (patientId) query = query.eq('patient_id', patientId)
      if (reservationId) query = query.eq('reservation_id', reservationId)

      const { data } = await query
      result.medical = data
    }

    // 관리 차트
    if (!chartType || chartType === 'care') {
      let query = supabase
        .from('care_charts')
        .select(`
          *,
          staff:employees!care_charts_staff_id_fkey(id, name)
        `)
        .order('chart_date', { ascending: false })

      if (patientId) query = query.eq('patient_id', patientId)
      if (reservationId) query = query.eq('reservation_id', reservationId)

      const { data } = await query
      result.care = data
    }

    // 만족도 차트
    if (!chartType || chartType === 'satisfaction') {
      let query = supabase
        .from('satisfaction_charts')
        .select('*')
        .order('created_at', { ascending: false })

      if (patientId) query = query.eq('patient_id', patientId)
      if (reservationId) query = query.eq('reservation_id', reservationId)

      const { data } = await query
      result.satisfaction = data
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('차트 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 저장
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { chart_type, ...chartData } = body

    if (!chart_type) {
      return NextResponse.json(
        { success: false, error: '차트 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    const tableMap: Record<string, string> = {
      consultation: 'consultation_charts',
      medical: 'medical_charts',
      care: 'care_charts',
      satisfaction: 'satisfaction_charts'
    }

    const tableName = tableMap[chart_type]
    if (!tableName) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 차트 타입입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(chartData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 저장 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { chart_type, id, ...updateData } = body

    if (!chart_type || !id) {
      return NextResponse.json(
        { success: false, error: '차트 타입과 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const tableMap: Record<string, string> = {
      consultation: 'consultation_charts',
      medical: 'medical_charts',
      care: 'care_charts',
      satisfaction: 'satisfaction_charts'
    }

    const tableName = tableMap[chart_type]
    if (!tableName) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 차트 타입입니다.' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

