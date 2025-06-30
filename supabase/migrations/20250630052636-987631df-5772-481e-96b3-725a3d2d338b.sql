
-- Consolidate multiple permissive RLS policies on normalized_entities table
-- This addresses the "multiple permissive policies" performance warning

-- Step 1: Drop the existing conflicting policies
DROP POLICY IF EXISTS "optimized_normalized_entities_admin_access" ON public.normalized_entities;
DROP POLICY IF EXISTS "optimized_normalized_entities_read_access" ON public.normalized_entities;

-- Step 2: Create a single unified policy that handles both admin and read access
CREATE POLICY "normalized_entities_unified_access" ON public.normalized_entities
  FOR ALL USING (
    -- Admin users have full access
    public.is_admin_user_optimized() OR
    -- All authenticated users have read access for SELECT operations
    (current_setting('request.method', true) = 'GET' AND public.is_authenticated())
  )
  WITH CHECK (
    -- Only admins can INSERT/UPDATE/DELETE
    public.is_admin_user_optimized()
  );

-- Step 3: Log the policy consolidation
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (public.current_user_id(), 'rls_policy_consolidation_completed', 
    jsonb_build_object(
      'timestamp', now(),
      'table_name', 'normalized_entities',
      'old_policies_removed', jsonb_build_array(
        'optimized_normalized_entities_admin_access',
        'optimized_normalized_entities_read_access'
      ),
      'new_policy_created', 'normalized_entities_unified_access',
      'optimization_type', 'multiple_permissive_policies_fix',
      'expected_improvement', 'Eliminated policy evaluation overhead'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;
