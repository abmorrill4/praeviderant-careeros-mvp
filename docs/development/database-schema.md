
# Database Schema Documentation

CareerOS uses a sophisticated PostgreSQL database schema designed to handle versioned career data, AI-powered processing, and secure user management. This document provides comprehensive coverage of all tables, relationships, and design patterns.

## Schema Overview

### Design Principles

**Entity Versioning**
- All user profile entities support versioning for complete audit trails
- Logical entity grouping allows tracking changes over time
- Source attribution tracks data origin (interview, upload, manual)

**User Data Isolation**
- Row Level Security (RLS) ensures complete user data separation
- All user-related tables include `user_id` with proper policies
- No cross-user data access possible through application layer

**AI Processing Pipeline**
- Structured pipeline from raw input to enriched profile data
- Comprehensive job and processing tracking
- Error handling and retry mechanisms built into schema

## Core User Management

### profiles
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Extended user profile information beyond Supabase Auth
**Relationships**: Links to auth.users (Supabase managed)
**RLS Policies**: Users can only access their own profile

## Versioned Entity System

### work_experience
```sql
CREATE TABLE public.work_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Core fields
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  source_confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(logical_entity_id, version),
  CHECK (source_confidence >= 0.0 AND source_confidence <= 1.0)
);

-- Indexes for performance
CREATE INDEX idx_work_experience_user_current 
  ON work_experience(user_id, is_current) 
  WHERE is_current = true;

CREATE INDEX idx_work_experience_logical_entity 
  ON work_experience(logical_entity_id);
```

**Key Features**:
- `logical_entity_id`: Groups versions of the same job
- `version`: Incremental version number
- `is_current`: Only one version per logical entity can be current
- `source`: Tracks data origin (interview, upload, manual, ai_enrichment)
- `source_confidence`: AI confidence score for extracted data

### education
```sql
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Core fields
  institution TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date TEXT,
  end_date TEXT,
  gpa TEXT,
  description TEXT,
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  source_confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(logical_entity_id, version)
);
```

### skill
```sql
CREATE TABLE public.skill (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Core fields
  name TEXT NOT NULL,
  category TEXT, -- e.g., 'programming', 'framework', 'soft_skill'
  proficiency_level TEXT, -- e.g., 'beginner', 'intermediate', 'advanced', 'expert'
  years_of_experience INTEGER,
  context TEXT, -- How/where this skill was used
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  source_confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(logical_entity_id, version)
);
```

### project
```sql
CREATE TABLE public.project (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  technologies TEXT[], -- Array of technologies used
  start_date TEXT,
  end_date TEXT,
  url TEXT, -- Project URL or repository
  role TEXT, -- User's role in the project
  achievements TEXT[], -- Key achievements or outcomes
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  source_confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(logical_entity_id, version)
);
```

### certification
```sql
CREATE TABLE public.certification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Core fields
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  credential_id TEXT,
  issue_date TEXT,
  expiration_date TEXT,
  credential_url TEXT,
  description TEXT,
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  source_confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(logical_entity_id, version)
);
```

## Resume Processing Pipeline

### resume_streams
```sql
CREATE TABLE public.resume_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Stream metadata
  total_uploads INTEGER DEFAULT 0,
  latest_version_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Groups related resume uploads and versions
**Use Case**: User might have different streams for different types of roles

### resume_versions
```sql
CREATE TABLE public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES resume_streams(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- File information
  original_filename TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_type TEXT,
  storage_path TEXT,
  
  -- Processing status
  processing_status TEXT NOT NULL DEFAULT 'pending',
  current_stage TEXT DEFAULT 'upload',
  processing_progress INTEGER DEFAULT 0,
  processing_stages JSONB DEFAULT '{}',
  
  -- Content
  raw_content TEXT,
  structured_content JSONB,
  
  -- Metadata
  upload_source TEXT DEFAULT 'web_ui',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(stream_id, version_number)
);
```

**Processing Stages Structure**:
```json
{
  "upload": {
    "status": "completed",
    "started_at": "2024-01-01T00:00:00Z",
    "completed_at": "2024-01-01T00:00:05Z"
  },
  "parse": {
    "status": "in_progress",
    "started_at": "2024-01-01T00:00:05Z"
  },
  "enrich": {
    "status": "pending"
  },
  "complete": {
    "status": "pending"
  }
}
```

### parsed_resume_entities
```sql
CREATE TABLE public.parsed_resume_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  
  -- Entity information
  entity_type TEXT NOT NULL, -- 'work_experience', 'education', 'skill', etc.
  entity_data JSONB NOT NULL,
  
  -- AI extraction metadata
  extraction_confidence DECIMAL(3,2),
  ai_model_used TEXT,
  extraction_notes TEXT,
  
  -- Processing status
  applied_to_profile BOOLEAN DEFAULT false,
  merge_decision_id UUID, -- Reference to merge_decisions if conflicts exist
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient entity type queries
CREATE INDEX idx_parsed_resume_entities_type 
  ON parsed_resume_entities(entity_type);
