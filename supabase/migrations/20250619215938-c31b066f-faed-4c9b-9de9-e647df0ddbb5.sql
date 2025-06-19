
-- Create profile_deltas table for tracking changes
CREATE TABLE public.profile_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  source_interview UUID NOT NULL REFERENCES public.interviews(id),
  entity_type TEXT NOT NULL, -- 'job', 'summary', 'current_title', 'current_company'
  field TEXT,                -- 'start_date', 'impact', 'description', etc.
  original_value TEXT,
  new_value TEXT,
  status TEXT DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create career_profile table for storing user career summaries
CREATE TABLE public.career_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users UNIQUE,
  summary TEXT,
  current_title TEXT,
  current_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create jobs table for storing user job history
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  impact TEXT,
  tools_used TEXT[], -- Array of strings for tools
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add processed column to interviews table
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.profile_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_deltas
CREATE POLICY "Users can view their own profile deltas" 
  ON public.profile_deltas 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile deltas" 
  ON public.profile_deltas 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile deltas" 
  ON public.profile_deltas 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for career_profile
CREATE POLICY "Users can view their own career profile" 
  ON public.career_profile 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own career profile" 
  ON public.career_profile 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career profile" 
  ON public.career_profile 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for jobs
CREATE POLICY "Users can view their own jobs" 
  ON public.jobs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" 
  ON public.jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
  ON public.jobs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" 
  ON public.jobs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER career_profile_updated_at
  BEFORE UPDATE ON public.career_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profile_deltas_updated_at
  BEFORE UPDATE ON public.profile_deltas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
