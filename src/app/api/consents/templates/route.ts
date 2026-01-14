import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 템플릿 목록 조회 (전체, 활성/비활성 포함)
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let query = supabase
      .from('consent_templates')
      .select('*')
      .order('category')
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('동의서 템플릿 조회 오류:', error)
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
      category,
      content,
      is_required = false,
      validity_days,
      version = 1,
      is_active = true
    } = body

    if (!name || !category || !content) {
      return NextResponse.json(
        { success: false, error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('consent_templates')
      .insert({
        name,
        category,
        content,
        is_required,
        validity_days: validity_days || null,
        version,
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
      category,
      content,
      is_required,
      validity_days,
      version,
      is_active
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (content !== undefined) updateData.content = content
    if (is_required !== undefined) updateData.is_required = is_required
    if (validity_days !== undefined) updateData.validity_days = validity_days
    if (version !== undefined) updateData.version = version
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('consent_templates')
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
      .from('consent_templates')
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

