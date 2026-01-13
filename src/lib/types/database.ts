export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          columns: number | null
          created_at: string | null
          employee_id: string
          id: string
          layout_json: Json | null
          updated_at: string | null
        }
        Insert: {
          columns?: number | null
          created_at?: string | null
          employee_id: string
          id?: string
          layout_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          columns?: number | null
          created_at?: string | null
          employee_id?: string
          id?: string
          layout_json?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          access_fields: string[] | null
          access_type: string
          created_at: string | null
          employee_id: string
          id: string
          ip_address: string | null
          target_id: string
          target_identifier: string | null
          target_table: string
        }
        Insert: {
          access_fields?: string[] | null
          access_type: string
          created_at?: string | null
          employee_id: string
          id?: string
          ip_address?: string | null
          target_id: string
          target_identifier?: string | null
          target_table: string
        }
        Update: {
          access_fields?: string[] | null
          access_type?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          ip_address?: string | null
          target_id?: string
          target_identifier?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_2fa: {
        Row: {
          backup_codes: Json | null
          created_at: string | null
          employee_id: string
          id: string
          is_enabled: boolean | null
          method: string | null
          secret_key: string | null
          updated_at: string | null
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string | null
          employee_id: string
          id?: string
          is_enabled?: boolean | null
          method?: string | null
          secret_key?: string | null
          updated_at?: string | null
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string | null
          employee_id?: string
          id?: string
          is_enabled?: boolean | null
          method?: string | null
          secret_key?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_2fa_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          employee_id: string
          id: string
          is_primary: boolean | null
          role_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          employee_id: string
          id?: string
          is_primary?: boolean | null
          role_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          employee_id?: string
          id?: string
          is_primary?: boolean | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          created_at: string | null
          equipment_code: string
          extended_data: Json | null
          id: string
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance_date: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          equipment_code: string
          extended_data?: Json | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance_date?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          equipment_code?: string
          extended_data?: Json | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance_date?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_maintenance: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          equipment_id: string
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date: string | null
          performed_by: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id: string
          id?: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date?: string | null
          performed_by?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      export_logs: {
        Row: {
          created_at: string | null
          employee_id: string
          export_type: string
          exported_columns: string[] | null
          file_name: string | null
          filter_conditions: Json | null
          id: string
          ip_address: string | null
          record_count: number | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          export_type: string
          exported_columns?: string[] | null
          file_name?: string | null
          filter_conditions?: Json | null
          id?: string
          ip_address?: string | null
          record_count?: number | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          export_type?: string
          exported_columns?: string[] | null
          file_name?: string | null
          filter_conditions?: Json | null
          id?: string
          ip_address?: string | null
          record_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "export_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_active: boolean | null
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          current_stock: number | null
          expiry_alert_days: number | null
          extended_data: Json | null
          id: string
          is_active: boolean | null
          item_code: string
          item_name: string
          max_stock: number | null
          min_stock: number | null
          selling_price: number | null
          specification: string | null
          sub_category: string | null
          supplier_id: string | null
          supplier_name: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_alert_days?: number | null
          extended_data?: Json | null
          id?: string
          is_active?: boolean | null
          item_code: string
          item_name: string
          max_stock?: number | null
          min_stock?: number | null
          selling_price?: number | null
          specification?: string | null
          sub_category?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_alert_days?: number | null
          extended_data?: Json | null
          id?: string
          is_active?: boolean | null
          item_code?: string
          item_name?: string
          max_stock?: number | null
          min_stock?: number | null
          selling_price?: number | null
          specification?: string | null
          sub_category?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          item_id: string
          lot_number: string | null
          performed_by: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          total_price: number | null
          transaction_type: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          item_id: string
          lot_number?: string | null
          performed_by?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          total_price?: number | null
          transaction_type: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          item_id?: string
          lot_number?: string | null
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          total_price?: number | null
          transaction_type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          employee_id: string | null
          failure_reason: string | null
          id: string
          ip_address: string
          is_internal_ip: boolean | null
          is_success: boolean
          login_type: string | null
          os: string | null
          required_2fa: boolean | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          employee_id?: string | null
          failure_reason?: string | null
          id?: string
          ip_address: string
          is_internal_ip?: boolean | null
          is_success: boolean
          login_type?: string | null
          os?: string | null
          required_2fa?: boolean | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          employee_id?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string
          is_internal_ip?: boolean | null
          is_success?: boolean
          login_type?: string | null
          os?: string | null
          required_2fa?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          code: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          path: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          path?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          path?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "patients_primary_counselor_id_fkey"
            columns: ["primary_counselor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_primary_doctor_id_fkey"
            columns: ["primary_doctor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_bulk_edit: boolean | null
          can_create: boolean | null
          can_delete: boolean | null
          can_export: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          can_bulk_edit?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          can_bulk_edit?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          age: number | null
          category: string | null
          chart_number: string | null
          created_at: string | null
          date: string
          gender: string | null
          id: string
          memo: string | null
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
          created_at?: string | null
          date: string
          gender?: string | null
          id?: string
          memo?: string | null
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
          created_at?: string | null
          date?: string
          gender?: string | null
          id?: string
          memo?: string | null
          patient_name?: string
          phone?: string | null
          status?: string | null
          time?: string
          treatment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_menus: {
        Row: {
          can_access: boolean | null
          created_at: string | null
          id: string
          menu_id: string
          role_id: string
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          menu_id: string
          role_id: string
        }
        Update: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          menu_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_menus_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_menus_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          data_scope: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          data_scope?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          data_scope?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          business_number: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          note: string | null
          payment_terms: string | null
          phone: string | null
          supplier_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_number?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          note?: string | null
          payment_terms?: string | null
          phone?: string | null
          supplier_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_number?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          note?: string | null
          payment_terms?: string | null
          phone?: string | null
          supplier_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          device_info: Json | null
          employee_id: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          is_internal_ip: boolean | null
          last_activity_at: string | null
          login_at: string | null
          logout_at: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          device_info?: Json | null
          employee_id: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_internal_ip?: boolean | null
          last_activity_at?: string | null
          login_at?: string | null
          logout_at?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          device_info?: Json | null
          employee_id?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_internal_ip?: boolean | null
          last_activity_at?: string | null
          login_at?: string | null
          logout_at?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_data: {
        Row: {
          created_at: string | null
          data: Json | null
          employee_id: string
          id: string
          updated_at: string | null
          widget_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          employee_id: string
          id?: string
          updated_at?: string | null
          widget_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          employee_id?: string
          id?: string
          updated_at?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_data_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
