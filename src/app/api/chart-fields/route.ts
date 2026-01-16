import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 차트 필드 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const chartType = searchParams.get('chart_type')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('chart_fields')
      .select('*')
      .order('section_order', { ascending: true })
      .order('field_order', { ascending: true })

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
    console.error('차트 필드 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 필드를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 필드 생성
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      chart_type,
      field_key,
      field_name,
      field_type,
      section,
      section_order = 0,
      field_order = 0,
      is_required = false,
      default_value,
      placeholder,
      help_text,
      validation_rules = {},
      options = [],
      display_condition = {},
      is_active = true,
      is_searchable = false,
      is_list_display = false
    } = body

    if (!chart_type || !field_key || !field_name || !field_type) {
      return NextResponse.json(
        { success: false, error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('chart_fields')
      .insert({
        chart_type,
        field_key,
        field_name,
        field_type,
        section,
        section_order,
        field_order,
        is_required,
        default_value,
        placeholder,
        help_text,
        validation_rules,
        options,
        display_condition,
        is_active,
        is_searchable,
        is_list_display,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('차트 필드 생성 오류:', error)
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 필드 키입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: '차트 필드 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 필드 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '필드 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('chart_fields')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 필드 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 필드 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 차트 필드 삭제
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '필드 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 소프트 딜리트: is_active를 false로 변경
    const { data, error } = await supabase
      .from('chart_fields')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('차트 필드 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '차트 필드 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

