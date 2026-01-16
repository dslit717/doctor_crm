export interface PendingReservation {
  id: string
  patient_id?: string
  patient_name: string
  phone: string
  consultation_summary?: string
  desired_treatment?: string
  desired_schedule?: string
  pending_reason: string
  reason_detail?: string
  expected_decision_date?: string
  counselor_id?: string
  next_contact_date?: string
  status: string
  memo?: string
  contact_history?: Array<{
    contacted_at: string
    method: string
    content: string
    result?: string
  }>
  created_at: string
  patient?: {
    id: string
    name: string
    chart_no: string
  }
  counselor?: {
    id: string
    name: string
  }
}


