import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 환자 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = getSupabaseServer()
    const { patientId } = params

    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        primary_counselor:employees!patients_primary_counselor_id_fkey(id, name),
        primary_doctor:employees!patients_primary_doctor_id_fkey(id, name)
      `)
      .eq('id', patientId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '환자를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('환자 상세 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '환자 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}


