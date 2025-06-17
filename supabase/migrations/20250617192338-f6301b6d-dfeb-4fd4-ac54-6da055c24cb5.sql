
-- Create interviews table to store interview metadata and data
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  interview_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  transcript TEXT,
  audio_url TEXT,
  extracted_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own interviews
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create policies for interviews table
CREATE POLICY "Users can view their own interviews" 
  ON public.interviews 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interviews" 
  ON public.interviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews" 
  ON public.interviews 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews" 
  ON public.interviews 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create interview_types table for managing available interview topics
CREATE TABLE public.interview_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default interview types
INSERT INTO public.interview_types (name, title, description, prompt_template, display_order) VALUES
('welcome', 'Welcome', 'Tell us about your welcome.', 'Please introduce yourself and tell me about your background, current situation, and what brings you here today.', 1),
('work_history', 'Work History', 'Tell us about your work history.', 'Walk me through your work history, starting with your most recent position. For each role, please describe your responsibilities, key accomplishments, and what you learned.', 2),
('education', 'Education', 'Tell us about your education.', 'Tell me about your educational background, including formal education, certifications, and any significant learning experiences that shaped your career.', 3),
('career_goals', 'Career Goals', 'Tell us about your career goals.', 'What are your career aspirations? Where do you see yourself in the next few years, and what steps are you taking to achieve these goals?', 4),
('skills', 'Skills & Expertise', 'Tell us about your skills and expertise.', 'What are your core technical and soft skills? Can you provide examples of how you''ve applied these skills in your work?', 5),
('achievements', 'Key Achievements', 'Share your notable achievements.', 'What are some of your most significant professional achievements or projects you''re proud of? What impact did they have?', 6);

-- Enable RLS on interview_types (public read access)
ALTER TABLE public.interview_types ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to interview types
CREATE POLICY "Anyone can view active interview types" 
  ON public.interview_types 
  FOR SELECT 
  USING (is_active = true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
