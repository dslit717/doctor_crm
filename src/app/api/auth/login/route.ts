import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { 
  checkIpAddress, 
  parseUserAgent, 
  generateSessionToken, 
  calculateSessionExpiry 
} from '@/lib/auth/session'
import { verifyTotpCode, generateSmsCode, getSmsCodeExpiry, sendSmsCode } from '@/lib/auth/two-factor'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const { email, password, otpCode, twoFactorMethod: requestedMethod } = body

    // 1. IP 주소 확인
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0].trim() || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || ''

    // 2. IP 화이트리스트 조회
    const { data: whitelistData } = await supabase
      .from('ip_whitelist')
      .select('ip_address')
      .eq('is_active', true)

    const whitelistIps = whitelistData?.map(item => item.ip_address) || []
    const ipCheck = checkIpAddress(ipAddress, whitelistIps)

    // 3. Supabase Auth로 로그인 시도
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      // 로그인 실패 로그 기록
      await logLoginAttempt({
        ipAddress,
        userAgent,
        isSuccess: false,
        failureReason: authError?.message || 'Invalid credentials',
        isInternalIp: ipCheck.isInternal,
      })

      return NextResponse.json(
        { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 4. 직원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (employeeError || !employee) {
      await logLoginAttempt({
        ipAddress,
        userAgent,
        isSuccess: false,
        failureReason: 'Employee not found or inactive',
        isInternalIp: ipCheck.isInternal,
      })

      return NextResponse.json(
        { success: false, error: '등록된 직원 정보가 없습니다.' },
        { status: 403 }
      )
    }

    // 5. 2FA 확인 (외부 IP인 경우)
    if (ipCheck.requiresTwoFactor) {
      // 사용자가 선택한 방식 또는 기존 설정된 방식 사용
      const selectedMethod = requestedMethod || 'sms'
      
      // 기존 2FA 설정 조회
      const { data: twoFaData } = await supabase
        .from('employee_2fa')
        .select('*')
        .eq('employee_id', employee.id)
        .single()

      // OTP 코드가 제공되지 않은 경우 2FA 요청
      if (!otpCode) {
        // SMS 선택 시
        if (selectedMethod === 'sms') {
          const code = generateSmsCode()
          const expiry = getSmsCodeExpiry()

          // 기존 레코드가 있으면 update, 없으면 insert
          const { data: existing2fa } = await supabase
            .from('employee_2fa')
            .select('id')
            .eq('employee_id', employee.id)
            .single()

          if (existing2fa) {
            // Update
            const { data: updatedData, error: updateError } = await supabase
              .from('employee_2fa')
              .update({
                method: 'sms',
                secret_key: `${code}:${expiry.toISOString()}`,
                is_enabled: true,
                updated_at: new Date().toISOString(),
              })
              .eq('employee_id', employee.id)
              .select()
              .single()

            if (updateError) {
              console.error('[2FA] SMS 코드 업데이트 실패:', updateError)
            } else {
              console.log('[2FA] SMS 코드 업데이트 성공:', code, '저장된 값:', updatedData?.secret_key)
            }
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('employee_2fa')
              .insert({
                employee_id: employee.id,
                method: 'sms',
                secret_key: `${code}:${expiry.toISOString()}`,
                is_enabled: true,
              })

            if (insertError) {
              console.error('[2FA] SMS 코드 저장 실패:', insertError)
            } else {
              console.log('[2FA] SMS 코드 저장 성공:', code)
            }
          }

          // SMS 발송
          if (employee.phone) {
            await sendSmsCode(employee.phone, code)
          }

          return NextResponse.json({
            success: false,
            requiresTwoFactor: true,
            twoFactorMethod: 'sms',
          })
        }

        // OTP 선택 시
        if (selectedMethod === 'otp') {
          // OTP 설정이 없으면 에러
          if (!twoFaData || twoFaData.method !== 'otp' || !twoFaData.secret_key) {
            return NextResponse.json({
              success: false,
              error: 'OTP가 설정되지 않았습니다. 먼저 보안 설정에서 OTP를 등록해주세요.',
            }, { status: 400 })
          }

          return NextResponse.json({
            success: false,
            requiresTwoFactor: true,
            twoFactorMethod: 'otp',
          })
        }
      }

      // OTP 코드 검증 (otpCode가 제공된 경우)
      if (otpCode) {
        // 최신 2FA 데이터 다시 조회 (SMS 코드 저장 후 변경될 수 있음)
        const { data: currentTwoFaData } = await supabase
          .from('employee_2fa')
          .select('*')
          .eq('employee_id', employee.id)
          .single()

        if (!currentTwoFaData) {
          return NextResponse.json(
            { success: false, error: '2FA 설정을 찾을 수 없습니다.' },
            { status: 401 }
          )
        }

        const isValidOtp = await verifyOtpCode(currentTwoFaData, otpCode)
        if (!isValidOtp) {
          await logLoginAttempt({
            employeeId: employee.id,
            ipAddress,
            userAgent,
            isSuccess: false,
            failureReason: 'Invalid OTP code',
            isInternalIp: ipCheck.isInternal,
            required2fa: true,
          })

          return NextResponse.json(
            { success: false, error: '인증 코드가 올바르지 않습니다.' },
            { status: 401 }
          )
        }
      }
    }

    // 6. 기존 활성 세션 수 확인 (최대 동시 세션 제한)
    const { count: activeSessions } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('is_active', true)

    if ((activeSessions ?? 0) >= 3) {
      // 가장 오래된 세션 비활성화
      const { data: oldestSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('employee_id', employee.id)
        .eq('is_active', true)
        .order('login_at', { ascending: true })
        .limit(1)
        .single()

      if (oldestSession) {
        await supabase
          .from('user_sessions')
          .update({ is_active: false, logout_at: new Date().toISOString() })
          .eq('id', oldestSession.id)
      }
    }

    // 7. 세션 생성
    const sessionToken = generateSessionToken()
    const expiresAt = calculateSessionExpiry()
    const deviceInfo = parseUserAgent(userAgent)

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        employee_id: employee.id,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_info: deviceInfo,
        is_internal_ip: ipCheck.isInternal,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      return NextResponse.json(
        { success: false, error: '세션 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 8. 로그인 성공 로그 기록
    await logLoginAttempt({
      employeeId: employee.id,
      ipAddress,
      userAgent,
      isSuccess: true,
      isInternalIp: ipCheck.isInternal,
      required2fa: ipCheck.requiresTwoFactor,
      loginType: otpCode ? 'otp' : 'password',
      ...deviceInfo,
    })

    // 9. 직원 역할 조회
    const { data: employeeRoles } = await supabase
      .from('employee_roles')
      .select('role_id')
      .eq('employee_id', employee.id)

    const roleIds = employeeRoles?.map(er => er.role_id) || []
    
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name, code, level')
      .in('id', roleIds)

    // 10. 응답 (세션 토큰은 쿠키로 설정)
    const response = NextResponse.json({
      success: true,
      user: {
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          position: employee.position,
          profileImageUrl: employee.profile_image_url,
        },
        roles: roles || [],
      },
    })

    // 세션 토큰 쿠키 설정
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 로그인 시도 로그 기록
async function logLoginAttempt(params: {
  employeeId?: string
  ipAddress: string
  userAgent: string
  isSuccess: boolean
  failureReason?: string
  isInternalIp: boolean
  required2fa?: boolean
  loginType?: string
  browser?: string
  os?: string
  deviceType?: string
}) {
  const supabase = getSupabaseServer()
  const { browser, os, deviceType } = parseUserAgent(params.userAgent)

  await supabase.from('login_logs').insert({
    employee_id: params.employeeId,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    is_success: params.isSuccess,
    failure_reason: params.failureReason,
    is_internal_ip: params.isInternalIp,
    required_2fa: params.required2fa ?? false,
    login_type: params.loginType as 'password' | 'otp' | 'sso' | null,
    browser: params.browser || browser,
    os: params.os || os,
    device_type: params.deviceType || deviceType,
  })
}

// OTP 코드 검증
async function verifyOtpCode(
  twoFaData: { method: string | null; secret_key: string | null },
  otpCode: string
): Promise<boolean> {
  // 테스트 코드: 123456은 항상 허용
  if (otpCode === '123456') {
    return true
  }

  if (!twoFaData.method) return false

  // TOTP (Google Authenticator) 검증
  if (twoFaData.method === 'otp') {
    if (!twoFaData.secret_key) return false
    return verifyTotpCode(twoFaData.secret_key, otpCode)
  }

  // SMS/이메일 인증 코드 검증
  if (twoFaData.method === 'sms' || twoFaData.method === 'email') {
    if (!twoFaData.secret_key) return false
    
    // secret_key 형식: "코드:만료시간"
    const [storedCode, expiryStr] = twoFaData.secret_key.split(':')
    
    if (!storedCode || !expiryStr) return false
    
    // 만료 시간 확인
    const expiry = new Date(expiryStr)
    if (new Date() > expiry) {
      return false // 코드 만료
    }
    
    // 코드 일치 확인
    return storedCode === otpCode
  }

  return false
}

