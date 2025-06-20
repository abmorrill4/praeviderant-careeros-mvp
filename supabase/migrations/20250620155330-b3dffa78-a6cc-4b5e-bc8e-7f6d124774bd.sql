
-- Create storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false, 
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
);

-- Create storage policies for resumes bucket
CREATE POLICY "Users can upload their own resumes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own resumes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resumes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create a table to track resume parsing status and results
CREATE TABLE public.resume_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'processing', 'completed', 'failed')),
  parsing_status TEXT NOT NULL DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  structured_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for resume_uploads
ALTER TABLE public.resume_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume uploads" ON public.resume_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume uploads" ON public.resume_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume uploads" ON public.resume_uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_resume_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_uploads_updated_at
  BEFORE UPDATE ON public.resume_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_resume_uploads_updated_at();
