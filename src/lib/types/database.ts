export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          note: string | null
          overtime_minutes: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          note?: string | null
          overtime_minutes?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          note?: string | null
          overtime_minutes?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_category: string
          action_detail: string | null
          action_type: string
          created_at: string | null
          employee_id: string | null
          employee_name: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          role_name: string | null
          session_id: string | null
          target_id: string | null
          target_name: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action_category: string
          action_detail?: string | null
          action_type: string
          created_at?: string | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          role_name?: string | null
          session_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action_category?: string
          action_detail?: string | null
          action_type?: string
          created_at?: string | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          role_name?: string | null
          session_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          extended_data: Json | null
          id: string
          is_active: boolean | null
          is_package: boolean | null
          name: string
          package_sessions: number | null
          selling_price: number | null
          service_code: string
          sort_order: number | null
          sub_category: string | null
          tax_type: string | null
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          extended_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_package?: boolean | null
          name: string
          package_sessions?: number | null
          selling_price?: number | null
          service_code: string
          sort_order?: number | null
          sub_category?: string | null
          tax_type?: string | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          extended_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_package?: boolean | null
          name?: string
          package_sessions?: number | null
          selling_price?: number | null
          service_code?: string
          sort_order?: number | null
          sub_category?: string | null
          tax_type?: string | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      membership_grades: {
        Row: {
          benefits: string | null
          color: string | null
          created_at: string | null
          discount_rate: number | null
          grade_code: string
          grade_name: string
          id: string
          is_active: boolean | null
          min_spent: number | null
          min_visits: number | null
          point_rate: number | null
          sort_order: number | null
        }
        Insert: {
          benefits?: string | null
          color?: string | null
          created_at?: string | null
          discount_rate?: number | null
          grade_code: string
          grade_name: string
          id?: string
          is_active?: boolean | null
          min_spent?: number | null
          min_visits?: number | null
          point_rate?: number | null
          sort_order?: number | null
        }
        Update: {
          benefits?: string | null
          color?: string | null
          created_at?: string | null
          discount_rate?: number | null
          grade_code?: string
          grade_name?: string
          id?: string
          is_active?: boolean | null
          min_spent?: number | null
          min_visits?: number | null
          point_rate?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          patient_id: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          patient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          patient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      patient_services: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          memo: string | null
          patient_id: string | null
          payment_id: string | null
          purchase_date: string | null
          remaining_sessions: number | null
          service_id: string | null
          service_name: string
          service_type: string | null
          status: string | null
          total_price: number | null
          total_sessions: number | null
          updated_at: string | null
          used_sessions: number | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          memo?: string | null
          patient_id?: string | null
          payment_id?: string | null
          purchase_date?: string | null
          remaining_sessions?: number | null
          service_id?: string | null
          service_name: string
          service_type?: string | null
          status?: string | null
          total_price?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          used_sessions?: number | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          memo?: string | null
          patient_id?: string | null
          payment_id?: string | null
          purchase_date?: string | null
          remaining_sessions?: number | null
          service_id?: string | null
          service_name?: string
          service_type?: string | null
          status?: string | null
          total_price?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          used_sessions?: number | null
        }
        Relationships: []
      }
      service_usage: {
        Row: {
          created_at: string | null
          id: string
          memo: string | null
          patient_service_id: string | null
          reservation_id: string | null
          session_number: number
          staff_id: string | null
          status: string | null
          usage_date: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          memo?: string | null
          patient_service_id?: string | null
          reservation_id?: string | null
          session_number: number
          staff_id?: string | null
          status?: string | null
          usage_date?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          memo?: string | null
          patient_service_id?: string | null
          reservation_id?: string | null
          session_number?: number
          staff_id?: string | null
          status?: string | null
          usage_date?: string | null
        }
        Relationships: []
      }
      consultation_charts: {
        Row: {
          budget_range: string | null
          chief_complaint: string | null
          concern_areas: Json | null
          consultation_date: string | null
          consultation_result: string | null
          counselor_id: string | null
          created_at: string | null
          desired_effect: string | null
          downtime_days: number | null
          estimated_price: number | null
          extended_data: Json | null
          id: string
          memo: string | null
          pain_sensitivity: string | null
          patient_id: string | null
          recommended_services: Json | null
          rejection_reason: string | null
          reservation_id: string | null
          selected_services: Json | null
          skin_concerns: Json | null
          updated_at: string | null
        }
        Insert: {
          budget_range?: string | null
          chief_complaint?: string | null
          concern_areas?: Json | null
          consultation_date?: string | null
          consultation_result?: string | null
          counselor_id?: string | null
          created_at?: string | null
          desired_effect?: string | null
          downtime_days?: number | null
          estimated_price?: number | null
          extended_data?: Json | null
          id?: string
          memo?: string | null
          pain_sensitivity?: string | null
          patient_id?: string | null
          recommended_services?: Json | null
          rejection_reason?: string | null
          reservation_id?: string | null
          selected_services?: Json | null
          skin_concerns?: Json | null
          updated_at?: string | null
        }
        Update: {
          budget_range?: string | null
          chief_complaint?: string | null
          concern_areas?: Json | null
          consultation_date?: string | null
          consultation_result?: string | null
          counselor_id?: string | null
          created_at?: string | null
          desired_effect?: string | null
          downtime_days?: number | null
          estimated_price?: number | null
          extended_data?: Json | null
          id?: string
          memo?: string | null
          pain_sensitivity?: string | null
          patient_id?: string | null
          recommended_services?: Json | null
          rejection_reason?: string | null
          reservation_id?: string | null
          selected_services?: Json | null
          skin_concerns?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_charts: {
        Row: {
          chart_date: string | null
          chief_complaint: string | null
          created_at: string | null
          diagnosis: string | null
          doctor_id: string | null
          energy_settings: Json | null
          extended_data: Json | null
          id: string
          materials_used: Json | null
          memo: string | null
          past_history: string | null
          patient_id: string | null
          physical_exam: string | null
          prescription: string | null
          present_illness: string | null
          procedure_performed: Json | null
          reservation_id: string | null
          treatment_plan: string | null
          updated_at: string | null
        }
        Insert: {
          chart_date?: string | null
          chief_complaint?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          energy_settings?: Json | null
          extended_data?: Json | null
          id?: string
          materials_used?: Json | null
          memo?: string | null
          past_history?: string | null
          patient_id?: string | null
          physical_exam?: string | null
          prescription?: string | null
          present_illness?: string | null
          procedure_performed?: Json | null
          reservation_id?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          chart_date?: string | null
          chief_complaint?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          energy_settings?: Json | null
          extended_data?: Json | null
          id?: string
          materials_used?: Json | null
          memo?: string | null
          past_history?: string | null
          patient_id?: string | null
          physical_exam?: string | null
          prescription?: string | null
          present_illness?: string | null
          procedure_performed?: Json | null
          reservation_id?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      care_charts: {
        Row: {
          chart_date: string | null
          created_at: string | null
          extended_data: Json | null
          home_care_guide: string | null
          id: string
          immediate_reaction: string | null
          intensity_level: string | null
          memo: string | null
          next_visit_guide: string | null
          patient_condition: string | null
          patient_id: string | null
          procedure_name: string | null
          products_used: Json | null
          reservation_id: string | null
          staff_id: string | null
          treatment_area: string | null
          treatment_time: number | null
          updated_at: string | null
        }
        Insert: {
          chart_date?: string | null
          created_at?: string | null
          extended_data?: Json | null
          home_care_guide?: string | null
          id?: string
          immediate_reaction?: string | null
          intensity_level?: string | null
          memo?: string | null
          next_visit_guide?: string | null
          patient_condition?: string | null
          patient_id?: string | null
          procedure_name?: string | null
          products_used?: Json | null
          reservation_id?: string | null
          staff_id?: string | null
          treatment_area?: string | null
          treatment_time?: number | null
          updated_at?: string | null
        }
        Update: {
          chart_date?: string | null
          created_at?: string | null
          extended_data?: Json | null
          home_care_guide?: string | null
          id?: string
          immediate_reaction?: string | null
          intensity_level?: string | null
          memo?: string | null
          next_visit_guide?: string | null
          patient_condition?: string | null
          patient_id?: string | null
          procedure_name?: string | null
          products_used?: Json | null
          reservation_id?: string | null
          staff_id?: string | null
          treatment_area?: string | null
          treatment_time?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      satisfaction_charts: {
        Row: {
          area_evaluations: Json | null
          chart_id: string | null
          chart_type: string | null
          created_at: string | null
          extended_data: Json | null
          id: string
          improvement_comment: string | null
          improvement_grade: string | null
          pain_level: number | null
          patient_id: string | null
          patient_personality: string | null
          reservation_id: string | null
          revisit_intention: string | null
          satisfaction_comment: string | null
          satisfaction_grade: string | null
          service_grade: string | null
          staff_observation: string | null
        }
        Insert: {
          area_evaluations?: Json | null
          chart_id?: string | null
          chart_type?: string | null
          created_at?: string | null
          extended_data?: Json | null
          id?: string
          improvement_comment?: string | null
          improvement_grade?: string | null
          pain_level?: number | null
          patient_id?: string | null
          patient_personality?: string | null
          reservation_id?: string | null
          revisit_intention?: string | null
          satisfaction_comment?: string | null
          satisfaction_grade?: string | null
          service_grade?: string | null
          staff_observation?: string | null
        }
        Update: {
          area_evaluations?: Json | null
          chart_id?: string | null
          chart_type?: string | null
          created_at?: string | null
          extended_data?: Json | null
          id?: string
          improvement_comment?: string | null
          improvement_grade?: string | null
          pain_level?: number | null
          patient_id?: string | null
          patient_personality?: string | null
          reservation_id?: string | null
          revisit_intention?: string | null
          satisfaction_comment?: string | null
          satisfaction_grade?: string | null
          service_grade?: string | null
          staff_observation?: string | null
        }
        Relationships: []
      }
      consent_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          template_code: string
          updated_at: string | null
          validity_days: number | null
          version: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          template_code: string
          updated_at?: string | null
          validity_days?: number | null
          version?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          template_code?: string
          updated_at?: string | null
          validity_days?: number | null
          version?: number | null
        }
        Relationships: []
      }
      patient_consents: {
        Row: {
          created_at: string | null
          device_info: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          patient_id: string | null
          revoked_at: string | null
          signature_data: string | null
          signed_at: string | null
          status: string | null
          template_id: string | null
          template_version: number | null
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string | null
          revoked_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          template_version?: number | null
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string | null
          revoked_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          template_version?: number | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          channel: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notification_type: string
          template_id: string | null
          trigger_timing: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_type: string
          template_id?: string | null
          trigger_timing?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_type?: string
          template_id?: string | null
          trigger_timing?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string | null
          content: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_type: string | null
          patient_id: string | null
          recipient: string | null
          reference_id: string | null
          reference_type: string | null
          sent_at: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          channel?: string | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string | null
          patient_id?: string | null
          recipient?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          channel?: string | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string | null
          patient_id?: string | null
          recipient?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string | null
          channel: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          kakao_template_id: string | null
          name: string
          template_code: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          channel: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kakao_template_id?: string | null
          name: string
          template_code: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kakao_template_id?: string | null
          name?: string
          template_code?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          chart_no: string
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_consent: boolean | null
          extended_data: Json | null
          first_visit_date: string | null
          gender: string | null
          id: string
          last_visit_date: string | null
          marketing_consent: boolean | null
          marketing_consent_date: string | null
          membership_grade: string | null
          name: string
          phone: string
          phone_secondary: string | null
          point_balance: number | null
          primary_counselor_id: string | null
          primary_doctor_id: string | null
          referral_detail: string | null
          referral_source: string | null
          sms_consent: boolean | null
          status: string | null
          total_spent: number | null
          updated_at: string | null
          visit_count: number | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          chart_no: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_consent?: boolean | null
          extended_data?: Json | null
          first_visit_date?: string | null
          gender?: string | null
          id?: string
          last_visit_date?: string | null
          marketing_consent?: boolean | null
          marketing_consent_date?: string | null
          membership_grade?: string | null
          name: string
          phone: string
          phone_secondary?: string | null
          point_balance?: number | null
          primary_counselor_id?: string | null
          primary_doctor_id?: string | null
          referral_detail?: string | null
          referral_source?: string | null
          sms_consent?: boolean | null
          status?: string | null
          total_spent?: number | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          chart_no?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_consent?: boolean | null
          extended_data?: Json | null
          first_visit_date?: string | null
          gender?: string | null
          id?: string
          last_visit_date?: string | null
          marketing_consent?: boolean | null
          marketing_consent_date?: string | null
          membership_grade?: string | null
          name?: string
          phone?: string
          phone_secondary?: string | null
          point_balance?: number | null
          primary_counselor_id?: string | null
          primary_doctor_id?: string | null
          referral_detail?: string | null
          referral_source?: string | null
          sms_consent?: boolean | null
          status?: string | null
          total_spent?: number | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          deleted_at: string | null
          department_id: string | null
          email: string | null
          employee_no: string
          extended_data: Json | null
          hire_date: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          profile_image_url: string | null
          resign_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department_id?: string | null
          email?: string | null
          employee_no: string
          extended_data?: Json | null
          hire_date?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          resign_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department_id?: string | null
          email?: string | null
          employee_no?: string
          extended_data?: Json | null
          hire_date?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          resign_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          age: number | null
          category: string | null
          chart_number: string | null
          counselor_id: string | null
          created_at: string | null
          date: string
          doctor_id: string | null
          gender: string | null
          id: string
          memo: string | null
          patient_id: string | null
          patient_name: string
          phone: string | null
          status: string | null
          time: string
          treatment: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          category?: string | null
          chart_number?: string | null
          counselor_id?: string | null
          created_at?: string | null
          date: string
          doctor_id?: string | null
          gender?: string | null
          id?: string
          memo?: string | null
          patient_id?: string | null
          patient_name: string
          phone?: string | null
          status?: string | null
          time: string
          treatment?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          category?: string | null
          chart_number?: string | null
          counselor_id?: string | null
          created_at?: string | null
          date?: string
          doctor_id?: string | null
          gender?: string | null
          id?: string
          memo?: string | null
          patient_id?: string | null
          patient_name?: string
          phone?: string | null
          status?: string | null
          time?: string
          treatment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          memo: string | null
          paid_amount: number
          patient_id: string | null
          payment_date: string
          payment_no: string
          reservation_id: string | null
          status: string | null
          total_amount: number
          unpaid_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          memo?: string | null
          paid_amount?: number
          patient_id?: string | null
          payment_date?: string
          payment_no: string
          reservation_id?: string | null
          status?: string | null
          total_amount?: number
          unpaid_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          memo?: string | null
          paid_amount?: number
          patient_id?: string | null
          payment_date?: string
          payment_no?: string
          reservation_id?: string | null
          status?: string | null
          total_amount?: number
          unpaid_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          payment_id: string
          reason: string | null
          refund_amount: number
          refund_date: string
          refund_method: string
          refund_no: string
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_id: string
          reason?: string | null
          refund_amount: number
          refund_date?: string
          refund_method: string
          refund_no: string
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          payment_id?: string
          reason?: string | null
          refund_amount?: number
          refund_date?: string
          refund_method?: string
          refund_no?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// 추가 타입 정의 (인증 및 권한 관련)
export type RoleCode = 
  | 'director'
  | 'vice_director'
  | 'manager'
  | 'doctor'
  | 'coordinator'
  | 'counselor'
  | 'nurse'
  | 'therapist'
  | 'staff'

export type DataScope = 'all' | 'department' | 'own'

export interface Role {
  id: string
  code: RoleCode
  name: string
  level: number
  is_active: boolean
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Permission {
  id: string
  code: string
  name: string
  category: string
  description?: string | null
  can_create?: boolean | null
  can_read?: boolean | null
  can_update?: boolean | null
  can_delete?: boolean | null
  can_export?: boolean | null
  can_bulk_edit?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Menu {
  id: string
  code: string
  name: string
  path: string
  icon?: string | null
  parent_id?: string | null
  sort_order?: number | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type Employee = Tables<'employees'>
