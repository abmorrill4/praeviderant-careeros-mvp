
// Base interface for all versioned entities
export interface VersionedEntity {
  logical_entity_id: string;
  version: number;
  is_active: boolean;
  source?: string;
  source_confidence?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Work Experience entity
export interface WorkExperience extends VersionedEntity {
  company: string;
  title: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

// Education entity
export interface Education extends VersionedEntity {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  description?: string;
}

// Skill entity
export interface Skill extends VersionedEntity {
  name: string;
  category?: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

// Project entity
export interface Project extends VersionedEntity {
  name: string;
  description?: string;
  technologies_used?: string[];
  start_date?: string;
  end_date?: string;
  project_url?: string;
  repository_url?: string;
}

// Certification entity
export interface Certification extends VersionedEntity {
  name: string;
  issuing_organization: string;
  issue_date?: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

// Union type for all entity types
export type EntityType = 'work_experience' | 'education' | 'skill' | 'project' | 'certification';

// Generic type for entity data without versioning fields
export type EntityData<T extends VersionedEntity> = Omit<T, keyof VersionedEntity> & {
  user_id: string;
};
