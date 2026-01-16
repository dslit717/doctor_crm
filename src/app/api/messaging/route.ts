import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Solapi API 호출
async function sendSolapi(to: string, content: string, type: 'SMS' | 'LMS' | 'MMS' = 'SMS') {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const sender = process.env.SOLAPI_SENDER

  if (!apiKey || !apiSecret || !sender) {
    throw new Error('Solapi 설정이 없습니다.')
  }

  const crypto = await import('crypto')
  const date = new Date().toISOString()
  const salt = crypto.randomUUID()
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex')

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
    },
    body: JSON.stringify({
      message: {
        to,
        from: sender,
        text: content,
        type
      }
    })
  })

  return response.json()
}

// 템플릿 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const channel = searchParams.get('channel')

    let query = supabase
      .from('message_templates')
      .select('*')
      .eq('is_active', true)
      .order('category')

    if (category) {
      query = query.eq('category', category)
    }

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('템플릿 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 메시지 발송
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_id,
      template_code,
      to,
      variables,
      custom_content
    } = body

    let content = custom_content
    let channel: 'sms' | 'lms' | 'mms' = 'sms'

    // 템플릿 사용 시
    if (template_code && !custom_content) {
      const { data: template } = await supabase
        .from('message_templates')
        .select('*')
        .eq('template_code', template_code)
        .single()

      if (!template) {
        return NextResponse.json(
          { success: false, error: '템플릿을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      content = template.content
      channel = template.channel as 'sms' | 'lms' | 'mms'

      // 변수 치환
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`#{${key}}`, 'g'), String(value))
        }
      }
    }

    if (!to || !content) {
      return NextResponse.json(
        { success: false, error: '수신자와 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 메시지 타입 결정
    const messageType = content.length > 90 ? 'LMS' : 'SMS'

    // Solapi 발송
    const result = await sendSolapi(to.replace(/-/g, ''), content, messageType)

    // 발송 이력 저장
    await supabase.from('notification_logs').insert({
      patient_id,
      notification_type: template_code || 'custom',
      channel: channel,
      recipient: to,
      content,
      status: result.statusCode === '2000' ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
      error_message: result.statusCode !== '2000' ? JSON.stringify(result) : null
    })

    return NextResponse.json({
      success: result.statusCode === '2000',
      data: result
    })
  } catch (error) {
    console.error('메시지 발송 오류:', error)
    return NextResponse.json(
      { success: false, error: '메시지 발송에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 대량 발송
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_ids,
      template_code,
      variables_map  // { patient_id: { key: value } }
    } = body

    if (!patient_ids || !patient_ids.length || !template_code) {
      return NextResponse.json(
        { success: false, error: '환자 목록과 템플릿이 필요합니다.' },
        { status: 400 }
      )
    }

    // 템플릿 조회
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('template_code', template_code)
      .single()

    if (!template) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 환자 정보 조회
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, phone')
      .in('id', patient_ids)
      .not('phone', 'is', null)

    const results = {
      total: patients?.length || 0,
      sent: 0,
      failed: 0
    }

    // 순차 발송 (대량 발송 시에는 큐 시스템 권장)
    for (const patient of patients || []) {
      try {
        let content = template.content
        const vars = {
          환자명: patient.name,
          ...((variables_map || {})[patient.id] || {})
        }

        for (const [key, value] of Object.entries(vars)) {
          content = content.replace(new RegExp(`#{${key}}`, 'g'), String(value))
        }

        const messageType = content.length > 90 ? 'LMS' : 'SMS'
        await sendSolapi(patient.phone.replace(/-/g, ''), content, messageType)
        results.sent++
      } catch {
        results.failed++
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('대량 발송 오류:', error)
    return NextResponse.json(
      { success: false, error: '대량 발송에 실패했습니다.' },
      { status: 500 }
    )
  }
}

