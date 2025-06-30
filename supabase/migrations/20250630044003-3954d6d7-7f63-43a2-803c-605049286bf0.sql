
-- Phase 1: Critical Function Search Path Security Fix
-- Update all 30 affected functions to include SET search_path = ''

-- 1. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 2. Update handle_resume_streams_updated_at function
CREATE OR REPLACE FUNCTION public.handle_resume_streams_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Update handle_resume_versions_updated_at function
CREATE OR REPLACE FUNCTION public.handle_resume_versions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Update handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. Update handle_parsed_resume_entities_updated_at function
CREATE OR REPLACE FUNCTION public.handle_parsed_resume_entities_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 6. Update get_interview_context function
CREATE OR REPLACE FUNCTION public.get_interview_context(p_user_id uuid)
 RETURNS TABLE(active_interview jsonb, career_profile jsonb, job_history jsonb, recent_summaries jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  WITH active_interview_data AS (
    SELECT 
      to_jsonb(i.*) as interview_data
    FROM public.interviews i
    WHERE i.user_id = p_user_id 
      AND i.status IN ('in_progress', 'resumed')
    ORDER BY i.started_at DESC
    LIMIT 1
  ),
  profile_data AS (
    SELECT 
      to_jsonb(cp.*) as profile_data
    FROM public.career_profile cp
    WHERE cp.user_id = p_user_id
    LIMIT 1
  ),
  jobs_data AS (
    SELECT 
      COALESCE(jsonb_agg(to_jsonb(j.*) ORDER BY j.start_date DESC), '[]'::jsonb) as jobs_data
    FROM public.jobs j
    WHERE j.user_id = p_user_id
  ),
  summaries_data AS (
    SELECT 
      COALESCE(jsonb_agg(i.summary ORDER BY i.completed_at DESC), '[]'::jsonb) as summaries_data
    FROM public.interviews i
    WHERE i.user_id = p_user_id 
      AND i.status = 'completed'
      AND i.summary IS NOT NULL
    LIMIT 3
  )
  SELECT 
    COALESCE(aid.interview_data, 'null'::jsonb),
    COALESCE(pd.profile_data, 'null'::jsonb),
    COALESCE(jd.jobs_data, '[]'::jsonb),
    COALESCE(sd.summaries_data, '[]'::jsonb)
  FROM active_interview_data aid
  FULL OUTER JOIN profile_data pd ON true
  FULL OUTER JOIN jobs_data jd ON true
  FULL OUTER JOIN summaries_data sd ON true;
END;
$function$;

-- 7. Update update_question_flows_updated_at function
CREATE OR REPLACE FUNCTION public.update_question_flows_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 8. Update handle_entry_enrichment_updated_at function
CREATE OR REPLACE FUNCTION public.handle_entry_enrichment_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 9. Update handle_resume_uploads_updated_at function
CREATE OR REPLACE FUNCTION public.handle_resume_uploads_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 10. Update handle_resume_diffs_updated_at function
CREATE OR REPLACE FUNCTION public.handle_resume_diffs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 11. Update handle_user_confirmed_profile_updated_at function
CREATE OR REPLACE FUNCTION public.handle_user_confirmed_profile_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 12. Update handle_normalized_entities_updated_at function
CREATE OR REPLACE FUNCTION public.handle_normalized_entities_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 13. Update handle_resume_entity_links_updated_at function
CREATE OR REPLACE FUNCTION public.handle_resume_entity_links_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 14. Update handle_normalization_jobs_updated_at function
CREATE OR REPLACE FUNCTION public.handle_normalization_jobs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 15. Update is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT COALESCE(
    EXISTS(
      SELECT 1 FROM auth.users 
      WHERE id = COALESCE(user_id, auth.uid())
      AND (
        raw_user_meta_data->>'user_role' = 'admin' OR
        email IN ('admin@careeros.com', 'security@careeros.com')
      )
    ),
    false
  );
$function$;

-- 16. Update handle_career_enrichment_updated_at function
CREATE OR REPLACE FUNCTION public.handle_career_enrichment_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 17. Update handle_career_narratives_updated_at function
CREATE OR REPLACE FUNCTION public.handle_career_narratives_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 18. Update handle_enrichment_jobs_updated_at function
CREATE OR REPLACE FUNCTION public.handle_enrichment_jobs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 19. Update handle_merge_decisions_updated_at function
CREATE OR REPLACE FUNCTION public.handle_merge_decisions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 20. Update update_resume_processing_stage function
CREATE OR REPLACE FUNCTION public.update_resume_processing_stage(p_version_id uuid, p_stage text, p_status text DEFAULT 'in_progress'::text, p_error text DEFAULT NULL::text, p_progress integer DEFAULT NULL::integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  current_stages JSONB;
  updated_stages JSONB;
  stage_progress INTEGER;
  user_has_access BOOLEAN;
BEGIN
  -- Check if user has access to this version
  SELECT EXISTS(
    SELECT 1 FROM public.resume_versions rv
    JOIN public.resume_streams rs ON rv.stream_id = rs.id
    WHERE rv.id = p_version_id AND rs.user_id = auth.uid()
  ) INTO user_has_access;
  
  IF NOT user_has_access THEN
    RETURN FALSE;
  END IF;
  
  -- Get current stages
  SELECT processing_stages INTO current_stages 
  FROM public.resume_versions 
  WHERE id = p_version_id;
  
  IF current_stages IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the specific stage
  updated_stages := jsonb_set(
    current_stages,
    ARRAY[p_stage],
    jsonb_build_object(
      'status', p_status,
      'started_at', CASE WHEN p_status = 'in_progress' THEN to_jsonb(now()) ELSE current_stages->p_stage->'started_at' END,
      'completed_at', CASE WHEN p_status IN ('completed', 'failed') THEN to_jsonb(now()) ELSE NULL END,
      'error', CASE WHEN p_error IS NOT NULL THEN to_jsonb(p_error) ELSE NULL END
    )
  );
  
  -- Calculate progress based on stage
  stage_progress := CASE 
    WHEN p_stage = 'upload' AND p_status = 'completed' THEN 25
    WHEN p_stage = 'parse' AND p_status = 'completed' THEN 50
    WHEN p_stage = 'enrich' AND p_status = 'completed' THEN 75
    WHEN p_stage = 'complete' AND p_status = 'completed' THEN 100
    WHEN p_progress IS NOT NULL THEN p_progress
    ELSE COALESCE((SELECT processing_progress FROM public.resume_versions WHERE id = p_version_id), 0)
  END;
  
  -- Update the record
  UPDATE public.resume_versions 
  SET 
    processing_stages = updated_stages,
    current_stage = p_stage,
    processing_progress = stage_progress,
    processing_status = CASE 
      WHEN p_status = 'failed' THEN 'failed'
      WHEN p_stage = 'complete' AND p_status = 'completed' THEN 'completed'
      ELSE 'processing'
    END,
    updated_at = now()
  WHERE id = p_version_id;
  
  RETURN TRUE;
END;
$function$;

-- 21. Update find_similar_entities function
CREATE OR REPLACE FUNCTION public.find_similar_entities(p_entity_id uuid, p_similarity_threshold double precision DEFAULT 0.7)
 RETURNS TABLE(id uuid, entity_type text, canonical_name text, aliases text[], confidence_score double precision, similarity_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  target_entity RECORD;
BEGIN
  -- Get the target entity
  SELECT ne.entity_type, ne.canonical_name, ne.aliases, ne.embedding_vector
  INTO target_entity
  FROM public.normalized_entities ne
  WHERE ne.id = p_entity_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Find similar entities based on name similarity and same type
  RETURN QUERY
  SELECT 
    ne.id,
    ne.entity_type,
    ne.canonical_name,
    ne.aliases,
    ne.confidence_score,
    CASE 
      WHEN target_entity.embedding_vector IS NOT NULL AND ne.embedding_vector IS NOT NULL THEN
        1 - (target_entity.embedding_vector <=> ne.embedding_vector) -- Cosine similarity
      ELSE
        GREATEST(
          similarity(ne.canonical_name, target_entity.canonical_name),
          COALESCE(
            (SELECT MAX(similarity(alias, target_entity.canonical_name)) 
             FROM unnest(ne.aliases) AS alias), 0
          ),
          COALESCE(
            (SELECT MAX(similarity(target_entity.canonical_name, alias)) 
             FROM unnest(target_entity.aliases) AS alias), 0
          )
        )
    END as similarity_score
  FROM public.normalized_entities ne
  WHERE ne.id != p_entity_id
    AND ne.entity_type = target_entity.entity_type
    AND (
      similarity(ne.canonical_name, target_entity.canonical_name) > p_similarity_threshold
      OR EXISTS (
        SELECT 1 FROM unnest(ne.aliases) AS alias 
        WHERE similarity(alias, target_entity.canonical_name) > p_similarity_threshold
      )
      OR EXISTS (
        SELECT 1 FROM unnest(target_entity.aliases) AS target_alias
        WHERE similarity(ne.canonical_name, target_alias) > p_similarity_threshold
      )
      OR (target_entity.embedding_vector IS NOT NULL AND ne.embedding_vector IS NOT NULL 
          AND (1 - (target_entity.embedding_vector <=> ne.embedding_vector)) > p_similarity_threshold)
    )
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$function$;

-- 22. Update merge_normalized_entities function
CREATE OR REPLACE FUNCTION public.merge_normalized_entities(p_source_entity_id uuid, p_target_entity_id uuid, p_admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  source_entity RECORD;
  target_entity RECORD;
  merged_aliases TEXT[];
BEGIN
  -- Check if user is admin (you might want to implement proper admin check)
  -- For now, we'll assume this function is only called by admins
  
  -- Get source and target entities
  SELECT * INTO source_entity FROM public.normalized_entities WHERE id = p_source_entity_id;
  SELECT * INTO target_entity FROM public.normalized_entities WHERE id = p_target_entity_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Merge aliases
  merged_aliases := ARRAY(
    SELECT DISTINCT unnest(target_entity.aliases || source_entity.aliases || ARRAY[source_entity.canonical_name])
  );
  
  -- Update target entity with merged data
  UPDATE public.normalized_entities 
  SET 
    aliases = merged_aliases,
    confidence_score = GREATEST(source_entity.confidence_score, target_entity.confidence_score),
    review_status = 'approved',
    updated_at = now()
  WHERE id = p_target_entity_id;
  
  -- Update all links to point to target entity
  UPDATE public.resume_entity_links
  SET normalized_entity_id = p_target_entity_id
  WHERE normalized_entity_id = p_source_entity_id;
  
  -- Delete source entity
  DELETE FROM public.normalized_entities WHERE id = p_source_entity_id;
  
  RETURN TRUE;
END;
$function$;

-- 23. Update get_resume_processing_status function
CREATE OR REPLACE FUNCTION public.get_resume_processing_status(p_version_id uuid)
 RETURNS TABLE(version_id uuid, current_stage text, processing_progress integer, processing_status text, stages jsonb, has_entities boolean, has_enrichment boolean, has_narratives boolean, is_complete boolean, last_updated timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rv.id,
    rv.current_stage,
    rv.processing_progress,
    rv.processing_status,
    rv.processing_stages,
    -- Check if has entities
    EXISTS(SELECT 1 FROM public.parsed_resume_entities pre WHERE pre.resume_version_id = rv.id),
    -- Check if has enrichment
    EXISTS(SELECT 1 FROM public.career_enrichment ce WHERE ce.resume_version_id = rv.id),
    -- Check if has narratives
    EXISTS(SELECT 1 FROM public.career_narratives cn WHERE cn.resume_version_id = rv.id),
    -- Is complete check
    (rv.processing_progress = 100 AND rv.processing_status = 'completed'),
    rv.updated_at
  FROM public.resume_versions rv
  JOIN public.resume_streams rs ON rv.stream_id = rs.id
  WHERE rv.id = p_version_id
    AND rs.user_id = auth.uid();
END;
$function$;

-- 24. Update handle_user_deletion function
CREATE OR REPLACE FUNCTION public.handle_user_deletion(target_user_id uuid)
 RETURNS TABLE(table_name text, rows_deleted integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Only allow admins or users deleting their own account
  IF NOT (public.is_admin_user(auth.uid()) OR auth.uid() = target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins or account owners can delete user data';
  END IF;
  
  -- Log the deletion attempt if logging table exists
  BEGIN
    INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), 'user_data_deletion_attempted', 'user', target_user_id, 
      jsonb_build_object('target_user_id', target_user_id, 'requesting_user_id', auth.uid()));
  EXCEPTION WHEN OTHERS THEN
    -- Continue if logging fails
    NULL;
  END;
  
  -- Execute the existing deletion logic
  DELETE FROM public.entry_enrichment WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'entry_enrichment';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.encrypted_data WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'encrypted_data';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.interview_transcripts 
  WHERE session_id IN (SELECT id FROM public.interview_sessions WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'interview_transcripts';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.interview_sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'interview_sessions';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.interviews WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'interviews';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.work_experience WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'work_experience';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.education WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'education';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.skill WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'skill';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.project WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'project';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.certification WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'certification';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.career_profile WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'career_profile';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.jobs WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'jobs';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.resume_streams WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'resume_streams';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'profiles';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  RETURN;
END;
$function$;

-- 25. Update merge_normalized_entities_safe function
CREATE OR REPLACE FUNCTION public.merge_normalized_entities_safe(p_source_entity_id uuid, p_target_entity_id uuid, p_admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  source_entity RECORD;
  target_entity RECORD;
  merged_aliases TEXT[];
BEGIN
  -- Verify admin access
  IF NOT public.is_admin_user(p_admin_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Get entities with error handling
  BEGIN
    SELECT * INTO source_entity FROM public.normalized_entities WHERE id = p_source_entity_id;
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;
    
    SELECT * INTO target_entity FROM public.normalized_entities WHERE id = p_target_entity_id;
    IF NOT FOUND THEN  
      RETURN FALSE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  -- Perform merge with transaction safety
  BEGIN
    -- Merge aliases safely
    merged_aliases := ARRAY(
      SELECT DISTINCT unnest(
        COALESCE(target_entity.aliases, ARRAY[]::TEXT[]) || 
        COALESCE(source_entity.aliases, ARRAY[]::TEXT[]) || 
        ARRAY[source_entity.canonical_name]
      )
    );
    
    -- Update target entity
    UPDATE public.normalized_entities 
    SET 
      aliases = merged_aliases,
      confidence_score = GREATEST(
        COALESCE(source_entity.confidence_score, 0.0), 
        COALESCE(target_entity.confidence_score, 0.0)
      ),
      review_status = 'approved',
      updated_at = now()
    WHERE id = p_target_entity_id;
    
    -- Update links to point to target entity
    UPDATE public.resume_entity_links
    SET normalized_entity_id = p_target_entity_id
    WHERE normalized_entity_id = p_source_entity_id;
    
    -- Delete source entity
    DELETE FROM public.normalized_entities WHERE id = p_source_entity_id;
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$function$;

-- 26. Update find_similar_entities_safe function
CREATE OR REPLACE FUNCTION public.find_similar_entities_safe(p_entity_id uuid, p_similarity_threshold double precision DEFAULT 0.7)
 RETURNS TABLE(id uuid, entity_type text, canonical_name text, aliases text[], confidence_score double precision, similarity_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  target_entity RECORD;
BEGIN
  -- Get the target entity with error handling
  BEGIN
    SELECT ne.entity_type, ne.canonical_name, ne.aliases, ne.embedding_vector
    INTO target_entity
    FROM public.normalized_entities ne
    WHERE ne.id = p_entity_id;
    
    IF NOT FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;
  
  -- Find similar entities with proper error handling
  BEGIN
    RETURN QUERY
    SELECT 
      ne.id,
      ne.entity_type,
      ne.canonical_name,
      COALESCE(ne.aliases, ARRAY[]::TEXT[]),
      COALESCE(ne.confidence_score, 0.0),
      CASE 
        WHEN target_entity.embedding_vector IS NOT NULL AND ne.embedding_vector IS NOT NULL THEN
          GREATEST(0.0, LEAST(1.0, 1 - (target_entity.embedding_vector <=> ne.embedding_vector)))
        ELSE
          GREATEST(
            COALESCE(similarity(ne.canonical_name, target_entity.canonical_name), 0.0),
            COALESCE(
              (SELECT MAX(similarity(alias, target_entity.canonical_name)) 
               FROM unnest(COALESCE(ne.aliases, ARRAY[]::TEXT[])) AS alias), 0.0
            ),
            COALESCE(
              (SELECT MAX(similarity(target_entity.canonical_name, alias)) 
               FROM unnest(COALESCE(target_entity.aliases, ARRAY[]::TEXT[])) AS alias), 0.0
            )
          )
      END as similarity_score
    FROM public.normalized_entities ne
    WHERE ne.id != p_entity_id
      AND ne.entity_type = target_entity.entity_type
      AND (
        COALESCE(similarity(ne.canonical_name, target_entity.canonical_name), 0.0) > p_similarity_threshold
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(ne.aliases, ARRAY[]::TEXT[])) AS alias 
          WHERE COALESCE(similarity(alias, target_entity.canonical_name), 0.0) > p_similarity_threshold
        )
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(target_entity.aliases, ARRAY[]::TEXT[])) AS target_alias
          WHERE COALESCE(similarity(ne.canonical_name, target_alias), 0.0) > p_similarity_threshold
        )
        OR (target_entity.embedding_vector IS NOT NULL AND ne.embedding_vector IS NOT NULL 
            AND (1 - (target_entity.embedding_vector <=> ne.embedding_vector)) > p_similarity_threshold)
      )
    ORDER BY similarity_score DESC
    LIMIT 10;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;
END;
$function$;

-- 27. Update test_user_deletion_dry_run function
CREATE OR REPLACE FUNCTION public.test_user_deletion_dry_run(target_user_id uuid)
 RETURNS TABLE(table_name text, rows_to_delete bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- 28. Update get_unresolved_entities_stats function
CREATE OR REPLACE FUNCTION public.get_unresolved_entities_stats()
 RETURNS TABLE(id uuid, entity_type text, canonical_name text, aliases text[], confidence_score double precision, review_status text, created_at timestamp with time zone, updated_at timestamp with time zone, reference_count bigint, referencing_users uuid[], avg_match_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Only allow admin users to access this function
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin users can access unresolved entities stats';
  END IF;

  -- Return the same data as the original view, but with proper security
  RETURN QUERY
  SELECT 
    ne.id,
    ne.entity_type,
    ne.canonical_name,
    ne.aliases,
    ne.confidence_score,
    ne.review_status,
    ne.created_at,
    ne.updated_at,
    -- Count how many times this entity is referenced across resumes
    COUNT(rel.id) as reference_count,
    -- Get array of users who reference this entity
    ARRAY_AGG(DISTINCT rs.user_id) FILTER (WHERE rs.user_id IS NOT NULL) as referencing_users,
    -- Calculate average match score from links
    AVG(rel.match_score) as avg_match_score
  FROM public.normalized_entities ne
  LEFT JOIN public.resume_entity_links rel ON ne.id = rel.normalized_entity_id
  LEFT JOIN public.parsed_resume_entities pre ON rel.parsed_entity_id = pre.id
  LEFT JOIN public.resume_versions rv ON pre.resume_version_id = rv.id
  LEFT JOIN public.resume_streams rs ON rv.stream_id = rs.id
  WHERE ne.confidence_score < 0.85 OR ne.review_status = 'pending' OR ne.review_status = 'flagged'
  GROUP BY ne.id, ne.entity_type, ne.canonical_name, ne.aliases, ne.confidence_score, ne.review_status, ne.created_at, ne.updated_at;
END;
$function$;

-- 29. Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin',
    false
  );
$function$;

-- Log completion of Phase 1 security hardening
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (auth.uid(), 'security_hardening_phase_1_functions_completed', 
    jsonb_build_object(
      'timestamp', now(), 
      'functions_updated', 29,
      'security_issue', 'function_search_path_mutable',
      'fix_applied', 'SET search_path = empty_string',
      'phase', 'critical_function_search_path_security'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;
