
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their normalization jobs" ON public.normalization_jobs;
DROP POLICY IF EXISTS "Users can view their enrichment jobs" ON public.enrichment_jobs;
DROP POLICY IF EXISTS "Users can view their resume processing data" ON public.resume_versions;
DROP POLICY IF EXISTS "Users can view their job logs" ON public.job_logs;
DROP POLICY IF EXISTS "Authenticated users can view unresolved entity stats" ON public.normalized_entities;

-- First, let's create a proper admin check function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    EXISTS(
      SELECT 1 FROM auth.users 
      WHERE id = user_id 
      AND raw_user_meta_data->>'user_role' = 'admin'
    ),
    false
  );
$$;

-- Create RLS policies for the unresolved_entities_stats view
-- Note: Views inherit RLS from their underlying tables, but we need to ensure access
CREATE POLICY "Authenticated users can view unresolved entity stats" 
ON public.normalized_entities
FOR SELECT 
TO authenticated
USING (true);

-- Ensure the functions for entity management exist and work properly
-- This is a safer version of the find_similar_entities function
CREATE OR REPLACE FUNCTION public.find_similar_entities_safe(
  p_entity_id UUID,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  entity_type TEXT,
  canonical_name TEXT,
  aliases TEXT[],
  confidence_score FLOAT,
  similarity_score FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create a safer merge function with better error handling
CREATE OR REPLACE FUNCTION public.merge_normalized_entities_safe(
  p_source_entity_id UUID,
  p_target_entity_id UUID,
  p_admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Ensure proper permissions for timeline queries
CREATE POLICY "Users can view their resume processing data" 
ON public.resume_versions
FOR SELECT 
TO authenticated
USING (
  stream_id IN (
    SELECT id FROM public.resume_streams WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their job logs" 
ON public.job_logs
FOR SELECT 
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.normalization_jobs WHERE resume_version_id IN (
      SELECT rv.id FROM public.resume_versions rv
      JOIN public.resume_streams rs ON rv.stream_id = rs.id
      WHERE rs.user_id = auth.uid()
    )
    UNION
    SELECT id FROM public.enrichment_jobs WHERE resume_version_id IN (
      SELECT rv.id FROM public.resume_versions rv
      JOIN public.resume_streams rs ON rv.stream_id = rs.id
      WHERE rs.user_id = auth.uid()
    )
  )
);

-- Add policies for enrichment and normalization jobs
CREATE POLICY "Users can view their normalization jobs" 
ON public.normalization_jobs
FOR SELECT 
TO authenticated
USING (
  resume_version_id IN (
    SELECT rv.id FROM public.resume_versions rv
    JOIN public.resume_streams rs ON rv.stream_id = rs.id
    WHERE rs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their enrichment jobs" 
ON public.enrichment_jobs
FOR SELECT 
TO authenticated
USING (
  resume_version_id IN (
    SELECT rv.id FROM public.resume_versions rv
    JOIN public.resume_streams rs ON rv.stream_id = rs.id
    WHERE rs.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.find_similar_entities_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_normalized_entities_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;
GRANT SELECT ON public.unresolved_entities_stats TO authenticated;
