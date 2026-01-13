import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateTotpSecret, generateQrCode } from '@/lib/auth/two-factor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 2FA 설정 시작 (QR 코드 생성)
export async function POST(request: NextRequest) {
  try {
    const { employeeId, method } = await request.json()

    if (!employeeId || !method) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 직원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, email, name')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, error: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (method === 'otp') {
      // TOTP 설정
      const secret = generateTotpSecret(employee.email, 'Dr.CRM')
      const qrCodeUrl = await generateQrCode(secret.otpauthUrl)

      // 임시로 secret 저장 (아직 활성화 안됨)
      const { error: upsertError } = await supabase
        .from('employee_2fa')
        .upsert({
          employee_id: employeeId,
          method: 'otp',
          secret_key: secret.base32,
          is_enabled: false, // 검증 후 활성화
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'employee_id'
        })

      if (upsertError) {
        console.error('2FA setup error:', upsertError)
        return NextResponse.json(
          { success: false, error: '2FA 설정 저장에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        method: 'otp',
        qrCode: qrCodeUrl,
        secret: secret.base32, // 수동 입력용
        message: 'Google Authenticator 앱으로 QR 코드를 스캔하세요.',
      })

    } else if (method === 'sms') {
      // SMS는 secret 없이 설정
      const { error: upsertError } = await supabase
        .from('employee_2fa')
        .upsert({
          employee_id: employeeId,
          method: 'sms',
          secret_key: null,
          is_enabled: true, // 바로 활성화
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'employee_id'
        })

      if (upsertError) {
        return NextResponse.json(
          { success: false, error: '2FA 설정 저장에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        method: 'sms',
        message: 'SMS 인증이 활성화되었습니다.',
      })
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 인증 방식입니다.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { success: false, error: '2FA 설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 2FA 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: '직원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data: twoFa, error } = await supabase
      .from('employee_2fa')
      .select('method, is_enabled, created_at')
      .eq('employee_id', employeeId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { success: false, error: '2FA 설정 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      twoFa: twoFa || null,
    })

  } catch (error) {
    console.error('2FA get error:', error)
    return NextResponse.json(
      { success: false, error: '2FA 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

