
-- Create table for parsed resume entities with provenance tracking
CREATE TABLE IF NOT EXISTS public.parsed_resume_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_version_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  raw_value TEXT,
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  model_version TEXT DEFAULT 'gpt-4o-mini',
  source_type TEXT DEFAULT 'openai_function_call',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_parsed_resume_entities_resume_version_id ON public.parsed_resume_entities(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_parsed_resume_entities_field_name ON public.parsed_resume_entities(field_name);

-- Enable RLS
ALTER TABLE public.parsed_resume_entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view parsed entities for their resumes" ON public.parsed_resume_entities
  FOR SELECT USING (
    auth.uid() = (
      SELECT rs.user_id 
      FROM public.resume_versions rv 
      JOIN public.resume_streams rs ON rv.stream_id = rs.id 
      WHERE rv.id = resume_version_id
    )
  );

CREATE POLICY "System can create parsed entities" ON public.parsed_resume_entities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update parsed entities" ON public.parsed_resume_entities
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_parsed_resume_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parsed_resume_entities_updated_at
  BEFORE UPDATE ON public.parsed_resume_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_parsed_resume_entities_updated_at();
