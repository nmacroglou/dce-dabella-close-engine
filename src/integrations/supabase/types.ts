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
      coaching_sessions: {
        Row: {
          created_at: string
          deal_id: string | null
          detected_objections: Json | null
          ended_at: string | null
          id: string
          next_steps: Json | null
          rep_id: string
          started_at: string
          summary: string | null
          transcript: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          detected_objections?: Json | null
          ended_at?: string | null
          id?: string
          next_steps?: Json | null
          rep_id: string
          started_at?: string
          summary?: string | null
          transcript?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          detected_objections?: Json | null
          ended_at?: string | null
          id?: string
          next_steps?: Json | null
          rep_id?: string
          started_at?: string
          summary?: string | null
          transcript?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_grids: {
        Row: {
          created_at: string
          follow_up_sla: Json
          front_end_pct: number
          id: string
          monthly_bonus_tiers: Json
          promos: Json
          rep_id: string
          tiers: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up_sla?: Json
          front_end_pct?: number
          id?: string
          monthly_bonus_tiers?: Json
          promos?: Json
          rep_id: string
          tiers?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up_sla?: Json
          front_end_pct?: number
          id?: string
          monthly_bonus_tiers?: Json
          promos?: Json
          rep_id?: string
          tiers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      commission_payments: {
        Row: {
          back_paid_amount: number
          back_paid_at: string | null
          created_at: string
          customer_name: string | null
          deal_id: string | null
          expected_back: number
          expected_front: number
          expected_total: number
          front_paid_amount: number
          front_paid_at: string | null
          id: string
          job_number: string | null
          notes: string | null
          rep_id: string
          sale_date: string | null
          updated_at: string
        }
        Insert: {
          back_paid_amount?: number
          back_paid_at?: string | null
          created_at?: string
          customer_name?: string | null
          deal_id?: string | null
          expected_back?: number
          expected_front?: number
          expected_total?: number
          front_paid_amount?: number
          front_paid_at?: string | null
          id?: string
          job_number?: string | null
          notes?: string | null
          rep_id: string
          sale_date?: string | null
          updated_at?: string
        }
        Update: {
          back_paid_amount?: number
          back_paid_at?: string | null
          created_at?: string
          customer_name?: string | null
          deal_id?: string | null
          expected_back?: number
          expected_front?: number
          expected_total?: number
          front_paid_amount?: number
          front_paid_at?: string | null
          id?: string
          job_number?: string | null
          notes?: string | null
          rep_id?: string
          sale_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deal_incident_notes: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          incident_id: string
          rep_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          incident_id: string
          rep_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          incident_id?: string
          rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_incident_notes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "deal_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_incidents: {
        Row: {
          assignee: string | null
          attachments: Json
          created_at: string
          customer_name: string | null
          deal_id: string | null
          details: string | null
          due_at: string | null
          email_link: string | null
          email_subject: string | null
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          job_number: string | null
          rep_id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          source: Database["public"]["Enums"]["incident_source"]
          status: Database["public"]["Enums"]["incident_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          attachments?: Json
          created_at?: string
          customer_name?: string | null
          deal_id?: string | null
          details?: string | null
          due_at?: string | null
          email_link?: string | null
          email_subject?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          job_number?: string | null
          rep_id: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          source?: Database["public"]["Enums"]["incident_source"]
          status?: Database["public"]["Enums"]["incident_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          attachments?: Json
          created_at?: string
          customer_name?: string | null
          deal_id?: string | null
          details?: string | null
          due_at?: string | null
          email_link?: string | null
          email_subject?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          job_number?: string | null
          rep_id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          source?: Database["public"]["Enums"]["incident_source"]
          status?: Database["public"]["Enums"]["incident_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deal_inspections: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          report_type: string
          sections: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          report_type: string
          sections?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          report_type?: string
          sections?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_inspections_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_objections: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          notes: string | null
          objection_type: string
          rep_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          notes?: string | null
          objection_type: string
          rep_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          notes?: string | null
          objection_type?: string
          rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_objections_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_photos: {
        Row: {
          caption: string | null
          created_at: string
          deal_id: string
          id: string
          include_in_report: boolean
          inspection_report_type: string | null
          inspection_tags: string[]
          rep_id: string
          severity: string | null
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          deal_id: string
          id?: string
          include_in_report?: boolean
          inspection_report_type?: string | null
          inspection_tags?: string[]
          rep_id: string
          severity?: string | null
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          include_in_report?: boolean
          inspection_report_type?: string | null
          inspection_tags?: string[]
          rep_id?: string
          severity?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      deal_stage_history: {
        Row: {
          changed_at: string
          deal_id: string
          from_stage: Database["public"]["Enums"]["deal_stage"] | null
          id: string
          note: string | null
          rep_id: string
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Insert: {
          changed_at?: string
          deal_id: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          note?: string | null
          rep_id: string
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Update: {
          changed_at?: string
          deal_id?: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          note?: string | null
          rep_id?: string
          to_stage?: Database["public"]["Enums"]["deal_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          address: string | null
          closed_amount: number | null
          closed_at: string | null
          commission_sheet: Json
          created_at: string
          disqualified_reason: string | null
          engine_state: Json
          homeowner_email: string | null
          homeowner_phone: string | null
          homeowner1: string | null
          homeowner2: string | null
          id: string
          install_date: string | null
          install_notes: string | null
          lead_source: string | null
          lost_reason: string | null
          notes: string | null
          preliminary_estimate: Json
          price_a: number | null
          price_b: number | null
          price_c: number | null
          products: string[] | null
          rep_id: string
          selected_option: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          stage_changed_at: string
          updated_at: string
          was_demoed: boolean
          was_presented: boolean
        }
        Insert: {
          address?: string | null
          closed_amount?: number | null
          closed_at?: string | null
          commission_sheet?: Json
          created_at?: string
          disqualified_reason?: string | null
          engine_state?: Json
          homeowner_email?: string | null
          homeowner_phone?: string | null
          homeowner1?: string | null
          homeowner2?: string | null
          id?: string
          install_date?: string | null
          install_notes?: string | null
          lead_source?: string | null
          lost_reason?: string | null
          notes?: string | null
          preliminary_estimate?: Json
          price_a?: number | null
          price_b?: number | null
          price_c?: number | null
          products?: string[] | null
          rep_id: string
          selected_option?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          stage_changed_at?: string
          updated_at?: string
          was_demoed?: boolean
          was_presented?: boolean
        }
        Update: {
          address?: string | null
          closed_amount?: number | null
          closed_at?: string | null
          commission_sheet?: Json
          created_at?: string
          disqualified_reason?: string | null
          engine_state?: Json
          homeowner_email?: string | null
          homeowner_phone?: string | null
          homeowner1?: string | null
          homeowner2?: string | null
          id?: string
          install_date?: string | null
          install_notes?: string | null
          lead_source?: string | null
          lost_reason?: string | null
          notes?: string | null
          preliminary_estimate?: Json
          price_a?: number | null
          price_b?: number | null
          price_c?: number | null
          products?: string[] | null
          rep_id?: string
          selected_option?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          stage_changed_at?: string
          updated_at?: string
          was_demoed?: boolean
          was_presented?: boolean
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          ai_email_body: string | null
          ai_email_subject: string | null
          attachments: Json
          channel: string | null
          completed_at: string | null
          context_notes: string | null
          created_at: string
          deal_id: string
          due_at: string
          id: string
          notes: string | null
          rep_id: string
          touchpoint_number: number
          updated_at: string
        }
        Insert: {
          ai_email_body?: string | null
          ai_email_subject?: string | null
          attachments?: Json
          channel?: string | null
          completed_at?: string | null
          context_notes?: string | null
          created_at?: string
          deal_id: string
          due_at: string
          id?: string
          notes?: string | null
          rep_id: string
          touchpoint_number?: number
          updated_at?: string
        }
        Update: {
          ai_email_body?: string | null
          ai_email_subject?: string | null
          attachments?: Json
          channel?: string | null
          completed_at?: string | null
          context_notes?: string | null
          created_at?: string
          deal_id?: string
          due_at?: string
          id?: string
          notes?: string | null
          rep_id?: string
          touchpoint_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      paycheck_overrides: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payday_date: string
          rep_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payday_date: string
          rep_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payday_date?: string
          rep_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      utility_refresh_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          items_added: number
          items_total: number
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          items_added?: number
          items_total?: number
          started_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          items_added?: number
          items_total?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      utility_updates: {
        Row: {
          category: string
          content_hash: string
          created_at: string
          fetched_at: string
          id: string
          impact: string | null
          published_at: string | null
          source_name: string | null
          source_url: string
          summary: string | null
          title: string
          utility: string
        }
        Insert: {
          category?: string
          content_hash: string
          created_at?: string
          fetched_at?: string
          id?: string
          impact?: string | null
          published_at?: string | null
          source_name?: string | null
          source_url: string
          summary?: string | null
          title: string
          utility: string
        }
        Update: {
          category?: string
          content_hash?: string
          created_at?: string
          fetched_at?: string
          id?: string
          impact?: string | null
          published_at?: string | null
          source_name?: string | null
          source_url?: string
          summary?: string | null
          title?: string
          utility?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "rep"
      deal_stage:
        | "inspecting"
        | "presented"
        | "follow_up"
        | "won"
        | "lost"
        | "disqualified"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_source:
        | "email"
        | "phone"
        | "text"
        | "portal"
        | "in_person"
        | "other"
      incident_status:
        | "open"
        | "in_progress"
        | "waiting_external"
        | "blocked"
        | "resolved"
      incident_type:
        | "incomplete_paperwork"
        | "audit_item"
        | "change_order"
        | "addendum"
        | "refund"
        | "deposit_issue"
        | "missing_poi"
        | "fraud_alert"
        | "cancel_decline"
        | "approval_pending"
        | "ownership_stip"
        | "roof_packet"
        | "deal_update"
        | "other"
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
      app_role: ["admin", "rep"],
      deal_stage: [
        "inspecting",
        "presented",
        "follow_up",
        "won",
        "lost",
        "disqualified",
      ],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_source: [
        "email",
        "phone",
        "text",
        "portal",
        "in_person",
        "other",
      ],
      incident_status: [
        "open",
        "in_progress",
        "waiting_external",
        "blocked",
        "resolved",
      ],
      incident_type: [
        "incomplete_paperwork",
        "audit_item",
        "change_order",
        "addendum",
        "refund",
        "deposit_issue",
        "missing_poi",
        "fraud_alert",
        "cancel_decline",
        "approval_pending",
        "ownership_stip",
        "roof_packet",
        "deal_update",
        "other",
      ],
    },
  },
} as const
