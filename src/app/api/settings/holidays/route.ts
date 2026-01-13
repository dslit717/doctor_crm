import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 휴무일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    let query = supabase
      .from('holidays')
      .select('*')
      .eq('is_active', true)
      .order('date')

    if (year) {
      query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Holidays fetch error:', error)
    return NextResponse.json({ success: false, error: '휴무일 조회 실패' }, { status: 500 })
  }
}

// 휴무일 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, name, type } = body

    const { data, error } = await supabase
      .from('holidays')
      .insert({ date, name, type: type || 'custom' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Holiday create error:', error)
    return NextResponse.json({ success: false, error: '휴무일 등록 실패' }, { status: 500 })
  }
}

// 휴무일 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID 필요' }, { status: 400 })
    }

    const { error } = await supabase
      .from('holidays')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Holiday delete error:', error)
    return NextResponse.json({ success: false, error: '휴무일 삭제 실패' }, { status: 500 })
  }
}

