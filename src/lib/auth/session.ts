import type { IpCheckResult, SessionInfo } from './types'

// 세션 설정
export const SESSION_CONFIG = {
  // 세션 만료 시간 (8시간)
  EXPIRY_HOURS: 8,
  // 비활성 세션 타임아웃 (30분)
  INACTIVE_TIMEOUT_MINUTES: 30,
  // 최대 동시 세션 수
  MAX_CONCURRENT_SESSIONS: 3,
}

/**
 * IP가 내부 IP인지 확인 (화이트리스트 기반)
 * - 각 기관에서 ip_whitelist 테이블에 허용 IP를 등록해야 함
 * - 화이트리스트에 없으면 외부 IP로 간주 → 2FA 필요
 */
export function checkIpAddress(
  ipAddress: string, 
  whitelistIps: string[]
): IpCheckResult {
  // 화이트리스트 확인 (오직 등록된 IP만 내부로 인식)
  const isWhitelisted = whitelistIps.some(whitelistIp => {
    // CIDR 표기법 지원 (예: 192.168.1.0/24)
    if (whitelistIp.includes('/')) {
      return isIpInCidr(ipAddress, whitelistIp)
    }
    // 와일드카드 지원 (예: 192.168.1.*)
    if (whitelistIp.includes('*')) {
      const regex = new RegExp('^' + whitelistIp.replace(/\./g, '\\.').replace(/\*/g, '\\d+') + '$')
      return regex.test(ipAddress)
    }
    // 정확한 매칭
    return whitelistIp === ipAddress
  })

  return {
    isInternal: isWhitelisted,
    requiresTwoFactor: !isWhitelisted,
    ipAddress,
  }
}

/**
 * IP가 CIDR 범위에 포함되는지 확인
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/')
  const mask = ~(2 ** (32 - parseInt(bits)) - 1)
  
  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(range)
  
  return (ipNum & mask) === (rangeNum & mask)
}

/**
 * IP 주소를 숫자로 변환
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

/**
 * User-Agent 파싱
 */
export function parseUserAgent(userAgent: string): {
  browser: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
} {
  // 브라우저 감지
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari'
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge'
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browser = 'Internet Explorer'
  }

  // OS 감지
  let os = 'Unknown'
  if (userAgent.includes('Windows')) {
    os = 'Windows'
  } else if (userAgent.includes('Mac')) {
    os = 'macOS'
  } else if (userAgent.includes('Linux')) {
    os = 'Linux'
  } else if (userAgent.includes('Android')) {
    os = 'Android'
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS'
  }

  // 디바이스 타입 감지
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (userAgent.includes('Mobile')) {
    deviceType = 'mobile'
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'tablet'
  }

  return { browser, os, deviceType }
}

/**
 * 세션 토큰 생성
 */
export function generateSessionToken(): string {
  // Node.js 환경
  if (typeof window === 'undefined') {
    const { randomBytes } = require('crypto')
    return randomBytes(32).toString('hex')
  }
  // 브라우저 환경
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 세션 만료 시간 계산
 */
export function calculateSessionExpiry(): Date {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_CONFIG.EXPIRY_HOURS)
  return expiresAt
}

/**
 * 세션이 유효한지 확인
 */
export function isSessionValid(session: SessionInfo): boolean {
  const now = new Date()
  
  // 만료 시간 확인
  if (session.expiresAt < now) {
    return false
  }
  
  // 비활성 타임아웃 확인
  const inactiveTimeout = new Date(session.lastActivityAt)
  inactiveTimeout.setMinutes(
    inactiveTimeout.getMinutes() + SESSION_CONFIG.INACTIVE_TIMEOUT_MINUTES
  )
  
  if (inactiveTimeout < now) {
    return false
  }
  
  return true
}

/**
 * 세션 정보를 쿠키에 저장할 형식으로 변환
 */
export function serializeSession(session: SessionInfo): string {
  return JSON.stringify({
    id: session.id,
    employeeId: session.employeeId,
    expiresAt: session.expiresAt.toISOString(),
  })
}

/**
 * 쿠키에서 세션 정보 파싱
 */
export function deserializeSession(serialized: string): Partial<SessionInfo> | null {
  try {
    const data = JSON.parse(serialized)
    return {
      id: data.id,
      employeeId: data.employeeId,
      expiresAt: new Date(data.expiresAt),
    }
  } catch {
    return null
  }
}

