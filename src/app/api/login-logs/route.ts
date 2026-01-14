import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 로그인 이력 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = request.nextUrl.searchParams
    
    // 필터 파라미터
    const employeeId = searchParams.get('employeeId')
    const isSuccess = searchParams.get('isSuccess')
    const ipAddress = searchParams.get('ipAddress')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 쿼리 빌드
    let query = supabase
      .from('login_logs')
      .select(`
        *,
        employee:employees (
          id,
          name,
          email,
          employee_no
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    if (isSuccess !== null && isSuccess !== undefined) {
      query = query.eq('is_success', isSuccess === 'true')
    }
    if (ipAddress) {
      query = query.ilike('ip_address', `%${ipAddress}%`)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Login logs error:', error)
    return NextResponse.json(
      { success: false, error: '로그인 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 로그인 통계 조회
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { type, startDate, endDate } = body

    if (type === 'failed_attempts') {
      // 실패한 로그인 시도 통계 (IP별)
      const { data, error } = await supabase
        .from('login_logs')
        .select('ip_address')
        .eq('is_success', false)
        .gte('created_at', startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate || new Date().toISOString())

      if (error) throw error

      // IP별 실패 횟수 집계
      const failedByIp = data?.reduce((acc, log) => {
        acc[log.ip_address] = (acc[log.ip_address] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // 5회 이상 실패한 IP 필터링 (잠재적 공격)
      const suspiciousIps = Object.entries(failedByIp || {})
        .filter(([_, count]) => count >= 5)
        .sort((a, b) => b[1] - a[1])

      return NextResponse.json({
        success: true,
        data: {
          totalFailedAttempts: data?.length || 0,
          suspiciousIps: suspiciousIps.map(([ip, count]) => ({ ip, count })),
        },
      })
    }

    if (type === 'daily_stats') {
      // 일별 로그인 통계
      const { data, error } = await supabase
        .from('login_logs')
        .select('created_at, is_success')
        .gte('created_at', startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate || new Date().toISOString())

      if (error) throw error

      // 일별 집계
      const dailyStats = data?.reduce((acc, log) => {
        const date = new Date(log.created_at!).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { success: 0, failed: 0 }
        }
        if (log.is_success) {
          acc[date].success++
        } else {
          acc[date].failed++
        }
        return acc
      }, {} as Record<string, { success: number; failed: number }>)

      return NextResponse.json({
        success: true,
        data: dailyStats,
      })
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 통계 유형입니다.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Login stats error:', error)
    return NextResponse.json(
      { success: false, error: '로그인 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

