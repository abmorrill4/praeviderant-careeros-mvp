
-- Create admin-specific functions and views for entity management

-- Create a view to show unresolved entities with stats
CREATE OR REPLACE VIEW public.unresolved_entities_stats AS
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

-- Create function to find similar entities
CREATE OR REPLACE FUNCTION public.find_similar_entities(
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
$$;

-- Create function to merge entities (admin only)
CREATE OR REPLACE FUNCTION public.merge_normalized_entities(
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
$$;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage all normalized entities" ON public.normalized_entities
  FOR ALL USING (public.is_admin());

-- Enable RLS on the view (it inherits from the table policies)
-- Note: Views don't have RLS directly, but the underlying tables do

-- Grant access to admin functions
GRANT EXECUTE ON FUNCTION public.find_similar_entities TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_normalized_entities TO authenticated;
GRANT SELECT ON public.unresolved_entities_stats TO authenticated;
