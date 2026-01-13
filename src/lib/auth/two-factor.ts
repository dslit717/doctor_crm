import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// 솔라피 설정
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || 'NCSSTPKXXIQSOCD9'
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || 'P7GCTGKHCNJCWX81P1EN19LLLGSYIZLX'
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || '01076494556' 

// TOTP Secret 생성
export function generateTotpSecret(email: string, issuer: string = 'Dr.CRM') {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: email,
    issuer: issuer,
  })

  return {
    ascii: secret.ascii,
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url || '',
  }
}

// QR 코드 이미지 생성 (Data URL)
export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(otpauthUrl, (err, imageData) => {
      if (err) {
        reject(err)
      } else {
        resolve(imageData)
      }
    })
  })
}

// TOTP 코드 검증
export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1, // 30초 전후 허용
  })
}

// SMS 인증 코드 생성 (6자리)
export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// SMS 인증 코드 만료 시간 (5분)
export function getSmsCodeExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 5)
  return expiry
}

// SMS 발송 (solapi)
export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  try {
    // 발신번호가 없으면 콘솔 로그만 (개발용)
    if (!SOLAPI_SENDER) {
      console.log(`[SMS 발송 - 개발모드] ${phone}: 인증 코드는 [${code}]입니다.`)
      console.log('⚠️ 발신번호(SOLAPI_SENDER)를 설정하면 실제 SMS가 발송됩니다.')
      return true
    }

    // 솔라피 SDK 동적 import (서버사이드에서만)
    const { SolapiMessageService } = await import('solapi')
    const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET)
    
    // 전화번호 포맷 정리 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '')
    
    const result = await messageService.sendOne({
      to: cleanPhone,
      from: SOLAPI_SENDER,
      text: `[Dr.CRM] 인증 코드는 [${code}]입니다. 5분 내에 입력해주세요.`,
    })
    
    console.log('[SMS 발송 성공]', result)
    return true
  } catch (error) {
    console.error('[SMS 발송 실패]', error)
    // 실패해도 개발 환경에서는 true 반환 (devCode로 테스트 가능)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS 발송 - 개발모드 폴백] ${phone}: 인증 코드는 [${code}]입니다.`)
      return true
    }
    return false
  }
}
