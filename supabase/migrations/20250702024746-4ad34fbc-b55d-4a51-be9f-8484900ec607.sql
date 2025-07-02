-- Create AI insights feedback table
CREATE TABLE IF NOT EXISTS public.ai_insights_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'career_enrichment', 'career_narrative', 'entry_enrichment'
  insight_id UUID NOT NULL, -- Reference to the specific insight record
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correction', 'context', 'enhancement')),
  feedback_text TEXT NOT NULL,
  user_context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_insights_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own feedback" 
ON public.ai_insights_feedback 
FOR ALL 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_ai_insights_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER ai_insights_feedback_updated_at
  BEFORE UPDATE ON public.ai_insights_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_ai_insights_feedback_updated_at();

-- Create index for performance
CREATE INDEX idx_ai_insights_feedback_user_id ON public.ai_insights_feedback(user_id);
CREATE INDEX idx_ai_insights_feedback_insight ON public.ai_insights_feedback(insight_type, insight_id);