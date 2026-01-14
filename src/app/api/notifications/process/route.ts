import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 자동 알림 처리 (cron job에서 호출)
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { category } = await req.json()

    // 활성화된 알림 설정 조회
    let query = supabase
      .from('notification_settings')
      .select('*')
      .eq('is_enabled', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: settings, error: settingsError } = await query

    if (settingsError) throw settingsError

    const results = {
      processed: 0,
      sent: 0,
      failed: 0
    }

    for (const setting of settings || []) {
      try {
        const processed = await processNotification(supabase, setting)
        results.processed++
        results.sent += processed.sent
        results.failed += processed.failed
      } catch (error) {
        console.error(`알림 처리 오류 (${setting.category}):`, error)
        results.failed++
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('자동 알림 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '자동 알림 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

interface NotificationSetting {
  category: string
  template_code: string
  timing?: { days_before?: number; days_after?: number }
  conditions?: Record<string, unknown>
  [key: string]: unknown
}

async function processNotification(
  supabase: ReturnType<typeof getSupabaseServer>,
  setting: NotificationSetting
) {
  const { category, template_code, timing, conditions } = setting
  const result = { sent: 0, failed: 0 }

  // 예약 리마인드
  if (category === 'reservation_reminder') {
    const daysBefore = timing?.days_before || 1
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysBefore)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // 해당 날짜 예약 조회
    const { data: reservations } = await supabase
      .from('reservations')
      .select(`
        *,
        patient:patients(id, name, phone)
      `)
      .eq('status', 'reservation')
      .gte('date', `${targetDateStr}T00:00:00`)
      .lte('date', `${targetDateStr}T23:59:59`)
      .not('patient.phone', 'is', null)

    for (const reservation of reservations || []) {
      if (!reservation.patient?.phone) continue

      // 이미 발송했는지 확인
      const { data: existing } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('patient_id', reservation.patient_id)
        .eq('notification_type', template_code)
        .gte('sent_at', `${targetDateStr}T00:00:00`)
        .single()

      if (existing) continue

      // 메시지 발송
      try {
        await sendNotification(supabase, {
          patient_id: reservation.patient_id,
          template_code,
          to: reservation.patient.phone,
          variables: {
            이름: reservation.patient.name,
            예약일시: new Date(reservation.date).toLocaleString('ko-KR')
          }
        })
        result.sent++
      } catch {
        result.failed++
      }
    }
  }

  // 시술 후 안내
  if (category === 'treatment_aftercare') {
    const daysAfter = timing?.days_after || 0
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - daysAfter)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // 해당 날짜 완료된 예약 조회
    const { data: reservations } = await supabase
      .from('reservations')
      .select(`
        *,
        patient:patients(id, name, phone),
        service:services(name)
      `)
      .eq('status', 'completed')
      .gte('date', `${targetDateStr}T00:00:00`)
      .lte('date', `${targetDateStr}T23:59:59`)
      .not('patient.phone', 'is', null)

    for (const reservation of reservations || []) {
      if (!reservation.patient?.phone) continue

      // 이미 발송했는지 확인
      const { data: existing } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('patient_id', reservation.patient_id)
        .eq('notification_type', template_code)
        .eq('reference_id', reservation.id)
        .single()

      if (existing) continue

      // 메시지 발송
      try {
        await sendNotification(supabase, {
          patient_id: reservation.patient_id,
          template_code,
          to: reservation.patient.phone,
          variables: {
            이름: reservation.patient.name,
            시술명: reservation.service?.name || '시술'
          }
        })
        result.sent++
      } catch {
        result.failed++
      }
    }
  }

  return result
}

async function sendNotification(
  supabase: ReturnType<typeof getSupabaseServer>,
  params: {
  patient_id: string
  template_code: string
  to: string
  variables: Record<string, string>
}) {
  // 메시징 API 호출
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/messaging`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    throw new Error('메시지 발송 실패')
  }

  return response.json()
}

