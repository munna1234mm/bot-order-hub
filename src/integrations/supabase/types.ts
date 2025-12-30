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
      admin_telegram_ids: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string | null
          telegram_chat_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
          telegram_chat_id: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
          telegram_chat_id?: number
        }
        Relationships: []
      }
      bot_commands: {
        Row: {
          command: string
          created_at: string
          id: string
          is_active: boolean
          response: string
          updated_at: string
        }
        Insert: {
          command: string
          created_at?: string
          id?: string
          is_active?: boolean
          response: string
          updated_at?: string
        }
        Update: {
          command?: string
          created_at?: string
          id?: string
          is_active?: boolean
          response?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      canva_pro_requests: {
        Row: {
          created_at: string
          gmail: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          telegram_user_id: number
        }
        Insert: {
          created_at?: string
          gmail: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          telegram_user_id: number
        }
        Update: {
          created_at?: string
          gmail?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
      chatgpt_orders: {
        Row: {
          admin_message: string | null
          created_at: string
          credits_cost: number
          gmail: string | null
          id: string
          order_type: string
          password: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          telegram_user_id: number
        }
        Insert: {
          admin_message?: string | null
          created_at?: string
          credits_cost?: number
          gmail?: string | null
          id?: string
          order_type?: string
          password?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          telegram_user_id: number
        }
        Update: {
          admin_message?: string | null
          created_at?: string
          credits_cost?: number
          gmail?: string | null
          id?: string
          order_type?: string
          password?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
      coupon_codes: {
        Row: {
          code: string
          created_at: string
          credits: number
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string
          telegram_user_id: number
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string
          telegram_user_id: number
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string
          telegram_user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_method_id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          telegram_user_id: number
          transaction_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method_id: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          telegram_user_id: number
          transaction_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method_id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          telegram_user_id?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          id: string
          message_text: string | null
          message_type: string | null
          telegram_user_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: string
          message_text?: string | null
          message_type?: string | null
          telegram_user_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: string
          message_text?: string | null
          message_type?: string | null
          telegram_user_id?: number
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          balance: number
          banned_at: string | null
          created_at: string
          first_name: string | null
          id: string
          is_banned: boolean
          language: string
          last_active_at: string
          last_daily_claim: string | null
          last_name: string | null
          referral_code: string | null
          referral_count: number | null
          referred_by: number | null
          telegram_id: number
          username: string | null
        }
        Insert: {
          balance?: number
          banned_at?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_banned?: boolean
          language?: string
          last_active_at?: string
          last_daily_claim?: string | null
          last_name?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: number | null
          telegram_id: number
          username?: string | null
        }
        Update: {
          balance?: number
          banned_at?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_banned?: boolean
          language?: string
          last_active_at?: string
          last_daily_claim?: string | null
          last_name?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: number | null
          telegram_id?: number
          username?: string | null
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
