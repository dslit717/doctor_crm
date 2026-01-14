import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 동의서 템플릿/서명 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const type = searchParams.get('type') // templates, patient
    const patientId = searchParams.get('patient_id')

    // 템플릿 목록
    if (type === 'templates') {
      const { data, error } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('is_active', true)
        .order('category')

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    // 환자 동의서
    if (type === 'patient' && patientId) {
      const { data, error } = await supabase
        .from('patient_consents')
        .select(`
          *,
          template:consent_templates(id, name, category, is_required)
        `)
        .eq('patient_id', patientId)
        .order('signed_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json(
      { success: false, error: '타입을 지정해주세요.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('동의서 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '동의서를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 동의서 서명
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_id,
      template_id,
      signature_data,
      ip_address,
      device_info
    } = body

    // 템플릿 정보 조회
    const { data: template } = await supabase
      .from('consent_templates')
      .select('version, validity_days')
      .eq('id', template_id)
      .single()

    let expiresAt = null
    if (template?.validity_days) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + template.validity_days)
      expiresAt = expiry.toISOString()
    }

    // 기존 동의서 만료 처리
    await supabase
      .from('patient_consents')
      .update({ status: 'expired' })
      .eq('patient_id', patient_id)
      .eq('template_id', template_id)
      .eq('status', 'active')

    // 새 동의서 서명
    const { data, error } = await supabase
      .from('patient_consents')
      .insert({
        patient_id,
        template_id,
        template_version: template?.version || 1,
        signature_data,
        ip_address,
        device_info,
        expires_at: expiresAt,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('동의서 서명 오류:', error)
    return NextResponse.json(
      { success: false, error: '동의서 서명에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 동의서 철회
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
      .from('patient_consents')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('동의서 철회 오류:', error)
    return NextResponse.json(
      { success: false, error: '동의서 철회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

