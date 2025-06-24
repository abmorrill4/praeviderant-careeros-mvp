
-- Enable the pgvector extension for embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing resume diffs
CREATE TABLE IF NOT EXISTS public.resume_diffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_version_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  parsed_entity_id UUID NOT NULL REFERENCES public.parsed_resume_entities(id) ON DELETE CASCADE,
  profile_entity_id UUID NULL, -- NULL for new entities
  profile_entity_type TEXT NULL, -- work_experience, education, skill, etc.
  diff_type TEXT NOT NULL CHECK (diff_type IN ('identical', 'equivalent', 'conflicting', 'new')),
  similarity_score DOUBLE PRECISION DEFAULT 0.0,
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  justification TEXT NOT NULL,
  embedding_vector vector(1536), -- OpenAI ada-002 embedding size
  metadata JSONB DEFAULT '{}',
  requires_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_diffs_resume_version_id ON public.resume_diffs(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_resume_diffs_parsed_entity_id ON public.resume_diffs(parsed_entity_id);
CREATE INDEX IF NOT EXISTS idx_resume_diffs_profile_entity_id ON public.resume_diffs(profile_entity_id);
CREATE INDEX IF NOT EXISTS idx_resume_diffs_diff_type ON public.resume_diffs(diff_type);
CREATE INDEX IF NOT EXISTS idx_resume_diffs_requires_review ON public.resume_diffs(requires_review);

-- Enable RLS
ALTER TABLE public.resume_diffs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view diffs for their resumes" ON public.resume_diffs
  FOR SELECT USING (
    auth.uid() = (
      SELECT rs.user_id 
      FROM public.resume_versions rv 
      JOIN public.resume_streams rs ON rv.stream_id = rs.id 
      WHERE rv.id = resume_version_id
    )
  );

CREATE POLICY "System can create resume diffs" ON public.resume_diffs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update resume diffs" ON public.resume_diffs
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_resume_diffs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_diffs_updated_at
  BEFORE UPDATE ON public.resume_diffs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_resume_diffs_updated_at();

-- Create table for user confirmed profile entities (consolidated view)
CREATE TABLE IF NOT EXISTS public.user_confirmed_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- work_experience, education, skill, project, certification
  entity_id UUID NOT NULL, -- References logical_entity_id from versioned tables
  field_name TEXT NOT NULL,
  confirmed_value TEXT NOT NULL,
  confidence_score DOUBLE PRECISION DEFAULT 1.0,
  source TEXT DEFAULT 'user_confirmed',
  last_confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id, field_name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_confirmed_profile_user_id ON public.user_confirmed_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_confirmed_profile_entity_type ON public.user_confirmed_profile(entity_type);
CREATE INDEX IF NOT EXISTS idx_user_confirmed_profile_entity_id ON public.user_confirmed_profile(entity_id);

-- Enable RLS
ALTER TABLE public.user_confirmed_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own confirmed profile" ON public.user_confirmed_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own confirmed profile" ON public.user_confirmed_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own confirmed profile" ON public.user_confirmed_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_user_confirmed_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_confirmed_profile_updated_at
  BEFORE UPDATE ON public.user_confirmed_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_confirmed_profile_updated_at();
