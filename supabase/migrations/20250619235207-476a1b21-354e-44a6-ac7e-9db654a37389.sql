
-- Create enum type for interview phases
CREATE TYPE interview_phase AS ENUM ('warmup', 'identity', 'impact', 'deep_dive');

-- Create question_flows table for structured interview questions
CREATE TABLE public.question_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase interview_phase NOT NULL,
  order_num INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  followup_trigger_keywords TEXT[] DEFAULT '{}',
  branch_condition_json JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update existing interview_sessions table to include current phase and question tracking
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'warmup';
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS current_question_id UUID;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS phase_data JSONB DEFAULT '{}';

-- Update existing interview_transcripts table to include structured responses
ALTER TABLE public.interview_transcripts ADD COLUMN IF NOT EXISTS question_id UUID;
ALTER TABLE public.interview_transcripts ADD COLUMN IF NOT EXISTS user_answer TEXT;
ALTER TABLE public.interview_transcripts ADD COLUMN IF NOT EXISTS structured_response JSONB;
ALTER TABLE public.interview_transcripts ADD COLUMN IF NOT EXISTS ai_followup TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_flows_phase_order ON public.question_flows(phase, order_num);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_current ON public.interview_sessions(user_id, current_phase);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_session_question ON public.interview_transcripts(session_id, question_id);

-- Enable RLS on new table
ALTER TABLE public.question_flows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for question_flows (read-only for all authenticated users)
CREATE POLICY "Users can view question flows" 
  ON public.question_flows 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Insert sample question flow data for the interview phases
INSERT INTO public.question_flows (phase, order_num, question_text, followup_trigger_keywords, metadata) VALUES
-- Warmup phase
('warmup', 1, 'Hi! I''m here to learn about your professional background to help create a tailored resume. To start, could you tell me your name and what you currently do for work?', '{"current", "role", "position", "job"}', '{"category": "basic_info", "required": true}'),
('warmup', 2, 'That sounds interesting! How long have you been in this role, and what initially drew you to this field?', '{"years", "experience", "started", "passion"}', '{"category": "experience_timeline", "followup_trigger": true}'),

-- Identity phase
('identity', 1, 'Let''s dive deeper into your professional identity. What would you say are your core strengths or the skills you''re most known for?', '{"skills", "strengths", "known for", "good at"}', '{"category": "core_skills", "skill_extraction": true}'),
('identity', 2, 'Can you walk me through your career progression? What were the key roles or experiences that shaped your professional journey?', '{"progression", "career", "roles", "journey"}', '{"category": "career_progression", "timeline_focus": true}'),

-- Impact phase
('impact', 1, 'I''d love to hear about some specific achievements or projects you''re proud of. Can you share an example of something impactful you''ve accomplished?', '{"achievement", "project", "impact", "accomplished"}', '{"category": "achievements", "quantifiable_focus": true}'),
('impact', 2, 'That''s impressive! Can you quantify that impact? For example, did it save time, increase revenue, improve processes, or affect team performance?', '{"metrics", "numbers", "percentage", "revenue", "time"}', '{"category": "quantified_impact", "resume_bullet": true}'),

-- Deep dive phase
('deep_dive', 1, 'What tools, technologies, or methodologies do you use regularly in your work? I want to make sure we capture all your technical competencies.', '{"tools", "technology", "software", "methodologies"}', '{"category": "technical_skills", "comprehensive_list": true}'),
('deep_dive', 2, 'Looking ahead, what type of role or responsibilities are you hoping to grow into next? This helps me tailor your resume for future opportunities.', '{"future", "goals", "next role", "growth"}', '{"category": "career_goals", "targeting": true}');

-- Create updated_at trigger for question_flows
CREATE OR REPLACE FUNCTION update_question_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_flows_updated_at
  BEFORE UPDATE ON public.question_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_question_flows_updated_at();