```

## AI Enhancement System

### career_enrichment
```sql
CREATE TABLE public.career_enrichment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  
  -- Enrichment content
  career_summary TEXT,
  professional_strengths TEXT[],
  growth_trajectory TEXT,
  industry_positioning TEXT,
  
  -- Achievement analysis
  quantified_achievements JSONB,
  impact_statements TEXT[],
  
  -- AI metadata
  ai_model_used TEXT,
  confidence_score DECIMAL(3,2),
  generation_prompt TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### career_narratives
```sql
CREATE TABLE public.career_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  
  -- Narrative content
  narrative_type TEXT NOT NULL, -- 'transition', 'growth', 'achievement', 'challenge'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Context
  related_entities JSONB, -- References to work_experience, projects, etc.
  time_period TEXT,
  relevance_score DECIMAL(3,2),
  
  -- AI metadata
  ai_model_used TEXT,
  generation_context TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### entry_enrichment
```sql
CREATE TABLE public.entry_enrichment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  
  -- Source entity reference
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Enrichment data
  enhanced_description TEXT,
  achievement_bullets TEXT[],
  skill_extractions JSONB,
  industry_context TEXT,
  
  -- Processing metadata
  enrichment_type TEXT NOT NULL, -- 'description', 'achievements', 'skills', 'context'
  ai_model_used TEXT,
  confidence_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Interview System

### interview_sessions
```sql
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session information
  openai_session_id TEXT,
  session_type TEXT DEFAULT 'career_overview', -- 'career_overview', 'role_deep_dive', 'skills_assessment'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed'
  
  -- System prompt and configuration
  system_prompt TEXT,
  session_config JSONB,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### interview_transcripts
```sql
CREATE TABLE public.interview_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  
  -- Transcript content
  speaker TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL, -- May be encrypted reference
  timestamp_ms INTEGER,
  
  -- Processing metadata
  is_encrypted BOOLEAN DEFAULT false,
  ai_extracted_entities JSONB,
  confidence_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient session queries
CREATE INDEX idx_interview_transcripts_session 
  ON interview_transcripts(session_id, created_at);
```

## Data Security and Encryption

### encrypted_data
```sql
CREATE TABLE public.encrypted_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Encrypted content
  encrypted_content BYTEA NOT NULL,
  encryption_method TEXT NOT NULL DEFAULT 'aes-256-gcm',
  
  -- Key management
  key_id TEXT NOT NULL,
  initialization_vector BYTEA,
  
  -- Metadata
  content_type TEXT,
  content_size INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- TTL cleanup for expired data
CREATE INDEX idx_encrypted_data_expires 
  ON encrypted_data(expires_at) 
  WHERE expires_at IS NOT NULL;
```

## Merge Decision System

### merge_decisions
```sql
CREATE TABLE public.merge_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Entity references
  entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  target_entity_id UUID,
  
  -- Decision details
  decision_type TEXT NOT NULL, -- 'merge', 'keep_separate', 'replace', 'skip'
  field_preferences JSONB, -- Which fields to prefer from which source
  confidence_score DECIMAL(3,2),
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'applied', 'rejected'
  applied_at TIMESTAMPTZ,
  
  -- Context
  merge_reason TEXT,
  user_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Job and Background Processing

### enrichment_jobs
```sql
CREATE TABLE public.enrichment_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL, -- 'resume_enrichment', 'bulk_enhancement', 'profile_analysis'
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  
  -- Input/output
  input_data JSONB,
  output_data JSONB,
  error_details TEXT,
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0,
  current_step TEXT,
  total_steps INTEGER,
  
  -- Timing
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for job queue processing
CREATE INDEX idx_enrichment_jobs_queue 
  ON enrichment_jobs(status, queued_at) 
  WHERE status = 'queued';
```

## Advanced Features

