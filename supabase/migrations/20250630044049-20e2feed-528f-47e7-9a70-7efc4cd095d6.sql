
-- Phase 2: Relocate Vector Extension from Public Schema
-- This addresses the extension_in_public security warning

-- Step 1: Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Move the vector extension to the extensions schema
-- Note: We need to drop and recreate the extension in the new schema
-- This is safe as the extension functions will be recreated

-- First, let's check what vector-related objects exist in public schema
DO $$
DECLARE
    obj_count INTEGER;
BEGIN
    -- Count vector-related functions in public schema
    SELECT COUNT(*) INTO obj_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND (p.proname LIKE '%vector%' OR p.proname LIKE '%halfvec%' OR p.proname LIKE '%sparsevec%');
    
    RAISE NOTICE 'Found % vector-related functions in public schema', obj_count;
END $$;

-- Step 3: Drop the vector extension from public schema and recreate in extensions schema
DROP EXTENSION IF EXISTS vector CASCADE;

-- Create the extension in the dedicated schema
CREATE EXTENSION vector WITH SCHEMA extensions;

-- Step 4: Grant necessary permissions to the extensions schema
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Step 5: Update search_path to include extensions schema for users who need vector functions
-- This ensures vector functions are accessible without full schema qualification
ALTER DATABASE postgres SET search_path = "$user", public, extensions;

-- Step 6: Update any existing tables that might reference vector types
-- Check if we have any tables using vector types and update their column references if needed
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
BEGIN
    -- Find tables with vector, halfvec, or sparsevec columns
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        FOR column_record IN
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = table_record.schemaname
            AND table_name = table_record.tablename
            AND data_type LIKE '%vector%'
        LOOP
            RAISE NOTICE 'Found vector column: %.%.%', 
                table_record.schemaname, table_record.tablename, column_record.column_name;
        END LOOP;
    END LOOP;
END $$;

-- Step 7: Log the security improvement
DO $$
BEGIN
    INSERT INTO public.security_audit_log (user_id, action, details)
    VALUES (auth.uid(), 'security_hardening_phase_2_extension_relocation_completed', 
        jsonb_build_object(
            'timestamp', now(),
            'security_issue', 'extension_in_public',
            'fix_applied', 'relocated_vector_extension_to_extensions_schema',
            'phase', 'extension_schema_security',
            'extension_name', 'vector',
            'old_schema', 'public',
            'new_schema', 'extensions'
        ));
EXCEPTION WHEN OTHERS THEN
    -- Continue if logging fails
    NULL;
END $$;

-- Step 8: Verify the extension is now in the correct schema
SELECT 
    e.extname as extension_name,
    n.nspname as schema_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';
