
export interface NormalizedEntity {
  id: string;
  entity_type: string;
  canonical_name: string;
  aliases: string[];
  embedding_vector?: number[];
  confidence_score: number;
  review_status: 'approved' | 'pending' | 'flagged';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ResumeEntityLink {
  id: string;
  parsed_entity_id: string;
  normalized_entity_id: string;
  match_method: 'embedding' | 'fuzzy' | 'llm' | 'manual';
  match_score: number;
  confidence_score: number;
  review_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface NormalizationJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  entity_type?: string;
  resume_version_id?: string;
  total_entities: number;
  processed_entities: number;
  matched_entities: number;
  orphaned_entities: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NormalizationResult {
  job: NormalizationJob;
  summary: {
    total: number;
    matched: number;
    orphaned: number;
    needsReview: number;
  };
  links: ResumeEntityLink[];
}
