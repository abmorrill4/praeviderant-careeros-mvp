
-- Add summary column to interviews table for storing session summaries
ALTER TABLE interviews ADD COLUMN summary TEXT;

-- Add index for faster queries on user_id and status
CREATE INDEX idx_interviews_user_status ON interviews (user_id, status, started_at DESC);

-- Add 'resumed' as a valid status
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_status_check;
ALTER TABLE interviews ADD CONSTRAINT interviews_status_check 
  CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed', 'resumed'));

-- Create function to get interview context data
CREATE OR REPLACE FUNCTION get_interview_context(p_user_id UUID)
RETURNS TABLE (
  active_interview JSONB,
  career_profile JSONB,
  job_history JSONB,
  recent_summaries JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_interview_data AS (
    SELECT 
      to_jsonb(i.*) as interview_data
    FROM interviews i
    WHERE i.user_id = p_user_id 
      AND i.status IN ('in_progress', 'resumed')
    ORDER BY i.started_at DESC
    LIMIT 1
  ),
  profile_data AS (
    SELECT 
      to_jsonb(cp.*) as profile_data
    FROM career_profile cp
    WHERE cp.user_id = p_user_id
    LIMIT 1
  ),
  jobs_data AS (
    SELECT 
      COALESCE(jsonb_agg(to_jsonb(j.*) ORDER BY j.start_date DESC), '[]'::jsonb) as jobs_data
    FROM jobs j
    WHERE j.user_id = p_user_id
  ),
  summaries_data AS (
    SELECT 
      COALESCE(jsonb_agg(i.summary ORDER BY i.completed_at DESC), '[]'::jsonb) as summaries_data
    FROM interviews i
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
$$;
