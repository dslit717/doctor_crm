import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const sessionToken = request.cookies.get('session_token')?.value

    if (sessionToken) {
      // 세션 비활성화
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          logout_at: new Date().toISOString(),
        })
        .eq('session_token', sessionToken)

      // 감사 로그 기록
      const { data: session } = await supabase
        .from('user_sessions')
        .select('employee_id')
        .eq('session_token', sessionToken)
        .single()

      if (session) {
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ipAddress = forwardedFor?.split(',')[0].trim() || '127.0.0.1'

        await supabase.from('audit_logs').insert({
          employee_id: session.employee_id,
          action_type: 'logout',
          action_category: 'auth',
          action_detail: 'User logged out',
          ip_address: ipAddress,
          user_agent: request.headers.get('user-agent'),
        })
      }
    }

    // 쿠키 삭제
    const response = NextResponse.json({ success: true })
    response.cookies.delete('session_token')

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

