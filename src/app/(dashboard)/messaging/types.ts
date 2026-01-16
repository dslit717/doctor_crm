export type MessageChannel = 'sms' | 'lms' | 'mms'

export interface MessageTemplate {
  id: string
  name: string
  template_code: string
  category: string | null
  channel: MessageChannel
  content: string
  variables: Record<string, unknown> | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface NotificationLog {
  id: string
  patient_id: string | null
  notification_type: string
  channel: string
  recipient: string
  content: string
  status: 'sent' | 'failed'
  sent_at: string
  error_message: string | null
  patient?: {
    id: string
    name: string
    phone: string
  }
}

export type MessageTemplateFormData = {
  name: string
  template_code: string
  category: string
  channel: MessageChannel
  content: string
  is_active: boolean
}


