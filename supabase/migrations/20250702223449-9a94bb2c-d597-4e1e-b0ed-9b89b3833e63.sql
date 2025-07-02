-- Optimize the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with comprehensive error handling
  BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name'),
      COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'image')
    );
  EXCEPTION WHEN unique_violation THEN
    -- Profile already exists, this is ok
    NULL;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() 
IS 'Creates user profile with OAuth data extraction and comprehensive error handling';

-- Add indexes for better performance on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Create a function to check profile completeness
CREATE OR REPLACE FUNCTION public.check_profile_completeness(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_record RECORD;
  completeness_score INTEGER := 0;
  missing_fields TEXT[] := ARRAY[]::TEXT[];
  result JSONB;
BEGIN
  -- Get profile data
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'complete', false,
      'score', 0,
      'missing_fields', ARRAY['profile'],
      'message', 'Profile not found'
    );
  END IF;
  
  -- Check required fields
  IF profile_record.name IS NOT NULL AND length(trim(profile_record.name)) > 0 THEN
    completeness_score := completeness_score + 40;
  ELSE
    missing_fields := array_append(missing_fields, 'name');
  END IF;
  
  IF profile_record.email IS NOT NULL AND length(trim(profile_record.email)) > 0 THEN
    completeness_score := completeness_score + 30;
  ELSE
    missing_fields := array_append(missing_fields, 'email');
  END IF;
  
  IF profile_record.avatar_url IS NOT NULL THEN
    completeness_score := completeness_score + 30;
  ELSE
    missing_fields := array_append(missing_fields, 'avatar');
  END IF;
  
  RETURN jsonb_build_object(
    'complete', completeness_score >= 70,
    'score', completeness_score,
    'missing_fields', missing_fields,
    'message', CASE 
      WHEN completeness_score >= 90 THEN 'Profile is complete'
      WHEN completeness_score >= 70 THEN 'Profile is mostly complete'
      WHEN completeness_score >= 40 THEN 'Profile needs more information'
      ELSE 'Profile is incomplete'
    END
  );
END;
$$;