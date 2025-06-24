
export interface ResumeDiff {
  id: string;
  resume_version_id: string;
  parsed_entity_id: string;
  profile_entity_id?: string;
  profile_entity_type?: string;
  diff_type: 'identical' | 'equivalent' | 'conflicting' | 'new';
  similarity_score: number;
  confidence_score: number;
  justification: string;
  embedding_vector?: number[];
  metadata: Record<string, any>;
  requires_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserConfirmedProfile {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  confirmed_value: string;
  confidence_score: number;
  source: string;
  last_confirmed_at: string;
  created_at: string;
  updated_at: string;
}

export interface DiffAnalysisResult {
  diffs: ResumeDiff[];
  summary: {
    total: number;
    identical: number;
    equivalent: number;
    conflicting: number;
    new: number;
    requiresReview: number;
  };
}
