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
      admin_roles: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apostas: {
        Row: {
          colocacao: string
          created_at: string | null
          data_jogo: string
          horarios: string[]
          id: string
          loterias: string[] | null
          modalidade: string
          multiplicador: number
          palpites: string[]
          premio_valor: number | null
          pule: string | null
          status: string | null
          tipo: string
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          colocacao: string
          created_at?: string | null
          data_jogo: string
          horarios: string[]
          id?: string
          loterias?: string[] | null
          modalidade: string
          multiplicador: number
          palpites: string[]
          premio_valor?: number | null
          pule?: string | null
          status?: string | null
          tipo: string
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          colocacao?: string
          created_at?: string | null
          data_jogo?: string
          horarios?: string[]
          id?: string
          loterias?: string[] | null
          modalidade?: string
          multiplicador?: number
          palpites?: string[]
          premio_valor?: number | null
          pule?: string | null
          status?: string | null
          tipo?: string
          user_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "apostas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          entity: string | null
          id: string
          ip_address: string | null
          location: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          id?: string
          ip_address?: string | null
          location?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          id?: string
          ip_address?: string | null
          location?: Json | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          aposta_id: string | null
          created_at: string | null
          id: string
          metodo_pagamento: string | null
          paid_at: string | null
          pix_copy_paste: string | null
          pix_expiration: string | null
          pix_qr_code: string | null
          status: string
          tipo: string | null
          updated_at: string | null
          user_id: string
          valor: number
          washpay_order_id: string | null
          washpay_order_number: string | null
          washpay_payment_link_id: string | null
        }
        Insert: {
          aposta_id?: string | null
          created_at?: string | null
          id?: string
          metodo_pagamento?: string | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_expiration?: string | null
          pix_qr_code?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
          washpay_order_id?: string | null
          washpay_order_number?: string | null
          washpay_payment_link_id?: string | null
        }
        Update: {
          aposta_id?: string | null
          created_at?: string | null
          id?: string
          metodo_pagamento?: string | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_expiration?: string | null
          pix_qr_code?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
          washpay_order_id?: string | null
          washpay_order_number?: string | null
          washpay_payment_link_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_aposta_id_fkey"
            columns: ["aposta_id"]
            isOneToOne: false
            referencedRelation: "apostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          codigo_convite: string | null
          cpf: string
          created_at: string | null
          id: string
          indicado_por: string | null
          last_ip: string | null
          last_location: Json | null
          last_login: string | null
          nome: string
          saldo: number | null
          saldo_bonus: number | null
          signup_ip: string | null
          telefone: string | null
        }
        Insert: {
          codigo_convite?: string | null
          cpf: string
          created_at?: string | null
          id: string
          indicado_por?: string | null
          last_ip?: string | null
          last_location?: Json | null
          last_login?: string | null
          nome: string
          saldo?: number | null
          saldo_bonus?: number | null
          signup_ip?: string | null
          telefone?: string | null
        }
        Update: {
          codigo_convite?: string | null
          cpf?: string
          created_at?: string | null
          id?: string
          indicado_por?: string | null
          last_ip?: string | null
          last_location?: Json | null
          last_login?: string | null
          nome?: string
          saldo?: number | null
          saldo_bonus?: number | null
          signup_ip?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados: {
        Row: {
          banca: string | null
          bicho_1: string | null
          bicho_2: string | null
          bicho_3: string | null
          bicho_4: string | null
          bicho_5: string | null
          bicho_6: string | null
          bicho_7: string | null
          created_at: string | null
          data: string
          horario: string
          id: string
          loteria: string | null
          premio_1: string | null
          premio_2: string | null
          premio_3: string | null
          premio_4: string | null
          premio_5: string | null
          premio_6: string | null
          premio_7: string | null
        }
        Insert: {
          banca?: string | null
          bicho_1?: string | null
          bicho_2?: string | null
          bicho_3?: string | null
          bicho_4?: string | null
          bicho_5?: string | null
          bicho_6?: string | null
          bicho_7?: string | null
          created_at?: string | null
          data: string
          horario: string
          id?: string
          loteria?: string | null
          premio_1?: string | null
          premio_2?: string | null
          premio_3?: string | null
          premio_4?: string | null
          premio_5?: string | null
          premio_6?: string | null
          premio_7?: string | null
        }
        Update: {
          banca?: string | null
          bicho_1?: string | null
          bicho_2?: string | null
          bicho_3?: string | null
          bicho_4?: string | null
          bicho_5?: string | null
          bicho_6?: string | null
          bicho_7?: string | null
          created_at?: string | null
          data?: string
          horario?: string
          id?: string
          loteria?: string | null
          premio_1?: string | null
          premio_2?: string | null
          premio_3?: string | null
          premio_4?: string | null
          premio_5?: string | null
          premio_6?: string | null
          premio_7?: string | null
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          active_gateway: string | null
          bet_max: number | null
          bet_min: number | null
          color_accent_green: string | null
          color_accent_teal: string | null
          color_background: string | null
          color_primary: string | null
          color_primary_dark: string | null
          color_surface: string | null
          color_text_primary: string | null
          created_at: string | null
          custom_head_scripts: string | null
          deposit_max: number | null
          deposit_min: number | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          google_analytics_id: string | null
          id: string
          logo_url: string | null
          max_payout_daily: number | null
          max_payout_per_bet: number | null
          production_mode: boolean | null
          promotor_link: string | null
          site_description: string | null
          site_name: string | null
          social_instagram: string | null
          social_telegram: string | null
          social_whatsapp: string | null
          updated_at: string | null
          withdrawal_fee_percent: number | null
          withdrawal_max: number | null
          withdrawal_min: number | null
          withdrawal_mode: string | null
        }
        Insert: {
          active_gateway?: string | null
          bet_max?: number | null
          bet_min?: number | null
          color_accent_green?: string | null
          color_accent_teal?: string | null
          color_background?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_surface?: string | null
          color_text_primary?: string | null
          created_at?: string | null
          custom_head_scripts?: string | null
          deposit_max?: number | null
          deposit_min?: number | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          google_analytics_id?: string | null
          id?: string
          logo_url?: string | null
          max_payout_daily?: number | null
          max_payout_per_bet?: number | null
          production_mode?: boolean | null
          promotor_link?: string | null
          site_description?: string | null
          site_name?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
          withdrawal_fee_percent?: number | null
          withdrawal_max?: number | null
          withdrawal_min?: number | null
          withdrawal_mode?: string | null
        }
        Update: {
          active_gateway?: string | null
          bet_max?: number | null
          bet_min?: number | null
          color_accent_green?: string | null
          color_accent_teal?: string | null
          color_background?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_surface?: string | null
          color_text_primary?: string | null
          created_at?: string | null
          custom_head_scripts?: string | null
          deposit_max?: number | null
          deposit_min?: number | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          google_analytics_id?: string | null
          id?: string
          logo_url?: string | null
          max_payout_daily?: number | null
          max_payout_per_bet?: number | null
          production_mode?: boolean | null
          promotor_link?: string | null
          site_description?: string | null
          site_name?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
          withdrawal_fee_percent?: number | null
          withdrawal_max?: number | null
          withdrawal_min?: number | null
          withdrawal_mode?: string | null
        }
        Relationships: []
      }
      saques: {
        Row: {
          bspay_transaction_id: string | null
          chave_pix: string
          created_at: string | null
          error_message: string | null
          external_id: string
          id: string
          paid_at: string | null
          status: string
          taxa: number
          tipo_chave: string
          updated_at: string | null
          user_id: string
          valor: number
          valor_liquido: number
        }
        Insert: {
          bspay_transaction_id?: string | null
          chave_pix: string
          created_at?: string | null
          error_message?: string | null
          external_id: string
          id?: string
          paid_at?: string | null
          status?: string
          taxa?: number
          tipo_chave: string
          updated_at?: string | null
          user_id: string
          valor: number
          valor_liquido: number
        }
        Update: {
          bspay_transaction_id?: string | null
          chave_pix?: string
          created_at?: string | null
          error_message?: string | null
          external_id?: string
          id?: string
          paid_at?: string | null
          status?: string
          taxa?: number
          tipo_chave?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "saques_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          external_id: string
          gateway_id: string | null
          id: string
          metadata: Json | null
          provider: string | null
          status: string
          tipo: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          external_id: string
          gateway_id?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          external_id?: string
          gateway_id?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempt_number: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          next_retry_at: string | null
          request_body: Json | null
          request_headers: Json | null
          request_method: string
          request_url: string
          response_body: string | null
          response_status: number | null
          response_time_ms: number | null
          status: string
          webhook_id: string
        }
        Insert: {
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_method: string
          request_url: string
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          status?: string
          webhook_id: string
        }
        Update: {
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_method?: string
          request_url?: string
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks_config"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          events: string[]
          headers: Json | null
          id: string
          last_error: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          max_retries: number | null
          method: string
          name: string
          retry_delay_seconds: number | null
          secret_key: string
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_retries?: number | null
          method?: string
          name?: string
          retry_delay_seconds?: number | null
          secret_key: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_retries?: number | null
          method?: string
          name?: string
          retry_delay_seconds?: number | null
          secret_key?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invoke_scrape_resultados: { Args: never; Returns: undefined }
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
