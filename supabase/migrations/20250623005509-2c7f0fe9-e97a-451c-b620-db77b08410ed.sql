
-- Secure the handle_new_user function by removing raw_user_meta_data usage
-- This migration updates the function to only populate safe fields from auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only populate id and email from auth.users record
  -- Set name and avatar_url to NULL for security
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NULL,  -- Don't use raw_user_meta_data for name
    NULL   -- Don't use raw_user_meta_data for avatar_url
  );
  RETURN NEW;
END;
$$;

-- Add a comment explaining the security improvement
COMMENT ON FUNCTION public.handle_new_user() 
IS 'Securely creates user profile with only validated fields from auth.users. Name and avatar_url are set to NULL to prevent injection from raw_user_meta_data.';
