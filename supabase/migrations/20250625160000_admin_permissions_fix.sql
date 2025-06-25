
-- Simplified admin permissions and entity management functions
-- This replaces the overly complex previous migration

-- Ensure the admin check function exists and works properly
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

-- Create simplified entity similarity function
CREATE OR REPLACE FUNCTION public.find_similar_entities_simple(
  p_entity_id UUID,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  entity_type TEXT,
  canonical_name TEXT,
  similarity_score FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_entity RECORD;
BEGIN
  -- Get the target entity
  SELECT ne.entity_type, ne.canonical_name
  INTO target_entity
  FROM public.normalized_entities ne
  WHERE ne.id = p_entity_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Find similar entities using text similarity
  RETURN QUERY
  SELECT 
    ne.id,
    ne.entity_type,
    ne.canonical_name,
    COALESCE(similarity(ne.canonical_name, target_entity.canonical_name), 0.0) as similarity_score
  FROM public.normalized_entities ne
  WHERE ne.id != p_entity_id
    AND ne.entity_type = target_entity.entity_type
    AND COALESCE(similarity(ne.canonical_name, target_entity.canonical_name), 0.0) > p_similarity_threshold
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$;

-- Ensure RLS policies exist for timeline data
DO $$ 
BEGIN
  -- Create policy for resume versions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resume_versions' 
    AND policyname = 'Users can view their resume processing data'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their resume processing data" 
             ON public.resume_versions
             FOR SELECT 
             TO authenticated
             USING (
               stream_id IN (
                 SELECT id FROM public.resume_streams WHERE user_id = auth.uid()
               )
             )';
  END IF;

  -- Create policy for job logs if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_logs' 
    AND policyname = 'Users can view their job logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their job logs" 
             ON public.job_logs
             FOR SELECT 
             TO authenticated
             USING (true)'; -- Simplified for now
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.find_similar_entities_simple TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;
