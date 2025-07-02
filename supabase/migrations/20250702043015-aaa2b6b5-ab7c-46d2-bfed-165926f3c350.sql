-- Enhanced Interview Session Management
-- Add new columns to interview_sessions for enhanced flow management
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS interview_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progression_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions_asked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_insights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS next_recommended_phase TEXT,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Create interview_contexts table for storing extracted context
CREATE TABLE IF NOT EXISTS public.interview_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  context_type TEXT NOT NULL, -- 'work_experience', 'education', 'skills', etc.
  extracted_data JSONB NOT NULL DEFAULT '{}',
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'merged', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for interview_contexts
ALTER TABLE public.interview_contexts ENABLE ROW LEVEL SECURITY;

-- Create policy for interview_contexts
CREATE POLICY "optimized_interview_contexts_access" 
ON public.interview_contexts 
FOR ALL 
USING (current_user_id() = user_id);

-- Create function to update interview_contexts updated_at
CREATE OR REPLACE FUNCTION public.handle_interview_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for interview_contexts
CREATE TRIGGER update_interview_contexts_updated_at
BEFORE UPDATE ON public.interview_contexts
FOR EACH ROW
EXECUTE FUNCTION public.handle_interview_contexts_updated_at();

-- Create interview_questions table for dynamic question management
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'work_experience', 'education', 'skills', 'goals', etc.
  question_text TEXT NOT NULL,
  follow_up_triggers TEXT[] DEFAULT '{}',
  complexity_level INTEGER DEFAULT 1, -- 1-5 scale
  expected_data_points TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert sample questions for different categories
INSERT INTO public.interview_questions (category, question_text, follow_up_triggers, complexity_level, expected_data_points) VALUES
('work_experience', 'Tell me about your current or most recent job role.', ARRAY['responsibilities', 'achievements', 'challenges'], 2, ARRAY['company', 'title', 'duration', 'responsibilities']),
('work_experience', 'What were your main accomplishments in that role?', ARRAY['metrics', 'impact', 'recognition'], 3, ARRAY['achievements', 'metrics', 'impact']),
('education', 'What is your educational background?', ARRAY['degree', 'institution', 'coursework'], 2, ARRAY['degree', 'institution', 'graduation_date', 'gpa']),
('skills', 'What are your strongest technical skills?', ARRAY['proficiency', 'experience', 'projects'], 2, ARRAY['skills', 'proficiency_level', 'years_experience']),
('goals', 'What are your career goals and aspirations?', ARRAY['timeline', 'growth', 'interests'], 3, ARRAY['career_goals', 'timeline', 'preferred_roles']);

-- Create session_analytics table for tracking interview insights
CREATE TABLE IF NOT EXISTS public.session_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'response_length', 'confidence_score', 'topic_coverage', etc.
  metric_value DOUBLE PRECISION NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for session_analytics
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for session_analytics
CREATE POLICY "optimized_session_analytics_access" 
ON public.session_analytics 
FOR ALL 
USING (current_user_id() = user_id);

-- Update interview_transcripts to include more metadata
ALTER TABLE public.interview_transcripts 
ADD COLUMN IF NOT EXISTS extracted_entities JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sentiment_score DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS topic_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}';

-- Create function to calculate session completion percentage
CREATE OR REPLACE FUNCTION public.calculate_session_completion(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_expected_topics INTEGER := 5; -- work, education, skills, goals, projects
  covered_topics INTEGER;
BEGIN
  SELECT COUNT(DISTINCT context_type) INTO covered_topics
  FROM public.interview_contexts
  WHERE session_id = p_session_id AND processing_status = 'processed';
  
  RETURN LEAST(100, (covered_topics * 100 / total_expected_topics));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create function to get session insights
CREATE OR REPLACE FUNCTION public.get_session_insights(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  insights JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_questions', COUNT(*),
    'avg_response_length', AVG(LENGTH(content)),
    'topics_covered', COUNT(DISTINCT ic.context_type),
    'confidence_scores', jsonb_agg(DISTINCT ic.confidence_score) FILTER (WHERE ic.confidence_score IS NOT NULL),
    'completion_percentage', public.calculate_session_completion(p_session_id)
  ) INTO insights
  FROM public.interview_transcripts it
  LEFT JOIN public.interview_contexts ic ON ic.session_id = it.session_id
  WHERE it.session_id = p_session_id;
  
  RETURN COALESCE(insights, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';