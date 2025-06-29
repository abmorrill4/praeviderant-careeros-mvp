
-- Create entry_enrichment table for per-entry AI enrichment data
CREATE TABLE IF NOT EXISTS public.entry_enrichment (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_version_id uuid NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
    parsed_entity_id uuid NOT NULL REFERENCES public.parsed_resume_entities(id) ON DELETE CASCADE,
    
    -- Enrichment data
    insights jsonb DEFAULT '[]'::jsonb,
    skills_identified jsonb DEFAULT '[]'::jsonb,
    experience_level text,
    career_progression text,
    market_relevance text,
    recommendations jsonb DEFAULT '[]'::jsonb,
    parsed_structure jsonb,
    
    -- Metadata
    model_version text DEFAULT 'gpt-4o-mini'::text,
    confidence_score double precision DEFAULT 0.0,
    enrichment_metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Constraints
    UNIQUE(parsed_entity_id) -- One enrichment per parsed entity
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_entry_enrichment_user_id ON public.entry_enrichment(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_enrichment_resume_version_id ON public.entry_enrichment(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_entry_enrichment_parsed_entity_id ON public.entry_enrichment(parsed_entity_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_entry_enrichment_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER entry_enrichment_updated_at
    BEFORE UPDATE ON public.entry_enrichment
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_entry_enrichment_updated_at();

-- Enable RLS
ALTER TABLE public.entry_enrichment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own entry enrichments"
    ON public.entry_enrichment FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entry enrichments"
    ON public.entry_enrichment FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entry enrichments"
    ON public.entry_enrichment FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entry enrichments"
    ON public.entry_enrichment FOR DELETE
    USING (auth.uid() = user_id);
