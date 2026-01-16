import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Solapi API 호출 함수
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

// 서비스 이행 알림 생성 및 발송
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const { action } = body // 'check_all' | 'send_notification'

    if (action === 'check_all') {
      // 모든 알림 조건 체크
      const now = new Date()
      const alerts: Array<{
        service_id: string
        patient_id: string
        patient_name: string
        alert_type: string
        message: string
      }> = []

      // 1. 잔여 회차 알림 (1~2회 시)
      const { data: lowRemaining } = await supabase
        .from('patient_services')
        .select(`
          id,
          patient_id,
          service_name,
          remaining_sessions,
          patient:patients(name, phone)
        `)
        .eq('status', 'active')
        .lte('remaining_sessions', 2)
        .gt('remaining_sessions', 0)

      ;(lowRemaining || []).forEach(service => {
        const patient = service.patient as any
        alerts.push({
          service_id: service.id,
          patient_id: service.patient_id,
          patient_name: patient?.name || '',
          alert_type: 'low_remaining',
          message: `${patient?.name || ''}님의 ${service.service_name} 서비스 잔여 회차가 ${service.remaining_sessions}회 남았습니다.`
        })
      })

      // 2. 유효기간 알림 (30/14/7일 전)
      const { data: expiring } = await supabase
        .from('patient_services')
        .select(`
          id,
          patient_id,
          service_name,
          expiry_date,
          patient:patients(name, phone)
        `)
        .eq('status', 'active')
        .not('expiry_date', 'is', null)

      ;(expiring || []).forEach(service => {
        if (!service.expiry_date) return
        const expiry = new Date(service.expiry_date)
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const patient = service.patient as any

        if (diffDays === 30 || diffDays === 14 || diffDays === 7) {
          alerts.push({
            service_id: service.id,
            patient_id: service.patient_id,
            patient_name: patient?.name || '',
            alert_type: 'expiring',
            message: `${patient?.name || ''}님의 ${service.service_name} 서비스 유효기간이 ${diffDays}일 남았습니다.`
          })
        }
      })

      // 3. 미사용 알림 (구매 후 30일 이상 미사용)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const { data: unused } = await supabase
        .from('patient_services')
        .select(`
          id,
          patient_id,
          service_name,
          created_at,
          used_sessions,
          patient:patients(name, phone)
        `)
        .eq('status', 'active')
        .eq('used_sessions', 0)
        .lte('created_at', thirtyDaysAgo.toISOString())

      ;(unused || []).forEach(service => {
        const patient = service.patient as any
        alerts.push({
          service_id: service.id,
          patient_id: service.patient_id,
          patient_name: patient?.name || '',
          alert_type: 'unused',
          message: `${patient?.name || ''}님의 ${service.service_name} 서비스가 구매 후 30일 이상 미사용 상태입니다.`
        })
      })

      // 4. 소진 완료 알림 (최근 7일 내 완료된 서비스만)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const { data: completed } = await supabase
        .from('patient_services')
        .select(`
          id,
          patient_id,
          service_name,
          updated_at,
          patient:patients(name, phone)
        `)
        .eq('status', 'completed')
        .eq('remaining_sessions', 0)
        .gte('updated_at', sevenDaysAgo.toISOString())

      // 이미 발송된 알림 확인
      if (completed && completed.length > 0) {
        const serviceIds = completed.map(s => s.id)
        const { data: sentNotifications } = await supabase
          .from('notification_logs')
          .select('reference_id')
          .eq('reference_type', 'patient_service')
          .eq('notification_type', 'completed')
          .eq('status', 'sent')
          .in('reference_id', serviceIds)

        const sentServiceIds = new Set((sentNotifications || []).map(n => n.reference_id))

        completed.forEach(service => {
          // 이미 발송된 알림은 제외
          if (sentServiceIds.has(service.id)) return

          const patient = service.patient as any
          alerts.push({
            service_id: service.id,
            patient_id: service.patient_id,
            patient_name: patient?.name || '',
            alert_type: 'completed',
            message: `${patient?.name || ''}님의 ${service.service_name} 서비스가 모두 소진되었습니다. 재구매를 안내해주세요.`
          })
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          alerts,
          count: alerts.length
        }
      })
    }

    if (action === 'send_notification') {
      const { service_id, alert_type, message, patient_id } = body

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, name, phone, sms_consent')
        .eq('id', patient_id)
        .single()

      if (patientError || !patient) {
        return NextResponse.json(
          { success: false, error: '환자 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      if (!patient.phone) {
        return NextResponse.json(
          { success: false, error: '환자 전화번호가 등록되어 있지 않습니다.' },
          { status: 400 }
        )
      }

      if (!patient.sms_consent) {
        return NextResponse.json(
          { success: false, error: '환자가 SMS 수신에 동의하지 않았습니다.' },
          { status: 400 }
        )
      }

      let sendResult: any = null
      let sendStatus = 'failed'
      let errorMessage: string | null = null

      try {
        const phoneNumber = patient.phone.replace(/-/g, '')
        
        const messageType = message.length > 90 ? 'LMS' : 'SMS'
        
        const result = await sendSolapi(phoneNumber, message, messageType)
        
        if (result.statusCode === '2000') {
          sendStatus = 'sent'
          sendResult = result
        } else {
          sendStatus = 'failed'
          errorMessage = result.errorMessage || JSON.stringify(result)
          console.error('Solapi 발송 실패:', result)
        }
      } catch (error) {
        sendStatus = 'failed'
        errorMessage = error instanceof Error ? error.message : '메시지 발송 중 오류 발생'
        console.error('SMS 발송 오류:', error)
      }

      try {
        const { error: logError } = await supabase
          .from('notification_logs')
          .insert({
            patient_id,
            reference_id: service_id,
            reference_type: 'patient_service',
            notification_type: alert_type,
            title: '서비스 알림',
            content: message,
            channel: 'sms',
            recipient: patient.phone,
            status: sendStatus,
            sent_at: sendStatus === 'sent' ? new Date().toISOString() : null,
            error_message: errorMessage,
            created_at: new Date().toISOString()
          })

        if (logError) {
          console.error('알림 이력 저장 오류:', logError)
          // 이력 저장 실패해도 발송 결과는 반환
        }
      } catch (logErr) {
        console.error('알림 이력 저장 중 예외 발생:', logErr)
      }

      if (sendStatus === 'failed') {
        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage || '알림 발송에 실패했습니다.',
            data: { message: '알림 발송 실패' }
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { 
          message: '알림이 발송되었습니다.',
          recipient: patient.phone,
          result: sendResult
        }
      })
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 작업입니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('서비스 알림 처리 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알림 처리에 실패했습니다.'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

