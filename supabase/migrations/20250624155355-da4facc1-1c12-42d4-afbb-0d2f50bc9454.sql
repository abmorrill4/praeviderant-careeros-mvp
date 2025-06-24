
-- Create career_enrichment table for storing inferred signals and scores
CREATE TABLE IF NOT EXISTS public.career_enrichment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  role_archetype TEXT NOT NULL,
  role_archetype_explanation TEXT,
  persona_type TEXT NOT NULL,
  persona_explanation TEXT,
  leadership_score INTEGER NOT NULL CHECK (leadership_score >= 0 AND leadership_score <= 100),
  leadership_explanation TEXT,
  scope_score INTEGER NOT NULL CHECK (scope_score >= 0 AND scope_score <= 100),
  scope_explanation TEXT,
  technical_depth_score INTEGER NOT NULL CHECK (technical_depth_score >= 0 AND technical_depth_score <= 100),
  technical_depth_explanation TEXT,
  model_version TEXT DEFAULT 'gpt-4o-mini',
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create career_narratives table for storing narrative descriptions
CREATE TABLE IF NOT EXISTS public.career_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  narrative_type TEXT NOT NULL, -- 'career_summary', 'key_strengths', 'growth_trajectory'
  narrative_text TEXT NOT NULL,
  narrative_explanation TEXT,
  model_version TEXT DEFAULT 'gpt-4o-mini',
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrichment_jobs table for tracking job progress
CREATE TABLE IF NOT EXISTS public.enrichment_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_version_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  job_type TEXT NOT NULL DEFAULT 'full_enrichment',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_career_enrichment_user_id ON public.career_enrichment(user_id);
CREATE INDEX IF NOT EXISTS idx_career_enrichment_resume_version_id ON public.career_enrichment(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_career_narratives_user_id ON public.career_narratives(user_id);
CREATE INDEX IF NOT EXISTS idx_career_narratives_resume_version_id ON public.career_narratives(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_user_id ON public.enrichment_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_status ON public.enrichment_jobs(status);

-- Enable RLS
ALTER TABLE public.career_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for career_enrichment
CREATE POLICY "Users can view their career enrichment" ON public.career_enrichment
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage career enrichment" ON public.career_enrichment
  FOR ALL USING (true);

-- RLS policies for career_narratives
CREATE POLICY "Users can view their career narratives" ON public.career_narratives
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage career narratives" ON public.career_narratives
  FOR ALL USING (true);

-- RLS policies for enrichment_jobs
CREATE POLICY "Users can view their enrichment jobs" ON public.enrichment_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage enrichment jobs" ON public.enrichment_jobs
  FOR ALL USING (true);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_career_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER career_enrichment_updated_at
  BEFORE UPDATE ON public.career_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_career_enrichment_updated_at();

CREATE OR REPLACE FUNCTION public.handle_career_narratives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER career_narratives_updated_at
  BEFORE UPDATE ON public.career_narratives
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_career_narratives_updated_at();

CREATE OR REPLACE FUNCTION public.handle_enrichment_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrichment_jobs_updated_at
  BEFORE UPDATE ON public.enrichment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_enrichment_jobs_updated_at();
