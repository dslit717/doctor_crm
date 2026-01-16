import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 차트 템플릿 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const chartType = searchParams.get('chart_type')
    const serviceId = searchParams.get('service_id')
    const isActive = searchParams.get('is_active')

    // 시술별 템플릿 조회
    if (serviceId && chartType) {
      const { data: serviceTemplates, error: serviceError } = await supabase
        .from('service_chart_templates')
        .select(`
          *,
          template:chart_templates(*)
        `)
        .eq('service_id', serviceId)
        .eq('chart_type', chartType)

      if (serviceError) throw serviceError

      if (serviceTemplates && serviceTemplates.length > 0) {
        return NextResponse.json({ success: true, data: serviceTemplates[0].template })
      }
    }

    // 일반 템플릿 조회
    let query = supabase
      .from('chart_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (chartType) {
      query = query.eq('chart_type', chartType)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 템플릿 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 템플릿을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 템플릿 생성
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      chart_type,
      template_name,
      description,
      field_ids = [],
      field_order = [],
      is_default = false,
      is_active = true,
      service_id // 시술별 템플릿인 경우
    } = body

    if (!chart_type || !template_name) {
      return NextResponse.json(
        { success: false, error: '차트 타입과 템플릿명이 필요합니다.' },
        { status: 400 }
      )
    }

    // 기본 템플릿인 경우 기존 기본 템플릿 해제
    if (is_default) {
      await supabase
        .from('chart_templates')
        .update({ is_default: false })
        .eq('chart_type', chart_type)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('chart_templates')
      .insert({
        chart_type,
        template_name,
        description,
        field_ids,
        field_order,
        is_default,
        is_active,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // 시술별 템플릿 연결
    if (service_id && data) {
      await supabase
        .from('service_chart_templates')
        .upsert({
          service_id,
          chart_type,
          template_id: data.id
        }, {
          onConflict: 'service_id,chart_type'
        })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 템플릿 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 템플릿 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 템플릿 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { id, service_id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기본 템플릿인 경우 기존 기본 템플릿 해제
    if (updateData.is_default) {
      const { data: template } = await supabase
        .from('chart_templates')
        .select('chart_type')
        .eq('id', id)
        .single()

      if (template) {
        await supabase
          .from('chart_templates')
          .update({ is_default: false })
          .eq('chart_type', template.chart_type)
          .eq('is_default', true)
          .neq('id', id)
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('chart_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 시술별 템플릿 연결 업데이트
    if (service_id && data) {
      await supabase
        .from('service_chart_templates')
        .upsert({
          service_id,
          chart_type: data.chart_type,
          template_id: data.id
        }, {
          onConflict: 'service_id,chart_type'
        })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 템플릿 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 템플릿 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 템플릿 삭제
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 소프트 딜리트: is_active를 false로 변경
    const { data, error } = await supabase
      .from('chart_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 템플릿 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 템플릿 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

