
-- Create prompt_templates table for managing structured prompts with version control
CREATE TABLE public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Ensure unique combination of category and version
  UNIQUE(category, version)
);

-- Create trigger for updated_at
CREATE TRIGGER handle_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create table to track prompt usage in processing jobs
CREATE TABLE public.job_prompt_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  job_type TEXT NOT NULL, -- 'parsing', 'normalization', 'enrichment', etc.
  prompt_template_id UUID NOT NULL REFERENCES public.prompt_templates(id),
  prompt_category TEXT NOT NULL,
  prompt_version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Index for efficient lookups
  UNIQUE(job_id, job_type, prompt_category)
);

-- Enable RLS on prompt_templates (admins can manage, authenticated users can read)
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policy for reading prompt templates (authenticated users)
CREATE POLICY "Authenticated users can view prompt templates"
  ON public.prompt_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for managing prompt templates (admins only)
CREATE POLICY "Admins can manage prompt templates"
  ON public.prompt_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Enable RLS on job_prompt_usage
ALTER TABLE public.job_prompt_usage ENABLE ROW LEVEL SECURITY;

-- Policy for job_prompt_usage (authenticated users can read, system can write)
CREATE POLICY "Users can view job prompt usage"
  ON public.job_prompt_usage
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage job prompt usage"
  ON public.job_prompt_usage
  FOR ALL
  TO authenticated
  USING (true);

-- Insert initial prompt templates
INSERT INTO public.prompt_templates (category, version, content, description) VALUES
(
  'resume_parsing',
  1,
  'You are a resume parsing specialist. Extract structured data from the provided resume text using the extract_resume_data function.

Guidelines:
1. Extract specific facts, achievements, and quantifiable metrics
2. Ensure all extracted information is accurate and comes directly from the resume
3. For dates, use readable formats (e.g., "January 2020", "2020-2023", "Present")
4. Be comprehensive but accurate - don''t infer information not explicitly stated
5. Focus on extracting relevant work experience, education, skills, projects, and certifications',
  'Initial prompt template for structured resume parsing using OpenAI function calls'
),
(
  'semantic_diffing',
  1,
  'You are a career data analysis expert. Compare parsed resume entities with existing profile data to identify meaningful differences.

Your task:
1. Analyze the semantic similarity between parsed resume data and existing profile entries
2. Identify genuine updates, additions, or conflicts that require user attention
3. Distinguish between formatting differences and substantive changes
4. Provide clear justification for each identified difference
5. Consider context and career progression when evaluating changes

Focus on substantial differences that would impact resume accuracy or completeness.',
  'Template for comparing resume data with existing profile to identify meaningful differences'
),
(
  'normalization',
  1,
  'You are an entity normalization specialist. Your task is to standardize and deduplicate entities from resume data.

Guidelines:
1. Normalize company names, job titles, and skill names to canonical forms
2. Handle common variations, abbreviations, and misspellings
3. Merge similar entities that represent the same concept
4. Maintain consistency across different resume versions
5. Create meaningful aliases for alternative representations
6. Assign confidence scores based on match quality

Prioritize accuracy and consistency in entity resolution.',
  'Template for normalizing and deduplicating entities from resume data'
),
(
  'enrichment',
  1,
  'You are a career analysis expert. Analyze this resume data and provide comprehensive career insights.

Provide analysis focusing on:
1. Role archetype classification (Individual Contributor, People Manager, Technical Leader, etc.)
2. Persona type identification (Builder, Optimizer, Strategist, etc.)
3. Leadership, scope, and technical depth scoring (0-100 scale)
4. Career summary highlighting key progression and achievements
5. Key strengths and growth trajectory analysis

Base all scores and insights on concrete evidence from the resume. Be analytical and specific in your assessment.',
  'Template for generating career insights and enrichment analysis'
),
(
  'followup_generation',
  1,
  'You are an AI interview assistant. Based on the user''s response, generate thoughtful follow-up questions or provide encouraging feedback.

Guidelines:
1. Ask clarifying questions to extract more specific details
2. Focus on quantifiable achievements and impact
3. Encourage the user to provide concrete examples
4. Maintain a conversational and supportive tone
5. Avoid repetitive or generic questions
6. Build on previous responses to create natural conversation flow

Generate 1-2 follow-up questions or provide acknowledgment before moving to the next topic.',
  'Template for generating follow-up questions during interview sessions'
);
