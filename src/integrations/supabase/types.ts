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
      ai_insights_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          feedback_type: string
          id: string
          insight_id: string
          insight_type: string
          processed_at: string | null
          status: string
          updated_at: string
          user_context: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text: string
          feedback_type: string
          id?: string
          insight_id: string
          insight_type: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_context?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string
          feedback_type?: string
          id?: string
          insight_id?: string
          insight_type?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_context?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt: string | null
          id: string
          identifier: string
          last_attempt: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          last_attempt?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          last_attempt?: string | null
        }
        Relationships: []
      }
      career_enrichment: {
        Row: {
          confidence_score: number | null
          created_at: string
          enrichment_metadata: Json | null
          id: string
          leadership_explanation: string | null
          leadership_score: number
          model_version: string | null
          persona_explanation: string | null
          persona_type: string
          resume_version_id: string | null
          role_archetype: string
          role_archetype_explanation: string | null
          scope_explanation: string | null
          scope_score: number
          technical_depth_explanation: string | null
          technical_depth_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          enrichment_metadata?: Json | null
          id?: string
          leadership_explanation?: string | null
          leadership_score: number
          model_version?: string | null
          persona_explanation?: string | null
          persona_type: string
          resume_version_id?: string | null
          role_archetype: string
          role_archetype_explanation?: string | null
          scope_explanation?: string | null
          scope_score: number
          technical_depth_explanation?: string | null
          technical_depth_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          enrichment_metadata?: Json | null
          id?: string
          leadership_explanation?: string | null
          leadership_score?: number
          model_version?: string | null
          persona_explanation?: string | null
          persona_type?: string
          resume_version_id?: string | null
          role_archetype?: string
          role_archetype_explanation?: string | null
          scope_explanation?: string | null
          scope_score?: number
          technical_depth_explanation?: string | null
          technical_depth_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_enrichment_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      career_narratives: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          model_version: string | null
          narrative_explanation: string | null
          narrative_text: string
          narrative_type: string
          resume_version_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          model_version?: string | null
          narrative_explanation?: string | null
          narrative_text: string
          narrative_type: string
          resume_version_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          model_version?: string | null
          narrative_explanation?: string | null
          narrative_text?: string
          narrative_type?: string
          resume_version_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_narratives_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      enrichment_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          resume_version_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          resume_version_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          resume_version_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_jobs_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_enrichment: {
        Row: {
          career_progression: string | null
          confidence_score: number | null
          created_at: string
          enrichment_metadata: Json | null
          experience_level: string | null
          id: string
          insights: Json | null
          market_relevance: string | null
          model_version: string | null
          parsed_entity_id: string
          parsed_structure: Json | null
          recommendations: Json | null
          resume_version_id: string
          skills_identified: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career_progression?: string | null
          confidence_score?: number | null
          created_at?: string
          enrichment_metadata?: Json | null
          experience_level?: string | null
          id?: string
          insights?: Json | null
          market_relevance?: string | null
          model_version?: string | null
          parsed_entity_id: string
          parsed_structure?: Json | null
          recommendations?: Json | null
          resume_version_id: string
          skills_identified?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career_progression?: string | null
          confidence_score?: number | null
          created_at?: string
          enrichment_metadata?: Json | null
          experience_level?: string | null
          id?: string
          insights?: Json | null
          market_relevance?: string | null
          model_version?: string | null
          parsed_entity_id?: string
          parsed_structure?: Json | null
          recommendations?: Json | null
          resume_version_id?: string
          skills_identified?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_enrichment_parsed_entity_id_fkey"
            columns: ["parsed_entity_id"]
            isOneToOne: true
            referencedRelation: "parsed_resume_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_enrichment_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_resumes: {
        Row: {
          content: Json
          created_at: string
          format_settings: Json | null
          id: string
          job_description: string
          metadata: Json
          personalization: Json | null
          style_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          format_settings?: Json | null
          id?: string
          job_description: string
          metadata?: Json
          personalization?: Json | null
          style_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          format_settings?: Json | null
          id?: string
          job_description?: string
          metadata?: Json
          personalization?: Json | null
          style_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_contexts: {
        Row: {
          confidence_score: number | null
          context_type: string
          created_at: string
          extracted_data: Json
          id: string
          processing_status: string | null
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          context_type: string
          created_at?: string
          extracted_data?: Json
          id?: string
          processing_status?: string | null
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          context_type?: string
          created_at?: string
          extracted_data?: Json
          id?: string
          processing_status?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_contexts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          category: string
          complexity_level: number | null
          created_at: string
          expected_data_points: string[] | null
          follow_up_triggers: string[] | null
          id: string
          is_active: boolean | null
          question_text: string
          updated_at: string
        }
        Insert: {
          category: string
          complexity_level?: number | null
          created_at?: string
          expected_data_points?: string[] | null
          follow_up_triggers?: string[] | null
          id?: string
          is_active?: boolean | null
          question_text: string
          updated_at?: string
        }
        Update: {
          category?: string
          complexity_level?: number | null
          created_at?: string
          expected_data_points?: string[] | null
          follow_up_triggers?: string[] | null
          id?: string
          is_active?: boolean | null
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          audio_file_url: string | null
          completion_percentage: number | null
          context_data: Json | null
          created_at: string
          current_phase: string | null
          current_question_id: string | null
          ended_at: string | null
          id: string
          interview_type: string | null
          next_recommended_phase: string | null
          phase_data: Json | null
          progression_score: number | null
          session_id: string | null
          session_insights: Json | null
          started_at: string | null
          status: string
          total_questions_asked: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_file_url?: string | null
          completion_percentage?: number | null
          context_data?: Json | null
          created_at?: string
          current_phase?: string | null
          current_question_id?: string | null
          ended_at?: string | null
          id?: string
          interview_type?: string | null
          next_recommended_phase?: string | null
          phase_data?: Json | null
          progression_score?: number | null
          session_id?: string | null
          session_insights?: Json | null
          started_at?: string | null
          status?: string
          total_questions_asked?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_file_url?: string | null
          completion_percentage?: number | null
          context_data?: Json | null
          created_at?: string
          current_phase?: string | null
          current_question_id?: string | null
          ended_at?: string | null
          id?: string
          interview_type?: string | null
          next_recommended_phase?: string | null
          phase_data?: Json | null
          progression_score?: number | null
          session_id?: string | null
          session_insights?: Json | null
          started_at?: string | null
          status?: string
          total_questions_asked?: number | null
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
          extracted_entities: Json | null
          id: string
          processing_metadata: Json | null
          question_id: string | null
          sentiment_score: number | null
          session_id: string
          speaker: string
          structured_response: Json | null
          timestamp_ms: number | null
          topic_tags: string[] | null
          user_answer: string | null
        }
        Insert: {
          ai_followup?: string | null
          content: string
          created_at?: string
          extracted_entities?: Json | null
          id?: string
          processing_metadata?: Json | null
          question_id?: string | null
          sentiment_score?: number | null
          session_id: string
          speaker: string
          structured_response?: Json | null
          timestamp_ms?: number | null
          topic_tags?: string[] | null
          user_answer?: string | null
        }
        Update: {
          ai_followup?: string | null
          content?: string
          created_at?: string
          extracted_entities?: Json | null
          id?: string
          processing_metadata?: Json | null
          question_id?: string | null
          sentiment_score?: number | null
          session_id?: string
          speaker?: string
          structured_response?: Json | null
          timestamp_ms?: number | null
          topic_tags?: string[] | null
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
      job_logs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          level: string
          message: string
          metadata: Json | null
          stage: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          level?: string
          message: string
          metadata?: Json | null
          stage: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          level?: string
          message?: string
          metadata?: Json | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_prompt_usage: {
        Row: {
          created_at: string
          id: string
          job_id: string
          job_type: string
          prompt_category: string
          prompt_template_id: string
          prompt_version: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          job_type: string
          prompt_category: string
          prompt_template_id: string
          prompt_version: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          job_type?: string
          prompt_category?: string
          prompt_template_id?: string
          prompt_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_prompt_usage_prompt_template_id_fkey"
            columns: ["prompt_template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
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
      merge_decisions: {
        Row: {
          confidence_score: number | null
          confirmed_value: string
          created_at: string
          decision_type: string
          field_name: string
          id: string
          justification: string | null
          override_value: string | null
          parsed_entity_id: string
          parsed_value: string
          profile_entity_id: string | null
          profile_entity_type: string | null
          resume_version_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          confirmed_value: string
          created_at?: string
          decision_type: string
          field_name: string
          id?: string
          justification?: string | null
          override_value?: string | null
          parsed_entity_id: string
          parsed_value: string
          profile_entity_id?: string | null
          profile_entity_type?: string | null
          resume_version_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          confirmed_value?: string
          created_at?: string
          decision_type?: string
          field_name?: string
          id?: string
          justification?: string | null
          override_value?: string | null
          parsed_entity_id?: string
          parsed_value?: string
          profile_entity_id?: string | null
          profile_entity_type?: string | null
          resume_version_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_decisions_parsed_entity_id_fkey"
            columns: ["parsed_entity_id"]
            isOneToOne: false
            referencedRelation: "parsed_resume_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_decisions_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      normalization_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_type: string | null
          error_message: string | null
          id: string
          matched_entities: number | null
          orphaned_entities: number | null
          processed_entities: number | null
          resume_version_id: string | null
          started_at: string | null
          status: string
          total_entities: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string | null
          error_message?: string | null
          id?: string
          matched_entities?: number | null
          orphaned_entities?: number | null
          processed_entities?: number | null
          resume_version_id?: string | null
          started_at?: string | null
          status?: string
          total_entities?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string | null
          error_message?: string | null
          id?: string
          matched_entities?: number | null
          orphaned_entities?: number | null
          processed_entities?: number | null
          resume_version_id?: string | null
          started_at?: string | null
          status?: string
          total_entities?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "normalization_jobs_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      normalized_entities: {
        Row: {
          aliases: string[] | null
          canonical_name: string
          confidence_score: number | null
          created_at: string
          entity_type: string
          id: string
          metadata: Json | null
          review_status: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          canonical_name: string
          confidence_score?: number | null
          created_at?: string
          entity_type: string
          id?: string
          metadata?: Json | null
          review_status?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          canonical_name?: string
          confidence_score?: number | null
          created_at?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          review_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parsed_resume_entities: {
        Row: {
          confidence_score: number | null
          created_at: string
          field_name: string
          id: string
          model_version: string | null
          raw_value: string | null
          resume_version_id: string
          source_type: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          field_name: string
          id?: string
          model_version?: string | null
          raw_value?: string | null
          resume_version_id: string
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          field_name?: string
          id?: string
          model_version?: string | null
          raw_value?: string | null
          resume_version_id?: string
          source_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_resume_entities_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_telemetry: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          memory_usage_mb: number | null
          metadata: Json | null
          resume_version_id: string
          stage: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json | null
          resume_version_id: string
          stage: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json | null
          resume_version_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_telemetry_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
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
      prompt_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
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
      resume_diffs: {
        Row: {
          confidence_score: number | null
          created_at: string
          diff_type: string
          id: string
          justification: string
          metadata: Json | null
          parsed_entity_id: string
          profile_entity_id: string | null
          profile_entity_type: string | null
          requires_review: boolean | null
          resume_version_id: string
          similarity_score: number | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          diff_type: string
          id?: string
          justification: string
          metadata?: Json | null
          parsed_entity_id: string
          profile_entity_id?: string | null
          profile_entity_type?: string | null
          requires_review?: boolean | null
          resume_version_id: string
          similarity_score?: number | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          diff_type?: string
          id?: string
          justification?: string
          metadata?: Json | null
          parsed_entity_id?: string
          profile_entity_id?: string | null
          profile_entity_type?: string | null
          requires_review?: boolean | null
          resume_version_id?: string
          similarity_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_diffs_parsed_entity_id_fkey"
            columns: ["parsed_entity_id"]
            isOneToOne: false
            referencedRelation: "parsed_resume_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_diffs_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_entity_links: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          match_method: string
          match_score: number
          normalized_entity_id: string
          parsed_entity_id: string
          review_required: boolean | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          match_method: string
          match_score: number
          normalized_entity_id: string
          parsed_entity_id: string
          review_required?: boolean | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          match_method?: string
          match_score?: number
          normalized_entity_id?: string
          parsed_entity_id?: string
          review_required?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_entity_links_normalized_entity_id_fkey"
            columns: ["normalized_entity_id"]
            isOneToOne: false
            referencedRelation: "normalized_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_entity_links_parsed_entity_id_fkey"
            columns: ["parsed_entity_id"]
            isOneToOne: false
            referencedRelation: "parsed_resume_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_streams: {
        Row: {
          auto_tagged: boolean | null
          created_at: string
          description: string | null
          id: string
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_tagged?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_tagged?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
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
      resume_versions: {
        Row: {
          created_at: string
          current_stage: string | null
          file_hash: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          processing_errors: Json | null
          processing_progress: number | null
          processing_stages: Json | null
          processing_status: string
          processing_telemetry: Json | null
          resume_metadata: Json | null
          stream_id: string
          updated_at: string
          upload_metadata: Json | null
          version_number: number
        }
        Insert: {
          created_at?: string
          current_stage?: string | null
          file_hash: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          processing_errors?: Json | null
          processing_progress?: number | null
          processing_stages?: Json | null
          processing_status?: string
          processing_telemetry?: Json | null
          resume_metadata?: Json | null
          stream_id: string
          updated_at?: string
          upload_metadata?: Json | null
          version_number?: number
        }
        Update: {
          created_at?: string
          current_stage?: string | null
          file_hash?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          processing_errors?: Json | null
          processing_progress?: number | null
          processing_stages?: Json | null
          processing_status?: string
          processing_telemetry?: Json | null
          resume_metadata?: Json | null
          stream_id?: string
          updated_at?: string
          upload_metadata?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "resume_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill: {
        Row: {
          category: string | null
          created_at: string
          is_active: boolean
          logical_entity_id: string
          name: string
          narrative_context: string | null
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
          narrative_context?: string | null
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
          narrative_context?: string | null
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
      user_confirmed_profile: {
        Row: {
          confidence_score: number | null
          confirmed_value: string
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          last_confirmed_at: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          confirmed_value: string
          created_at?: string
          entity_id: string
          entity_type: string
          field_name: string
          id?: string
          last_confirmed_at?: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          confirmed_value?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          id?: string
          last_confirmed_at?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          session_end: string | null
          session_start: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id?: string
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
      calculate_session_completion: {
        Args: { p_session_id: string }
        Returns: number
      }
      check_profile_completeness: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_action_type: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      find_similar_entities: {
        Args: { p_entity_id: string; p_similarity_threshold?: number }
        Returns: {
          id: string
          entity_type: string
          canonical_name: string
          aliases: string[]
          confidence_score: number
          similarity_score: number
        }[]
      }
      find_similar_entities_safe: {
        Args: { p_entity_id: string; p_similarity_threshold?: number }
        Returns: {
          id: string
          entity_type: string
          canonical_name: string
          aliases: string[]
          confidence_score: number
          similarity_score: number
        }[]
      }
      get_interview_context: {
        Args: { p_user_id: string }
        Returns: {
          active_interview: Json
          career_profile: Json
          job_history: Json
          recent_summaries: Json
        }[]
      }
      get_resume_processing_status: {
        Args: { p_version_id: string }
        Returns: {
          version_id: string
          current_stage: string
          processing_progress: number
          processing_status: string
          stages: Json
          has_entities: boolean
          has_enrichment: boolean
          has_narratives: boolean
          is_complete: boolean
          last_updated: string
        }[]
      }
      get_session_insights: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_unresolved_entities_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          entity_type: string
          canonical_name: string
          aliases: string[]
          confidence_score: number
          review_status: string
          created_at: string
          updated_at: string
          reference_count: number
          referencing_users: string[]
          avg_match_score: number
        }[]
      }
      handle_user_deletion: {
        Args: { target_user_id: string }
        Returns: {
          table_name: string
          rows_deleted: number
        }[]
      }
      handle_user_deletion_optimized: {
        Args: { target_user_id: string }
        Returns: {
          table_name: string
          rows_deleted: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_admin_user_optimized: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      merge_normalized_entities: {
        Args: {
          p_source_entity_id: string
          p_target_entity_id: string
          p_admin_user_id: string
        }
        Returns: boolean
      }
      merge_normalized_entities_safe: {
        Args: {
          p_source_entity_id: string
          p_target_entity_id: string
          p_admin_user_id: string
        }
        Returns: boolean
      }
      test_user_deletion_dry_run: {
        Args: { target_user_id: string }
        Returns: {
          table_name: string
          rows_to_delete: number
        }[]
      }
      update_resume_processing_stage: {
        Args: {
          p_version_id: string
          p_stage: string
          p_status?: string
          p_error?: string
          p_progress?: number
        }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password_text: string }
        Returns: boolean
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
