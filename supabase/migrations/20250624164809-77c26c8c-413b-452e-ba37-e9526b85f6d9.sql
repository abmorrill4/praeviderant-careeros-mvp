
-- Function to preview what data would be deleted (dry run)
CREATE OR REPLACE FUNCTION public.test_user_deletion_dry_run(target_user_id uuid)
RETURNS TABLE(table_name text, rows_to_delete bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Count rows that would be deleted from each table (without actually deleting)
  
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
  
  table_name := 'profile_deltas';
  SELECT COUNT(*) INTO rows_to_delete FROM public.profile_deltas WHERE user_id = target_user_id;
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
  
  table_name := 'profiles';
  SELECT COUNT(*) INTO rows_to_delete FROM public.profiles WHERE id = target_user_id;
  RETURN NEXT;
  
  RETURN;
END;
$$;

-- Function to actually delete user data
CREATE OR REPLACE FUNCTION public.handle_user_deletion(target_user_id uuid)
RETURNS TABLE(table_name text, rows_deleted integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  result_record RECORD;
BEGIN
  -- Start a transaction to ensure all deletions succeed or fail together
  -- Note: This function should be called within a transaction by the caller
  
  -- Delete from encrypted_data table
  DELETE FROM public.encrypted_data WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'encrypted_data';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from interview_transcripts (via session relationship)
  DELETE FROM public.interview_transcripts 
  WHERE session_id IN (
    SELECT id FROM public.interview_sessions WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'interview_transcripts';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from interview_sessions
  DELETE FROM public.interview_sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'interview_sessions';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from interviews
  DELETE FROM public.interviews WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'interviews';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from profile_deltas
  DELETE FROM public.profile_deltas WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'profile_deltas';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from work_experience (all versions)
  DELETE FROM public.work_experience WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'work_experience';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from education (all versions)
  DELETE FROM public.education WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'education';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from skill (all versions)
  DELETE FROM public.skill WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'skill';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from project (all versions)
  DELETE FROM public.project WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'project';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from certification (all versions)
  DELETE FROM public.certification WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'certification';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from career_profile
  DELETE FROM public.career_profile WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'career_profile';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from jobs
  DELETE FROM public.jobs WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'jobs';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from resume_streams
  DELETE FROM public.resume_streams WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'resume_streams';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Delete from profiles (this should be done last as other tables may reference it)
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'profiles';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Note: We don't delete from auth.users as that's managed by Supabase Auth
  -- The auth user deletion should be handled separately via Supabase Admin API
  
  RETURN;
END;
$$;
