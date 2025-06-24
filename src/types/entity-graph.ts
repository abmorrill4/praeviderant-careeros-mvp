
export interface UnresolvedEntity {
  id: string;
  entity_type: string;
  canonical_name: string;
  aliases: string[];
  confidence_score: number;
  review_status: 'approved' | 'pending' | 'flagged';
  reference_count: number;
  referencing_users: string[];
  avg_match_score?: number;
  created_at: string;
  updated_at: string;
}

export interface SimilarEntity {
  id: string;
  entity_type: string;
  canonical_name: string;
  aliases: string[];
  confidence_score: number;
  similarity_score: number;
}

export interface EntityMergeRequest {
  sourceEntityId: string;
  targetEntityId: string;
  adminUserId: string;
}

export interface EntityStats {
  totalUnresolved: number;
  pendingReview: number;
  flagged: number;
  entityTypes: number;
}
