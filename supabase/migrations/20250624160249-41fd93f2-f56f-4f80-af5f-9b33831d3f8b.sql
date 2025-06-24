
-- Create merge_decisions table for storing user review decisions
CREATE TABLE IF NOT EXISTS public.merge_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_version_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  parsed_entity_id UUID NOT NULL REFERENCES public.parsed_resume_entities(id) ON DELETE CASCADE,
  profile_entity_id UUID NULL, -- References logical_entity_id from versioned tables
  profile_entity_type TEXT NULL, -- work_experience, education, skill, etc.
  field_name TEXT NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('accept', 'reject', 'override')),
  parsed_value TEXT NOT NULL,
  confirmed_value TEXT NOT NULL,
  override_value TEXT NULL,
  justification TEXT NULL,
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resume_version_id, parsed_entity_id, field_name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_merge_decisions_user_id ON public.merge_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_merge_decisions_resume_version_id ON public.merge_decisions(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_merge_decisions_parsed_entity_id ON public.merge_decisions(parsed_entity_id);
CREATE INDEX IF NOT EXISTS idx_merge_decisions_decision_type ON public.merge_decisions(decision_type);

-- Enable RLS
ALTER TABLE public.merge_decisions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their merge decisions" ON public.merge_decisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their merge decisions" ON public.merge_decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their merge decisions" ON public.merge_decisions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their merge decisions" ON public.merge_decisions
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_merge_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merge_decisions_updated_at
  BEFORE UPDATE ON public.merge_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_merge_decisions_updated_at();
