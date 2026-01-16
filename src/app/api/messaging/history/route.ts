import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 발송 이력 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const patientId = searchParams.get('patient_id')
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('notification_logs')
      .select(`
        *,
        patient:patients(id, name, phone)
      `, { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (channel) {
      query = query.eq('channel', channel)
    }

    if (startDate) {
      query = query.gte('sent_at', startDate)
    }

    if (endDate) {
      query = query.lte('sent_at', endDate)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('발송 이력 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '발송 이력을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}


