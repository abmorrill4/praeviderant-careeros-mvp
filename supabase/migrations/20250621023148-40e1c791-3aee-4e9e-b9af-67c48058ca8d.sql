
-- Remove the invitation_code foreign key column from the profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS invitation_code;

-- Drop the invitations table entirely
DROP TABLE IF EXISTS public.invitations CASCADE;

-- Drop the generate_invitation_code function as it's no longer needed
DROP FUNCTION IF EXISTS public.generate_invitation_code();

-- Drop the mark_expired_invitations function as it's no longer needed
DROP FUNCTION IF EXISTS public.mark_expired_invitations();
