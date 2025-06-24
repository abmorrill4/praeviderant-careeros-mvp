
import type { Json } from '@/integrations/supabase/types';

export interface PromptTemplate {
  id: string;
  category: string;
  version: number;
  content: string;
  description?: string;
  metadata?: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPromptUsage {
  id: string;
  job_id: string;
  job_type: string;
  prompt_template_id: string;
  prompt_category: string;
  prompt_version: number;
  created_at: string;
}

export interface CreatePromptTemplateRequest {
  category: string;
  content: string;
  description?: string;
  metadata?: Json;
}

export interface UpdatePromptTemplateRequest {
  content?: string;
  description?: string;
  metadata?: Json;
  is_active?: boolean;
}

export type PromptCategory = 
  | 'resume_parsing'
  | 'semantic_diffing' 
  | 'normalization'
  | 'enrichment'
  | 'followup_generation';

export const PROMPT_CATEGORIES: PromptCategory[] = [
  'resume_parsing',
  'semantic_diffing',
  'normalization', 
  'enrichment',
  'followup_generation'
];
