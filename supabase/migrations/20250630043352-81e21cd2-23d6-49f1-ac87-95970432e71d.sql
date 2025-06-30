
-- Drop the insecure view that bypasses RLS
DROP VIEW IF EXISTS public.unresolved_entities_stats;

-- Create a secure admin-only function to replace the view
CREATE OR REPLACE FUNCTION public.get_unresolved_entities_stats()
RETURNS TABLE(
  id uuid,
  entity_type text,
  canonical_name text,
  aliases text[],
  confidence_score double precision,
  review_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  reference_count bigint,
  referencing_users uuid[],
  avg_match_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Grant execute permission to authenticated users (function will handle admin check internally)
GRANT EXECUTE ON FUNCTION public.get_unresolved_entities_stats() TO authenticated;

-- Log the security fix
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (auth.uid(), 'security_vulnerability_fixed', 
    jsonb_build_object(
      'vulnerability', 'insecure_view_bypassing_rls',
      'view_name', 'unresolved_entities_stats',
      'fix_applied', 'replaced_with_secure_admin_function',
      'timestamp', now()
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;
