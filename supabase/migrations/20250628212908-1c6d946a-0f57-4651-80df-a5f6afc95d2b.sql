
-- First, let's add the basic columns to resume_versions table
ALTER TABLE public.resume_versions 
ADD COLUMN IF NOT EXISTS processing_stages JSONB DEFAULT '{
  "upload": {"status": "pending", "started_at": null, "completed_at": null, "error": null},
  "parse": {"status": "pending", "started_at": null, "completed_at": null, "error": null},
  "enrich": {"status": "pending", "started_at": null, "completed_at": null, "error": null},
  "complete": {"status": "pending", "started_at": null, "completed_at": null, "error": null}
}'::jsonb;

-- Add current processing stage column for quick queries
ALTER TABLE public.resume_versions 
ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'upload';

-- Add processing progress percentage
ALTER TABLE public.resume_versions 
ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0;

-- Add detailed error information
ALTER TABLE public.resume_versions 
ADD COLUMN IF NOT EXISTS processing_errors JSONB DEFAULT '[]'::jsonb;

-- Add processing telemetry
ALTER TABLE public.resume_versions 
ADD COLUMN IF NOT EXISTS processing_telemetry JSONB DEFAULT '{}'::jsonb;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_resume_versions_current_stage ON public.resume_versions(current_stage);
CREATE INDEX IF NOT EXISTS idx_resume_versions_processing_progress ON public.resume_versions(processing_progress);

-- Create a function to update processing stage
CREATE OR REPLACE FUNCTION public.update_resume_processing_stage(
  p_version_id UUID,
  p_stage TEXT,
  p_status TEXT DEFAULT 'in_progress',
  p_error TEXT DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create a function to get comprehensive processing status
CREATE OR REPLACE FUNCTION public.get_resume_processing_status(p_version_id UUID)
RETURNS TABLE(
  version_id UUID,
  current_stage TEXT,
  processing_progress INTEGER,
  processing_status TEXT,
  stages JSONB,
  has_entities BOOLEAN,
  has_enrichment BOOLEAN,
  has_narratives BOOLEAN,
  is_complete BOOLEAN,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Add telemetry tracking for performance monitoring
CREATE TABLE IF NOT EXISTS public.processing_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_version_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'start', 'progress', 'complete', 'error'
  duration_ms INTEGER,
  memory_usage_mb INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for telemetry
CREATE INDEX IF NOT EXISTS idx_processing_telemetry_version_id ON public.processing_telemetry(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_processing_telemetry_stage ON public.processing_telemetry(stage);
CREATE INDEX IF NOT EXISTS idx_processing_telemetry_event_type ON public.processing_telemetry(event_type);

-- Enable RLS on telemetry
ALTER TABLE public.processing_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their processing telemetry" ON public.processing_telemetry
  FOR SELECT USING (
    auth.uid() = (
      SELECT rs.user_id 
      FROM public.resume_versions rv 
      JOIN public.resume_streams rs ON rv.stream_id = rs.id 
      WHERE rv.id = resume_version_id
    )
  );

CREATE POLICY "System can manage processing telemetry" ON public.processing_telemetry
  FOR ALL USING (true);
