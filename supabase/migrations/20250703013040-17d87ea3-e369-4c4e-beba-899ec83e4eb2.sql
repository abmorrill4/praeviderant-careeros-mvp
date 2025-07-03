-- Create generated_resumes table for storing AI-generated resumes
CREATE TABLE public.generated_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_description TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  personalization JSONB DEFAULT '{}',
  format_settings JSONB DEFAULT '{}',
  style_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can manage their own generated resumes" 
ON public.generated_resumes 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_generated_resumes_updated_at
BEFORE UPDATE ON public.generated_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_generated_resumes_user_id ON public.generated_resumes(user_id);
CREATE INDEX idx_generated_resumes_created_at ON public.generated_resumes(created_at);