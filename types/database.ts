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
          platform_id: string
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
          platform_id: string
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
          platform_id?: string
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
            foreignKeyName: "apostas_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
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
      bonus_deposito_aplicados: {
        Row: {
          config_id: string | null
          created_at: string | null
          id: string
          pagamento_id: string
          percentual_aplicado: number
          platform_id: string | null
          user_id: string
          valor_bonus: number
          valor_deposito: number
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          id?: string
          pagamento_id: string
          percentual_aplicado: number
          platform_id?: string | null
          user_id: string
          valor_bonus: number
          valor_deposito: number
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          id?: string
          pagamento_id?: string
          percentual_aplicado?: number
          platform_id?: string | null
          user_id?: string
          valor_bonus?: number
          valor_deposito?: number
        }
        Relationships: [
          {
            foreignKeyName: "bonus_deposito_aplicados_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "bonus_deposito_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_deposito_aplicados_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_deposito_aplicados_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_deposito_aplicados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_deposito_config: {
        Row: {
          ativo: boolean
          bonus_maximo: number | null
          bonus_percentual: number
          created_at: string | null
          created_by: string | null
          deposito_minimo: number
          id: string
          platform_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          bonus_maximo?: number | null
          bonus_percentual: number
          created_at?: string | null
          created_by?: string | null
          deposito_minimo: number
          id?: string
          platform_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          bonus_maximo?: number | null
          bonus_percentual?: number
          created_at?: string | null
          created_by?: string | null
          deposito_minimo?: number
          id?: string
          platform_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonus_deposito_config_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comissoes_indicacao: {
        Row: {
          aposta_id: string
          created_at: string | null
          id: string
          indicado_id: string
          indicador_id: string
          percentual: number
          platform_id: string | null
          status: string | null
          valor_aposta: number
          valor_comissao: number
        }
        Insert: {
          aposta_id: string
          created_at?: string | null
          id?: string
          indicado_id: string
          indicador_id: string
          percentual?: number
          platform_id?: string | null
          status?: string | null
          valor_aposta: number
          valor_comissao: number
        }
        Update: {
          aposta_id?: string
          created_at?: string | null
          id?: string
          indicado_id?: string
          indicador_id?: string
          percentual?: number
          platform_id?: string | null
          status?: string | null
          valor_aposta?: number
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_indicacao_aposta_id_fkey"
            columns: ["aposta_id"]
            isOneToOne: false
            referencedRelation: "apostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_indicacao_indicado_id_fkey"
            columns: ["indicado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_indicacao_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_indicacao_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_config: {
        Row: {
          ativo: boolean | null
          base_url: string
          created_at: string | null
          global_apikey: string
          id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          base_url: string
          created_at?: string | null
          global_apikey: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          base_url?: string
          created_at?: string | null
          global_apikey?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      evolution_instances: {
        Row: {
          created_at: string | null
          id: string
          instance_apikey: string | null
          instance_name: string
          phone_number: string | null
          platform_id: string | null
          qrcode_base64: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_apikey?: string | null
          instance_name: string
          phone_number?: string | null
          platform_id?: string | null
          qrcode_base64?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_apikey?: string | null
          instance_name?: string
          phone_number?: string | null
          platform_id?: string | null
          qrcode_base64?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_instances_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_messages_log: {
        Row: {
          error_message: string | null
          id: string
          instance_id: string | null
          message_content: string | null
          recipient_phone: string
          sent_at: string | null
          status: string | null
          trigger_type: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          instance_id?: string | null
          message_content?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string | null
          trigger_type?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          instance_id?: string | null
          message_content?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string | null
          trigger_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_messages_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_trigger_messages: {
        Row: {
          caption: string | null
          content: string | null
          created_at: string | null
          delay_seconds: number | null
          id: string
          message_type: string
          order_index: number
          trigger_id: string | null
        }
        Insert: {
          caption?: string | null
          content?: string | null
          created_at?: string | null
          delay_seconds?: number | null
          id?: string
          message_type: string
          order_index?: number
          trigger_id?: string | null
        }
        Update: {
          caption?: string | null
          content?: string | null
          created_at?: string | null
          delay_seconds?: number | null
          id?: string
          message_type?: string
          order_index?: number
          trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_trigger_messages_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "evolution_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_triggers: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          instance_id: string | null
          platform_id: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          instance_id?: string | null
          platform_id?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          instance_id?: string | null
          platform_id?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_triggers_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_triggers_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_config: {
        Row: {
          ativo: boolean | null
          client_id: string | null
          client_secret: string | null
          config: Json | null
          created_at: string | null
          gateway_name: string
          id: string
          platform_id: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          ativo?: boolean | null
          client_id?: string | null
          client_secret?: string | null
          config?: Json | null
          created_at?: string | null
          gateway_name: string
          id?: string
          platform_id?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          ativo?: boolean | null
          client_id?: string | null
          client_secret?: string | null
          config?: Json | null
          created_at?: string | null
          gateway_name?: string
          id?: string
          platform_id?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gateway_config_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades_config: {
        Row: {
          ativo: boolean | null
          categoria: string
          codigo: string
          created_at: string | null
          id: string
          multiplicador: number
          nome: string
          ordem: number | null
          posicoes_1_10: boolean | null
          posicoes_1_5: boolean | null
          posicoes_1_6: boolean | null
          posicoes_1_7: boolean | null
          posicoes_5_6: boolean | null
          updated_at: string | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          codigo: string
          created_at?: string | null
          id?: string
          multiplicador: number
          nome: string
          ordem?: number | null
          posicoes_1_10?: boolean | null
          posicoes_1_5?: boolean | null
          posicoes_1_6?: boolean | null
          posicoes_1_7?: boolean | null
          posicoes_5_6?: boolean | null
          updated_at?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          codigo?: string
          created_at?: string | null
          id?: string
          multiplicador?: number
          nome?: string
          ordem?: number | null
          posicoes_1_10?: boolean | null
          posicoes_1_5?: boolean | null
          posicoes_1_6?: boolean | null
          posicoes_1_7?: boolean | null
          posicoes_5_6?: boolean | null
          updated_at?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
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
          platform_id: string
          status: string
          tipo: string | null
          updated_at: string | null
          user_id: string
          valor: number
          wallet_type: string | null
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
          platform_id: string
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
          wallet_type?: string | null
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
          platform_id?: string
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
          wallet_type?: string | null
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
            foreignKeyName: "pagamentos_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
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
      page_views: {
        Row: {
          created_at: string | null
          device_type: string | null
          game_type: string | null
          id: string
          page_path: string
          page_type: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          game_type?: string | null
          id?: string
          page_path: string
          page_type?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          game_type?: string | null
          id?: string
          page_path?: string
          page_type?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          permissions: Json | null
          platform_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          permissions?: Json | null
          platform_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          permissions?: Json | null
          platform_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
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
          comissao_promotor_automatica: boolean | null
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
          comissao_promotor_automatica?: boolean | null
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
          comissao_promotor_automatica?: boolean | null
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
      platform_modalidades: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          id: string
          multiplicador: number
          ordem: number | null
          platform_id: string
          updated_at: string | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          id?: string
          multiplicador?: number
          ordem?: number | null
          platform_id: string
          updated_at?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          id?: string
          multiplicador?: number
          ordem?: number | null
          platform_id?: string
          updated_at?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_modalidades_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          active_gateway: string | null
          ativo: boolean | null
          bet_max: number | null
          bet_min: number | null
          client_id: string | null
          color_accent_green: string | null
          color_accent_teal: string | null
          color_background: string | null
          color_primary: string | null
          color_primary_dark: string | null
          color_surface: string | null
          color_text_primary: string | null
          comissao_promotor_automatica: boolean | null
          created_at: string | null
          custom_head_scripts: string | null
          deposit_max: number | null
          deposit_min: number | null
          domain: string
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          gateway_credentials: Json | null
          google_analytics_id: string | null
          id: string
          layout_id: number | null
          login_bg_url: string | null
          logo_url: string | null
          max_payout_daily: number | null
          max_payout_per_bet: number | null
          name: string
          production_mode: boolean | null
          promotor_link: string | null
          site_description: string | null
          slug: string
          social_instagram: string | null
          social_telegram: string | null
          social_whatsapp: string | null
          updated_at: string | null
          utmify_pixel_id: string | null
          withdrawal_fee_percent: number | null
          withdrawal_max: number | null
          withdrawal_min: number | null
          withdrawal_mode: string | null
        }
        Insert: {
          active_gateway?: string | null
          ativo?: boolean | null
          bet_max?: number | null
          bet_min?: number | null
          client_id?: string | null
          color_accent_green?: string | null
          color_accent_teal?: string | null
          color_background?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_surface?: string | null
          color_text_primary?: string | null
          comissao_promotor_automatica?: boolean | null
          created_at?: string | null
          custom_head_scripts?: string | null
          deposit_max?: number | null
          deposit_min?: number | null
          domain: string
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          gateway_credentials?: Json | null
          google_analytics_id?: string | null
          id?: string
          layout_id?: number | null
          login_bg_url?: string | null
          logo_url?: string | null
          max_payout_daily?: number | null
          max_payout_per_bet?: number | null
          name: string
          production_mode?: boolean | null
          promotor_link?: string | null
          site_description?: string | null
          slug: string
          social_instagram?: string | null
          social_telegram?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
          utmify_pixel_id?: string | null
          withdrawal_fee_percent?: number | null
          withdrawal_max?: number | null
          withdrawal_min?: number | null
          withdrawal_mode?: string | null
        }
        Update: {
          active_gateway?: string | null
          ativo?: boolean | null
          bet_max?: number | null
          bet_min?: number | null
          client_id?: string | null
          color_accent_green?: string | null
          color_accent_teal?: string | null
          color_background?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_surface?: string | null
          color_text_primary?: string | null
          comissao_promotor_automatica?: boolean | null
          created_at?: string | null
          custom_head_scripts?: string | null
          deposit_max?: number | null
          deposit_min?: number | null
          domain?: string
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          gateway_credentials?: Json | null
          google_analytics_id?: string | null
          id?: string
          layout_id?: number | null
          login_bg_url?: string | null
          logo_url?: string | null
          max_payout_daily?: number | null
          max_payout_per_bet?: number | null
          name?: string
          production_mode?: boolean | null
          promotor_link?: string | null
          site_description?: string | null
          slug?: string
          social_instagram?: string | null
          social_telegram?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
          utmify_pixel_id?: string | null
          withdrawal_fee_percent?: number | null
          withdrawal_max?: number | null
          withdrawal_min?: number | null
          withdrawal_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platforms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      playfiver_config: {
        Row: {
          agent_token: string
          ativo: boolean
          bonus_enable: boolean
          callback_url: string
          created_at: string
          default_rtp: number
          id: string
          limit_amount: number | null
          limit_enable: boolean
          limit_hours: number | null
          platform_id: string
          secret_key: string
          updated_at: string
        }
        Insert: {
          agent_token: string
          ativo?: boolean
          bonus_enable?: boolean
          callback_url: string
          created_at?: string
          default_rtp?: number
          id?: string
          limit_amount?: number | null
          limit_enable?: boolean
          limit_hours?: number | null
          platform_id: string
          secret_key: string
          updated_at?: string
        }
        Update: {
          agent_token?: string
          ativo?: boolean
          bonus_enable?: boolean
          callback_url?: string
          created_at?: string
          default_rtp?: number
          id?: string
          limit_amount?: number | null
          limit_enable?: boolean
          limit_hours?: number | null
          platform_id?: string
          secret_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playfiver_config_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: true
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      playfiver_games_cache: {
        Row: {
          cached_at: string
          featured: boolean | null
          game_code: string
          game_name: string
          id: string
          image_url: string | null
          original: boolean
          provider: string
        }
        Insert: {
          cached_at?: string
          featured?: boolean | null
          game_code: string
          game_name: string
          id?: string
          image_url?: string | null
          original?: boolean
          provider: string
        }
        Update: {
          cached_at?: string
          featured?: boolean | null
          game_code?: string
          game_name?: string
          id?: string
          image_url?: string | null
          original?: boolean
          provider?: string
        }
        Relationships: []
      }
      playfiver_transactions: {
        Row: {
          balance_after: number
          balance_before: number
          bet: number
          created_at: string
          game_code: string | null
          game_type: string | null
          id: string
          platform_id: string
          provider_code: string | null
          raw_payload: Json | null
          round_id: string | null
          txn_id: string
          txn_type: string
          user_id: string
          win: number
        }
        Insert: {
          balance_after: number
          balance_before: number
          bet?: number
          created_at?: string
          game_code?: string | null
          game_type?: string | null
          id?: string
          platform_id: string
          provider_code?: string | null
          raw_payload?: Json | null
          round_id?: string | null
          txn_id: string
          txn_type: string
          user_id: string
          win?: number
        }
        Update: {
          balance_after?: number
          balance_before?: number
          bet?: number
          created_at?: string
          game_code?: string | null
          game_type?: string | null
          id?: string
          platform_id?: string
          provider_code?: string | null
          raw_payload?: Json | null
          round_id?: string | null
          txn_id?: string
          txn_type?: string
          user_id?: string
          win?: number
        }
        Relationships: [
          {
            foreignKeyName: "playfiver_transactions_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
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
          platform_id: string
          saldo: number | null
          saldo_bonus: number | null
          saldo_cassino: number | null
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
          platform_id: string
          saldo?: number | null
          saldo_bonus?: number | null
          saldo_cassino?: number | null
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
          platform_id?: string
          saldo?: number | null
          saldo_bonus?: number | null
          saldo_cassino?: number | null
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
          {
            foreignKeyName: "profiles_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      promocoes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          percentual: number | null
          platform_id: string | null
          tipo: string
          titulo: string
          updated_at: string | null
          valor: number | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          percentual?: number | null
          platform_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
          valor?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          percentual?: number | null
          platform_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          valor?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promocoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocoes_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      promotor_comissoes: {
        Row: {
          created_at: string | null
          id: string
          percentual_aplicado: number
          promotor_id: string
          referencia_id: string
          tipo: string
          user_id: string
          valor_base: number
          valor_comissao: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          percentual_aplicado: number
          promotor_id: string
          referencia_id: string
          tipo: string
          user_id: string
          valor_base: number
          valor_comissao: number
        }
        Update: {
          created_at?: string | null
          id?: string
          percentual_aplicado?: number
          promotor_id?: string
          referencia_id?: string
          tipo?: string
          user_id?: string
          valor_base?: number
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotor_comissoes_promotor_id_fkey"
            columns: ["promotor_id"]
            isOneToOne: false
            referencedRelation: "promotores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotor_comissoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotor_referidos: {
        Row: {
          created_at: string | null
          id: string
          promotor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          promotor_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          promotor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotor_referidos_promotor_id_fkey"
            columns: ["promotor_id"]
            isOneToOne: false
            referencedRelation: "promotores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotor_referidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotor_roles: {
        Row: {
          created_at: string | null
          id: string
          promotor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          promotor_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          promotor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotor_roles_promotor_id_fkey"
            columns: ["promotor_id"]
            isOneToOne: false
            referencedRelation: "promotores"
            referencedColumns: ["id"]
          },
        ]
      }
      promotores: {
        Row: {
          ativo: boolean
          codigo_afiliado: string
          comissao_deposito_percentual: number | null
          comissao_perda_percentual: number | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          nome: string
          platform_id: string
          saldo: number
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          codigo_afiliado: string
          comissao_deposito_percentual?: number | null
          comissao_perda_percentual?: number | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          nome: string
          platform_id: string
          saldo?: number
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean
          codigo_afiliado?: string
          comissao_deposito_percentual?: number | null
          comissao_perda_percentual?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          nome?: string
          platform_id?: string
          saldo?: number
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotores_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      propagandas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          gatilhos: string[]
          id: string
          imagem_url: string
          link_url: string | null
          platform_id: string | null
          prioridade: number | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gatilhos?: string[]
          id?: string
          imagem_url: string
          link_url?: string | null
          platform_id?: string | null
          prioridade?: number | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gatilhos?: string[]
          id?: string
          imagem_url?: string
          link_url?: string | null
          platform_id?: string | null
          prioridade?: number | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propagandas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propagandas_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
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
      saques: {
        Row: {
          bspay_transaction_id: string | null
          chave_pix: string
          created_at: string | null
          error_message: string | null
          external_id: string
          id: string
          paid_at: string | null
          platform_id: string
          status: string
          taxa: number
          tipo_chave: string
          updated_at: string | null
          user_id: string
          valor: number
          valor_liquido: number
          wallet_type: string | null
        }
        Insert: {
          bspay_transaction_id?: string | null
          chave_pix: string
          created_at?: string | null
          error_message?: string | null
          external_id: string
          id?: string
          paid_at?: string | null
          platform_id: string
          status?: string
          taxa?: number
          tipo_chave: string
          updated_at?: string | null
          user_id: string
          valor: number
          valor_liquido: number
          wallet_type?: string | null
        }
        Update: {
          bspay_transaction_id?: string | null
          chave_pix?: string
          created_at?: string | null
          error_message?: string | null
          external_id?: string
          id?: string
          paid_at?: string | null
          platform_id?: string
          status?: string
          taxa?: number
          tipo_chave?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
          valor_liquido?: number
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saques_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saques_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suspeitos: {
        Row: {
          created_at: string | null
          created_by: string | null
          detalhes: Json | null
          id: string
          motivo: string
          nivel: string
          platform_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          detalhes?: Json | null
          id?: string
          motivo: string
          nivel: string
          platform_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          detalhes?: Json | null
          id?: string
          motivo?: string
          nivel?: string
          platform_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspeitos_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspeitos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          external_id: string
          gateway_id: string | null
          id: string
          metadata: Json | null
          platform_id: string
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
          platform_id: string
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
          platform_id?: string
          provider?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ultimo_ganhador: {
        Row: {
          data_hora: string
          id: string
          platform_id: string | null
          unidade: string
          valor: number
        }
        Insert: {
          data_hora?: string
          id?: string
          platform_id?: string | null
          unidade: string
          valor: number
        }
        Update: {
          data_hora?: string
          id?: string
          platform_id?: string | null
          unidade?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "ultimo_ganhador_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: true
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      verificacao_apostas: {
        Row: {
          aposta_id: string | null
          created_at: string | null
          ganhou: boolean | null
          id: string
          palpite: string | null
          premio_calculado: number | null
          premio_numero: string | null
          premio_posicao: number | null
          resultado_id: string | null
        }
        Insert: {
          aposta_id?: string | null
          created_at?: string | null
          ganhou?: boolean | null
          id?: string
          palpite?: string | null
          premio_calculado?: number | null
          premio_numero?: string | null
          premio_posicao?: number | null
          resultado_id?: string | null
        }
        Update: {
          aposta_id?: string | null
          created_at?: string | null
          ganhou?: boolean | null
          id?: string
          palpite?: string | null
          premio_calculado?: number | null
          premio_numero?: string | null
          premio_posicao?: number | null
          resultado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verificacao_apostas_aposta_id_fkey"
            columns: ["aposta_id"]
            isOneToOne: false
            referencedRelation: "apostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verificacao_apostas_resultado_id_fkey"
            columns: ["resultado_id"]
            isOneToOne: false
            referencedRelation: "resultados"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_presence: {
        Row: {
          current_page: string | null
          id: string
          last_seen_at: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          current_page?: string | null
          id?: string
          last_seen_at?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          current_page?: string | null
          id?: string
          last_seen_at?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_presence_user_id_fkey"
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
          platform_id: string | null
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
          platform_id?: string | null
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
          platform_id?: string | null
          retry_delay_seconds?: number | null
          secret_key?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_config_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_balance: {
        Args: { p_amount: number; p_tipo?: string; p_user_id: string }
        Returns: Json
      }
      cancel_bet: { Args: { p_aposta_id: string }; Returns: undefined }
      debit_balance:
        | { Args: { p_amount: number; p_user_id: string }; Returns: Json }
        | {
            Args: {
              p_amount: number
              p_user_id: string
              p_wallet_type?: string
            }
            Returns: Json
          }
      fn_generate_daily_winner: {
        Args: { p_platform_id: string }
        Returns: {
          data_hora: string
          id: string
          platform_id: string | null
          unidade: string
          valor: number
        }
        SetofOptions: {
          from: "*"
          to: "ultimo_ganhador"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_get_multiplicador: {
        Args: { p_codigo: string; p_platform_id: string }
        Returns: number
      }
      fn_get_ultimo_ganhador: {
        Args: { p_platform_id: string }
        Returns: {
          data_hora: string
          is_fake: boolean
          unidade: string
          valor: number
        }[]
      }
      fn_mark_bets_lost: { Args: { p_bet_ids: string[] }; Returns: Json }
      fn_playfiver_game_launch: {
        Args: {
          p_game_code: string
          p_game_original: boolean
          p_provider: string
          p_user_id: string
        }
        Returns: Json
      }
      fn_playfiver_test_connection: {
        Args: { p_platform_id: string }
        Returns: Json
      }
      fn_process_payout: {
        Args: { p_amount: number; p_bet_id: string; p_metadata?: Json }
        Returns: Json
      }
      fn_process_refund: {
        Args: { p_bet_id: string; p_reason?: string }
        Returns: Json
      }
      fn_seed_platform_modalidades: {
        Args: { p_platform_id: string }
        Returns: number
      }
      get_platform_config: {
        Args: never
        Returns: {
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
          comissao_promotor_automatica: boolean | null
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
        SetofOptions: {
          from: "*"
          to: "platform_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_promotor_id: { Args: { checking_user_id: string }; Returns: string }
      get_user_admin_platforms: { Args: never; Returns: string[] }
      get_user_platform_id: { Args: never; Returns: string }
      invoke_scrape_resultados: { Args: never; Returns: undefined }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { checking_user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { p_platform_id: string }; Returns: boolean }
      is_promotor: { Args: { checking_user_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      map_subloteria_to_banca: {
        Args: { subloteria_id: string }
        Returns: string
      }
      map_subloteria_to_loteria: {
        Args: { subloteria_id: string }
        Returns: string
      }
      numero_to_grupo: { Args: { numero: string }; Returns: number }
      place_bet: {
        Args: {
          p_colocacao: string
          p_data_jogo: string
          p_horarios: string[]
          p_loterias: string[]
          p_modalidade: string
          p_multiplicador?: number
          p_palpites: string[]
          p_tipo: string
          p_valor_unitario: number
        }
        Returns: Json
      }
      process_pix_deposit:
        | {
            Args: {
              p_amount: number
              p_external_id: string
              p_gateway_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_external_id: string
              p_gateway_id: string
              p_user_id: string
            }
            Returns: Json
          }
      transfer_balance: {
        Args: {
          p_amount: number
          p_from_wallet: string
          p_to_wallet: string
          p_user_id: string
        }
        Returns: Json
      }
      verificar_apostas: {
        Args: { p_data?: string; p_horario?: string }
        Returns: Json
      }
      verificar_palpite: {
        Args: {
          p_colocacao: string
          p_modalidade: string
          p_palpite: string
          p_resultado: Record<string, unknown>
        }
        Returns: {
          ganhou: boolean
          posicao_match: number
          premio_numero: string
        }[]
      }
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
