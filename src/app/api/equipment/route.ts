import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 장비 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let query = supabase
      .from('equipment')
      .select('*')
      .order('name')

    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Equipment fetch error:', error)
    return NextResponse.json({ success: false, error: '장비 조회 실패' }, { status: 500 })
  }
}

// 장비 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { data, error } = await supabase
      .from('equipment')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Equipment create error:', error)
    return NextResponse.json({ success: false, error: '장비 등록 실패' }, { status: 500 })
  }
}

// 장비 수정
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase
      .from('equipment')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Equipment update error:', error)
    return NextResponse.json({ success: false, error: '장비 수정 실패' }, { status: 500 })
  }
}


