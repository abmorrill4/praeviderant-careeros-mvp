
-- Add onboarding columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed boolean DEFAULT false,
ADD COLUMN onboarding_data jsonb;

-- Update the trigger function to handle the new onboarding fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    false
  );
  RETURN NEW;
END;
$$;
