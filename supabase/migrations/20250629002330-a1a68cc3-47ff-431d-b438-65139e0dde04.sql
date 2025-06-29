
-- Add unique constraint to prevent duplicate enrichment entries
ALTER TABLE public.career_enrichment 
ADD CONSTRAINT career_enrichment_user_version_unique 
UNIQUE (user_id, resume_version_id);
