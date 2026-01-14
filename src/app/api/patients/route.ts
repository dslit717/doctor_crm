import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 환자 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // 검색 (이름, 전화번호, 차트번호)
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,chart_no.ilike.%${search}%`)
    }

    // 상태 필터
    if (status) {
      query = query.eq('status', status)
    }

    // 페이지네이션
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
    console.error('환자 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '환자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 환자 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      chart_no,
      name,
      phone,
      phone_secondary,
      birth_date,
      gender,
      email,
      address,
      referral_source,
      referral_detail,
      marketing_consent,
      sms_consent,
      email_consent,
      primary_counselor_id,
      primary_doctor_id,
      extended_data
    } = body

    // 필수 필드 검증
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '이름과 전화번호는 필수입니다.' },
        { status: 400 }
      )
    }

    // 차트번호 자동 생성 (없으면)
    let finalChartNo = chart_no
    if (!finalChartNo) {
      const today = new Date()
      const prefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
      
      const { data: lastPatient } = await supabase
        .from('patients')
        .select('chart_no')
        .like('chart_no', `${prefix}%`)
        .order('chart_no', { ascending: false })
        .limit(1)
        .single()

      if (lastPatient?.chart_no) {
        const lastNum = parseInt(lastPatient.chart_no.slice(-4)) || 0
        finalChartNo = `${prefix}${String(lastNum + 1).padStart(4, '0')}`
      } else {
        finalChartNo = `${prefix}0001`
      }
    }

    const { data, error } = await supabase
      .from('patients')
      .insert({
        chart_no: finalChartNo,
        name,
        phone,
        phone_secondary,
        birth_date,
        gender,
        email,
        address,
        referral_source,
        referral_detail,
        marketing_consent: marketing_consent || false,
        marketing_consent_date: marketing_consent ? new Date().toISOString() : null,
        sms_consent: sms_consent || false,
        email_consent: email_consent || false,
        primary_counselor_id,
        primary_doctor_id,
        first_visit_date: new Date().toISOString().split('T')[0],
        extended_data: extended_data || {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('환자 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: '환자 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 환자 정보 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '환자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 마케팅 동의 날짜 업데이트
    if (updateData.marketing_consent && !updateData.marketing_consent_date) {
      updateData.marketing_consent_date = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('patients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('환자 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '환자 정보 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 환자 삭제 (소프트 딜리트)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '환자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('patients')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'inactive'
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('환자 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '환자 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}


