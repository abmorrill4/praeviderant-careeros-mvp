
-- Phase 1: Database Cleanup (Corrected)
-- First check what enum values exist for interview_phase
DO $$ 
DECLARE
    phase_values text[];
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    INTO phase_values
    FROM pg_enum 
    WHERE enumtypid = 'interview_phase'::regtype;
    
    RAISE NOTICE 'Current interview_phase enum values: %', phase_values;
END $$;

-- Remove unused tables that have no active functionality
-- Drop unused tables in dependency order
DROP TABLE IF EXISTS public.interest_registrations CASCADE;
DROP TABLE IF EXISTS public.user_interest CASCADE; 
DROP TABLE IF EXISTS public.system_prompts CASCADE;
DROP TABLE IF EXISTS public.interview_types CASCADE;
DROP TABLE IF EXISTS public.domain_values CASCADE;
DROP TABLE IF EXISTS public.llm_cache CASCADE;

-- Clean up question_flows table - use actual enum values
-- First let's see what phases exist in the data
DO $$
DECLARE
    existing_phases text[];
BEGIN
    SELECT array_agg(DISTINCT phase::text) INTO existing_phases FROM public.question_flows;
    RAISE NOTICE 'Existing phases in question_flows: %', existing_phases;
END $$;

-- Clean up any orphaned records in remaining tables
-- Remove job_logs that reference deleted jobs
DELETE FROM public.job_logs 
WHERE job_id NOT IN (SELECT id FROM public.jobs);

-- Remove interview_transcripts that reference deleted sessions
DELETE FROM public.interview_transcripts 
WHERE session_id NOT IN (SELECT id FROM public.interview_sessions);

-- Remove profile_deltas that reference deleted interviews
DELETE FROM public.profile_deltas 
WHERE source_interview NOT IN (SELECT id FROM public.interviews);

-- Clean up resume-related orphaned data
DELETE FROM public.parsed_resume_entities 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);

DELETE FROM public.resume_entity_links 
WHERE parsed_entity_id NOT IN (SELECT id FROM public.parsed_resume_entities);

DELETE FROM public.normalization_jobs 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);

DELETE FROM public.enrichment_jobs 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);

DELETE FROM public.career_enrichment 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);

DELETE FROM public.career_narratives 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);

DELETE FROM public.resume_diffs 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);

DELETE FROM public.merge_decisions 
WHERE resume_version_id NOT IN (SELECT id FROM public.resume_versions);
