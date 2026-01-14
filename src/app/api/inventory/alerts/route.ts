import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// 재고 알림 조회 (부족 + 유통기한 임박)
export async function GET() {
  try {
    const supabase = getSupabaseServer()
    // 1. 재고 부족 품목
    const { data: items } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)

    const lowStockItems = items?.filter(item => 
      (item.current_stock ?? 0) <= (item.min_stock ?? 0)
    ) || []

    // 2. 유통기한 임박 품목 (30일 이내) - inventory_transactions에서 확인
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const { data: expiringItems } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        item:inventory_items(id, item_code, item_name)
      `)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysLater.toISOString().split('T')[0])
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date')

    return NextResponse.json({
      success: true,
      data: {
        lowStock: {
          count: lowStockItems.length,
          items: lowStockItems.map(item => ({
            id: item.id,
            item_code: item.item_code,
            item_name: item.item_name,
            current_stock: item.current_stock,
            min_stock: item.min_stock,
          }))
        },
        expiringSoon: {
          count: expiringItems?.length || 0,
          items: expiringItems?.map(tx => ({
            id: tx.id,
            item_name: tx.item?.item_name,
            lot_number: tx.lot_number,
            expiry_date: tx.expiry_date,
            quantity: tx.quantity,
          })) || []
        }
      }
    })
  } catch (error) {
    console.error('Inventory alerts error:', error)
    return NextResponse.json({ success: false, error: '알림 조회 실패' }, { status: 500 })
  }
}

