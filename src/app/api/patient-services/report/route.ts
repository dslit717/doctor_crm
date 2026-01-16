import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 서비스 이행 리포트
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)

    const reportType = searchParams.get('type') || 'summary'
    const patientId = searchParams.get('patient_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const staffId = searchParams.get('staff_id')

    // 1. 환자별 현황 리포트
    if (reportType === 'patient') {
      if (!patientId) {
        return NextResponse.json(
          { success: false, error: '환자 ID가 필요합니다.' },
          { status: 400 }
        )
      }

      const { data: services } = await supabase
        .from('patient_services')
        .select(`
          *,
          usage:service_usage(*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      const stats = {
        total: services?.length || 0,
        active: services?.filter(s => s.status === 'active').length || 0,
        completed: services?.filter(s => s.status === 'completed').length || 0,
        expired: services?.filter(s => s.status === 'expired').length || 0,
        totalSessions: services?.reduce((sum, s) => sum + (s.total_sessions || 0), 0) || 0,
        usedSessions: services?.reduce((sum, s) => sum + (s.used_sessions || 0), 0) || 0,
        remainingSessions: services?.reduce((sum, s) => sum + (s.remaining_sessions || 0), 0) || 0,
        totalAmount: services?.reduce((sum, s) => sum + (s.total_price || 0), 0) || 0
      }

      return NextResponse.json({
        success: true,
        data: {
          patient_id: patientId,
          services: services || [],
          stats
        }
      })
    }

    // 2. 서비스별 통계
    if (reportType === 'service') {
      let query = supabase
        .from('patient_services')
        .select('*')

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59')
      }

      const { data: services } = await query

      // 서비스명별 집계
      const serviceStats: Record<string, {
        count: number
        totalSessions: number
        usedSessions: number
        remainingSessions: number
        totalAmount: number
        avgUsageRate: number
      }> = {}

      ;(services || []).forEach(service => {
        const name = service.service_name || '미지정'
        if (!serviceStats[name]) {
          serviceStats[name] = {
            count: 0,
            totalSessions: 0,
            usedSessions: 0,
            remainingSessions: 0,
            totalAmount: 0,
            avgUsageRate: 0
          }
        }

        serviceStats[name].count++
        serviceStats[name].totalSessions += service.total_sessions || 0
        serviceStats[name].usedSessions += service.used_sessions || 0
        serviceStats[name].remainingSessions += service.remaining_sessions || 0
        serviceStats[name].totalAmount += service.total_price || 0
      })

      // 평균 사용률 계산
      Object.keys(serviceStats).forEach(name => {
        const stat = serviceStats[name]
        if (stat.totalSessions > 0) {
          stat.avgUsageRate = (stat.usedSessions / stat.totalSessions) * 100
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          serviceStats: Object.entries(serviceStats).map(([name, stats]) => ({
            service_name: name,
            ...stats
          }))
        }
      })
    }

    // 3. 미소진 분석
    if (reportType === 'unused') {
      const { data: services } = await supabase
        .from('patient_services')
        .select(`
          *,
          patient:patients(id, name, chart_no)
        `)
        .in('status', ['active', 'expired'])
        .order('expiry_date', { ascending: true, nullsFirst: false })

      const now = new Date()
      const expired = (services || []).filter(s => {
        if (!s.expiry_date) return false
        return new Date(s.expiry_date) < now
      })

      const expiring = (services || []).filter(s => {
        if (!s.expiry_date) return false
        const expiry = new Date(s.expiry_date)
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays <= 30 && diffDays > 0
      })

      const lowRemaining = (services || []).filter(s => {
        return s.remaining_sessions <= 2 && s.remaining_sessions > 0
      })

      const unused = (services || []).filter(s => {
        if (!s.created_at) return false
        const created = new Date(s.created_at)
        const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 30 && s.used_sessions === 0
      })

      return NextResponse.json({
        success: true,
        data: {
          expired: expired.length,
          expiring: expiring.length,
          lowRemaining: lowRemaining.length,
          unused: unused.length,
          expiredServices: expired,
          expiringServices: expiring,
          lowRemainingServices: lowRemaining,
          unusedServices: unused
        }
      })
    }

    // 4. 매출 인식 리포트
    if (reportType === 'revenue') {
      let query = supabase
        .from('patient_services')
        .select('*')

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59')
      }

      const { data: services } = await query

      // 선수금 (구매 금액)
      const prepaid = (services || []).reduce((sum, s) => sum + (s.total_price || 0), 0)

      // 실현 매출 (사용된 회차 기준)
      const realized = (services || []).reduce((sum, s) => {
        if (s.total_sessions > 0) {
          const sessionPrice = (s.total_price || 0) / s.total_sessions
          return sum + (sessionPrice * (s.used_sessions || 0))
        }
        return sum
      }, 0)

      // 미실현 매출 (잔여 회차 기준)
      const unrealized = prepaid - realized

      return NextResponse.json({
        success: true,
        data: {
          period: { start_date: startDate, end_date: endDate },
          prepaid,
          realized,
          unrealized,
          realizationRate: prepaid > 0 ? (realized / prepaid) * 100 : 0
        }
      })
    }

    // 5. 직원별 이행 통계
    if (reportType === 'staff') {
      let query = supabase
        .from('service_usage')
        .select(`
          *,
          service:patient_services(
            service_name,
            total_price,
            total_sessions
          )
        `)

      if (startDate) {
        query = query.gte('usage_date', startDate)
      }
      if (endDate) {
        query = query.lte('usage_date', endDate)
      }
      if (staffId) {
        query = query.eq('staff_id', staffId)
      }

      const { data: usages } = await query

      // 직원별 집계
      const staffStats: Record<string, {
        count: number
        services: string[]
        totalAmount: number
      }> = {}

      ;(usages || []).forEach(usage => {
        const staff = usage.staff_id || '미지정'
        if (!staffStats[staff]) {
          staffStats[staff] = {
            count: 0,
            services: [],
            totalAmount: 0
          }
        }

        staffStats[staff].count++
        const service = usage.service as any
        if (service?.service_name && !staffStats[staff].services.includes(service.service_name)) {
          staffStats[staff].services.push(service.service_name)
        }
        if (service?.total_price && service?.total_sessions) {
          const sessionPrice = service.total_price / service.total_sessions
          staffStats[staff].totalAmount += sessionPrice
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          staffStats: Object.entries(staffStats).map(([staff_id, stats]) => ({
            staff_id,
            ...stats
          }))
        }
      })
    }

    // 6. 요약 통계
    const { data: allServices } = await supabase
      .from('patient_services')
      .select('*')

    const summary = {
      total: allServices?.length || 0,
      active: allServices?.filter(s => s.status === 'active').length || 0,
      completed: allServices?.filter(s => s.status === 'completed').length || 0,
      expired: allServices?.filter(s => s.status === 'expired').length || 0,
      cancelled: allServices?.filter(s => s.status === 'cancelled').length || 0,
      totalSessions: allServices?.reduce((sum, s) => sum + (s.total_sessions || 0), 0) || 0,
      usedSessions: allServices?.reduce((sum, s) => sum + (s.used_sessions || 0), 0) || 0,
      remainingSessions: allServices?.reduce((sum, s) => sum + (s.remaining_sessions || 0), 0) || 0,
      totalAmount: allServices?.reduce((sum, s) => sum + (s.total_price || 0), 0) || 0,
      avgUsageRate: 0
    }

    if (summary.totalSessions > 0) {
      summary.avgUsageRate = (summary.usedSessions / summary.totalSessions) * 100
    }

    return NextResponse.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('서비스 이행 리포트 오류:', error)
    return NextResponse.json(
      { success: false, error: '리포트 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

