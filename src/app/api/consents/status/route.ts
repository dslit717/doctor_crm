import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 환자별 동의서 서명 현황 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const patientId = searchParams.get('patient_id')
    const templateId = searchParams.get('template_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('patient_consents')
      .select(`
        *,
        patient:patients(id, name, chart_no),
        template:consent_templates(id, name, category, is_required)
      `, { count: 'exact' })
      .order('signed_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    if (status) {
      query = query.eq('status', status)
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
    console.error('동의서 현황 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '동의서 현황을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}


