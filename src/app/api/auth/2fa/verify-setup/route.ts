import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyTotpCode } from '@/lib/auth/two-factor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// TOTP 설정 검증 (최초 설정 시 코드 확인)
export async function POST(req: NextRequest) {
  try {
    const { employeeId, code } = await req.json()

    if (!employeeId || !code) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 2FA 설정 조회
    const { data: twoFa, error: twoFaError } = await supabase
      .from('employee_2fa')
      .select('method, secret_key, is_enabled')
      .eq('employee_id', employeeId)
      .single()

    if (twoFaError || !twoFa) {
      return NextResponse.json(
        { success: false, error: '2FA 설정을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (twoFa.method !== 'otp' || !twoFa.secret_key) {
      return NextResponse.json(
        { success: false, error: 'TOTP 설정이 아닙니다.' },
        { status: 400 }
      )
    }

    // TOTP 코드 검증
    const isValid = verifyTotpCode(twoFa.secret_key, code)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 2FA 활성화
    const { error: updateError } = await supabase
      .from('employee_2fa')
      .update({
        is_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', employeeId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: '2FA 활성화에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'TOTP 인증이 활성화되었습니다.',
    })

  } catch (error) {
    console.error('2FA verify setup error:', error)
    return NextResponse.json(
      { success: false, error: '2FA 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

