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
      domain_values: {
        Row: {
          category: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          value?: string
        }
        Relationships: []
      }
      interest_registrations: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      interview_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          prompt_template: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          prompt_template?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          prompt_template?: string | null
          title?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          audio_url: string | null
          completed_at: string | null
          created_at: string
          extracted_context: Json | null
          id: string
          interview_type: string
          started_at: string | null
          status: string
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          completed_at?: string | null
          created_at?: string
          extracted_context?: Json | null
          id?: string
          interview_type: string
          started_at?: string | null
          status?: string
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          completed_at?: string | null
          created_at?: string
          extracted_context?: Json | null
          id?: string
          interview_type?: string
          started_at?: string | null
          status?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string | null
          invited_email: string | null
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          invitation_code: string | null
          name: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          invitation_code?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          invitation_code?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invitation_code_fkey"
            columns: ["invitation_code"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["code"]
          },
        ]
      }
      user_interest: {
        Row: {
          beta: boolean | null
          challenge: string | null
          created_at: string | null
          email: string
          id: string
          industry: string | null
          name: string
          stage: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          beta?: boolean | null
          challenge?: string | null
          created_at?: string | null
          email: string
          id?: string
          industry?: string | null
          name: string
          stage?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          beta?: boolean | null
          challenge?: string | null
          created_at?: string | null
          email?: string
          id?: string
          industry?: string | null
          name?: string
          stage?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      mark_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
