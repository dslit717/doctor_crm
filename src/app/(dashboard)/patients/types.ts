export interface Patient {
  id: string
  chart_no: string
  name: string
  phone: string
  birth_date: string
  gender: string
  email?: string
  referral_source?: string
  status: string
  first_visit_date?: string
  last_visit_date?: string
  visit_count: number
  membership_grade?: string
  created_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}


