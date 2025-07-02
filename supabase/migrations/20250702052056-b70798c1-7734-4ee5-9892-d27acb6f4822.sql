-- Update admin function to remove @careeros.com and add back abmorrill4@gmail.com
-- alongside @praeviderant.com domain criteria

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    EXISTS(
      SELECT 1 FROM auth.users 
      WHERE id = COALESCE(user_id, auth.uid())
      AND (
        raw_user_meta_data->>'user_role' = 'admin' OR
        email = 'abmorrill4@gmail.com' OR
        email LIKE '%@praeviderant.com'
      )
    ),
    false
  );
$$;

-- Log the admin function update
DO $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (public.current_user_id(), 'admin_function_updated', 
    jsonb_build_object(
      'timestamp', now(),
      'changes', 'removed_careeros_domain_added_abmorrill4_email',
      'allowed_criteria', jsonb_build_array(
        'user_role_admin',
        'abmorrill4@gmail.com',
        '@praeviderant.com_domain'
      )
    ));
EXCEPTION WHEN OTHERS THEN
  -- Continue if logging fails
  NULL;
END $$;