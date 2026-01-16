export interface PatientService {
  id: string
  patient_id: string
  service_id?: string
  payment_id?: string
  service_name: string
  service_type: 'package' | 'single'
  total_sessions: number
  used_sessions: number
  remaining_sessions: number
  expiry_date?: string
  total_price: number
  memo?: string
  status: 'active' | 'expired' | 'completed' | 'cancelled'
  created_at: string
  updated_at?: string
  patient?: {
    id: string
    name: string
    chart_no: string
  }
  service?: {
    id: string
    name: string
    category: string
  }
  usage?: ServiceUsage[]
}

export interface ServiceUsage {
  id: string
  patient_service_id: string
  session_number: number
  reservation_id?: string
  usage_date: string
  status: string
  staff_id?: string
  memo?: string
  created_at: string
}

