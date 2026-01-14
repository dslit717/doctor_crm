import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 유지보수 기록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipment_id')

    let query = supabase
      .from('equipment_maintenance')
      .select(`
        *,
        equipment:equipment(id, name, equipment_code)
      `)
      .order('maintenance_date', { ascending: false })

    if (equipmentId) query = query.eq('equipment_id', equipmentId)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Maintenance fetch error:', error)
    return NextResponse.json({ success: false, error: '유지보수 기록 조회 실패' }, { status: 500 })
  }
}

// 유지보수 기록 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { equipment_id, maintenance_type, maintenance_date, description, cost, performed_by, next_maintenance_date } = body

    // 1. 유지보수 기록 추가
    const { data, error } = await supabase
      .from('equipment_maintenance')
      .insert({
        equipment_id,
        maintenance_type,
        maintenance_date,
        description,
        cost,
        performed_by,
        next_maintenance_date,
      })
      .select()
      .single()

    if (error) throw error

    // 2. 장비의 다음 점검일 업데이트
    if (next_maintenance_date) {
      await supabase
        .from('equipment')
        .update({ 
          next_maintenance_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', equipment_id)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Maintenance create error:', error)
    return NextResponse.json({ success: false, error: '유지보수 기록 등록 실패' }, { status: 500 })
  }
}


