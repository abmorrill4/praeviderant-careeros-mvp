
export interface MergeDecision {
  id: string;
  user_id: string;
  resume_version_id: string;
  parsed_entity_id: string;
  profile_entity_id?: string;
  profile_entity_type?: string;
  field_name: string;
  decision_type: 'accept' | 'reject' | 'override';
  parsed_value: string;
  confirmed_value: string;
  override_value?: string;
  justification?: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface MergeReviewItem {
  parsedEntityId: string;
  profileEntityId?: string;
  profileEntityType?: string;
  fieldName: string;
  parsedValue: string;
  confirmedValue?: string;
  diffType: 'identical' | 'equivalent' | 'conflicting' | 'new';
  confidenceScore: number;
  similarityScore: number;
  justification: string;
}
