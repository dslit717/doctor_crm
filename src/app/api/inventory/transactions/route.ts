import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 입출고 내역 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const searchParams = req.nextUrl.searchParams
    const itemId = searchParams.get('item_id')
    const type = searchParams.get('type')

    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        item:inventory_items(id, item_code, item_name),
        performer:employees(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (itemId) query = query.eq('item_id', itemId)
    if (type) query = query.eq('transaction_type', type)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Transaction fetch error:', error)
    return NextResponse.json({ success: false, error: '입출고 내역 조회 실패' }, { status: 500 })
  }
}

// 입출고 처리
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { item_id, transaction_type, quantity, unit_price, lot_number, expiry_date, reason, performed_by } = body

    // 1. 트랜잭션 기록
    const { data: transaction, error: txError } = await supabase
      .from('inventory_transactions')
      .insert({
        item_id,
        transaction_type,
        quantity,
        unit_price,
        total_price: unit_price ? unit_price * quantity : null,
        lot_number,
        expiry_date,
        reason,
        performed_by,
      })
      .select()
      .single()

    if (txError) throw txError

    // 2. 재고 수량 업데이트
    const { data: item } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', item_id)
      .single()

    const currentStock = item?.current_stock || 0
    let newStock = currentStock

    if (transaction_type === 'in') {
      newStock = currentStock + quantity
    } else if (transaction_type === 'out' || transaction_type === 'dispose') {
      newStock = currentStock - quantity
    } else if (transaction_type === 'adjust') {
      newStock = quantity // 실사 조정은 절대값
    } else if (transaction_type === 'return') {
      newStock = currentStock + quantity
    }

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', item_id)

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      data: transaction,
      message: `${transaction_type === 'in' ? '입고' : '출고'} 처리 완료`
    })
  } catch (error) {
    console.error('Transaction error:', error)
    return NextResponse.json({ success: false, error: '입출고 처리 실패' }, { status: 500 })
  }
}

