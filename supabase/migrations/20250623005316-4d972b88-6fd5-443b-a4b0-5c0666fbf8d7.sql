
-- Fix insecure RLS policy on interest_registrations table
-- This migration creates an admin role check function and replaces the overly permissive policy

-- Create a function to check if the current user has admin role
-- This function checks for a custom claim 'user_role' with value 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin',
    false
  );
$$;

-- Drop the existing insecure policy that allows any authenticated user to view all registrations
DROP POLICY IF EXISTS "Authenticated users can view registrations" ON public.interest_registrations;

-- Create a new secure policy that only allows admins to view interest registrations
CREATE POLICY "Admins can view interest registrations" 
  ON public.interest_registrations 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin());

-- Add a comment to document the security improvement
COMMENT ON POLICY "Admins can view interest registrations" ON public.interest_registrations 
IS 'Restricts SELECT access to users with admin role only, replacing the previous insecure policy that allowed all authenticated users to view data';
