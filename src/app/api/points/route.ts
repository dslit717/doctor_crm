import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// 포인트 이력 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)
    
    const patientId = searchParams.get('patient_id')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('point_transactions')
      .select(`
        *,
        patient:patients(id, name, chart_no)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (type) {
      query = query.eq('transaction_type', type)
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
        total: count || 0
      }
    })
  } catch (error) {
    console.error('포인트 이력 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '포인트 이력을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 포인트 적립/사용
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      patient_id,
      transaction_type,
      amount,
      reference_type,
      reference_id,
      description,
      created_by
    } = body

    // 현재 포인트 잔액 조회
    const { data: patient } = await supabase
      .from('patients')
      .select('point_balance')
      .eq('id', patient_id)
      .single()

    const currentBalance = patient?.point_balance || 0
    let newBalance = currentBalance

    if (transaction_type === 'earn') {
      newBalance = currentBalance + amount
    } else if (transaction_type === 'use') {
      if (currentBalance < amount) {
        return NextResponse.json(
          { success: false, error: '포인트가 부족합니다.' },
          { status: 400 }
        )
      }
      newBalance = currentBalance - amount
    } else if (transaction_type === 'adjust') {
      newBalance = currentBalance + amount // 양수/음수 조정
    }

    // 포인트 이력 저장
    const { data: transaction, error: txError } = await supabase
      .from('point_transactions')
      .insert({
        patient_id,
        transaction_type,
        amount: transaction_type === 'use' ? -amount : amount,
        balance_after: newBalance,
        reference_type,
        reference_id,
        description,
        created_by
      })
      .select()
      .single()

    if (txError) throw txError

    // 환자 포인트 잔액 업데이트
    const { error: updateError } = await supabase
      .from('patients')
      .update({ point_balance: newBalance })
      .eq('id', patient_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('포인트 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '포인트 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

