/**
 * 민감 정보 마스킹 유틸리티
 * 역할에 따라 전화번호, 이메일, 주민번호 등을 마스킹 처리
 */

// 전화번호 마스킹: 010-1234-5678 → 010-****-5678
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`
  }
  return phone.slice(0, 3) + '*'.repeat(Math.max(0, phone.length - 6)) + phone.slice(-3)
}

// 이메일 마스킹: test@example.com → te**@example.com
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '-'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.length > 2 
    ? local.slice(0, 2) + '*'.repeat(local.length - 2)
    : local
  return `${maskedLocal}@${domain}`
}

// 이름 마스킹: 홍길동 → 홍*동
export function maskName(name: string | null | undefined): string {
  if (!name) return '-'
  if (name.length === 2) return name[0] + '*'
  if (name.length >= 3) return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
  return name
}

// 주소 마스킹: 서울시 강남구 역삼동 123-45 → 서울시 강남구 ***
export function maskAddress(address: string | null | undefined): string {
  if (!address) return '-'
  const parts = address.split(' ')
  if (parts.length <= 2) return address
  return parts.slice(0, 2).join(' ') + ' ***'
}

// 금액 마스킹: 5000000 → ***
export function maskAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return '***'
}

// 역할별 마스킹 필드 정의
export const MASKING_RULES: Record<string, {
  patients: string[]
  employees: string[]
  payments: string[]
}> = {
  // 원장/관리자: 마스킹 없음
  ADMIN: {
    patients: [],
    employees: [],
    payments: []
  },
  DIRECTOR: {
    patients: [],
    employees: [],
    payments: []
  },
  // 실장: 급여만 마스킹
  MANAGER: {
    patients: [],
    employees: ['salary'],
    payments: []
  },
  // 상담사/코디: 급여, 상세 매출 마스킹
  COUNSELOR: {
    patients: [],
    employees: ['salary', 'bank_account'],
    payments: ['paid_amount', 'total_amount']
  },
  COORDINATOR: {
    patients: [],
    employees: ['salary', 'bank_account'],
    payments: []
  },
  // 의사/간호사/관리사: 급여 마스킹, 본인 담당 외 환자 전화 마스킹
  DOCTOR: {
    patients: [],
    employees: ['salary', 'bank_account'],
    payments: ['paid_amount', 'total_amount']
  },
  NURSE: {
    patients: ['phone'],
    employees: ['salary', 'bank_account'],
    payments: ['paid_amount', 'total_amount']
  },
  // 기본 (정의되지 않은 역할)
  DEFAULT: {
    patients: ['phone', 'email', 'address'],
    employees: ['phone', 'email', 'salary', 'bank_account'],
    payments: ['paid_amount', 'total_amount', 'unpaid_amount']
  }
}

// 객체에 마스킹 적용
export function applyMasking<T extends Record<string, unknown>>(
  data: T,
  fieldsToMask: string[],
  maskFunctions: Record<string, (value: unknown) => string> = {}
): T {
  if (!data || fieldsToMask.length === 0) return data

  const masked = { ...data }
  
  for (const field of fieldsToMask) {
    if (field in masked) {
      const value = masked[field]
      
      // 커스텀 마스킹 함수가 있으면 사용
      if (maskFunctions[field]) {
        (masked as Record<string, unknown>)[field] = maskFunctions[field](value)
      } 
      // 필드 타입에 따라 자동 마스킹
      else if (field.includes('phone')) {
        (masked as Record<string, unknown>)[field] = maskPhone(value as string)
      } else if (field.includes('email')) {
        (masked as Record<string, unknown>)[field] = maskEmail(value as string)
      } else if (field.includes('address')) {
        (masked as Record<string, unknown>)[field] = maskAddress(value as string)
      } else if (field.includes('amount') || field.includes('salary') || field.includes('price')) {
        (masked as Record<string, unknown>)[field] = '***'
      } else {
        (masked as Record<string, unknown>)[field] = '***'
      }
    }
  }

  return masked
}

// 배열에 마스킹 적용
export function applyMaskingToArray<T extends Record<string, unknown>>(
  dataArray: T[],
  fieldsToMask: string[],
  maskFunctions?: Record<string, (value: unknown) => string>
): T[] {
  return dataArray.map(item => applyMasking(item, fieldsToMask, maskFunctions))
}

// 역할 코드로 마스킹할 필드 가져오기
export function getMaskingFields(
  roleCode: string | undefined,
  dataType: 'patients' | 'employees' | 'payments'
): string[] {
  const rules = MASKING_RULES[roleCode?.toUpperCase() || 'DEFAULT'] || MASKING_RULES.DEFAULT
  return rules[dataType]
}

