import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 결제 목록 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const patientId = searchParams.get('patient_id')
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('payments')
      .select(`
        *,
        patient:patients(id, name, chart_no, phone),
        items:payment_items(*),
        details:payment_details(*)
      `, { count: 'exact' })
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('payment_date', startDate)
    }

    if (endDate) {
      query = query.lte('payment_date', endDate)
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
    console.error('결제 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '결제 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 결제 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_id,
      reservation_id,
      items,
      payment_methods,
      memo
    } = body

    // 결제번호 생성
    const today = new Date()
    const prefix = `PAY${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    
    const { data: lastPayment } = await supabase
      .from('payments')
      .select('payment_no')
      .like('payment_no', `${prefix}%`)
      .order('payment_no', { ascending: false })
      .limit(1)
      .single()

    let paymentNo = `${prefix}001`
    if (lastPayment?.payment_no) {
      const lastNum = parseInt(lastPayment.payment_no.slice(-3)) || 0
      paymentNo = `${prefix}${String(lastNum + 1).padStart(3, '0')}`
    }

    // 총액 계산
    const totalAmount = items.reduce((sum: number, item: { total_price: number }) => sum + item.total_price, 0)
    const paidAmount = payment_methods.reduce((sum: number, pm: { amount: number }) => sum + pm.amount, 0)

    // 결제 상태 결정
    let status = 'pending'
    if (paidAmount >= totalAmount) {
      status = 'completed'
    } else if (paidAmount > 0) {
      status = 'partial'
    }

    // 1. 메인 결제 생성
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        patient_id,
        reservation_id,
        payment_no: paymentNo,
        payment_date: today.toISOString().split('T')[0],
        total_amount: totalAmount,
        paid_amount: paidAmount,
        status,
        memo
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // 2. 결제 항목 생성
    if (items && items.length > 0) {
      const paymentItems = items.map((item: {
        item_name: string
        item_type?: string
        quantity?: number
        unit_price: number
        discount_amount?: number
        tax_type?: string
        total_price: number
        memo?: string
      }) => ({
        payment_id: payment.id,
        item_name: item.item_name,
        item_type: item.item_type || 'treatment',
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        tax_type: item.tax_type || 'taxable',
        total_price: item.total_price,
        memo: item.memo
      }))

      const { error: itemsError } = await supabase
        .from('payment_items')
        .insert(paymentItems)

      if (itemsError) throw itemsError
    }

    // 3. 결제 수단 생성
    if (payment_methods && payment_methods.length > 0) {
      const paymentDetails = payment_methods.map((pm: {
        method: string
        amount: number
        card_company?: string
        card_number?: string
        installment?: number
        approval_no?: string
        cash_receipt?: boolean
      }) => ({
        payment_id: payment.id,
        method: pm.method,
        amount: pm.amount,
        card_company: pm.card_company,
        card_number: pm.card_number,
        installment: pm.installment || 0,
        approval_no: pm.approval_no,
        cash_receipt: pm.cash_receipt || false
      }))

      const { error: detailsError } = await supabase
        .from('payment_details')
        .insert(paymentDetails)

      if (detailsError) throw detailsError
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error('결제 등록 오류:', error)
    return NextResponse.json(
      { success: false, error: '결제 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 결제 수정 (추가 수납)
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { id, additional_payment, memo } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '결제 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 결제 조회
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingPayment) {
      return NextResponse.json(
        { success: false, error: '결제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 추가 결제 처리
    if (additional_payment) {
      const newPaidAmount = Number(existingPayment.paid_amount) + Number(additional_payment.amount)
      let newStatus = existingPayment.status

      if (newPaidAmount >= Number(existingPayment.total_amount)) {
        newStatus = 'completed'
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      // 결제 수단 추가
      const { error: detailError } = await supabase
        .from('payment_details')
        .insert({
          payment_id: id,
          method: additional_payment.method,
          amount: additional_payment.amount,
          card_company: additional_payment.card_company,
          card_number: additional_payment.card_number,
          installment: additional_payment.installment || 0,
          approval_no: additional_payment.approval_no,
          cash_receipt: additional_payment.cash_receipt || false
        })

      if (detailError) throw detailError

      // 결제 업데이트
      const { data, error } = await supabase
        .from('payments')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          memo: memo || existingPayment.memo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data })
    }

    // 메모만 업데이트
    const { data, error } = await supabase
      .from('payments')
      .update({
        memo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('결제 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '결제 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 결제 취소
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '결제 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('결제 취소 오류:', error)
    return NextResponse.json(
      { success: false, error: '결제 취소에 실패했습니다.' },
      { status: 500 }
    )
  }
}

