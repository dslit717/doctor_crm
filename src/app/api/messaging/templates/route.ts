import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 템플릿 목록 조회 (전체, 활성/비활성 포함)
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const channel = searchParams.get('channel')
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let query = supabase
      .from('message_templates')
      .select('*')
      .order('category')
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('템플릿 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 템플릿 생성
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      name,
      template_code,
      category,
      channel,
      content,
      variables,
      kakao_template_id,
      is_active = true
    } = body

    if (!name || !template_code || !channel || !content) {
      return NextResponse.json(
        { success: false, error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 템플릿 코드 중복 확인
    const { data: existing } = await supabase
      .from('message_templates')
      .select('id')
      .eq('template_code', template_code)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 템플릿 코드입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        name,
        template_code,
        category,
        channel,
        content,
        variables: variables || null,
        kakao_template_id: kakao_template_id || null,
        is_active
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('템플릿 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 템플릿 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      id,
      name,
      template_code,
      category,
      channel,
      content,
      variables,
      kakao_template_id,
      is_active
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 템플릿 코드 중복 확인 (자기 자신 제외)
    if (template_code) {
      const { data: existing } = await supabase
        .from('message_templates')
        .select('id')
        .eq('template_code', template_code)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: false, error: '이미 사용 중인 템플릿 코드입니다.' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (template_code !== undefined) updateData.template_code = template_code
    if (category !== undefined) updateData.category = category
    if (channel !== undefined) updateData.channel = channel
    if (content !== undefined) updateData.content = content
    if (variables !== undefined) updateData.variables = variables
    if (kakao_template_id !== undefined) updateData.kakao_template_id = kakao_template_id
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('message_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('템플릿 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 템플릿 삭제 (비활성화)
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

    const { error } = await supabase
      .from('message_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('템플릿 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}


