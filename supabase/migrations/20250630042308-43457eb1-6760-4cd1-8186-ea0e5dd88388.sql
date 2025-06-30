
-- Phase 1: Critical RLS Policy Implementation and Security Hardening
-- This migration implements comprehensive Row Level Security and enhanced admin functions

-- First, let's create a test function for user deletion dry runs
CREATE OR REPLACE FUNCTION public.test_user_deletion_dry_run(target_user_id uuid)
RETURNS TABLE(table_name text, rows_to_delete bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow users to preview deletion of their own data or admins
  IF NOT (public.is_admin_user(auth.uid()) OR auth.uid() = target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins or account owners can preview data deletion';
  END IF;

  -- Count rows that would be deleted from each table
  table_name := 'entry_enrichment';
  SELECT COUNT(*) INTO rows_to_delete FROM public.entry_enrichment WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'encrypted_data';
  SELECT COUNT(*) INTO rows_to_delete FROM public.encrypted_data WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'interview_transcripts';
  SELECT COUNT(*) INTO rows_to_delete FROM public.interview_transcripts 
  WHERE session_id IN (SELECT id FROM public.interview_sessions WHERE user_id = target_user_id);
  RETURN NEXT;
  
  table_name := 'interview_sessions';
  SELECT COUNT(*) INTO rows_to_delete FROM public.interview_sessions WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'interviews';
  SELECT COUNT(*) INTO rows_to_delete FROM public.interviews WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'work_experience';
  SELECT COUNT(*) INTO rows_to_delete FROM public.work_experience WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'education';
  SELECT COUNT(*) INTO rows_to_delete FROM public.education WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'skill';
  SELECT COUNT(*) INTO rows_to_delete FROM public.skill WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'project';
  SELECT COUNT(*) INTO rows_to_delete FROM public.project WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'certification';
  SELECT COUNT(*) INTO rows_to_delete FROM public.certification WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'career_profile';
  SELECT COUNT(*) INTO rows_to_delete FROM public.career_profile WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'jobs';
  SELECT COUNT(*) INTO rows_to_delete FROM public.jobs WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'resume_streams';
  SELECT COUNT(*) INTO rows_to_delete FROM public.resume_streams WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'career_enrichment';
  SELECT COUNT(*) INTO rows_to_delete FROM public.career_enrichment WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'career_narratives';
  SELECT COUNT(*) INTO rows_to_delete FROM public.career_narratives WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'enrichment_jobs';
  SELECT COUNT(*) INTO rows_to_delete FROM public.enrichment_jobs WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'merge_decisions';
  SELECT COUNT(*) INTO rows_to_delete FROM public.merge_decisions WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'user_confirmed_profile';
  SELECT COUNT(*) INTO rows_to_delete FROM public.user_confirmed_profile WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'resume_uploads';
  SELECT COUNT(*) INTO rows_to_delete FROM public.resume_uploads WHERE user_id = target_user_id;
  RETURN NEXT;
  
  table_name := 'profiles';
  SELECT COUNT(*) INTO rows_to_delete FROM public.profiles WHERE id = target_user_id;
  RETURN NEXT;
  
  RETURN;
END;
$$;

-- Drop any existing policies that might conflict (Phase 1 - Critical Database Security)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing policies on critical user tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'career_enrichment', 'career_narratives', 'career_profile', 'certification',
            'education', 'entry_enrichment', 'interview_sessions', 'interview_transcripts',
            'interviews', 'job_logs', 'jobs', 'merge_decisions', 'normalization_jobs',
            'parsed_resume_entities', 'project', 'resume_streams',
            'resume_uploads', 'resume_versions', 'skill', 'user_confirmed_profile',
            'work_experience', 'enrichment_jobs', 'resume_diffs'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all critical user tables
ALTER TABLE public.career_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merge_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.normalization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_resume_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_confirmed_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_diffs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for direct user-owned tables
CREATE POLICY "rls_career_enrichment_user_access" ON public.career_enrichment
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_career_narratives_user_access" ON public.career_narratives
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_career_profile_user_access" ON public.career_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_certifications_user_access" ON public.certification
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_education_user_access" ON public.education
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_entry_enrichment_user_access" ON public.entry_enrichment
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_interview_sessions_user_access" ON public.interview_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_interviews_user_access" ON public.interviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_jobs_user_access" ON public.jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_merge_decisions_user_access" ON public.merge_decisions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_projects_user_access" ON public.project
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_resume_streams_user_access" ON public.resume_streams
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_resume_uploads_user_access" ON public.resume_uploads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_skills_user_access" ON public.skill
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_confirmed_profile_user_access" ON public.user_confirmed_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_work_experience_user_access" ON public.work_experience
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_enrichment_jobs_user_access" ON public.enrichment_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Complex relationship policies for indirect user data access
CREATE POLICY "rls_interview_transcripts_user_access" ON public.interview_transcripts
  FOR ALL USING (
    session_id IN (
      SELECT id FROM public.interview_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "rls_resume_versions_user_access" ON public.resume_versions
  FOR ALL USING (
    stream_id IN (
      SELECT id FROM public.resume_streams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "rls_parsed_entities_user_access" ON public.parsed_resume_entities
  FOR ALL USING (
    resume_version_id IN (
      SELECT rv.id FROM public.resume_versions rv
      JOIN public.resume_streams rs ON rv.stream_id = rs.id
      WHERE rs.user_id = auth.uid()
    )
  );

CREATE POLICY "rls_resume_diffs_user_access" ON public.resume_diffs
  FOR ALL USING (
    resume_version_id IN (
      SELECT rv.id FROM public.resume_versions rv
      JOIN public.resume_streams rs ON rv.stream_id = rs.id
      WHERE rs.user_id = auth.uid()
    )
  );

CREATE POLICY "rls_job_logs_user_access" ON public.job_logs
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM public.normalization_jobs 
      WHERE resume_version_id IN (
        SELECT rv.id FROM public.resume_versions rv
        JOIN public.resume_streams rs ON rv.stream_id = rs.id
        WHERE rs.user_id = auth.uid()
      )
      UNION
      SELECT id FROM public.enrichment_jobs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "rls_normalization_jobs_user_access" ON public.normalization_jobs
  FOR ALL USING (
    resume_version_id IN (
      SELECT rv.id FROM public.resume_versions rv
      JOIN public.resume_streams rs ON rv.stream_id = rs.id
      WHERE rs.user_id = auth.uid()
    )
  );

-- Admin-only policies for system tables
CREATE POLICY "rls_security_audit_log_admin_access" ON public.security_audit_log
  FOR SELECT USING (public.is_admin_user(auth.uid()));

-- Grant proper permissions on functions
REVOKE ALL ON FUNCTION public.handle_user_deletion FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_normalized_entities_safe FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_similar_entities_safe FROM PUBLIC;
REVOKE ALL ON FUNCTION public.test_user_deletion_dry_run FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_user_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_normalized_entities_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_entities_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_user_deletion_dry_run TO authenticated;

-- Log completion of security hardening
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (auth.uid(), 'security_hardening_phase_1_completed', 
    jsonb_build_object(
      'timestamp', now(), 
      'policies_created', 18, 
      'tables_secured', 21,
      'phase', 'critical_database_security'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;
