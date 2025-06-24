
-- Create the user-resumes storage bucket for resume file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-resumes', 'user-resumes', false);

-- Create policy to allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resume files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to view their own resumes
CREATE POLICY "Users can view their own resume files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to update their own resumes
CREATE POLICY "Users can update their own resume files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete their own resume files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
