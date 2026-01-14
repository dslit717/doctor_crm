import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 결제 정산 리포트
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const reportType = searchParams.get('type') || 'daily'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // 1. 일일 정산
    if (reportType === 'daily') {
      // 해당 날짜 결제 내역
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          *,
          patient:patients(name, chart_no),
          details:payment_details(*)
        `)
        .eq('payment_date', date)
        .not('status', 'eq', 'cancelled')

      // 결제 수단별 집계
      const methodSummary: Record<string, { count: number; amount: number }> = {
        cash: { count: 0, amount: 0 },
        card: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        kakaopay: { count: 0, amount: 0 },
        naverpay: { count: 0, amount: 0 },
        point: { count: 0, amount: 0 }
      }

      let totalAmount = 0
      let totalPaid = 0
      let totalUnpaid = 0

      ;(payments || []).forEach(payment => {
        totalAmount += Number(payment.total_amount) || 0
        totalPaid += Number(payment.paid_amount) || 0
        totalUnpaid += Number(payment.unpaid_amount) || 0

        // 결제 수단별 집계
        ;(payment.details || []).forEach((detail: { method: string; amount: number }) => {
          const method = detail.method
          if (methodSummary[method]) {
            methodSummary[method].count++
            methodSummary[method].amount += Number(detail.amount) || 0
          }
        })
      })

      // 환불 내역
      const { data: refunds } = await supabase
        .from('refunds')
        .select('*')
        .eq('refund_date', date)
        .eq('status', 'completed')

      const totalRefund = (refunds || []).reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0)

      return NextResponse.json({
        success: true,
        data: {
          date,
          summary: {
            totalAmount,
            totalPaid,
            totalUnpaid,
            totalRefund,
            netAmount: totalPaid - totalRefund,
            paymentCount: payments?.length || 0,
            refundCount: refunds?.length || 0
          },
          methodSummary,
          payments,
          refunds
        }
      })
    }

    // 2. 기간별 매출 통계
    if (reportType === 'period') {
      const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
      const end = endDate || new Date().toISOString().split('T')[0]

      const { data: payments } = await supabase
        .from('payments')
        .select('payment_date, total_amount, paid_amount')
        .gte('payment_date', start)
        .lte('payment_date', end)
        .not('status', 'eq', 'cancelled')

      // 일별 집계
      const dailyStats: Record<string, { total: number; paid: number; count: number }> = {}

      ;(payments || []).forEach(p => {
        const date = p.payment_date
        if (!dailyStats[date]) {
          dailyStats[date] = { total: 0, paid: 0, count: 0 }
        }
        dailyStats[date].total += Number(p.total_amount) || 0
        dailyStats[date].paid += Number(p.paid_amount) || 0
        dailyStats[date].count++
      })

      // 날짜순 정렬
      const sortedStats = Object.entries(dailyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats }))

      // 합계
      const totalStats = sortedStats.reduce(
        (acc, s) => ({
          total: acc.total + s.total,
          paid: acc.paid + s.paid,
          count: acc.count + s.count
        }),
        { total: 0, paid: 0, count: 0 }
      )

      return NextResponse.json({
        success: true,
        data: {
          period: { start, end },
          dailyStats: sortedStats,
          totalStats
        }
      })
    }

    // 3. 미수금 현황
    if (reportType === 'unpaid') {
      const { data: unpaidPayments } = await supabase
        .from('payments')
        .select(`
          *,
          patient:patients(id, name, chart_no, phone)
        `)
        .gt('unpaid_amount', 0)
        .in('status', ['pending', 'partial'])
        .order('payment_date', { ascending: true })

      // 기간별 분류
      const now = new Date()
      type PaymentItem = NonNullable<typeof unpaidPayments>[number]
      const classified: {
        within7days: PaymentItem[]
        within30days: PaymentItem[]
        over30days: PaymentItem[]
      } = {
        within7days: [],
        within30days: [],
        over30days: []
      }

      ;(unpaidPayments || []).forEach(p => {
        const paymentDate = new Date(p.payment_date)
        const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff <= 7) {
          classified.within7days.push(p)
        } else if (daysDiff <= 30) {
          classified.within30days.push(p)
        } else {
          classified.over30days.push(p)
        }
      })

      const totalUnpaid = (unpaidPayments || []).reduce(
        (sum, p) => sum + (Number(p.unpaid_amount) || 0), 
        0
      )

      return NextResponse.json({
        success: true,
        data: {
          totalUnpaid,
          totalCount: unpaidPayments?.length || 0,
          classified,
          summary: {
            within7days: {
              count: classified.within7days.length,
              amount: classified.within7days.reduce((s, p) => s + (Number(p.unpaid_amount) || 0), 0)
            },
            within30days: {
              count: classified.within30days.length,
              amount: classified.within30days.reduce((s, p) => s + (Number(p.unpaid_amount) || 0), 0)
            },
            over30days: {
              count: classified.over30days.length,
              amount: classified.over30days.reduce((s, p) => s + (Number(p.unpaid_amount) || 0), 0)
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: '알 수 없는 리포트 타입입니다.'
    }, { status: 400 })

  } catch (error) {
    console.error('정산 리포트 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '정산 리포트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

