
-- Enable RLS on auth_rate_limits table and fix security vulnerability
-- This addresses the database linter warnings about RLS policies existing without RLS being enabled

-- Step 1: Enable Row Level Security on the auth_rate_limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify and recreate the system-only access policy
-- Drop existing policy if it exists to ensure clean state
DROP POLICY IF EXISTS "auth_rate_limits_system_access" ON public.auth_rate_limits;

-- Create a restrictive policy that only allows system-level access
-- This table should not be accessible to regular users or even admins through the API
CREATE POLICY "auth_rate_limits_system_only" ON public.auth_rate_limits
  FOR ALL USING (false)
  WITH CHECK (false);

-- Step 3: Log the security fix
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (public.current_user_id(), 'rls_security_vulnerability_fixed', 
    jsonb_build_object(
      'timestamp', now(),
      'table_name', 'auth_rate_limits',
      'vulnerability_type', 'rls_policies_without_rls_enabled',
      'fix_applied', 'enabled_rls_with_system_only_policy',
      'security_level', 'maximum_restriction',
      'description', 'Table now properly secured with RLS enabled and system-only access policy'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;

-- Step 4: Verify the fix by checking RLS status
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if RLS is now enabled
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class 
  WHERE relname = 'auth_rate_limits' AND relnamespace = 'public'::regnamespace;
  
  -- Count policies on the table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'auth_rate_limits';
  
  -- Log verification results
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (public.current_user_id(), 'rls_fix_verification', 
    jsonb_build_object(
      'timestamp', now(),
      'table_name', 'auth_rate_limits',
      'rls_enabled', rls_enabled,
      'policy_count', policy_count,
      'verification_status', CASE 
        WHEN rls_enabled AND policy_count > 0 THEN 'success'
        ELSE 'needs_attention'
      END,
      'expected_rls_enabled', true,
      'expected_policy_count', 1
    ));
    
  -- Raise notice for confirmation
  RAISE NOTICE '=== AUTH_RATE_LIMITS SECURITY FIX VERIFICATION ===';
  RAISE NOTICE 'RLS Enabled: %', rls_enabled;
  RAISE NOTICE 'Policy Count: %', policy_count;
  RAISE NOTICE 'Security Status: %', CASE 
    WHEN rls_enabled AND policy_count > 0 THEN '✅ SECURED'
    ELSE '⚠️ NEEDS ATTENTION'
  END;
EXCEPTION WHEN OTHERS THEN
  -- Continue if verification logging fails
  NULL;
END $$;
