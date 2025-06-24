
export interface CareerEnrichment {
  id: string;
  user_id: string;
  resume_version_id: string;
  role_archetype: string;
  role_archetype_explanation?: string;
  persona_type: string;
  persona_explanation?: string;
  leadership_score: number;
  leadership_explanation?: string;
  scope_score: number;
  scope_explanation?: string;
  technical_depth_score: number;
  technical_depth_explanation?: string;
  model_version: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface CareerNarrative {
  id: string;
  user_id: string;
  resume_version_id: string;
  narrative_type: 'career_summary' | 'key_strengths' | 'growth_trajectory';
  narrative_text: string;
  narrative_explanation?: string;
  model_version: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentJob {
  id: string;
  user_id: string;
  resume_version_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  job_type: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentResult {
  job: EnrichmentJob;
  enrichment?: CareerEnrichment;
  narratives: CareerNarrative[];
}
