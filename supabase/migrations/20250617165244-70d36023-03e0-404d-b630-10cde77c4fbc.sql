
-- First, let's make the invited_by column nullable temporarily to allow system invitations
ALTER TABLE public.invitations ALTER COLUMN invited_by DROP NOT NULL;

-- Insert the admin invitation code with a NULL invited_by (system-generated)
INSERT INTO public.invitations (
  code,
  invited_by,
  invited_email,
  expires_at,
  status
) VALUES (
  'ADMIN001',
  NULL, -- System-generated invitation
  null, -- No specific email restriction
  now() + interval '30 days', -- Expires in 30 days
  'pending'
);

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON public.invitations;

-- Create updated policy that allows viewing system invitations and user's own invitations
CREATE POLICY "Users can view their own invitations and system invitations" 
  ON public.invitations 
  FOR SELECT 
  USING (auth.uid() = invited_by OR invited_by IS NULL);
