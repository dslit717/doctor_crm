import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Quick Text 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const chartType = searchParams.get('chart_type')
    const serviceId = searchParams.get('service_id')
    const employeeId = searchParams.get('employee_id')
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('quick_texts')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (chartType) {
      query = query.or(`chart_type.eq.${chartType},chart_type.is.null`)
    }

    if (serviceId) {
      query = query.or(`service_id.eq.${serviceId},service_id.is.null`)
    }

    if (employeeId) {
      // 개인 문구 + 공용 문구 모두 조회
      query = query.or(`employee_id.eq.${employeeId},is_personal.eq.false`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Quick Text 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Quick Text를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// Quick Text 생성
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      chart_type,
      service_id,
      shortcut_code,
      content,
      category,
      is_personal = false,
      employee_id,
      is_active = true
    } = body

    if (!shortcut_code || !content) {
      return NextResponse.json(
        { success: false, error: '단축 코드와 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 단축 코드는 #으로 시작하도록 보정
    const normalizedShortcut = shortcut_code.startsWith('#') 
      ? shortcut_code 
      : `#${shortcut_code}`

    const { data, error } = await supabase
      .from('quick_texts')
      .insert({
        chart_type,
        service_id,
        shortcut_code: normalizedShortcut,
        content,
        category: category || (is_personal ? 'personal' : 'hospital'),
        is_personal,
        employee_id: is_personal ? employee_id : null,
        is_active,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 단축 코드입니다.' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Quick Text 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Quick Text 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// Quick Text 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Quick Text ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 단축 코드 보정
    if (updateData.shortcut_code && !updateData.shortcut_code.startsWith('#')) {
      updateData.shortcut_code = `#${updateData.shortcut_code}`
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('quick_texts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Quick Text 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Quick Text 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// Quick Text 삭제
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Quick Text ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 소프트 딜리트: is_active를 false로 변경
    const { data, error } = await supabase
      .from('quick_texts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Quick Text 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Quick Text 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// Quick Text 사용 횟수 증가
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Quick Text ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용 횟수 증가
    const { data, error } = await supabase.rpc('increment_quick_text_usage', {
      text_id: id
    })

    if (error) {
      // RPC 함수가 없으면 직접 업데이트
      const { data: current } = await supabase
        .from('quick_texts')
        .select('usage_count')
        .eq('id', id)
        .single()

      if (current) {
        const { data: updated, error: updateError } = await supabase
          .from('quick_texts')
          .update({ 
            usage_count: (current.usage_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (updateError) throw updateError
        return NextResponse.json({ success: true, data: updated })
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Quick Text 사용 횟수 증가 오류:', error)
    return NextResponse.json(
      { success: false, error: '사용 횟수 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

