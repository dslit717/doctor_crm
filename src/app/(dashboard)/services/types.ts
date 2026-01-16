export type TaxType = 'tax' | 'tax_free'

export interface Service {
  id: string
  service_code: string
  name: string
  category: string
  price: number
  tax_type: TaxType
  duration_minutes: number
  description?: string
  is_active: boolean
  sort_order: number
  custom_data?: Record<string, string | number>
  created_at: string
}

export interface CustomField {
  id: string
  field_name: string
  field_key: string
  field_type: 'text' | 'number' | 'select' | 'textarea'
  options?: string[] // select 타입일 때 옵션들
}

export type ServiceFormData = {
  service_code: string
  name: string
  category: string
  price: number
  tax_type: TaxType
  duration_minutes: number
  description: string
  is_active: boolean
  sort_order: number
  custom_data: Record<string, string | number>
}


