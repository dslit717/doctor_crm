import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// 2FA 비활성화
export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json()

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: '직원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 2FA 설정 삭제
    const { error } = await supabase
      .from('employee_2fa')
      .delete()
      .eq('employee_id', employeeId)

    if (error) {
      console.error('2FA disable error:', error)
      return NextResponse.json(
        { success: false, error: '2FA 비활성화에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA가 비활성화되었습니다.',
    })

  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { success: false, error: '2FA 비활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

