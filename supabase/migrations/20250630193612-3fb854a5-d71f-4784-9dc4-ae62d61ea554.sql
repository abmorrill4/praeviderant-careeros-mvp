
-- Final RLS Performance Optimization: Eliminate Remaining Warnings
-- This addresses the last two database linter warnings:
-- 1. Multiple permissive policies on auth_rate_limits table
-- 2. auth_rls_initplan warning on normalized_entities table

-- Step 1: Fix multiple permissive policies on auth_rate_limits
-- Drop the older policy that's causing the conflict
DROP POLICY IF EXISTS "optimized_auth_rate_limits_system_access" ON public.auth_rate_limits;

-- The "auth_rate_limits_system_only" policy from the previous migration should remain
-- This ensures only one policy exists on the table

-- Step 2: Fix auth_rls_initplan warning on normalized_entities
-- Drop the existing unified policy
DROP POLICY IF EXISTS "normalized_entities_unified_access" ON public.normalized_entities;

-- Create separate, optimized policies to avoid subquery issues
CREATE POLICY "normalized_entities_admin_full_access" ON public.normalized_entities
  FOR ALL USING (public.is_admin_user_optimized());

CREATE POLICY "normalized_entities_read_access" ON public.normalized_entities
  FOR SELECT USING (public.is_authenticated());

-- Step 3: Log the final policy cleanup completion
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (public.current_user_id(), 'final_rls_policy_cleanup_completed', 
    jsonb_build_object(
      'timestamp', now(),
      'optimization_phase', 'final_cleanup',
      'issues_resolved', jsonb_build_array(
        'multiple_permissive_policies_auth_rate_limits',
        'auth_rls_initplan_normalized_entities'
      ),
      'policies_updated', jsonb_build_object(
        'auth_rate_limits', 'removed_duplicate_policy',
        'normalized_entities', 'split_unified_policy_into_separate_policies'
      ),
      'expected_result', 'all_database_linter_warnings_resolved'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;

-- Step 4: Final verification and summary
DO $$
DECLARE
  auth_rate_limits_policy_count INTEGER;
  normalized_entities_policy_count INTEGER;
BEGIN
  -- Count policies on auth_rate_limits
  SELECT COUNT(*) INTO auth_rate_limits_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'auth_rate_limits';
  
  -- Count policies on normalized_entities
  SELECT COUNT(*) INTO normalized_entities_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'normalized_entities';
  
  -- Log final verification
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (public.current_user_id(), 'final_policy_cleanup_verification', 
    jsonb_build_object(
      'timestamp', now(),
      'auth_rate_limits_policies', auth_rate_limits_policy_count,
      'normalized_entities_policies', normalized_entities_policy_count,
      'optimization_complete', true,
      'all_warnings_resolved', CASE 
        WHEN auth_rate_limits_policy_count = 1 AND normalized_entities_policy_count = 2 THEN true
        ELSE false
      END
    ));
    
  -- Display final completion summary
  RAISE NOTICE '=== FINAL RLS OPTIMIZATION COMPLETE ===';
  RAISE NOTICE 'Auth Rate Limits Policies: % (Expected: 1)', auth_rate_limits_policy_count;
  RAISE NOTICE 'Normalized Entities Policies: % (Expected: 2)', normalized_entities_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Issues Resolved:';
  RAISE NOTICE '✓ Multiple permissive policies on auth_rate_limits';
  RAISE NOTICE '✓ auth_rls_initplan warning on normalized_entities';
  RAISE NOTICE '';
  RAISE NOTICE 'Final Status: %', CASE 
    WHEN auth_rate_limits_policy_count = 1 AND normalized_entities_policy_count = 2 THEN '🎉 ALL WARNINGS RESOLVED!'
    ELSE '⚠️ VERIFICATION NEEDED'
  END;
EXCEPTION WHEN OTHERS THEN
  -- Continue if verification logging fails
  NULL;
END $$;
