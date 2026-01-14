import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 재고 리포트/통계 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const reportType = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const category = searchParams.get('category')

    // 1. 재고 요약 통계
    if (reportType === 'summary') {
      // 전체 품목 수
      const { count: totalItems } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 재고 부족 품목
      const { data: lowStockItems } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true)
        .not('min_stock', 'is', null)

      const lowStockCount = (lowStockItems || []).filter(
        item => (item.current_stock || 0) <= (item.min_stock || 0)
      ).length

      // 카테고리별 품목 수
      const { data: categoryStats } = await supabase
        .from('inventory_items')
        .select('category')
        .eq('is_active', true)

      const categoryCount: Record<string, number> = {}
      ;(categoryStats || []).forEach(item => {
        const cat = item.category || '미분류'
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })

      // 총 재고 가치
      const { data: stockValue } = await supabase
        .from('inventory_items')
        .select('current_stock, base_price')
        .eq('is_active', true)

      const totalValue = (stockValue || []).reduce((sum, item) => {
        return sum + ((item.current_stock || 0) * (item.base_price || 0))
      }, 0)

      return NextResponse.json({
        success: true,
        data: {
          totalItems: totalItems || 0,
          lowStockCount,
          totalValue,
          categoryCount
        }
      })
    }

    // 2. 입출고 통계
    if (reportType === 'transactions') {
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          item:inventory_items(item_name, category)
        `)
        .order('created_at', { ascending: false })

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59')
      }

      const { data: transactions } = await query

      // 유형별 집계
      const stats = {
        in: { count: 0, quantity: 0, amount: 0 },
        out: { count: 0, quantity: 0, amount: 0 },
        adjust: { count: 0, quantity: 0 },
        disposal: { count: 0, quantity: 0 }
      }

      ;(transactions || []).forEach(tx => {
        const type = tx.transaction_type as keyof typeof stats
        if (stats[type]) {
          stats[type].count++
          stats[type].quantity += Math.abs(tx.quantity || 0)
          if ('amount' in stats[type]) {
            (stats[type] as { amount: number }).amount += tx.total_price || 0
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          stats,
          recentTransactions: (transactions || []).slice(0, 20)
        }
      })
    }

    // 3. 품목별 회전율
    if (reportType === 'turnover') {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('id, item_code, item_name, category, current_stock, base_price')
        .eq('is_active', true)

      // 최근 30일 출고량
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: outTransactions } = await supabase
        .from('inventory_transactions')
        .select('item_id, quantity')
        .eq('transaction_type', 'out')
        .gte('created_at', thirtyDaysAgo.toISOString())

      // 품목별 출고량 집계
      const outByItem: Record<string, number> = {}
      ;(outTransactions || []).forEach(tx => {
        outByItem[tx.item_id] = (outByItem[tx.item_id] || 0) + Math.abs(tx.quantity)
      })

      // 회전율 계산 (월 출고량 / 평균 재고)
      const turnoverData = (items || []).map(item => {
        const monthlyOut = outByItem[item.id] || 0
        const avgStock = item.current_stock || 1
        const turnoverRate = avgStock > 0 ? (monthlyOut / avgStock) : 0

        return {
          ...item,
          monthlyOut,
          turnoverRate: Math.round(turnoverRate * 100) / 100
        }
      }).sort((a, b) => b.turnoverRate - a.turnoverRate)

      return NextResponse.json({
        success: true,
        data: turnoverData
      })
    }

    // 4. 유통기한 임박 품목
    if (reportType === 'expiring') {
      const days = parseInt(searchParams.get('days') || '30')
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      const { data: expiringItems } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          item:inventory_items(item_code, item_name, category)
        `)
        .eq('transaction_type', 'in')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      return NextResponse.json({
        success: true,
        data: expiringItems || []
      })
    }

    return NextResponse.json({
      success: false,
      error: '알 수 없는 리포트 타입입니다.'
    }, { status: 400 })

  } catch (error) {
    console.error('재고 리포트 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '재고 리포트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

