import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 서비스 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')

    let query = supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,service_code.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('서비스 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { data, error } = await supabase
      .from('services')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('서비스 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 수정
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('서비스 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 서비스 삭제 (비활성화)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('서비스 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '서비스 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

