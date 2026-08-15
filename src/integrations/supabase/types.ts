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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      motorcycle_photos: {
        Row: {
          created_at: string
          id: string
          motorcycle_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          motorcycle_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          motorcycle_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "motorcycle_photos_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          description: string | null
          gender: string | null
          gift: string | null
          id: string
          installment_count: number | null
          km: number | null
          material: string | null
          model: string
          piece_type: string | null
          price_cash: number
          price_installment: number | null
          size: string | null
          status: Database["public"]["Enums"]["moto_status"]
          stock_quantity: number
          tenant_id: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          gift?: string | null
          id?: string
          installment_count?: number | null
          km?: number | null
          material?: string | null
          model: string
          piece_type?: string | null
          price_cash: number
          price_installment?: number | null
          size?: string | null
          status?: Database["public"]["Enums"]["moto_status"]
          stock_quantity?: number
          tenant_id?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          gift?: string | null
          id?: string
          installment_count?: number | null
          km?: number | null
          material?: string | null
          model?: string
          piece_type?: string | null
          price_cash?: number
          price_installment?: number | null
          size?: string | null
          status?: Database["public"]["Enums"]["moto_status"]
          stock_quantity?: number
          tenant_id?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          motorcycle_id: string
          sold_price: number | null
          status: Database["public"]["Enums"]["order_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          motorcycle_id: string
          sold_price?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          motorcycle_id?: string
          sold_price?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number
          created_at: string
          desired_slug: string | null
          desired_store_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          notes: string | null
          period_months: number
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["proof_status"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          desired_slug?: string | null
          desired_store_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          period_months?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          desired_slug?: string | null
          desired_store_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          period_months?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount: number | null
          created_at: string
          doc_type: Database["public"]["Enums"]["receipt_type"]
          file_type: string
          file_url: string
          id: string
          motorcycle_id: string | null
          notes: string | null
          order_id: string | null
          tenant_id: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["receipt_type"]
          file_type: string
          file_url: string
          id?: string
          motorcycle_id?: string | null
          notes?: string | null
          order_id?: string | null
          tenant_id?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["receipt_type"]
          file_type?: string
          file_url?: string
          id?: string
          motorcycle_id?: string | null
          notes?: string | null
          order_id?: string | null
          tenant_id?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          cost_price: number | null
          created_at: string
          motorcycle_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          motorcycle_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          motorcycle_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: true
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_costs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      profit_cycles: {
        Row: {
          closed_at: string | null
          cost: number
          created_at: string
          id: string
          label: string | null
          profit: number
          revenue: number
          sales_count: number
          started_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          cost?: number
          created_at?: string
          id?: string
          label?: string | null
          profit?: number
          revenue?: number
          sales_count?: number
          started_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          cost?: number
          created_at?: string
          id?: string
          label?: string | null
          profit?: number
          revenue?: number
          sales_count?: number
          started_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_cycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          about: string | null
          address: string | null
          business_hours: Json | null
          email: string | null
          facebook: string | null
          instagram: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          motivational_phrase: string | null
          phone: string | null
          store_name: string
          tenant_id: string
          theme_bg: string | null
          theme_button: string | null
          theme_card: string | null
          theme_color: string | null
          theme_footer: string | null
          theme_header: string | null
          theme_hero: string | null
          theme_text: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          business_hours?: Json | null
          email?: string | null
          facebook?: string | null
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          motivational_phrase?: string | null
          phone?: string | null
          store_name?: string
          tenant_id: string
          theme_bg?: string | null
          theme_button?: string | null
          theme_card?: string | null
          theme_color?: string | null
          theme_footer?: string | null
          theme_header?: string | null
          theme_hero?: string | null
          theme_text?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          business_hours?: Json | null
          email?: string | null
          facebook?: string | null
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          motivational_phrase?: string | null
          phone?: string | null
          store_name?: string
          tenant_id?: string
          theme_bg?: string | null
          theme_button?: string | null
          theme_card?: string | null
          theme_color?: string | null
          theme_footer?: string | null
          theme_header?: string | null
          theme_hero?: string | null
          theme_text?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          grace_days: number
          id: string
          monthly_price: number
          owner_id: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          store_name: string
          subscription_due_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          grace_days?: number
          id?: string
          monthly_price?: number
          owner_id: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          store_name: string
          subscription_due_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          grace_days?: number
          id?: string
          monthly_price?: number
          owner_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          store_name?: string
          subscription_due_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_subscriber: {
        Args: {
          p_months?: number
          p_proof_id: string
          p_slug: string
          p_store_name: string
          p_user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      reject_subscriber: {
        Args: { p_proof_id: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      renew_tenant: {
        Args: { p_months?: number; p_proof_id: string; p_tenant_id: string }
        Returns: undefined
      }
      suspend_overdue_tenants: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "staff" | "super_admin"
      moto_status: "available" | "reserved" | "sold"
      order_status: "pending" | "contacted" | "sold" | "cancelled"
      proof_status: "pending" | "approved" | "rejected"
      receipt_type: "receipt" | "invoice"
      tenant_status: "pending" | "active" | "suspended" | "cancelled"
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
    Enums: {
      app_role: ["admin", "staff", "super_admin"],
      moto_status: ["available", "reserved", "sold"],
      order_status: ["pending", "contacted", "sold", "cancelled"],
      proof_status: ["pending", "approved", "rejected"],
      receipt_type: ["receipt", "invoice"],
      tenant_status: ["pending", "active", "suspended", "cancelled"],
    },
  },
} as const
