
-- Create resume_streams table to track different resume versions
CREATE TABLE IF NOT EXISTS public.resume_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Resume',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  auto_tagged BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_versions table to track individual resume file versions
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.resume_streams(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_hash TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_metadata JSONB DEFAULT '{}',
  resume_metadata JSONB DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_logs table for detailed job logging (since jobs table exists)
CREATE TABLE IF NOT EXISTS public.job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_streams_user_id ON public.resume_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_stream_id ON public.resume_versions(stream_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_file_hash ON public.resume_versions(file_hash);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON public.job_logs(job_id);

-- Enable RLS for new tables
ALTER TABLE public.resume_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resume_streams
CREATE POLICY "Users can view their own resume streams" ON public.resume_streams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume streams" ON public.resume_streams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume streams" ON public.resume_streams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume streams" ON public.resume_streams
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for resume_versions
CREATE POLICY "Users can view their own resume versions" ON public.resume_versions
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.resume_streams WHERE id = stream_id));

CREATE POLICY "Users can create their own resume versions" ON public.resume_versions
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.resume_streams WHERE id = stream_id));

CREATE POLICY "Users can update their own resume versions" ON public.resume_versions
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.resume_streams WHERE id = stream_id));

CREATE POLICY "Users can delete their own resume versions" ON public.resume_versions
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.resume_streams WHERE id = stream_id));

-- Create RLS policies for job_logs
CREATE POLICY "Users can view their own job logs" ON public.job_logs
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.jobs WHERE id = job_id));

CREATE POLICY "Users can create their own job logs" ON public.job_logs
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.jobs WHERE id = job_id));

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_resume_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_streams_updated_at
  BEFORE UPDATE ON public.resume_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_resume_streams_updated_at();

CREATE OR REPLACE FUNCTION public.handle_resume_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_versions_updated_at
  BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_resume_versions_updated_at();

-- Create user-resumes bucket with better organization
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-resumes', 
  'user-resumes', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];

-- Create storage policies for user-resumes bucket
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can upload to their own resume folder" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own resume files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own resume files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own resume files" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if policies don't exist
  NULL;
END $$;

CREATE POLICY "Users can upload to their own resume folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resume files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own resume files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resume files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
