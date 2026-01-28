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
      apostas: {
        Row: {
          colocacao: string
          created_at: string | null
          data_jogo: string
          horarios: string[]
          id: string
          modalidade: string
          multiplicador: number
          palpites: string[]
          premio_valor: number | null
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
          modalidade: string
          multiplicador: number
          palpites: string[]
          premio_valor?: number | null
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
          modalidade?: string
          multiplicador?: number
          palpites?: string[]
          premio_valor?: number | null
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
          nome: string
          saldo: number | null
          saldo_bonus: number | null
          telefone: string | null
        }
        Insert: {
          codigo_convite?: string | null
          cpf: string
          created_at?: string | null
          id: string
          nome: string
          saldo?: number | null
          saldo_bonus?: number | null
          telefone?: string | null
        }
        Update: {
          codigo_convite?: string | null
          cpf?: string
          created_at?: string | null
          id?: string
          nome?: string
          saldo?: number | null
          saldo_bonus?: number | null
          telefone?: string | null
        }
        Relationships: []
      }
      resultados: {
        Row: {
          banca: string | null
          bicho_1: string | null
          bicho_2: string | null
          bicho_3: string | null
          bicho_4: string | null
          bicho_5: string | null
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
        }
        Insert: {
          banca?: string | null
          bicho_1?: string | null
          bicho_2?: string | null
          bicho_3?: string | null
          bicho_4?: string | null
          bicho_5?: string | null
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
        }
        Update: {
          banca?: string | null
          bicho_1?: string | null
          bicho_2?: string | null
          bicho_3?: string | null
          bicho_4?: string | null
          bicho_5?: string | null
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
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          id: string
          site_name: string | null
          site_description: string | null
          logo_url: string | null
          favicon_url: string | null
          color_primary: string | null
          color_primary_dark: string | null
          color_background: string | null
          color_surface: string | null
          color_accent_teal: string | null
          color_accent_green: string | null
          color_text_primary: string | null
          social_whatsapp: string | null
          social_instagram: string | null
          social_telegram: string | null
          active_gateway: string | null
          deposit_min: number | null
          deposit_max: number | null
          withdrawal_min: number | null
          withdrawal_max: number | null
          withdrawal_fee_percent: number | null
          withdrawal_mode: string | null
          bet_min: number | null
          bet_max: number | null
          max_payout_per_bet: number | null
          max_payout_daily: number | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          custom_head_scripts: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          site_name?: string | null
          site_description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_background?: string | null
          color_surface?: string | null
          color_accent_teal?: string | null
          color_accent_green?: string | null
          color_text_primary?: string | null
          social_whatsapp?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          active_gateway?: string | null
          deposit_min?: number | null
          deposit_max?: number | null
          withdrawal_min?: number | null
          withdrawal_max?: number | null
          withdrawal_fee_percent?: number | null
          withdrawal_mode?: string | null
          bet_min?: number | null
          bet_max?: number | null
          max_payout_per_bet?: number | null
          max_payout_daily?: number | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          custom_head_scripts?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          site_name?: string | null
          site_description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_background?: string | null
          color_surface?: string | null
          color_accent_teal?: string | null
          color_accent_green?: string | null
          color_text_primary?: string | null
          social_whatsapp?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          active_gateway?: string | null
          deposit_min?: number | null
          deposit_max?: number | null
          withdrawal_min?: number | null
          withdrawal_max?: number | null
          withdrawal_fee_percent?: number | null
          withdrawal_mode?: string | null
          bet_min?: number | null
          bet_max?: number | null
          max_payout_per_bet?: number | null
          max_payout_daily?: number | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          custom_head_scripts?: string | null
          created_at?: string | null
          updated_at?: string | null
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
