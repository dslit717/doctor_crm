import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 환불 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const paymentId = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('refunds')
      .select(`
        *,
        payment:payments(
          id, 
          payment_no, 
          total_amount,
          patient:patients(id, name, chart_no)
        ),
        approved_by_employee:employees!refunds_approved_by_fkey(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (paymentId) {
      query = query.eq('payment_id', paymentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('환불 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '환불 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 환불 신청
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      payment_id,
      refund_amount,
      refund_method,
      reason
    } = body

    // 결제 정보 확인
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 환불 가능 금액 확인
    if (refund_amount > payment.paid_amount) {
      return NextResponse.json(
        { success: false, error: '환불 금액이 수납액을 초과합니다.' },
        { status: 400 }
      )
    }

    // 환불번호 생성
    const today = new Date()
    const prefix = `REF${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    
    const { data: lastRefund } = await supabase
      .from('refunds')
      .select('refund_no')
      .like('refund_no', `${prefix}%`)
      .order('refund_no', { ascending: false })
      .limit(1)
      .single()

    let refundNo = `${prefix}001`
    if (lastRefund?.refund_no) {
      const lastNum = parseInt(lastRefund.refund_no.slice(-3)) || 0
      refundNo = `${prefix}${String(lastNum + 1).padStart(3, '0')}`
    }

    // 환불 생성
    const { data: refund, error } = await supabase
      .from('refunds')
      .insert({
        payment_id,
        refund_no: refundNo,
        refund_amount,
        refund_method,
        reason,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: refund })
  } catch (error) {
    console.error('환불 신청 오류:', error)
    return NextResponse.json(
      { success: false, error: '환불 신청에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 환불 승인/거절
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, action, approved_by } = body

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'ID와 액션이 필요합니다.' },
        { status: 400 }
      )
    }

    // 환불 정보 조회
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .select('*, payment:payments(*)')
      .eq('id', id)
      .single()

    if (refundError || !refund) {
      return NextResponse.json(
        { success: false, error: '환불 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (refund.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 환불입니다.' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // 환불 승인
      const { error: updateError } = await supabase
        .from('refunds')
        .update({
          status: 'completed',
          approved_by,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      // 결제 상태 업데이트
      const payment = refund.payment as { id: string; paid_amount: number; total_amount: number }
      const newPaidAmount = payment.paid_amount - refund.refund_amount
      
      let paymentStatus = 'partial'
      if (newPaidAmount <= 0) {
        paymentStatus = 'refunded'
      } else if (newPaidAmount >= payment.total_amount) {
        paymentStatus = 'completed'
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          paid_amount: Math.max(0, newPaidAmount),
          status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      if (paymentError) throw paymentError

    } else if (action === 'reject') {
      // 환불 거절
      const { error: updateError } = await supabase
        .from('refunds')
        .update({
          status: 'rejected',
          approved_by,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('환불 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '환불 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

