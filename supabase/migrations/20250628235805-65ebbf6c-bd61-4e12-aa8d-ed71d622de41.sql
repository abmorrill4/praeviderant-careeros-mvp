
-- Add the missing enrichment_metadata column to the career_enrichment table
ALTER TABLE public.career_enrichment 
ADD COLUMN enrichment_metadata JSONB DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN public.career_enrichment.enrichment_metadata IS 'Additional metadata about the enrichment process including processing time, entities analyzed, and career data structure';
