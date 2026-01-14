import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSmsCode, getSmsCodeExpiry, sendSmsCode } from '@/lib/auth/two-factor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// SMS 인증 코드 발송
export async function POST(req: NextRequest) {
  try {
    const { employeeId, method } = await req.json()

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: '직원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 직원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, email, phone')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, error: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2FA 설정 조회
    const { data: twoFa } = await supabase
      .from('employee_2fa')
      .select('method, is_enabled')
      .eq('employee_id', employeeId)
      .single()

    const authMethod = method || twoFa?.method || 'sms'

    // 인증 코드 생성
    const code = generateSmsCode()
    const expiry = getSmsCodeExpiry()

    // 임시 코드 저장 (employee_2fa 테이블에 저장하거나 별도 테이블 사용)
    // 여기서는 secret_key를 임시 코드 저장용으로 사용 (실제로는 별도 테이블 권장)
    const { error: updateError } = await supabase
      .from('employee_2fa')
      .upsert({
        employee_id: employeeId,
        method: authMethod,
        secret_key: `${code}:${expiry.toISOString()}`, // 코드:만료시간
        is_enabled: twoFa?.is_enabled ?? true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'employee_id'
      })

    if (updateError) {
      console.error('Save code error:', updateError)
      return NextResponse.json(
        { success: false, error: '인증 코드 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // SMS 발송
    if (!employee.phone) {
      return NextResponse.json(
        { success: false, error: '전화번호가 등록되어 있지 않습니다.' },
        { status: 400 }
      )
    }
    
    const sendSuccess = await sendSmsCode(employee.phone, code)
    if (!sendSuccess) {
      return NextResponse.json(
        { success: false, error: 'SMS 발송에 실패했습니다.' },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      method: 'sms',
      message: 'SMS로 인증 코드를 발송했습니다.',
      expiresAt: expiry.toISOString(),
    })

  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { success: false, error: '인증 코드 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

