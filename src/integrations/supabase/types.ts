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
      career_profile: {
        Row: {
          created_at: string | null
          current_company: string | null
          current_title: string | null
          id: string
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          id?: string
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          id?: string
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certification: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiration_date: string | null
          is_active: boolean
          issue_date: string | null
          issuing_organization: string
          logical_entity_id: string
          name: string
          source: string | null
          source_confidence: number | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          is_active?: boolean
          issue_date?: string | null
          issuing_organization: string
          logical_entity_id?: string
          name: string
          source?: string | null
          source_confidence?: number | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          is_active?: boolean
          issue_date?: string | null
          issuing_organization?: string
          logical_entity_id?: string
          name?: string
          source?: string | null
          source_confidence?: number | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
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
      education: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          gpa: string | null
          institution: string
          is_active: boolean
          logical_entity_id: string
          source: string | null
          source_confidence: number | null
          start_date: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: string | null
          institution: string
          is_active?: boolean
          logical_entity_id?: string
          source?: string | null
          source_confidence?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: string | null
          institution?: string
          is_active?: boolean
          logical_entity_id?: string
          source?: string | null
          source_confidence?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      encrypted_data: {
        Row: {
          content_type: string
          created_at: string
          encrypted_content: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          encrypted_content: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          encrypted_content?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      interview_sessions: {
        Row: {
          audio_file_url: string | null
          created_at: string
          current_phase: string | null
          current_question_id: string | null
          ended_at: string | null
          id: string
          phase_data: Json | null
          session_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_file_url?: string | null
          created_at?: string
          current_phase?: string | null
          current_question_id?: string | null
          ended_at?: string | null
          id?: string
          phase_data?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_file_url?: string | null
          created_at?: string
          current_phase?: string | null
          current_question_id?: string | null
          ended_at?: string | null
          id?: string
          phase_data?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_transcripts: {
        Row: {
          ai_followup: string | null
          content: string
          created_at: string
          id: string
          question_id: string | null
          session_id: string
          speaker: string
          structured_response: Json | null
          timestamp_ms: number | null
          user_answer: string | null
        }
        Insert: {
          ai_followup?: string | null
          content: string
          created_at?: string
          id?: string
          question_id?: string | null
          session_id: string
          speaker: string
          structured_response?: Json | null
          timestamp_ms?: number | null
          user_answer?: string | null
        }
        Update: {
          ai_followup?: string | null
          content?: string
          created_at?: string
          id?: string
          question_id?: string | null
          session_id?: string
          speaker?: string
          structured_response?: Json | null
          timestamp_ms?: number | null
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
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
          processed: boolean | null
          started_at: string | null
          status: string
          summary: string | null
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
          processed?: boolean | null
          started_at?: string | null
          status?: string
          summary?: string | null
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
          processed?: boolean | null
          started_at?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          impact: string | null
          start_date: string | null
          title: string
          tools_used: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impact?: string | null
          start_date?: string | null
          title: string
          tools_used?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impact?: string | null
          start_date?: string | null
          title?: string
          tools_used?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      llm_cache: {
        Row: {
          access_count: number
          complexity: string
          created_at: string
          id: string
          last_accessed_at: string
          model: string
          prompt_hash: string
          request_data: Json
          response_data: Json
        }
        Insert: {
          access_count?: number
          complexity: string
          created_at?: string
          id?: string
          last_accessed_at?: string
          model: string
          prompt_hash: string
          request_data: Json
          response_data: Json
        }
        Update: {
          access_count?: number
          complexity?: string
          created_at?: string
          id?: string
          last_accessed_at?: string
          model?: string
          prompt_hash?: string
          request_data?: Json
          response_data?: Json
        }
        Relationships: []
      }
      profile_deltas: {
        Row: {
          created_at: string | null
          entity_type: string
          field: string | null
          id: string
          new_value: string | null
          original_value: string | null
          source_interview: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          field?: string | null
          id?: string
          new_value?: string | null
          original_value?: string | null
          source_interview: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          field?: string | null
          id?: string
          new_value?: string | null
          original_value?: string | null
          source_interview?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_deltas_source_interview_fkey"
            columns: ["source_interview"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      project: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          is_active: boolean
          logical_entity_id: string
          name: string
          project_url: string | null
          repository_url: string | null
          source: string | null
          source_confidence: number | null
          start_date: string | null
          technologies_used: string[] | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          is_active?: boolean
          logical_entity_id?: string
          name: string
          project_url?: string | null
          repository_url?: string | null
          source?: string | null
          source_confidence?: number | null
          start_date?: string | null
          technologies_used?: string[] | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          is_active?: boolean
          logical_entity_id?: string
          name?: string
          project_url?: string | null
          repository_url?: string | null
          source?: string | null
          source_confidence?: number | null
          start_date?: string | null
          technologies_used?: string[] | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      question_flows: {
        Row: {
          branch_condition_json: Json | null
          created_at: string
          followup_trigger_keywords: string[] | null
          id: string
          metadata: Json | null
          order_num: number
          phase: Database["public"]["Enums"]["interview_phase"]
          question_text: string
          updated_at: string
        }
        Insert: {
          branch_condition_json?: Json | null
          created_at?: string
          followup_trigger_keywords?: string[] | null
          id?: string
          metadata?: Json | null
          order_num: number
          phase: Database["public"]["Enums"]["interview_phase"]
          question_text: string
          updated_at?: string
        }
        Update: {
          branch_condition_json?: Json | null
          created_at?: string
          followup_trigger_keywords?: string[] | null
          id?: string
          metadata?: Json | null
          order_num?: number
          phase?: Database["public"]["Enums"]["interview_phase"]
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      resume_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          parsing_status: string
          structured_data: Json | null
          updated_at: string
          upload_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          parsing_status?: string
          structured_data?: Json | null
          updated_at?: string
          upload_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          parsing_status?: string
          structured_data?: Json | null
          updated_at?: string
          upload_status?: string
          user_id?: string
        }
        Relationships: []
      }
      skill: {
        Row: {
          category: string | null
          created_at: string
          is_active: boolean
          logical_entity_id: string
          name: string
          proficiency_level: string | null
          source: string | null
          source_confidence: number | null
          updated_at: string
          user_id: string
          version: number
          years_of_experience: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          is_active?: boolean
          logical_entity_id?: string
          name: string
          proficiency_level?: string | null
          source?: string | null
          source_confidence?: number | null
          updated_at?: string
          user_id: string
          version?: number
          years_of_experience?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          is_active?: boolean
          logical_entity_id?: string
          name?: string
          proficiency_level?: string | null
          source?: string | null
          source_confidence?: number | null
          updated_at?: string
          user_id?: string
          version?: number
          years_of_experience?: number | null
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          prompt: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          prompt: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          prompt?: string
        }
        Relationships: []
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
      work_experience: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          is_active: boolean
          logical_entity_id: string
          source: string | null
          source_confidence: number | null
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          is_active?: boolean
          logical_entity_id?: string
          source?: string | null
          source_confidence?: number | null
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          is_active?: boolean
          logical_entity_id?: string
          source?: string | null
          source_confidence?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_interview_context: {
        Args: { p_user_id: string }
        Returns: {
          active_interview: Json
          career_profile: Json
          job_history: Json
          recent_summaries: Json
        }[]
      }
      handle_user_deletion: {
        Args: { target_user_id: string }
        Returns: {
          table_name: string
          rows_deleted: number
        }[]
      }
      test_user_deletion_dry_run: {
        Args: { target_user_id: string }
        Returns: {
          table_name: string
          rows_to_delete: number
        }[]
      }
    }
    Enums: {
      interview_phase: "warmup" | "identity" | "impact" | "deep_dive"
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
    Enums: {
      interview_phase: ["warmup", "identity", "impact", "deep_dive"],
    },
  },
} as const
