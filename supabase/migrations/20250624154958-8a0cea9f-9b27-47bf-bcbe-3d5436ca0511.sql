
-- Create normalized_entities table for the canonical graph
CREATE TABLE IF NOT EXISTS public.normalized_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'employer', 'tool', 'skill', etc.
  canonical_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  embedding_vector vector(1536), -- OpenAI ada-002 embedding size
  confidence_score DOUBLE PRECISION DEFAULT 1.0,
  review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('approved', 'pending', 'flagged')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, canonical_name)
);

-- Create resume_entity_links table for linking parsed entities to normalized ones
CREATE TABLE IF NOT EXISTS public.resume_entity_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parsed_entity_id UUID NOT NULL REFERENCES public.parsed_resume_entities(id) ON DELETE CASCADE,
  normalized_entity_id UUID NOT NULL REFERENCES public.normalized_entities(id) ON DELETE CASCADE,
  match_method TEXT NOT NULL CHECK (match_method IN ('embedding', 'fuzzy', 'llm', 'manual')),
  match_score DOUBLE PRECISION NOT NULL,
  confidence_score DOUBLE PRECISION DEFAULT 1.0,
  review_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parsed_entity_id, normalized_entity_id)
);

-- Create normalization_jobs table for tracking job progress
CREATE TABLE IF NOT EXISTS public.normalization_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  entity_type TEXT,
  resume_version_id UUID REFERENCES public.resume_versions(id),
  total_entities INTEGER DEFAULT 0,
  processed_entities INTEGER DEFAULT 0,
  matched_entities INTEGER DEFAULT 0,
  orphaned_entities INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_normalized_entities_type ON public.normalized_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_normalized_entities_embedding ON public.normalized_entities USING ivfflat (embedding_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_resume_entity_links_parsed_entity ON public.resume_entity_links(parsed_entity_id);
CREATE INDEX IF NOT EXISTS idx_resume_entity_links_normalized_entity ON public.resume_entity_links(normalized_entity_id);
CREATE INDEX IF NOT EXISTS idx_resume_entity_links_match_method ON public.resume_entity_links(match_method);
CREATE INDEX IF NOT EXISTS idx_normalization_jobs_status ON public.normalization_jobs(status);

-- Enable RLS
ALTER TABLE public.normalized_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.normalization_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for normalized_entities (readable by all authenticated users, writable by system)
CREATE POLICY "Users can view normalized entities" ON public.normalized_entities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage normalized entities" ON public.normalized_entities
  FOR ALL USING (true);

-- RLS policies for resume_entity_links (users can view their own links)
CREATE POLICY "Users can view their resume entity links" ON public.resume_entity_links
  FOR SELECT USING (
    auth.uid() = (
      SELECT rs.user_id 
      FROM public.parsed_resume_entities pre
      JOIN public.resume_versions rv ON pre.resume_version_id = rv.id
      JOIN public.resume_streams rs ON rv.stream_id = rs.id 
      WHERE pre.id = parsed_entity_id
    )
  );

CREATE POLICY "System can manage resume entity links" ON public.resume_entity_links
  FOR ALL USING (true);

-- RLS policies for normalization_jobs (users can view their own jobs)
CREATE POLICY "Users can view their normalization jobs" ON public.normalization_jobs
  FOR SELECT USING (
    resume_version_id IS NULL OR
    auth.uid() = (
      SELECT rs.user_id 
      FROM public.resume_versions rv 
      JOIN public.resume_streams rs ON rv.stream_id = rs.id 
      WHERE rv.id = resume_version_id
    )
  );

CREATE POLICY "System can manage normalization jobs" ON public.normalization_jobs
  FOR ALL USING (true);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_normalized_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalized_entities_updated_at
  BEFORE UPDATE ON public.normalized_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_normalized_entities_updated_at();

CREATE OR REPLACE FUNCTION public.handle_resume_entity_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_entity_links_updated_at
  BEFORE UPDATE ON public.resume_entity_links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_resume_entity_links_updated_at();

CREATE OR REPLACE FUNCTION public.handle_normalization_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalization_jobs_updated_at
  BEFORE UPDATE ON public.normalization_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_normalization_jobs_updated_at();

-- Insert some sample normalized entities for common tools and skills
INSERT INTO public.normalized_entities (entity_type, canonical_name, aliases, confidence_score) VALUES
('tool', 'JavaScript', ARRAY['JS', 'Javascript', 'java script'], 1.0),
('tool', 'TypeScript', ARRAY['TS', 'Typescript', 'type script'], 1.0),
('tool', 'Python', ARRAY['python', 'Python3', 'py'], 1.0),
('tool', 'React', ARRAY['ReactJS', 'React.js', 'react'], 1.0),
('tool', 'Node.js', ARRAY['NodeJS', 'Node', 'node.js'], 1.0),
('skill', 'Project Management', ARRAY['PM', 'project management', 'Project Mgmt'], 1.0),
('skill', 'Software Development', ARRAY['coding', 'programming', 'software engineering'], 1.0),
('employer', 'Google', ARRAY['Google Inc', 'Google LLC', 'Alphabet'], 1.0),
('employer', 'Microsoft', ARRAY['Microsoft Corp', 'MSFT', 'Microsoft Corporation'], 1.0),
('employer', 'Amazon', ARRAY['Amazon.com', 'Amazon Web Services', 'AWS'], 1.0)
ON CONFLICT (entity_type, canonical_name) DO NOTHING;
