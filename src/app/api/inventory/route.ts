import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 재고 품목 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const lowStock = searchParams.get('low_stock') // 재고 부족 필터

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('item_name')

    if (category) query = query.eq('category', category)
    if (search) query = query.or(`item_name.ilike.%${search}%,item_code.ilike.%${search}%`)

    const { data, error } = await query

    if (error) throw error

    // 재고 부족 필터링 (클라이언트 사이드)
    let filteredData = data
    if (lowStock === 'true') {
      filteredData = data?.filter(item => (item.current_stock ?? 0) <= (item.min_stock || 0)) || []
    }

    return NextResponse.json({ success: true, data: filteredData })
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json({ success: false, error: '재고 조회 실패' }, { status: 500 })
  }
}

// 품목 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Inventory create error:', error)
    return NextResponse.json({ success: false, error: '품목 등록 실패' }, { status: 500 })
  }
}

// 품목 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase
      .from('inventory_items')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Inventory update error:', error)
    return NextResponse.json({ success: false, error: '품목 수정 실패' }, { status: 500 })
  }
}