### resume_diffs
```sql
CREATE TABLE public.resume_diffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  
  -- Comparison details
  comparison_type TEXT NOT NULL, -- 'version_to_version', 'version_to_profile'
  compared_against_id UUID,
  
  -- Diff analysis
  differences JSONB NOT NULL,
  similarity_score DECIMAL(3,2),
  
  -- Analysis metadata
  analysis_model TEXT,
  analysis_prompt TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### user_confirmed_profile
```sql
CREATE TABLE public.user_confirmed_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Confirmed data snapshot
  profile_snapshot JSONB NOT NULL,
  confirmation_method TEXT, -- 'manual_review', 'interview_completion', 'periodic_update'
  
  -- Metadata
  completeness_score DECIMAL(3,2),
  last_major_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Only one confirmed profile per user
  UNIQUE(user_id)
);
```

## Row Level Security (RLS) Policies

### Example Policy Structure

```sql
-- Enable RLS on all user tables
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "work_experience_user_isolation" 
  ON work_experience 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Similar policies for all user tables
CREATE POLICY "education_user_isolation" 
  ON education 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "skill_user_isolation" 
  ON skill 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Resume processing policies
CREATE POLICY "resume_versions_user_access" 
  ON resume_versions 
  FOR ALL 
  USING (
    stream_id IN (
      SELECT id FROM resume_streams 
      WHERE user_id = auth.uid()
    )
  );
```

## Database Functions

### Entity Management Functions

```sql
-- Get latest version of all entities for a user
CREATE OR REPLACE FUNCTION get_latest_entities(
  p_user_id UUID,
  p_entity_type TEXT
) 
RETURNS TABLE(
  id UUID,
  logical_entity_id UUID,
  entity_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT id, logical_entity_id, row_to_json(%I)::jsonb as entity_data
    FROM %I 
    WHERE user_id = $1 AND is_current = true
    ORDER BY created_at DESC
  ', p_entity_type, p_entity_type)
  USING p_user_id;
END;
$$;
```

### Processing Status Functions

```sql
-- Update resume processing stage
CREATE OR REPLACE FUNCTION update_resume_processing_stage(
  p_version_id UUID,
  p_stage TEXT,
  p_status TEXT DEFAULT 'in_progress',
  p_error TEXT DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stages JSONB;
  updated_stages JSONB;
BEGIN
  -- Get current stages
  SELECT processing_stages INTO current_stages 
  FROM resume_versions 
  WHERE id = p_version_id;
  
  -- Update the specific stage
  updated_stages := jsonb_set(
    current_stages,
    ARRAY[p_stage],
    jsonb_build_object(
      'status', p_status,
      'started_at', CASE WHEN p_status = 'in_progress' THEN now() ELSE current_stages->p_stage->'started_at' END,
      'completed_at', CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE NULL END,
      'error', CASE WHEN p_error IS NOT NULL THEN to_jsonb(p_error) ELSE NULL END
    )
  );
  
  -- Update the record
  UPDATE resume_versions 
  SET 
    processing_stages = updated_stages,
    current_stage = p_stage,
    processing_progress = COALESCE(p_progress, processing_progress),
    updated_at = now()
  WHERE id = p_version_id;
  
  RETURN TRUE;
END;
$$;
```

## Performance Optimizations

### Key Indexes

```sql
-- User data access patterns
CREATE INDEX idx_work_experience_user_current 
  ON work_experience(user_id, is_current) 
  WHERE is_current = true;

CREATE INDEX idx_education_user_current 
  ON education(user_id, is_current) 
  WHERE is_current = true;

CREATE INDEX idx_skill_user_current 
  ON skill(user_id, is_current) 
  WHERE is_current = true;

-- Processing pipeline optimization
CREATE INDEX idx_resume_versions_processing 
  ON resume_versions(processing_status, created_at);

CREATE INDEX idx_enrichment_jobs_queue 
  ON enrichment_jobs(status, queued_at) 
  WHERE status IN ('queued', 'processing');

-- Search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_work_experience_title_search 
  ON work_experience USING gin(title gin_trgm_ops);
CREATE INDEX idx_work_experience_company_search 
  ON work_experience USING gin(company gin_trgm_ops);
```

### Partitioning Strategy

For high-volume tables, consider partitioning:

```sql
-- Partition interview_transcripts by month
CREATE TABLE interview_transcripts_template (
  LIKE interview_transcripts INCLUDING ALL
);

-- Create monthly partitions as needed
CREATE TABLE interview_transcripts_2024_01 
  PARTITION OF interview_transcripts_template
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Data Archival and Cleanup

### Cleanup Functions

```sql
-- Clean up expired encrypted data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM encrypted_data 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Schedule regular cleanup
SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');
```

This schema provides a robust foundation for CareerOS's career intelligence features while maintaining security, performance, and data integrity. The versioning system ensures complete audit trails, while the processing pipeline supports sophisticated AI-powered enhancements.
