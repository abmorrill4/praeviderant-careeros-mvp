
-- Create table for interview sessions
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'active', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  audio_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for interview transcripts
CREATE TABLE public.interview_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_sessions
CREATE POLICY "Users can view their own interview sessions" 
  ON public.interview_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview sessions" 
  ON public.interview_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions" 
  ON public.interview_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for interview_transcripts
CREATE POLICY "Users can view transcripts for their sessions" 
  ON public.interview_transcripts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions 
      WHERE id = interview_transcripts.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcripts for their sessions" 
  ON public.interview_transcripts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions 
      WHERE id = interview_transcripts.session_id 
      AND user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
