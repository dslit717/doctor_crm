import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 자동 알림 설정 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')

    if (error) {
      console.error('알림 설정 조회 오류:', error)
      // 테이블이 없거나 필드가 없을 경우 빈 배열 반환
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('column')) {
        return NextResponse.json({ success: true, data: [] })
      }
      throw error
    }

    // category 필드가 있으면 정렬, 없으면 그대로 반환
    interface NotificationSetting {
      category?: string
      [key: string]: unknown
    }
    
    const sortedData = data && data.length > 0 && 'category' in data[0]
      ? [...(data || [])].sort((a: NotificationSetting, b: NotificationSetting) => 
          (a.category || '').localeCompare(b.category || ''))
      : data || []

    return NextResponse.json({ success: true, data: sortedData })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알림 설정 조회 중 오류가 발생했습니다.'
    console.error('알림 설정 조회 오류:', error)
    // 에러가 발생해도 빈 배열 반환하여 UI가 깨지지 않도록 함
    return NextResponse.json({ 
      success: true, 
      data: []
    })
  }
}

// 자동 알림 설정 저장
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      category,
      is_enabled,
      template_code,
      timing,
      conditions
    } = body

    if (!category || !template_code) {
      return NextResponse.json(
        { success: false, error: '카테고리와 템플릿 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 설정 확인
    const { data: existing } = await supabase
      .from('notification_settings')
      .select('id')
      .eq('category', category)
      .single()

    let result
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          is_enabled: is_enabled !== undefined ? is_enabled : true,
          template_code,
          timing: timing || null,
          conditions: conditions || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // 생성
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          category,
          is_enabled: is_enabled !== undefined ? is_enabled : true,
          template_code,
          timing: timing || null,
          conditions: conditions || null
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('알림 설정 저장 오류:', error)
    return NextResponse.json(
      { success: false, error: '알림 설정 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

