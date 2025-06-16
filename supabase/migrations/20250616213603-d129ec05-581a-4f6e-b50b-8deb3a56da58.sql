
-- Create a domain_values table to store standard dropdown options
CREATE TABLE public.domain_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security (RLS) to the domain_values table
ALTER TABLE public.domain_values ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to read domain values (for dropdowns)
CREATE POLICY "Anyone can read domain values" 
  ON public.domain_values 
  FOR SELECT 
  USING (true);

-- Create policy that allows authenticated users to manage domain values (for admin purposes)
CREATE POLICY "Authenticated users can manage domain values" 
  ON public.domain_values 
  FOR ALL
  TO authenticated
  USING (true);

-- Insert standard values for industries
INSERT INTO public.domain_values (category, value, display_order) VALUES
('industry', 'Technology', 1),
('industry', 'Finance', 2),
('industry', 'Healthcare', 3),
('industry', 'Education', 4),
('industry', 'Manufacturing', 5),
('industry', 'Retail', 6),
('industry', 'Consulting', 7),
('industry', 'Media & Entertainment', 8),
('industry', 'Real Estate', 9),
('industry', 'Government', 10),
('industry', 'Non-profit', 11),
('industry', 'Other', 12);

-- Insert standard values for career stages
INSERT INTO public.domain_values (category, value, display_order) VALUES
('career_stage', 'Entry-level (0-2 years)', 1),
('career_stage', 'Early-career (2-5 years)', 2),
('career_stage', 'Mid-career (5-10 years)', 3),
('career_stage', 'Senior-level (10-15 years)', 4),
('career_stage', 'Executive-level (15+ years)', 5),
('career_stage', 'Career switcher', 6),
('career_stage', 'Returning to workforce', 7);

-- Insert standard values for current status
INSERT INTO public.domain_values (category, value, display_order) VALUES
('current_status', 'Actively job searching', 1),
('current_status', 'Open to opportunities', 2),
('current_status', 'Employed, not looking', 3),
('current_status', 'Between jobs', 4),
('current_status', 'Student', 5),
('current_status', 'Freelancer/Contractor', 6),
('current_status', 'Entrepreneur', 7),
('current_status', 'Retired', 8);
