import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 운영 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const { data, error } = await supabase
        .from('operation_settings')
        .select('*')
        .eq('setting_key', key)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return NextResponse.json({ success: true, data })
    }

    const { data, error } = await supabase
      .from('operation_settings')
      .select('*')

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ success: false, error: '설정 조회 실패' }, { status: 500 })
  }
}

// 운영 설정 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { setting_key, setting_value, updated_by } = body

    const { data, error } = await supabase
      .from('operation_settings')
      .upsert({
        setting_key,
        setting_value,
        updated_at: new Date().toISOString(),
        updated_by,
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Settings save error:', error)
    return NextResponse.json({ success: false, error: '설정 저장 실패' }, { status: 500 })
  }
}

