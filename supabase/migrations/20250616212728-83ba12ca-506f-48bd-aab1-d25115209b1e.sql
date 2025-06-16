
-- Create user_interest table for detailed registration data
CREATE TABLE public.user_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  status TEXT,
  industry TEXT,
  challenge TEXT,
  stage TEXT,
  beta BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security (RLS) to the user_interest table
ALTER TABLE public.user_interest ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to insert user interest (public registration)
CREATE POLICY "Anyone can register user interest" 
  ON public.user_interest 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy that allows authenticated users to view registrations (for admin purposes)
CREATE POLICY "Authenticated users can view user interest registrations" 
  ON public.user_interest 
  FOR SELECT 
  TO authenticated
  USING (true);
