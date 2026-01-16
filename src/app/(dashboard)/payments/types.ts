export interface PaymentItem {
  id: string
  item_name: string
  item_type: string
  quantity: number
  unit_price: number
  discount_amount: number
  total_price: number
}

export interface PaymentDetail {
  id: string
  method: string
  amount: number
  card_company?: string
  installment?: number
  approval_no?: string
  paid_at: string
}

export interface Payment {
  id: string
  payment_no: string
  payment_date: string
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  status: string
  memo?: string
  patient?: {
    id: string
    name: string
    chart_no: string
    phone: string
  }
  items?: PaymentItem[]
  details?: PaymentDetail[]
}

export interface Patient {
  id: string
  name: string
  chart_no: string
  phone: string
}


